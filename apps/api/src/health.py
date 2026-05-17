import httpx
import shutil
from openai import AsyncOpenAI

from src.logging_setup import get_logger
from src.config import get_settings, Settings

logger = get_logger("health")
settings = get_settings()


async def check_service_health(ai_clients, settings: Settings) -> dict:
    results = {
        "liteParse": {"status": "unknown", "error": None},
        "aiProvider": {"status": "unknown", "error": None},
        "embedProvider": {"status": "unknown", "error": None},
    }

    try:
        lit_path = shutil.which("lit")
        if not lit_path:
            raise RuntimeError("lit CLI not found")
        results["liteParse"]["status"] = "ok"
    except Exception as e:
        results["liteParse"]["status"] = "error"
        results["liteParse"]["error"] = str(e)

    try:
        if settings.ai_provider.lower() == "openai":
            client = AsyncOpenAI(api_key=settings.openai_api_key, base_url=settings.openai_api_base)
            await client.chat.completions.create(
                model=settings.ai_model,
                messages=[{"role": "user", "content": "test"}],
                max_tokens=1,
            )
        else:
            async with httpx.AsyncClient() as http:
                await http.post(
                    f"{settings.ai_base_url}/api/generate",
                    json={"model": settings.ai_model, "prompt": "test", "stream": False},
                )
        results["aiProvider"]["status"] = "ok"
    except Exception as e:
        results["aiProvider"]["status"] = "error"
        results["aiProvider"]["error"] = str(e)

    try:
        if settings.embed_provider.lower() == "openai":
            client = AsyncOpenAI(api_key=settings.openai_api_key, base_url=settings.openai_api_base)
            await client.embeddings.create(
                model=settings.embed_model,
                input=["test"],
            )
        else:
            async with httpx.AsyncClient() as http:
                await http.post(
                    f"{settings.embed_base_url}/api/embeddings",
                    json={"model": settings.embed_model, "input": ["test"]},
                )
        results["embedProvider"]["status"] = "ok"
    except Exception as e:
        results["embedProvider"]["status"] = "error"
        results["embedProvider"]["error"] = str(e)

    return results


async def log_service_health(ai_clients, settings: Settings) -> dict:
    logger.info("Checking external service connectivity...")
    health = await check_service_health(ai_clients, settings)

    for service, result in health.items():
        if result["status"] == "ok":
            logger.info(f"✓ {service}: ready")
        else:
            logger.error(f"✗ {service}: failed — {result['error']}")

    return health
