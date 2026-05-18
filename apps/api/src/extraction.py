import asyncio
import json
from collections import OrderedDict

from src.ai_clients import AiClients
from src.logging_setup import get_logger

logger = get_logger("extraction")

EXTRACTION_SCHEMA = {
    "name": "medical_report_extraction",
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
                        "flagged": {"type": "boolean"},
                    },
                    "required": ["test_name", "value", "unit", "reference_range", "flagged"],
                },
            },
        },
        "required": ["document_type", "report_date", "patient_information", "tests"],
    },
    "strict": True,
}

EXTRACTION_SYSTEM_PROMPT = """You are a medical data extraction engine.

Extract structured data from the report text below. Output ONLY valid JSON.

RULES:
- Output ONLY valid JSON. No markdown. No explanations. No reasoning.
- Preserve numeric values exactly as they appear.
- Preserve units exactly as they appear.
- Do not hallucinate. Do not invent values.
- Return "unknown" for any missing field.
- Do not add confidence scores, severity, explanations, recommendations, summaries, or alerts.
- Set flagged=true only if the report explicitly marks the value as abnormal (H/L/high/low/critical flags).

CANONICAL TEST NAMES — always use these:
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
For tests not on this list, use the full descriptive name as it appears (capitalize first letter of each word)."""


# ── Section grouping ────────────────────────────────────────────────


def _group_chunks_by_section(chunks: list[dict]) -> list[tuple[str, list[dict]]]:
    """Group chunks by their section label, preserving order of first appearance."""
    groups: OrderedDict[str, list[dict]] = OrderedDict()
    for chunk in chunks:
        section = chunk.get("section", "") or "General"
        if section not in groups:
            groups[section] = []
        groups[section].append(chunk)
    return list(groups.items())


_INCOMPLETE = {"not found", "unknown", "", "not specified"}


def _is_complete(value: str | None) -> bool:
    """Return True if the value is substantive (not a placeholder)."""
    return bool(value) and value.strip().lower() not in _INCOMPLETE


def _merge_test_lists(test_lists: list[list[dict]]) -> list[dict]:
    """Merge multiple test lists by canonical test name.

    For each test name, keeps the entry with the most complete data:
    - Prefers non-placeholder values over "not found" / "unknown"
    - Prefers entries with a unit
    - Prefers flagged=True (more cautious)
    """
    merged: dict[str, dict] = {}

    for tests in test_lists:
        for test in tests:
            name = test.get("test_name", "")
            if not name:
                continue
            if name not in merged:
                merged[name] = dict(test)  # copy
                continue

            existing = merged[name]
            # Prefer a real value over a placeholder
            if not _is_complete(existing.get("value")) and _is_complete(test.get("value")):
                merged[name] = dict(test)
            elif _is_complete(test.get("value")) and not _is_complete(existing.get("value")):
                merged[name] = dict(test)
            # If both have values, prefer one with a unit
            elif existing.get("unit") and not test.get("unit"):
                pass  # keep existing
            elif not existing.get("unit") and test.get("unit"):
                merged[name] = dict(test)
            # Prefer flagged=True (more cautious)
            elif test.get("flagged") and not existing.get("flagged"):
                merged[name] = dict(test)
            # Better reference_range
            elif not _is_complete(existing.get("reference_range")) and _is_complete(test.get("reference_range")):
                merged[name] = dict(test)

    return list(merged.values())


def _merge_patient_info(infos: list[dict]) -> dict:
    """Merge patient information from multiple extractions.

    Prefers the most complete entry (most non-unknown fields).
    """
    fields = ["name", "age", "gender", "patient_id"]
    best: dict | None = None
    best_score = -1

    for info in infos:
        if not isinstance(info, dict):
            continue
        score = sum(1 for f in fields if _is_complete(info.get(f, "")))
        if score > best_score:
            best_score = score
            best = info

    return best or {"name": "unknown", "age": "unknown", "gender": "unknown", "patient_id": "unknown"}


