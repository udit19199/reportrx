import os
import re
import uuid
import json
import asyncio
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from src.database import get_db, SessionLocal
from src.models import User, Report, ReportStatus, TestResult, TestCatalog, TestReferenceRange
from src.schemas import UpdateReportRequest
from src.config import get_settings
from src.vector_store import delete_by_report_id
from src.ingestion import process_ingestion_job
from src.logging_setup import get_logger

settings = get_settings()
logger = get_logger("reports")
router = APIRouter(prefix="/api/reports", tags=["reports"])


def _compute_status(value: str, reference_range: str, flagged: bool) -> str:
    """Determine the actual status by comparing value against the reference range.

    Returns "normal", "high", "low", or "critical". Falls back to "high" if
    parsing fails but the test is flagged.
    """
    if not flagged:
        return "normal"

    if not value or not reference_range:
        return "high"

    try:
        # Strip units and non-numeric prefixes like "<" or ">"
        cleaned = re.sub(r"[^0-9.\-]", "", value.replace(",", ""))
        num_value = float(cleaned)
    except (ValueError, AttributeError):
        return "high"

    range_match = re.match(r"([0-9.]+)\s*[-–—]+\s*([0-9.]+)", reference_range.strip())
    if not range_match:
        return "high"

    try:
        range_min = float(range_match.group(1))
        range_max = float(range_match.group(2))
    except (ValueError, AttributeError):
        return "high"

    if num_value < range_min:
        return "low"
    elif num_value > range_max:
        return "high"
    else:
        # Flagged but actually within range — unusual, flag as high anyway
        return "high"


def _coerce_string_list(value) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if item and str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def _recommendations_from_interpretation(interpretation: dict) -> list[str]:
    """Prefer explicit recommendations; fall back to actionable lines from interpretation text."""
    recs = _coerce_string_list(interpretation.get("recommendations"))
    if recs:
        return recs

    text = interpretation.get("interpretation")
    if not isinstance(text, str) or not text.strip():
        return []

    lines = [
        line.strip().lstrip("-•*0123456789.) ")
        for line in text.split("\n")
        if line.strip()
    ]
    actionable = [line for line in lines if len(line) > 15]
    if len(actionable) >= 2:
        return actionable[:8]

    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [sentence.strip() for sentence in sentences if len(sentence.strip()) > 20][:6]


