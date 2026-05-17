import json

from src.ai_clients import AiClients

EXTRACTION_SCHEMA = {
    "name": "medical_report_extraction",
    "schema": {
        "type": "object",
        "properties": {
            "document_type": {"type": "string"},
            "report_date": {"type": "string"},
            "patient_information": {
                "type": "object",
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


async def extract_structured_data(
    ai_clients: AiClients,
    chunks: list[dict] | None = None,
    *,
    context_block: str | None = None,
) -> dict:
    """Stage 1: Extract structured medical data from parsed text.

    This is a deterministic extraction call — no reasoning, no interpretation.
    Uses temperature=0 and low top_p for reproducibility.

    Accepts either:
    - `chunks`: list of {"text", "page", "section"} dicts (all parsed chunks)
    - `context_block`: pre-built context string (optimized, smaller prompt)

    If both are provided, `context_block` takes precedence.
    """
    if context_block is None:
        if not chunks:
            raise ValueError("Must provide either chunks or context_block")
        context_block = "\n\n".join(
            f"[p.{c['page']} {c['section']}] {c['text']}" for c in chunks
        )

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
