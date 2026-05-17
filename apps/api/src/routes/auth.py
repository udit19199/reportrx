import uuid
import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import User, Report
from src.schemas import UserResponse, RegisterRequest, LoginRequest, UpdateAccountRequest
from src.auth import hash_password, verify_password, sign_token, verify_token
from src.config import get_settings
from src.vector_store import delete_by_report_id
from src.logging_setup import get_logger

settings = get_settings()
logger = get_logger("auth")
router = APIRouter(prefix="/api/auth", tags=["auth"])


def auth_cookie_options() -> dict:
    return {
        "httponly": True,
        "samesite": "lax",
        "secure": settings.cookie_secure,
        "path": "/",
    }


@router.get("/me")
async def get_me(
    request: Request,
    db: Session = Depends(get_db),
):
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = verify_token(token)
        user = db.query(User).filter(User.id == payload["sub"]).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {"user": {"id": user.id, "email": user.email}}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/register")
async def register(
    body: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    password_hash = hash_password(body.password)
    user = User(
        id=str(uuid.uuid4()),
        email=body.email,
        password_hash=password_hash,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = sign_token(sub=user.id, email=user.email)
    response.set_cookie(key="token", value=token, **auth_cookie_options())

    return {"user": {"id": user.id, "email": user.email}}


@router.post("/login")
async def login(
    body: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = sign_token(sub=user.id, email=user.email)
    response.set_cookie(key="token", value=token, **auth_cookie_options())

    return {"user": {"id": user.id, "email": user.email}}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="token", path="/")
    return {"ok": True}


@router.put("/me")
async def update_account(
    body: UpdateAccountRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    user_id = request.state.user_id
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(body.currentPassword, user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    if body.email is not None and body.email != user.email:
        existing = db.query(User).filter(User.email == body.email).first()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        user.email = body.email

    if body.newPassword is not None:
        user.password_hash = hash_password(body.newPassword)

    db.commit()
    db.refresh(user)

    # Re-issue token with updated email
    token = sign_token(sub=user.id, email=user.email)
    response.set_cookie(key="token", value=token, **auth_cookie_options())

    return {"user": {"id": user.id, "email": user.email}}


@router.delete("/me")
async def delete_account(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    user_id = request.state.user_id
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Clean up uploaded files and vectors before deleting the user
    reports = db.query(Report).filter(Report.user_id == user_id).all()
    for report in reports:
        try:
            os.remove(report.storage_path)
        except OSError as e:
            logger.warning(f"Could not remove file {report.storage_path}: {e}")
        try:
            await delete_by_report_id("", user_id, report.id)
        except Exception as e:
            logger.warning(f"Could not delete vectors for report {report.id}: {e}")

    # Cascade deletes report rows; user row is removed
    db.delete(user)
    db.commit()

    response.delete_cookie(key="token", path="/")
    return {"ok": True}
