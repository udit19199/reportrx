import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt, JWTError
from jose.constants import ALGORITHMS

from src.logging_setup import get_logger
from src.config import get_settings

logger = get_logger("auth")
settings = get_settings()

SALT_ROUNDS = 10
JWT_ALGORITHM = ALGORITHMS.HS256

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(SALT_ROUNDS)).decode()

def verify_password(password: str, hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hash.encode())
    except Exception:
        return False

def sign_token(sub: str, email: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expires_minutes)
    return jwt.encode(
        {"sub": sub, "email": email, "exp": expires},
        settings.jwt_secret,
        algorithm=JWT_ALGORITHM,
    )

def verify_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret, algorithms=[JWT_ALGORITHM])
