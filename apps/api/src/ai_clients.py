import json
from abc import ABC, abstractmethod

import httpx
from openai import AsyncOpenAI

from src.config import get_settings
from src.logging_setup import get_logger

settings = get_settings()
logger = get_logger("ai-clients")


class LlmProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, system: str, max_tokens: int = 1024) -> str: ...

    @abstractmethod
    async def generate_json(self, prompt: str, system: str, max_tokens: int = 1024, schema: dict = None) -> dict: ...

    @abstractmethod
    async def generate_json_deterministic(
        self, prompt: str, system: str, max_tokens: int = 1024, schema: dict = None
    ) -> dict: ...


class EmbeddingProvider(ABC):
    @abstractmethod
    async def embed(self, inputs: list[str]) -> list[list[float]]: ...


class OpenAiProvider(LlmProvider, EmbeddingProvider):
    def __init__(self, api_key: str, base_url: str = None):
        kwargs = {"api_key": api_key}
        if base_url:
            kwargs["base_url"] = base_url
        self.client = AsyncOpenAI(**kwargs)

    async def generate(self, prompt: str, system: str, max_tokens: int = 1024) -> str:
        resp = await self.client.chat.completions.create(
            model=settings.ai_model,
            temperature=0.2,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        )
        return (resp.choices[0].message.content or "").strip()

    async def generate_json(self, prompt: str, system: str, max_tokens: int = 1024, schema: dict = None) -> dict:
        response_format = {"type": "json_object"}
        if schema:
            response_format = {
                "type": "json_schema",
                "json_schema": schema,
            }
        resp = await self.client.chat.completions.create(
            model=settings.ai_model,
            temperature=0.2,
            max_tokens=max_tokens,
            response_format=response_format,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        )
        content = (resp.choices[0].message.content or "").strip()
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            raise ValueError("OpenAI returned invalid JSON")

    async def generate_json_deterministic(
        self, prompt: str, system: str, max_tokens: int = 1024, schema: dict = None
    ) -> dict:
        response_format = {"type": "json_object"}
        if schema:
            response_format = {
                "type": "json_schema",
                "json_schema": schema,
            }
        resp = await self.client.chat.completions.create(
            model=settings.ai_model,
            temperature=0,
            top_p=0.1,
            max_tokens=max_tokens,
            response_format=response_format,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        )
        content = (resp.choices[0].message.content or "").strip()
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            raise ValueError("OpenAI returned invalid JSON")

    async def embed(self, inputs: list[str]) -> list[list[float]]:
        resp = await self.client.embeddings.create(
            model=settings.embed_model,
            input=inputs,
        )
        return [item.embedding for item in resp.data]


class OllamaProvider(LlmProvider, EmbeddingProvider):
    def __init__(self, base_url: str, is_embed: bool = False):
        self.base_url = base_url.rstrip("/")
        self.is_embed = is_embed

    async def generate(self, prompt: str, system: str, max_tokens: int = 1024) -> str:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": settings.ai_model if not self.is_embed else settings.embed_model,
                    "prompt": f"{system}\n\n{prompt}",
                    "stream": False,
                },
            )
            resp.raise_for_status()
            return (resp.json().get("response") or "").strip()

    async def generate_json(self, prompt: str, system: str, max_tokens: int = 1024, schema: dict = None) -> dict:
        format_param = schema.get("schema") if schema else "json"
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": settings.ai_model if not self.is_embed else settings.embed_model,
                    "prompt": f"{system}\n\n{prompt}",
                    "stream": False,
                    "format": format_param,
                },
            )
            resp.raise_for_status()
            content = (resp.json().get("response") or "").strip()
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                raise ValueError("Ollama returned invalid JSON")

    async def generate_json_deterministic(
        self, prompt: str, system: str, max_tokens: int = 1024, schema: dict = None
    ) -> dict:
        format_param = schema.get("schema") if schema else "json"
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": settings.ai_model if not self.is_embed else settings.embed_model,
                    "prompt": f"{system}\n\n{prompt}",
                    "stream": False,
                    "format": format_param,
                    "options": {
                        "temperature": 0,
                        "top_p": 0.1,
                    },
                },
            )
            resp.raise_for_status()
            content = (resp.json().get("response") or "").strip()
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                raise ValueError("Ollama returned invalid JSON")

    async def embed(self, inputs: list[str]) -> list[list[float]]:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/api/embed",
                json={
                    "model": settings.embed_model,
                    "input": inputs,
                },
            )
            resp.raise_for_status()
            return resp.json().get("embeddings") or []


class AiClients:
    def __init__(self, llm: LlmProvider, embed: EmbeddingProvider):
        self.llm = llm
        self.embed = embed


def create_ai_clients() -> AiClients:
    ai_provider = settings.ai_provider.lower()
    embed_provider = settings.embed_provider.lower()

    if ai_provider == "openai" and not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is required when AI_PROVIDER=openai")
    if embed_provider == "openai" and not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is required when EMBED_PROVIDER=openai")

    if ai_provider == "ollama":
        llm = OllamaProvider(settings.ai_base_url)
    else:
        llm = OpenAiProvider(settings.openai_api_key, base_url=settings.openai_api_base)

    if embed_provider == "ollama":
        embed = OllamaProvider(settings.embed_base_url, is_embed=True)
    else:
        embed_base = settings.embed_api_base or settings.openai_api_base
        embed = OpenAiProvider(settings.openai_api_key, base_url=embed_base)

    return AiClients(llm=llm, embed=embed)
