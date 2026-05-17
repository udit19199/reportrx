import asyncio
import uuid

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
    """Retrieve relevant context for interpretation using all test names as a batch query.

    Instead of one embed + search per test name (N+1 problem), this combines
    all test names into a single query for one round-trip.
    """
    tests = extraction.get("tests", [])
    if not tests:
        return ""

    test_names = [t["test_name"] for t in tests[:15]]
    combined_query = " ".join(test_names)

    try:
        query_vector = (await ai_clients.embed.embed([combined_query]))[0]
        contexts, sources = await search_vectors(
            "", query_vector, user_id, report_id, top_k=top_k
        )
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


async def process_ingestion_job(
    report_id: str,
    user_id: str,
    file_path: str,
    ai_clients: AiClients,
) -> None:
    """Process PDF ingestion with two-stage LLM pipeline.

    Stage 1: Extraction — deterministic, minimal schema, temperature=0
    Stage 2: Interpretation — reasoning, retrieved context, larger prompt

    The final parsed_data combines both stages:
    - extraction: canonical structured data
    - interpretation: medical insights
    """
    from src.database import SessionLocal
    from src.models import Report, ReportStatus

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
                lambda i=items: upsert_vectors("", user_id, i),
                retries=3,
                delay_ms=500,
                label="Vector store upsert",
            )

        logger.info(f"Upserted {total_upserted} vectors to Milvus for report {report_id}")

        await _set_stage("extracting")
        logger.info(f"Stage 1: Extracting structured data using all parsed chunks...")

        extraction = await with_retry(
            lambda: extract_structured_data(ai_clients, chunks),
            retries=3,
            delay_ms=500,
            label="Extraction",
        )

        num_tests = len(extraction.get("tests", []))
        logger.info(f"Extracted {num_tests} tests from report {report_id}")

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
