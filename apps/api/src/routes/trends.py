from collections import defaultdict

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Report, ReportStatus

router = APIRouter(prefix="/api/trends", tags=["trends"])


def get_user_id(request: Request) -> str:
    return request.state.user_id


def extract_tests(parsed_data: dict | None) -> list[dict]:
    """Extract tests list from parsed_data, handling both legacy and two-stage formats."""
    if not parsed_data:
        return []
    if "extraction" in parsed_data:
        return parsed_data["extraction"].get("tests", [])
    return parsed_data.get("tests", [])


@router.get("")
async def get_trends(
    request: Request,
    db: Session = Depends(get_db),
):
    user_id = get_user_id(request)

    reports = (
        db.query(Report)
        .filter(Report.user_id == user_id, Report.status == ReportStatus.ready, Report.parsed_data.isnot(None))
        .order_by(Report.uploaded_at.asc())
        .all()
    )

    grouped: dict[str, list[dict]] = defaultdict(list)

    for report in reports:
        tests = extract_tests(report.parsed_data)
        for test in tests:
            test_name = test.get("test_name")
            if not test_name:
                continue
            grouped[test_name].append({
                "reportId": report.id,
                "filename": report.filename,
                "uploadedAt": report.uploaded_at.isoformat(),
                "value": test.get("value"),
                "unit": test.get("unit"),
                "referenceRange": test.get("reference_range"),
                "flagged": test.get("flagged", False),
                "status": test.get("status", "normal"),
            })

    return {"tests": dict(grouped)}
