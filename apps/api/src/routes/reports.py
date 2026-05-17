import os
import re
import uuid
import asyncio
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from src.database import get_db, SessionLocal
from src.models import User, Report, ReportStatus
from src.schemas import ReportResponse, UpdateReportRequest
from src.config import get_settings
from src.vector_store import delete_by_report_id
from src.ingestion import process_ingestion_job
from src.logging_setup import get_logger

settings = get_settings()
logger = get_logger("reports")
router = APIRouter(prefix="/api/reports", tags=["reports"])


REPORT_SELECT_FIELDS = ["id", "filename", "status", "uploaded_at", "parsed_data", "error_message"]


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


def normalize_parsed_data(raw: dict | None) -> dict | None:
    """Normalize parsed_data for backward compatibility.

    New two-stage pipeline stores: {extraction: {...}, interpretation: {...}}
    Legacy single-stage stored flat fields at top level.

    This function flattens the new format so the frontend sees the same shape.
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

        return {
            "document_type": extraction.get("document_type", "unknown"),
            "report_date": extraction.get("report_date", "unknown"),
            "patient_information": extraction.get("patient_information", {}),
            "tests": enriched_tests,
            "abnormal_findings": interpretation.get("abnormal_findings", []),
            "doctor_impression": [],
            "recommendations": [],
            "critical_alerts": interpretation.get("alerts", []),
            "plain_language_summary": interpretation.get("summary", ""),
            "limitations": [],
            "overall_confidence": 0.85,
        }

    return raw


def report_to_dict(report: Report) -> dict:
    return {
        "id": report.id,
        "filename": report.filename,
        "status": report.status.value,
        "currentStage": report.current_stage,
        "uploadedAt": report.uploaded_at,
        "parsedData": normalize_parsed_data(report.parsed_data),
        "errorMessage": report.error_message,
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
    return {"reports": [report_to_dict(r) for r in reports]}


@router.post("", status_code=201)
async def upload_report(
    request: Request,
    file: UploadFile = File(...),
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

    report = Report(
        id=report_id,
        user_id=user_id,
        filename=safe_name,
        storage_path=file_path,
        status=ReportStatus.pending,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    def _handle_ingestion_error(task: asyncio.Task) -> None:
        """Ensure ingestion task failures are logged and not silently swallowed."""
        try:
            # This will re-raise any exception that occurred in the task
            task.result()
        except asyncio.CancelledError:
            logger.warning(f"Ingestion task for report {report_id} was cancelled")
        except Exception as e:
            logger.error(f"Ingestion task for report {report_id} failed: {type(e).__name__}: {e}")
            # Note: The report status should already be set to 'failed' by process_ingestion_job
            # This is just for logging purposes

    task = asyncio.create_task(
        process_ingestion_job(
            report_id=report_id,
            user_id=user_id,
            file_path=file_path,
            ai_clients=request.app.state.ai_clients,
        )
    )
    task.add_done_callback(_handle_ingestion_error)

    return {"report": report_to_dict(report)}


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
    return {"report": report_to_dict(report)}


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

    return {"report": report_to_dict(report)}


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
        )
    )

    return {"report": report_to_dict(report)}
