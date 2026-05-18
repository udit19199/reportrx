import enum
import json
from datetime import datetime, date
from sqlalchemy import String, DateTime, Enum as SAEnum, ForeignKey, Index, Text, JSON, Integer, Float, Boolean, Date
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


class JsonList(TypeDecorator):
    """Stores Python lists as JSON strings in SQLite TEXT columns."""
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

    # Profile fields
    date_of_birth: Mapped[date | None] = mapped_column("dateOfBirth", Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(16), nullable=True)   # "male", "female", "other"
    weight_kg: Mapped[float | None] = mapped_column("weightKg", Float, nullable=True)
    height_cm: Mapped[float | None] = mapped_column("heightCm", Float, nullable=True)
    pregnant: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    reports: Mapped[list["Report"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class TestCatalog(Base):
    """One row per canonical lab test, independent of panels."""
    __tablename__ = "TestCatalog"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    test_name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    standard_unit: Mapped[str | None] = mapped_column("standardUnit", String(64), nullable=True)
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)  # "hematology", "biochemistry", "hormone", etc.
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())


class Panel(Base):
    """A group of tests commonly ordered together (e.g. CBC, KFT, LFT)."""
    __tablename__ = "Panel"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column("displayOrder", Integer, default=0)


class PanelTest(Base):
    """Which tests belong to which panels, in display order."""
    __tablename__ = "PanelTest"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    panel_id: Mapped[str] = mapped_column("panelId", String, ForeignKey("Panel.id", ondelete="CASCADE"), nullable=False)
    test_id: Mapped[str] = mapped_column("testId", String, ForeignKey("TestCatalog.id", ondelete="CASCADE"), nullable=False)
    display_order: Mapped[int] = mapped_column("displayOrder", Integer, default=0)

    __table_args__ = (Index("ix_PanelTest_panelId", "panelId"), Index("ix_PanelTest_testId", "testId"))


class TestReferenceRange(Base):
    """Demographic-specific reference ranges for each test.

    Supports per-gender, per-age-bucket ranges so the correct reference
    can be looked up given a patient's age and gender.
    """
    __tablename__ = "TestReferenceRange"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    test_id: Mapped[str] = mapped_column("testId", String, ForeignKey("TestCatalog.id", ondelete="CASCADE"), nullable=False)
    gender: Mapped[str | None] = mapped_column(String(16), nullable=True)   # "male", "female", null = any
    age_min: Mapped[int | None] = mapped_column("ageMin", Integer, nullable=True)   # inclusive
    age_max: Mapped[int | None] = mapped_column("ageMax", Integer, nullable=True)   # exclusive, null = no upper bound
    range_min: Mapped[float | None] = mapped_column("rangeMin", Float, nullable=True)
    range_max: Mapped[float | None] = mapped_column("rangeMax", Float, nullable=True)
    range_text: Mapped[str | None] = mapped_column("rangeText", String(128), nullable=True)  # display text like "<= 199.9"
    range_type: Mapped[str] = mapped_column("rangeType", String(16), default="numeric")  # "numeric", "max_only", "min_only", "ratio", "text"
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[int] = mapped_column(Integer, default=0)  # higher = preferred when multiple match

    __table_args__ = (Index("ix_TestReferenceRange_testId", "testId"),)


class TestResult(Base):
    """Per-report test values, extracted from the report during ingestion."""
    __tablename__ = "TestResult"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    report_id: Mapped[str] = mapped_column("reportId", String, ForeignKey("Report.id", ondelete="CASCADE"), nullable=False)
    test_id: Mapped[str | None] = mapped_column("testId", String, ForeignKey("TestCatalog.id", ondelete="SET NULL"), nullable=True)
    test_name: Mapped[str] = mapped_column("testName", String, nullable=False)  # canonical name from extraction
    value: Mapped[str] = mapped_column(String, nullable=False)
    unit: Mapped[str | None] = mapped_column(String(64), nullable=True)
    report_range: Mapped[str | None] = mapped_column("reportRange", String(128), nullable=True)  # from the PDF
    flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(16), default="normal")
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, server_default=func.now())

    report: Mapped["Report"] = relationship(back_populates="test_results")

    __table_args__ = (
        Index("ix_TestResult_reportId", "reportId"),
        Index("ix_TestResult_testName", "testName"),
        Index("ix_TestResult_testId", "testId"),
    )


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

    # Report date extracted from the PDF content (may differ from upload date)
    report_date: Mapped[str | None] = mapped_column("reportDate", String(32), nullable=True)

    # Report-type tracking
    selected_panels: Mapped[list | None] = mapped_column("selectedPanels", JsonList, nullable=True)  # ["cbc", "kft", ...]

    # Patient snapshot from the report (filled during ingestion)
    patient_age: Mapped[int | None] = mapped_column("patientAge", Integer, nullable=True)
    patient_gender: Mapped[str | None] = mapped_column("patientGender", String(16), nullable=True)

    user: Mapped["User"] = relationship(back_populates="reports")
    test_results: Mapped[list["TestResult"]] = relationship(back_populates="report", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_Report_userId", "userId"),)