def _parse_age(age_str: str) -> int | None:
    """Parse age string like '21 Yrs', '42 Years', '5m' into integer years."""
    if not age_str or age_str == "unknown":
        return None
    match = re.search(r"(\d+)", str(age_str))
    if match:
        age = int(match.group(1))
        # If followed by 'm' or 'mo' it's months, convert to years
        if re.search(r"(\d+)\s*(m|mo|month)", str(age_str), re.IGNORECASE):
            return max(1, age // 12)
        return age
    return None


def _lookup_catalog_range(
    db: Session, test_name: str, gender: str | None, age: int | None
) -> dict | None:
    """Look up the best-matching reference range from the catalog.

    Returns None if the test isn't in the catalog.
    """
    catalog_test = db.query(TestCatalog).filter(
        TestCatalog.test_name == test_name
    ).first()
    if not catalog_test:
        return None

    # Build query — order by priority descending, most specific first
    query = db.query(TestReferenceRange).filter(
        TestReferenceRange.test_id == catalog_test.id
    )

    ranges = query.order_by(TestReferenceRange.priority.desc()).all()
    if not ranges:
        return None

    # Score each range for how well it matches demographics
    best = None
    best_score = -1

    for r in ranges:
        score = 0

        # Gender match
        if r.gender is None:
            score += 1  # generic match
        elif gender and r.gender == gender.lower():
            score += 10  # exact gender match

        # Age match
        age_matched = True
        if r.age_min is not None and (age is None or age < r.age_min):
            age_matched = False
        if r.age_max is not None and (age is None or age >= r.age_max):
            age_matched = False

        if not age_matched:
            continue  # age mismatch — skip entirely

        if r.age_min is not None:
            score += 5
        if r.age_max is not None:
            score += 5

        # Priority from DB
        score += r.priority * 2

        if score > best_score:
            best_score = score
            best = r

    if best is None:
        # Fall back to the most generic range
        generic = [r for r in ranges if r.gender is None and r.age_min is None and r.age_max is None]
        best = generic[0] if generic else ranges[0]

    if best is None:
        return None

    # Build catalog range text
    if best.range_text:
        cat_text = best.range_text
    elif best.range_type == "max_only" and best.range_max is not None:
        cat_text = f"<= {best.range_max}"
    elif best.range_type == "min_only" and best.range_min is not None:
        cat_text = f">= {best.range_min}"
    elif best.range_min is not None and best.range_max is not None:
        cat_text = f"{best.range_min} - {best.range_max}"
    else:
        cat_text = None

    return {
        "range": cat_text,
        "range_min": best.range_min,
        "range_max": best.range_max,
        "range_type": best.range_type,
        "unit": catalog_test.standard_unit,
        "notes": best.notes,
    }


def _enrich_tests(
    tests: list[dict],
    db: Session,
    patient_gender: str | None,
    patient_age: int | None,
) -> list[dict]:
    """Enrich each test with catalog_range from the reference range DB."""
    enriched = []
    for t in tests:
        t = dict(t)  # copy
        cat_range = _lookup_catalog_range(db, t.get("test_name", ""), patient_gender, patient_age)
        if cat_range:
            t["catalog_range"] = cat_range
        enriched.append(t)
    return enriched


def normalize_parsed_data(
    raw: dict | None,
    db: Session | None = None,
    patient_gender: str | None = None,
    patient_age: int | None = None,
) -> dict | None:
    """Normalize parsed_data for backward compatibility.

    New two-stage pipeline stores: {extraction: {...}, interpretation: {...}}
    Legacy single-stage stored flat fields at top level.

    This function flattens the new format and enriches tests with catalog ranges.
    """
    if raw is None:
        return None

    if "extraction" in raw and "interpretation" in raw:
        extraction = raw["extraction"]
        interpretation = raw["interpretation"]
        tests = extraction.get("tests", [])

        enriched_tests = []
        for t in tests:
            enriched = dict(t)
            if "status" not in enriched:
                enriched["status"] = _compute_status(
                    enriched.get("value", ""),
                    enriched.get("reference_range", ""),
                    enriched.get("flagged", False),
                )
            if "confidence" not in enriched:
                enriched["confidence"] = 0.9
            enriched_tests.append(enriched)

        # Add catalog ranges if we have a DB session
        if db is not None:
            enriched_tests = _enrich_tests(enriched_tests, db, patient_gender, patient_age)

        return {
            "document_type": extraction.get("document_type", "unknown"),
            "report_date": extraction.get("report_date", "unknown"),
            "patient_information": extraction.get("patient_information", {}),
            "tests": enriched_tests,
            "abnormal_findings": interpretation.get("abnormal_findings", []),
            "doctor_impression": [],
            "recommendations": _recommendations_from_interpretation(interpretation),
            "critical_alerts": interpretation.get("alerts", []),
            "plain_language_summary": interpretation.get("summary", ""),
            "limitations": _coerce_string_list(interpretation.get("limitations")),
            "overall_confidence": 0.85,
        }

    return raw


def report_to_dict(report: Report, db: Session | None = None) -> dict:
    patient_gender = report.patient_gender
    patient_age = report.patient_age

    return {
        "id": report.id,
        "filename": report.filename,
        "status": report.status.value,
        "currentStage": report.current_stage,
        "uploadedAt": report.uploaded_at,
        "reportDate": report.report_date,
        "parsedData": normalize_parsed_data(report.parsed_data, db, patient_gender, patient_age),
        "errorMessage": report.error_message,
        "selectedPanels": report.selected_panels or [],
        "patientAge": report.patient_age,
        "patientGender": report.patient_gender,
    }


def get_user_id(request: Request) -> str:
    return request.state.user_id


@router.get("")
async def list_reports(
    request: Request,
    db: Session = Depends(get_db),
):
    user_id = get_user_id(request)
    reports = db.query(Report).filter(Report.user_id == user_id).order_by(Report.uploaded_at.desc()).all()
    return {"reports": [report_to_dict(r, db) for r in reports]}


@router.post("", status_code=201)
async def upload_report(
    request: Request,
    file: UploadFile = File(...),
    panels: str = Form(default=""),  # JSON string array, e.g. '["cbc","kft"]'
    db: Session = Depends(get_db),
):
    user_id = get_user_id(request)

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    report_id = str(uuid.uuid4())
    safe_name = os.path.basename(file.filename)
    user_dir = Path(settings.upload_dir) / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    file_path = str(user_dir / f"{report_id}-{safe_name}")

    content = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File size exceeds {settings.max_upload_mb}MB limit")
    with open(file_path, "wb") as f:
        f.write(content)

    # Parse optional panel selections
    selected_panels = None
    if panels:
        try:
            parsed = json.loads(panels)
            if isinstance(parsed, list):
                selected_panels = parsed
        except json.JSONDecodeError:
            pass

    report = Report(
        id=report_id,
        user_id=user_id,
        filename=safe_name,
        storage_path=file_path,
        status=ReportStatus.pending,
        selected_panels=selected_panels,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    def _handle_ingestion_error(task: asyncio.Task) -> None:
        """Ensure ingestion task failures are logged and not silently swallowed."""
        try:
            task.result()
        except asyncio.CancelledError:
            logger.warning(f"Ingestion task for report {report_id} was cancelled")
        except Exception as e:
            logger.error(f"Ingestion task for report {report_id} failed: {type(e).__name__}: {e}")

    task = asyncio.create_task(
        process_ingestion_job(
            report_id=report_id,
            user_id=user_id,
            file_path=file_path,
            ai_clients=request.app.state.ai_clients,
            selected_panels=selected_panels,
        )
    )
    task.add_done_callback(_handle_ingestion_error)

    return {"report": report_to_dict(report, db)}


@router.get("/{report_id}")
async def get_report(
    report_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    user_id = get_user_id(request)
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == user_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"report": report_to_dict(report, db)}


@router.delete("/{report_id}")
async def delete_report(
    report_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    user_id = get_user_id(request)
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == user_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Always try to clean up the file — best effort
    try:
        os.remove(report.storage_path)
    except OSError as e:
        logger.warning(f"Could not remove file {report.storage_path}: {e}")

    # Clean up vectors — best effort; don't block the DB delete
    try:
        await delete_by_report_id("", user_id, report_id)
    except Exception as e:
        logger.warning(f"Could not delete Qdrant vectors for report {report_id}: {e}")

    db.delete(report)
    db.commit()

    return {"ok": True}


@router.put("/{report_id}")
async def update_report(
    report_id: str,
    body: UpdateReportRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    user_id = get_user_id(request)
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == user_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if body.filename is not None:
        if not body.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Filename must end with .pdf")
        report.filename = body.filename

    db.commit()
    db.refresh(report)

    return {"report": report_to_dict(report, db)}


@router.put("/{report_id}/reprocess")
async def reprocess_report(
    report_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    user_id = get_user_id(request)
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == user_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status == ReportStatus.processing:
        raise HTTPException(status_code=409, detail="Report is already processing")

    # Reset status to trigger re-ingestion
    report.status = ReportStatus.pending
    report.current_stage = None
    report.error_message = None
    db.commit()

    task = asyncio.create_task(
        process_ingestion_job(
            report_id=report_id,
            user_id=user_id,
            file_path=report.storage_path,
            ai_clients=request.app.state.ai_clients,
            selected_panels=report.selected_panels,
        )
    )

    return {"report": report_to_dict(report, db)}
