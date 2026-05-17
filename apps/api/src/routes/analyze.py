from fastapi import APIRouter, Depends, HTTPException, Request

from src.schemas import AnalyzeRequest
from src.analyze import answer_question
from src.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/analyze", tags=["analyze"])


def get_user_id(request: Request) -> str:
    return request.state.user_id


@router.post("")
async def analyze(
    body: AnalyzeRequest,
    request: Request,
):
    user_id = get_user_id(request)

    try:
        answer, sources = await answer_question(
            user_id=user_id,
            report_id=body.reportId,
            query=body.query,
            top_k=body.topK,
            ai_clients=request.app.state.ai_clients,
        )
        if not answer:
            raise HTTPException(status_code=404, detail="Report not found")
        return {"answer": answer, "sources": sources}
    except ValueError as e:
        if str(e) == "Report not ready":
            raise HTTPException(status_code=409, detail="Report not ready")
        raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")
