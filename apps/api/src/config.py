from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str = "file:./prisma/dev.db"
    jwt_secret: str = ""
    jwt_expires_minutes: int = 30
    upload_dir: str = "uploads"
    max_upload_mb: int = 10
    ai_provider: str = "openai"
    embed_provider: str = "openai"
    ai_model: str = "gpt-4o-mini"
    embed_model: str = "text-embedding-3-large"
    openai_api_key: str = ""
    openai_api_base: str = "https://api.openai.com/v1"
    lm_studio_chat_endpoint: str = ""
    ai_base_url: str = "http://localhost:11434"
    embed_base_url: str = "http://localhost:11434"
    qdrant_url: str = "http://localhost:6333"
    vector_collection: str = "medical_reports"
    embed_dim: int = 768
    cookie_secure: bool = False
    structured_output_system_prompt: str = ""


@lru_cache()
def get_settings() -> Settings:
    return Settings()


def validate_settings(settings: Settings) -> None:
    missing = []
    if not settings.database_url:
        missing.append("DATABASE_URL")
    if not settings.jwt_secret:
        missing.append("JWT_SECRET")
    if settings.ai_provider.lower() == "openai" and not settings.openai_api_key:
        missing.append("OPENAI_API_KEY")
    if settings.embed_provider.lower() == "openai" and not settings.openai_api_key:
        missing.append("OPENAI_API_KEY")
    if missing:
        raise ValueError(f"Missing required env vars: {', '.join(dict.fromkeys(missing))}")
