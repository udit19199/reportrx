import json

from src.ai_clients import AiClients
from src.config import get_settings
from src.logging_setup import get_logger

logger = get_logger("interpretation")
settings = get_settings()

INTERPRETATION_SCHEMA = {
    "name": "medical_report_interpretation",
    "schema": {
        "type": "object",
        "properties": {
            "abnormal_findings": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "finding": {"type": "string"},
                        "severity": {
                            "type": "string",
                            "enum": ["mild", "moderate", "severe", "unclear"],
                        },
                        "explanation": {"type": "string"},
                    },
                    "required": ["finding", "severity", "explanation"],
                },
            },
            "summary": {"type": "string"},
            "alerts": {"type": "array", "items": {"type": "string"}},
            "interpretation": {"type": "string"},
        },
        "required": ["abnormal_findings", "summary", "alerts", "interpretation"],
    },
    "strict": True,
}

INTERPRETATION_SYSTEM_PROMPT = """You are a medical report interpretation assistant.

Analyze the extracted structured data and provide clinical interpretation.

RULES:
- Base your analysis ONLY on the provided extracted data and retrieved context.
- Do not hallucinate diagnoses or invent values.
- Identify abnormal findings by comparing test values against reference ranges.
- Provide clear, concise explanations suitable for patient understanding.
- Flag critical values that require immediate medical attention.
- If no abnormalities are found, state that all values are within normal ranges.
- Use plain language but include brief medical term explanations.

The extracted data contains:
- patient_information: demographics
- tests: lab values with units and reference ranges

Use retrieved context (if provided) for:
- Historical comparisons
- Reference range clarification
- Medical guideline context

Do not treat retrieved context as confirmed patient facts unless explicitly stated."""


async def interpret_structured_data(
    ai_clients: AiClients,
    extraction: dict,
    retrieved_context: str = "",
) -> dict:
    """Stage 2: Interpret extracted structured data and generate medical insights.

    This call may use reasoning, larger prompts, and retrieved context.
    Falls gracefully if interpretation fails — extraction results are preserved.
    """
    tests_summary = json.dumps(extraction.get("tests", []), indent=2)
    patient_info = json.dumps(extraction.get("patient_information", {}), indent=2)

    context_section = ""
    if retrieved_context:
        context_section = f"\n\nRetrieved context (historical data, guidelines):\n{retrieved_context}"

    prompt = f"""Interpret the following extracted medical report data.

Document type: {extraction.get("document_type", "unknown")}
Report date: {extraction.get("report_date", "unknown")}

Patient information:
{patient_info}

Extracted tests:
{tests_summary}
{context_section}

Provide clinical interpretation including abnormal findings, summary, alerts, and overall interpretation."""

    try:
        result = await ai_clients.llm.generate_json(
            prompt=prompt,
            system=INTERPRETATION_SYSTEM_PROMPT,
            max_tokens=2000,
            schema=INTERPRETATION_SCHEMA,
        )
        return result
    except Exception as e:
        logger.error(f"Failed to generate interpretation: {e}")
        return {
            "abnormal_findings": [],
            "summary": "Interpretation could not be generated.",
            "alerts": [],
            "interpretation": f"Error during interpretation: {str(e)}",
        }
