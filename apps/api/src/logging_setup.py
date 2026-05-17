import logging
import sys
from datetime import datetime, timezone


class PrefixedFormatter(logging.Formatter):
    """Custom formatter that adds timestamp and module prefix like: [2026-05-17 14:30:00] [INGESTION] INFO: message"""

    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        return f"[{timestamp}] [{record.name:12s}] {record.levelname}: {record.getMessage()}"


def setup_logging() -> None:
    """Configure root logger with consistent structured format."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(PrefixedFormatter())
    logging.basicConfig(level=logging.INFO, handlers=[handler], force=True)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
