import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import get_settings, validate_settings
from src.database import engine, Base, SessionLocal
from src.models import User
from src.auth import verify_token, verify_auth0_access_token
from src.ai_clients import create_ai_clients
from src.vector_store import start_qdrant, stop_qdrant
from src.health import log_service_health
from src.workers.watchdog import start_watchdog_loop
from src.logging_setup import setup_logging, get_logger
from src.routes import auth, reports, analyze, trends

logger = get_logger("main")


def _run_migrations():
    """Apply schema migrations for columns added after initial creation.

    SQLAlchemy's Base.metadata.create_all() only creates tables, it does NOT
    ALTER existing tables when new columns are added to models. This function
    adds any missing columns to keep the schema in sync.
    """
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    existing_columns = {c["name"] for c in inspector.get_columns("Report")}

    migrations = [
        # currentStage was added after initial deploy
        ("Report", "currentStage", "VARCHAR(64)"),
    ]

    for table, column, col_type in migrations:
        if column not in existing_columns:
            try:
                with engine.connect() as conn:
                    conn.execute(text(f"ALTER TABLE \"{table}\" ADD COLUMN \"{column}\" {col_type}"))
                    conn.commit()
                logger.info(f"Added missing column {table}.{column}")
            except Exception as e:
                logger.warning(f"Failed to add column {table}.{column}: {e}")
        else:
            # Refresh column list in case we added one
            existing_columns.add(column)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    settings = get_settings()
    validate_settings(settings)
    logger.info("Starting Medical Report Analyzer API...")

    Base.metadata.create_all(bind=engine)
    _run_migrations()
    logger.info("Database schema created/verified")

    await start_qdrant()
    ai_clients = create_ai_clients()

    app.state.ai_clients = ai_clients

    logger.info(f"Vector store: Qdrant ({settings.qdrant_url})")
    logger.info(f"AI provider: {settings.ai_provider}, Embed provider: {settings.embed_provider}")
    logger.info(f"AI model: {settings.ai_model}")

    asyncio.create_task(log_service_health(ai_clients, settings))
    asyncio.create_task(start_watchdog_loop(interval_seconds=60))

    logger.info("API startup complete")

    yield

    logger.info("Shutting down...")
    await stop_qdrant()
    logger.info("Shutdown complete")


app = FastAPI(title="Medical Report Analyzer API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]


def _cors_headers(origin: str | None) -> dict[str, str]:
    """Return CORS headers if the origin is allowed."""
    if origin and origin in ALLOWED_ORIGINS:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    return {}


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # CORS preflight must pass through because this middleware wraps OUTSIDE
    # the CORSMiddleware — without this, OPTIONS requests hit auth first and
    # get rejected before CORSMiddleware can respond to the preflight.
    if request.method == "OPTIONS":
        return await call_next(request)

    if request.url.path.startswith("/api/auth") or request.url.path == "/":
        return await call_next(request)

    token = None
    is_bearer = False

    auth_header = request.headers.get("authorization")
    if auth_header:
        parts = auth_header.split(" ", 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1].strip()
            is_bearer = True

    if not token:
        token = request.cookies.get("token")

    if not token:
        response = JSONResponse(status_code=401, content={"error": "Unauthorized"})
        for k, v in _cors_headers(request.headers.get("origin")).items():
            response.headers[k] = v
        return response

    try:
        if is_bearer:
            profile = await verify_auth0_access_token(token)
            email = profile.get("email") or f"auth0:{profile['sub']}"
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.email == email).first()
                if not user:
                    user = User(id=str(profile["sub"]), email=email, password_hash=profile["sub"])
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                request.state.user_id = user.id
                request.state.user_email = user.email
            finally:
                db.close()
        else:
            payload = verify_token(token)
            request.state.user_id = payload["sub"]
            request.state.user_email = payload["email"]
    except Exception as e:
        get_logger("auth").warning(f"Auth verification failed: {e}")
        response = JSONResponse(status_code=401, content={"error": "Unauthorized"})
        for k, v in _cors_headers(request.headers.get("origin")).items():
            response.headers[k] = v
        return response

    return await call_next(request)


app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(analyze.router)
app.include_router(trends.router)


@app.get("/")
async def root():
    return {"status": "ok", "message": "Medical Report Analyzer API"}
