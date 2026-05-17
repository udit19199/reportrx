import time
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from jose import jwt, JWTError, jwk
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


_jwks_cache: dict[str, Any] | None = None
_jwks_fetched_at: float = 0
_JWKS_CACHE_TTL = 3600


async def verify_auth0_access_token(token: str) -> dict[str, str | None]:
    global _jwks_cache, _jwks_fetched_at

    now = time.time()
    if _jwks_cache is None or now - _jwks_fetched_at > _JWKS_CACHE_TTL:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://{settings.auth0_domain}/.well-known/jwks.json"
            )
            resp.raise_for_status()
            _jwks_cache = resp.json()
            _jwks_fetched_at = now

    key = jwk.construct(_jwks_cache, algorithm=JWT_ALGORITHM)

    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise JWTError("No kid in token header")

        public_key = None
        for k in _jwks_cache.get("keys", []):
            if k.get("kid") == kid:
                public_key = jwk.construct(k)
                break

        if not public_key:
            raise JWTError("No matching key found")

        payload = jwt.decode(
            token,
            public_key.to_pem().decode(),
            algorithms=[unverified_header.get("alg", JWT_ALGORITHM)],
            audience=settings.auth0_audience,
            issuer=f"https://{settings.auth0_domain}/",
        )

        sub = payload.get("sub")
        email = payload.get("email")
        return {"sub": sub, "email": email}
    except JWTError as e:
        logger.warning(f"Auth0 token verification failed: {e}")
        raise