def validate_extraction(data: dict) -> tuple[bool, str]:
    """Validate extraction JSON has required structure.

    Returns (is_valid, error_message).
    """
    if not isinstance(data, dict):
        return False, f"Extraction output is not a dict, got {type(data).__name__}"

    required_top = ["document_type", "report_date", "patient_information", "tests"]
    for key in required_top:
        if key not in data:
            return False, f"Missing required field: {key}"

    if not isinstance(data["patient_information"], dict):
        return False, "patient_information must be an object"

    patient_required = ["name", "age", "gender", "patient_id"]
    for key in patient_required:
        if key not in data["patient_information"]:
            return False, f"Missing patient_information.{key}"

    if not isinstance(data["tests"], list):
        return False, "tests must be an array"

    test_required = ["test_name", "value", "unit", "reference_range", "flagged"]
    for i, test in enumerate(data["tests"]):
        if not isinstance(test, dict):
            return False, f"tests[{i}] must be an object"
        for key in test_required:
            if key not in test:
                return False, f"Missing tests[{i}].{key}"

    return True, ""


def _build_context_from_chunks(chunk_list: list[dict]) -> str:
    """Build a context string from a list of chunks."""
    return "\n\n".join(
        f"[p.{c['page']} {c['section']}] {c['text']}" for c in chunk_list
    )


async def _extract_section(
    ai_clients: AiClients,
    section_name: str,
    section_chunks: list[dict],
    schema: dict,
    expected_tests_hint: str,
) -> dict | None:
    """Extract structured data from a single section's chunks."""
    context = _build_context_from_chunks(section_chunks)
    if expected_tests_hint:
        context += expected_tests_hint

    try:
        result = await ai_clients.llm.generate_json_deterministic(
            prompt=(
                f"Extract structured data from the following medical report text.\n\n"
                f"This section is: {section_name}\n\n"
                f"Report text:\n{context}"
            ),
            system=EXTRACTION_SYSTEM_PROMPT,
            max_tokens=4000,
            schema=schema,
        )
        is_valid, error = validate_extraction(result)
        if not is_valid:
            logger.warning(f"Section '{section_name}' extraction failed validation: {error}")
            return None
        return result
    except Exception as e:
        logger.warning(f"Section '{section_name}' extraction failed: {e}")
        return None


async def extract_structured_data(
    ai_clients: AiClients,
    chunks: list[dict] | None = None,
    *,
    context_block: str | None = None,
    expected_tests_hint: str = "",
) -> dict:
    """Stage 1: Extract structured medical data from parsed text.

    This is a deterministic extraction call — no reasoning, no interpretation.
    Uses temperature=0 and low top_p for reproducibility.

    When `chunks` is provided, extraction is done per-section and merged —
    this is the recommended path because each section call sees a smaller,
    more focused context, reducing test-miss rates on long documents.

    When `context_block` is provided (legacy path), it's passed directly
    in a single call.

    If both are provided, `chunks` takes precedence.
    """
    if chunks:
        # ── Section-based extraction (recommended) ──────────────────
        sections = _group_chunks_by_section(chunks)
        logger.info(f"Extracting from {len(sections)} section(s): {[s for s, _ in sections]}")

        tasks = [
            _extract_section(ai_clients, name, section_chunks, EXTRACTION_SCHEMA, expected_tests_hint)
            for name, section_chunks in sections
        ]
        results = await asyncio.gather(*tasks)
        results = [r for r in results if r is not None]

        if not results:
            raise ValueError("All section extractions failed — no data extracted")

        # Merge tests across sections
        all_test_lists = [r["tests"] for r in results if r.get("tests")]
        merged_tests = _merge_test_lists(all_test_lists)
        logger.info(f"Merged {sum(len(t) for t in all_test_lists)} raw extractions into {len(merged_tests)} unique tests")

        # Patient info from the most complete source
        patient_infos = [r.get("patient_information", {}) for r in results]
        merged_patient_info = _merge_patient_info(patient_infos)

        # Use first result's top-level metadata, merged tests + patient info
        result = dict(results[0])
        result["tests"] = merged_tests
        result["patient_information"] = merged_patient_info
        return result

    # ── Legacy path: single context_block ────────────────────────────
    if context_block is None:
        raise ValueError("Must provide either chunks or context_block")

    result = await ai_clients.llm.generate_json_deterministic(
        prompt=f"Extract structured data from the following medical report text.\n\nReport text:\n{context_block}",
        system=EXTRACTION_SYSTEM_PROMPT,
        max_tokens=4000,
        schema=EXTRACTION_SCHEMA,
    )

    is_valid, error = validate_extraction(result)
    if not is_valid:
        raise ValueError(f"Extraction validation failed: {error}. Raw output keys: {list(result.keys())}")

    return result
