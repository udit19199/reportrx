from datetime import date
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: str
    password: str


class AnalyzeRequest(BaseModel):
    reportId: str = Field(min_length=1)
    query: str = Field(min_length=1)
    topK: int = Field(default=5, ge=1, le=20)


class UpdateReportRequest(BaseModel):
    filename: str | None = None


class UpdateAccountRequest(BaseModel):
    email: str | None = None
    currentPassword: str
    newPassword: str | None = Field(default=None, min_length=8)


class UpdateProfileRequest(BaseModel):
    dateOfBirth: str | None = None  # ISO date string
    gender: str | None = Field(default=None, pattern=r"^(male|female|other)?$")
    weightKg: float | None = None
    heightCm: float | None = None
    pregnant: bool | None = None


class UserProfileResponse(BaseModel):
    id: str
    email: str
    dateOfBirth: str | None = None
    gender: str | None = None
    weightKg: float | None = None
    heightCm: float | None = None
    pregnant: bool | None = None
