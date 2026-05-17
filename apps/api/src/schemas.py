from datetime import datetime
from pydantic import BaseModel, Field


class UserResponse(BaseModel):
    id: str
    email: str


class ReportResponse(BaseModel):
    id: str
    filename: str
    status: str
    uploadedAt: datetime
    parsedData: dict | None = None
    errorMessage: str | None = None

    class Config:
        from_attributes = True


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


class AnalyzeResponse(BaseModel):
    answer: str
    sources: list[str]


class UpdateReportRequest(BaseModel):
    filename: str | None = None


class UpdateAccountRequest(BaseModel):
    email: str | None = None
    currentPassword: str
    newPassword: str | None = Field(default=None, min_length=8)


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str = Field(min_length=8)
