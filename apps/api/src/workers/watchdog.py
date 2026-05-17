"""
Watchdog worker that monitors reports stuck in 'processing' state.

If a report has been processing for longer than the timeout threshold,
it's automatically marked as failed to prevent indefinite stuck states.
"""

import asyncio
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.logging_setup import get_logger
from src.database import SessionLocal
from src.models import Report, ReportStatus

logger = get_logger("watchdog")

PROCESSING_TIMEOUT_MINUTES = 10  # Reports stuck longer than this are failed


async def run_watchdog() -> None:
    """Monitor and fail stale processing reports."""
    db = SessionLocal()
    try:
        # Calculate cutoff time (10 minutes ago)
        cutoff_time = datetime.utcnow() - timedelta(minutes=PROCESSING_TIMEOUT_MINUTES)

        # Find reports stuck in processing
        stale_reports = (
            db.query(Report)
            .filter(
                Report.status == ReportStatus.processing,
                Report.uploaded_at < cutoff_time,
            )
            .all()
        )

        if not stale_reports:
            logger.info("No stale reports found")
            return

        logger.warning(f"Found {len(stale_reports)} reports stuck in processing")

        for report in stale_reports:
            elapsed = datetime.utcnow() - report.uploaded_at
            logger.warning(
                f"Marking report {report.id} as failed "
                f"(stuck for {elapsed.total_seconds() / 60:.1f} minutes)"
            )

            db.query(Report).filter(Report.id == report.id).update(
                {
                    "status": ReportStatus.failed,
                    "current_stage": "failed",
                    "error_message": f"Processing timeout after {PROCESSING_TIMEOUT_MINUTES} minutes. "
                    "The PDF may be too large or complex. Please try uploading a smaller file.",
                }
            )

        db.commit()
        logger.info(f"Updated {len(stale_reports)} reports")

    except Exception as e:
        logger.error(f"Watchdog error: {e}")
        try:
            db.rollback()
        except Exception:
            pass
    finally:
        try:
            db.close()
        except Exception:
            pass


async def start_watchdog_loop(interval_seconds: int = 60) -> None:
    """Start the watchdog loop that runs periodically.
    
    Args:
        interval_seconds: How often to run the watchdog check (default: 60 seconds)
    """
    logger.info(f"Starting watchdog loop (interval: {interval_seconds}s, timeout: {PROCESSING_TIMEOUT_MINUTES}min)")

    while True:
        try:
            await run_watchdog()
        except Exception as e:
            logger.error(f"Unexpected error in loop: {e}")

        await asyncio.sleep(interval_seconds)
