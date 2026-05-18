from collections import defaultdict

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import TestResult, Report, ReportStatus

router = APIRouter(prefix="/api/trends", tags=["trends"])


def get_user_id(request: Request) -> str:
    return request.state.user_id


@router.get("")
async def get_trends(
    request: Request,
    db: Session = Depends(get_db),
):
    user_id = get_user_id(request)

    # Query all user's report IDs that are ready
    ready_report_ids = [
        r[0]
        for r in db.query(Report.id)
        .filter(Report.user_id == user_id, Report.status == ReportStatus.ready)
        .all()
    ]

    if not ready_report_ids:
        return {"tests": {}}

    from sqlalchemy import case

    # Coalesce: prefer report_date (parsed from PDF) over uploaded_at
    sort_col = case(
        (Report.report_date.isnot(None), Report.report_date),
        else_=Report.uploaded_at
    )

    # Query TestResult for all ready reports, ordered by report date (PDF) / upload date
    results = (
        db.query(TestResult, Report.uploaded_at, Report.filename, Report.report_date)
        .join(Report, TestResult.report_id == Report.id)
        .filter(
            TestResult.report_id.in_(ready_report_ids),
            Report.user_id == user_id,
        )
        .order_by(sort_col.asc())
        .all()
    )

    grouped: dict[str, list[dict]] = defaultdict(list)

    for result, uploaded_at, filename, report_date in results:
        test_name = result.test_name
        grouped[test_name].append({
            "reportId": result.report_id,
            "filename": filename,
            "uploadedAt": uploaded_at.isoformat(),
            "reportDate": report_date,
            "value": result.value,
            "unit": result.unit,
            "referenceRange": result.report_range,
            "flagged": result.flagged,
            "status": result.status,
        })

    return {"tests": dict(grouped)}
