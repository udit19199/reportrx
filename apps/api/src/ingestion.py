import asyncio
import uuid
import re

from src.config import get_settings
from src.ai_clients import AiClients
from src.vector_store import upsert_vectors, search_vectors
from src.liteparse import parse_pdf as liteparse_pdf
from src.extraction import extract_structured_data
from src.interpretation import interpret_structured_data
from src.logging_setup import get_logger

settings = get_settings()
logger = get_logger("ingestion")


async def parse_pdf(file_path: str) -> list[dict]:
    logger.info(f"Parsing {file_path} locally...")
    chunks = await liteparse_pdf(file_path)
    logger.info(f"Extracted {len(chunks)} chunks via LiteParse")
    return chunks


TEST_NAME_NORMALIZATION = """
CRITICAL — TEST NAME NORMALIZATION:
Always use these canonical test names. Map any aliases, abbreviations, or variations to the canonical name:
- "Hemoglobin" (not Hb, HGB, Hgb)
- "White Blood Cell Count" (not WBC, Leukocyte Count, TLC)
- "Red Blood Cell Count" (not RBC, Erythrocyte Count)
- "Platelet Count" (not PLT, Platelets, Thrombocyte Count)
- "Glucose" (not Blood Sugar, FBS, Fasting Blood Sugar, RBS, Random Blood Sugar)
- "Creatinine" (not Serum Creatinine, S. Creatinine, Cr)
- "Urea" (not Blood Urea, BUN, Blood Urea Nitrogen)
- "Cholesterol Total" (not Total Cholesterol, TC, Cholesterol)
- "HDL Cholesterol" (not HDL, High Density Lipoprotein)
- "LDL Cholesterol" (not LDL, Low Density Lipoprotein)
- "Triglycerides" (not TG, Triglyceride, Serum Triglycerides)
- "Bilirubin Total" (not Total Bilirubin, T.Bilirubin)
- "ALT" (not SGPT, Alanine Transaminase, Alanine Aminotransferase)
- "AST" (not SGOT, Aspartate Transaminase, Aspartate Aminotransferase)
- "Alkaline Phosphatase" (not ALP, ALKP)
- "Sodium" (not Na, Serum Sodium)
- "Potassium" (not K, Serum Potassium)
- "Calcium" (not Ca, Serum Calcium)
- "Thyroid Stimulating Hormone" (not TSH)
- "Free T4" (not FT4, Free Thyroxine)
- "Free T3" (not FT3, Free Triiodothyronine)
- "HbA1c" (not Glycated Hemoglobin, A1C, Hemoglobin A1c)
- "Uric Acid" (not Serum Uric Acid)
- "Albumin" (not Serum Albumin)
- "Total Protein" (not Serum Total Protein)
- "C-Reactive Protein" (not CRP)
- "Vitamin D" (not 25-OH Vitamin D, 25-Hydroxyvitamin D, Vitamin D3)
- "Vitamin B12" (not Cobalamin)
- "Iron" (not Serum Iron)
- "Ferritin" (not Serum Ferritin)
- "INR" (not International Normalized Ratio)
- "PT" (not Prothrombin Time)
- "aPTT" (not APTT, Activated Partial Thromboplastin Time)
For any test not on this list, use the full descriptive name as it appears in the report (capitalize first letter of each word).
"""


SYSTEM_PROMPT = """You are a medical report analysis engine.

You must answer ONLY using:
1. the retrieved medical context
2. the parsed report content

Do not use outside knowledge unless explicitly requested.

If information is not present in the provided context, return:
"unknown"

RULES:
- Never hallucinate.
- Never invent diagnoses.
- Never fabricate values or ranges.
- Never assume missing patient information.
- Never output unsupported conclusions.
- Preserve numeric values exactly.
- Preserve units exactly.
- Return ONLY valid JSON matching the schema.
- If retrieved context conflicts with report text, prioritize report text.
- If confidence is low, state "unclear".

The retrieved context may include:
- previous reports
- medical guidelines
- reference ranges
- historical patient data

Use retrieved context only for:
- explaining findings
- comparing trends
- interpreting reference ranges
- generating summaries

Do not treat retrieved context as confirmed patient facts unless explicitly stated in the report."""


