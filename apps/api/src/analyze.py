from src.ai_clients import AiClients
from src.config import get_settings
from src.vector_store import search_vectors

settings = get_settings()

QA_PROMPT = """You are a medical report analysis assistant.
Use only the given context from the uploaded report.
If the answer is not in the report, say that clearly.
Answer in plain language and include brief explanations of medical terms."""


async def answer_question(
    user_id: str,
    report_id: str,
    query: str,
    top_k: int,
    ai_clients: AiClients,
) -> tuple[str, list[str]]:
    from src.database import SessionLocal
    from src.models import Report, ReportStatus

    db = SessionLocal()
    try:
        report = db.query(Report).filter(Report.id == report_id, Report.user_id == user_id).first()
        if not report:
            return "", []
        if report.status != ReportStatus.ready:
            raise ValueError("Report not ready")

        query_vector = (await ai_clients.embed.embed([query]))[0]
        contexts, sources = await search_vectors(query_vector, user_id, report_id, top_k)

        if not contexts:
            return "I could not find relevant sections in this report for that question.", []

        context_block = "\n\n".join(f"- {c}" for c in contexts)
        answer = await ai_clients.llm.generate(
            prompt=f"{QA_PROMPT}\n\nContext:\n{context_block}\n\nQuestion: {query}",
            system="You answer only from the provided report context.",
        )

        return answer, sources
    finally:
        db.close()
