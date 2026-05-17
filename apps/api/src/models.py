import enum
import json
from datetime import datetime
from sqlalchemy import String, DateTime, Enum as SAEnum, ForeignKey, Index, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.types import TypeDecorator

from src.database import Base


class ReportStatus(enum.Enum):
    pending = "pending"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class JsonString(TypeDecorator):
    """Stores Python dicts/lists as JSON strings in SQLite TEXT columns."""
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return json.loads(value)


class User(Base):
    __tablename__ = "User"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column("passwordHash", String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, server_default=func.now()
    )

    reports: Mapped[list["Report"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Report(Base):
    __tablename__ = "Report"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column("userId", String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    storage_path: Mapped[str] = mapped_column("storagePath", String, nullable=False)
    parsed_data: Mapped[dict | None] = mapped_column("parsedData", JsonString, nullable=True)
    error_message: Mapped[str | None] = mapped_column("errorMessage", Text, nullable=True)
    current_stage: Mapped[str | None] = mapped_column(
        "currentStage", String(64), nullable=True, default=None
    )
    status: Mapped[ReportStatus] = mapped_column(
        SAEnum(ReportStatus), default=ReportStatus.pending, nullable=False
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        "uploadedAt", DateTime, server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="reports")

    __table_args__ = (Index("ix_Report_userId", "userId"),)