REPORT_JSON_SCHEMA = {
    "name": "medical_report",
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "document_type": {"type": "string"},
            "report_date": {"type": "string"},
            "patient_information": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "name": {"type": "string"},
                    "age": {"type": "string"},
                    "gender": {"type": "string"},
                    "patient_id": {"type": "string"},
                },
                "required": ["name", "age", "gender", "patient_id"],
            },
            "tests": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "test_name": {"type": "string"},
                        "value": {"type": "string"},
                        "unit": {"type": "string"},
                        "reference_range": {"type": "string"},
                        "status": {
                            "type": "string",
                            "enum": ["normal", "high", "low", "critical", "unclear"],
                        },
                        "flagged": {"type": "boolean"},
                        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                    },
                    "required": [
                        "test_name",
                        "value",
                        "unit",
                        "reference_range",
                        "status",
                        "flagged",
                        "confidence",
                    ],
                },
            },
            "abnormal_findings": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "finding": {"type": "string"},
                        "severity": {
                            "type": "string",
                            "enum": ["mild", "moderate", "severe", "unclear"],
                        },
                        "explanation": {"type": "string"},
                        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                    },
                    "required": ["finding", "severity", "explanation", "confidence"],
                },
            },
            "doctor_impression": {"type": "array", "items": {"type": "string"}},
            "recommendations": {"type": "array", "items": {"type": "string"}},
            "critical_alerts": {"type": "array", "items": {"type": "string"}},
            "plain_language_summary": {"type": "string"},
            "limitations": {"type": "array", "items": {"type": "string"}},
            "overall_confidence": {"type": "number", "minimum": 0, "maximum": 1},
        },
        "required": [
            "document_type",
            "report_date",
            "patient_information",
            "tests",
            "abnormal_findings",
            "doctor_impression",
            "recommendations",
            "critical_alerts",
            "plain_language_summary",
            "limitations",
            "overall_confidence",
        ],
    },
    "strict": True,
}


async def generate_structured_data(
    ai_clients: AiClients,
    chunks: list[dict],
) -> dict:
    """Legacy single-stage structured data generation (kept for backward compatibility)."""
    context_block = "\n\n".join(f"- [p.{c['page']} {c['section']}] {c['text']}" for c in chunks)

    system = settings.structured_output_system_prompt or SYSTEM_PROMPT

    result = await ai_clients.llm.generate_json(
        prompt=f"Analyze the following medical report content and produce the required JSON fields.\n\nContext:\n{context_block}\n\n{TEST_NAME_NORMALIZATION}",
        system=system,
        max_tokens=3000,
        schema=REPORT_JSON_SCHEMA,
    )
    return result


async def with_retry(fn, retries: int = 3, delay_ms: int = 2000, label: str = ""):
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            return await fn()
        except Exception as e:
            last_error = e
            logger.warning(f"{label} failed (attempt {attempt}/{retries}): {e}")
            if attempt < retries:
                await asyncio.sleep(delay_ms * attempt / 1000)
    raise last_error


async def _retrieve_context_for_interpretation(
    ai_clients: AiClients,
    user_id: str,
    report_id: str,
    extraction: dict,
    top_k: int = 10,
) -> str:
    """Retrieve relevant context for interpretation using all test names as a batch query."""
    tests = extraction.get("tests", [])
    if not tests:
        return ""

    test_names = [t["test_name"] for t in tests[:15]]
    combined_query = " ".join(test_names)

    try:
        query_vector = (await ai_clients.embed.embed([combined_query]))[0]
        contexts, sources = await search_vectors("", query_vector, user_id, report_id, top_k=top_k)
    except Exception as e:
        logger.warning(f"Batch retrieval failed: {e}")
        return ""

    if not contexts:
        return ""

    logger.info(f"Retrieved {len(contexts)} relevant chunks for interpretation (batch query)")
    seen = set()
    unique_contexts = []
    for ctx, src in zip(contexts, sources):
        key = f"{src}:{ctx[:100]}"
        if key not in seen:
            seen.add(key)
            unique_contexts.append(f"[{src}] {ctx}")

    return "\n\n".join(unique_contexts)


def _parse_age(age_str: str) -> int | None:
    """Parse age string like '21 Yrs' into integer years."""
    if not age_str or age_str == "unknown":
        return None
    match = re.search(r"(\d+)", str(age_str))
    if match:
        age = int(match.group(1))
        if re.search(r"(\d+)\s*(m|mo|month)", str(age_str), re.IGNORECASE):
            return max(1, age // 12)
        return age
    return None


def _write_test_results(db_session, report_id: str, tests: list[dict]) -> None:
    """Write test results to the TestResult table.

    Each test is stored with its canonical name, value, unit, and status.
    Tests that match a catalog entry get test_id populated; unmatched tests
    get test_id = null but are still stored.
    """
    from src.models import TestResult, TestCatalog

    for t in tests:
        test_name = t.get("test_name", "")
        if not test_name:
            continue

        # Try to find a catalog match
        catalog = db_session.query(TestCatalog).filter(
            TestCatalog.test_name == test_name
        ).first()

        result = TestResult(
            id=str(uuid.uuid4()),
            report_id=report_id,
            test_id=catalog.id if catalog else None,
            test_name=test_name,
            value=t.get("value", ""),
            unit=t.get("unit"),
            report_range=t.get("reference_range"),
            flagged=t.get("flagged", False),
            status=t.get("status", "normal"),
            confidence=t.get("confidence"),
        )
        db_session.add(result)

    db_session.commit()
    logger.info(f"Wrote {len(tests)} test results for report {report_id}")


async def process_ingestion_job(
    report_id: str,
    user_id: str,
    file_path: str,
    ai_clients: AiClients,
    selected_panels: list[str] | None = None,
) -> None:
    """Process PDF ingestion with two-stage LLM pipeline.

    Stage 1: Extraction — deterministic, minimal schema, temperature=0
    Stage 2: Interpretation — reasoning, retrieved context, larger prompt

    The final parsed_data combines both stages:
    - extraction: canonical structured data
    - interpretation: medical insights

    Test results are also written to the TestResult table for relational queries.
    Patient demographics are parsed and saved on the Report model.
    """
    from src.database import SessionLocal
    from src.models import Report, ReportStatus, Panel, PanelTest, TestCatalog

    logger.info(f"Starting job for report {report_id}")
    db = None

    async def _set_stage(stage: str) -> None:
        nonlocal db
        try:
            if db is None:
                db = SessionLocal()
            db.query(Report).filter(Report.id == report_id).update(
                {"current_stage": stage}
            )
            db.commit()
        except Exception as stage_err:
            logger.warning(f"Failed to update stage for {report_id}: {stage_err}")

    try:
        db = SessionLocal()
        db.query(Report).filter(Report.id == report_id).update(
            {"status": ReportStatus.processing, "current_stage": "queued", "error_message": None}
        )
        db.commit()

        await _set_stage("parsing")
        chunks = await with_retry(
            lambda: parse_pdf(file_path),
            retries=3,
            delay_ms=500,
            label="LiteParse",
        )
        logger.info(f"Parsed {len(chunks)} chunks for report {report_id}")

        if not chunks:
            raise ValueError("No text could be extracted from the PDF.")

        await _set_stage("embedding")
        batch_size = 50
        total_upserted = 0

        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            batch_num = i // batch_size + 1
            total_batches = (len(chunks) + batch_size - 1) // batch_size
            logger.info(f"Processing embedding batch {batch_num}/{total_batches} ({len(batch)} chunks)")

            embeddings = await with_retry(
                lambda b=batch: ai_clients.embed.embed([c["text"] for c in b]),
                retries=3,
                delay_ms=500,
                label="Embedding generation",
            )

            items = [
                {
                    "id": str(uuid.uuid4()),
                    "vector": vector,
                    "report_id": report_id,
                    "text": batch[idx]["text"],
                    "page": batch[idx]["page"],
                    "section": batch[idx]["section"],
                }
                for idx, vector in enumerate(embeddings)
            ]

            total_upserted += len(items)

            await with_retry(
                lambda i=items: upsert_vectors(user_id, i),
                retries=3,
                delay_ms=500,
                label="Vector store upsert",
            )

        logger.info(f"Upserted {total_upserted} vectors to Milvus for report {report_id}")

        # ── Build expected test list from selected panels ──────────────
        expected_tests_hint = ""
        if selected_panels and len(selected_panels) > 0:
            panel_slugs = selected_panels
            panel_rows = db.query(Panel).filter(Panel.slug.in_(panel_slugs)).all()
            if panel_rows:
                panel_ids = [p.id for p in panel_rows]
                panel_tests = (
                    db.query(TestCatalog)
                    .join(PanelTest, PanelTest.test_id == TestCatalog.id)
                    .filter(PanelTest.panel_id.in_(panel_ids))
                    .order_by(PanelTest.display_order)
                    .all()
                )
                if panel_tests:
                    expected_names = [t.test_name for t in panel_tests]
                    expected_tests_hint = (
                        "\n\nEXPECTED TESTS (based on user-selected panel):\n"
                        + "\n".join(f"- {name}" for name in expected_names)
                        + "\n\nThese tests should be present in this report type. "
                        "If a test from this list is not found in the report, mark its value, unit, "
                        "and reference_range as 'not found'. Do NOT fabricate values. "
                        "You may also find additional tests not in this list — include them too."
                    )
                    logger.info(
                        f"Injecting {len(expected_names)} expected test names from "
                        f"{', '.join(p.slug for p in panel_rows)} panels"
                    )

        await _set_stage("extracting")
        logger.info(f"Stage 1: Extracting from {len(chunks)} chunks (section-based merge)...")

        # Pass chunks directly — extract_structured_data handles
        # per-section extraction and internal merge
        extraction = await with_retry(
            lambda: extract_structured_data(ai_clients, chunks=chunks, expected_tests_hint=expected_tests_hint),
            retries=3,
            delay_ms=500,
            label="Extraction",
        )

        num_tests = len(extraction.get("tests", []))
        logger.info(f"Extracted {num_tests} tests from report {report_id}")

        # ── Write TestResult rows ─────────────────────────────────
        await _set_stage("saving_results")
        tests = extraction.get("tests", [])
        _write_test_results(db, report_id, tests)

        # ── Parse and store patient demographics ──────────────────
        patient_info = extraction.get("patient_information", {})
        patient_age = _parse_age(patient_info.get("age"))
        patient_gender = patient_info.get("gender", "").lower().strip()
        if patient_gender not in ("male", "female", "other"):
            patient_gender = None

        # ── Parse and store report date ──────────────────────────
        report_date = extraction.get("report_date", "")
        if report_date in ("unknown", "", None):
            report_date = None

        db.query(Report).filter(Report.id == report_id).update({
            "patient_age": patient_age,
            "patient_gender": patient_gender,
            "report_date": report_date,
        })
        db.commit()

        await _set_stage("interpreting")
        logger.info(f"Stage 2: Interpreting structured data...")
        retrieved_context = await _retrieve_context_for_interpretation(
            ai_clients, user_id, report_id, extraction
        )
        if retrieved_context:
            logger.info(f"Retrieved context from {len(retrieved_context)} historical sources")
        interpretation = await interpret_structured_data(
            ai_clients, extraction, retrieved_context
        )
        logger.info(f"Generated interpretation for report {report_id}")

        combined = {
            "extraction": extraction,
            "interpretation": interpretation,
        }

        await _set_stage("saving")
        db.query(Report).filter(Report.id == report_id).update(
            {
                "status": ReportStatus.ready,
                "current_stage": "complete",
                "parsed_data": combined,
                "error_message": None,
            }
        )
        db.commit()
        logger.info(f"Completed job for report {report_id} — ready")

    except Exception as e:
        error_message = str(e)
        logger.error(f"Failed job for report {report_id}: {error_message}")

        try:
            if db is None:
                db = SessionLocal()
            db.query(Report).filter(Report.id == report_id).update(
                {"status": ReportStatus.failed, "current_stage": "failed", "error_message": error_message}
            )
            db.commit()
        except Exception as db_error:
            logger.error(f"Failed to update report status to failed: {db_error}")
            if db:
                try:
                    db.rollback()
                except Exception:
                    pass

    finally:
        if db:
            try:
                db.close()
            except Exception as close_error:
                logger.error(f"Error closing database: {close_error}")
