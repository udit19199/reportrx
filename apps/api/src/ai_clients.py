import json
import re
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


class LMStudioProvider(LlmProvider, EmbeddingProvider):
    """LM Studio provider using OpenAI-compatible API for both chat and embeddings.

    LM Studio supports OpenAI's structured output (response_format with json_schema)
    for compatible models. For models that don't support it, we fall back to
    prompt-based JSON instructions and regex extraction.
    """

    def __init__(self, api_key: str, openai_base_url: str, chat_endpoint: str = None):
        # LM Studio uses OpenAI-compatible endpoints
        self.client = AsyncOpenAI(api_key=api_key, base_url=openai_base_url)

    @staticmethod
    def _extract_json(raw: str) -> str:
        """Extract JSON from a response that may have leading/trailing text or markdown fences."""
        # Try to find JSON inside markdown code blocks first
        match = re.search(r"```(?:json)?\s*\n?([\s\S]*?)```", raw)
        if match:
            return match.group(1).strip()
        # Try to find a top-level JSON object (starts with { and ends with })
        match = re.search(r"(\{.*\})", raw, re.DOTALL)
        if match:
            return match.group(1).strip()
        # Try to find a top-level JSON array (starts with [ and ends with ])
        match = re.search(r"(\[.*\])", raw, re.DOTALL)
        if match:
            return match.group(1).strip()
        return raw

    async def generate(self, prompt: str, system: str, max_tokens: int = 1024) -> str:
        """Generate text using LM Studio's OpenAI-compatible chat endpoint."""
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

    def _build_json_instructions(self, schema: dict | None) -> tuple[str, str]:
        """Build system and user additions for JSON generation.

        Returns (system_addition, user_postscript).
        Key insight: Local models pay more attention to the END of the user
        prompt than to the system prompt, so the critical "output JSON"
        instruction goes at the end of the user message.
        """
        if schema:
            schema_hint = json.dumps(schema.get("schema", schema), indent=2)
            system_addition = (
                f"\n\nYou must output valid JSON conforming to this schema:\n"
                f"{schema_hint}"
            )
            user_postscript = (
                "\n\nIMPORTANT: Respond with ONLY valid JSON matching the schema above."
                " No explanations, no markdown, no code fences. Start your response with '{'"
                " and end with '}'. Do not include any text before or after the JSON object."
            )
        else:
            system_addition = ""
            user_postscript = (
                "\n\nIMPORTANT: Respond with ONLY valid JSON. No explanations, no markdown,"
                " no code fences. Start your response with '{' or '[' and end with the"
                " matching closing bracket."
            )
        return system_addition, user_postscript

    def _make_response_format(self, schema: dict | None) -> dict | None:
        """Build the response_format dict for LM Studio's /v1/chat/completions.

        LM Studio supports OpenAI's structured output via json_schema.
        Returns None when no schema is provided (no constraint needed).
        """
        if not schema:
            return None
        return {
            "type": "json_schema",
            "json_schema": schema,
        }

    async def generate_json(self, prompt: str, system: str, max_tokens: int = 1024, schema: dict = None) -> dict:
        """Generate JSON using LM Studio.

        1. Use response_format (json_schema) for models that support it —
           LM Studio uses llama.cpp grammar / Outlines to constrain output.
        2. Fall back to prompt-based JSON extraction for models that don't.
        """
        sys_add, user_post = self._build_json_instructions(schema)
        system_with_json = f"{system}{sys_add}"
        prompt_with_json = f"{prompt}{user_post}"
        response_format = self._make_response_format(schema)

        kwargs = dict(
            model=settings.ai_model,
            temperature=0.2,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system_with_json},
                {"role": "user", "content": prompt_with_json},
            ],
        )
        if response_format:
            kwargs["response_format"] = response_format

        resp = await self.client.chat.completions.create(**kwargs)
        content = (resp.choices[0].message.content or "").strip()
        extracted = self._extract_json(content)
        try:
            return json.loads(extracted)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse JSON from response (first 500 chars): {content[:500]}...")
            logger.warning(f"Extracted JSON attempt: {extracted[:200]}...")
            # Retry without response_format — model may not support structured output
            logger.info("Retrying without response_format...")
            kwargs.pop("response_format", None)
            kwargs["temperature"] = 0
            resp = await self.client.chat.completions.create(**kwargs)
            content = (resp.choices[0].message.content or "").strip()
            extracted = self._extract_json(content)
            try:
                return json.loads(extracted)
            except json.JSONDecodeError:
                # Final retry with assistant priming
                logger.warning("Retrying with assistant priming...")
                kwargs["messages"] = [
                    {"role": "system", "content": system_with_json},
                    {"role": "user", "content": prompt_with_json},
                    {"role": "assistant", "content": "{"},
                ]
                resp = await self.client.chat.completions.create(**kwargs)
                content = (resp.choices[0].message.content or "").strip()
                if not content.startswith("{") and not content.startswith("["):
                    content = "{" + content
                extracted = self._extract_json(content)
                try:
                    return json.loads(extracted)
                except json.JSONDecodeError:
                    logger.error(f"All retries exhausted. Raw content:\n{content[:500]}...")
                    raise ValueError(f"LM Studio returned invalid JSON")

    async def generate_json_deterministic(
        self, prompt: str, system: str, max_tokens: int = 1024, schema: dict = None
    ) -> dict:
        """Generate deterministic JSON using LM Studio with temperature=0."""
        sys_add, user_post = self._build_json_instructions(schema)
        system_with_json = f"{system}{sys_add}"
        prompt_with_json = f"{prompt}{user_post}"
        response_format = self._make_response_format(schema)

        kwargs = dict(
            model=settings.ai_model,
            temperature=0,
            top_p=0.1,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system_with_json},
                {"role": "user", "content": prompt_with_json},
            ],
        )
        if response_format:
            kwargs["response_format"] = response_format

        resp = await self.client.chat.completions.create(**kwargs)
        content = (resp.choices[0].message.content or "").strip()
        extracted = self._extract_json(content)
        try:
            return json.loads(extracted)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse deterministic JSON from response (first 500 chars): {content[:500]}...")
            logger.warning(f"Extracted JSON attempt: {extracted[:200]}...")
            # Retry without response_format
            logger.info("Retrying deterministic without response_format...")
            kwargs.pop("response_format", None)
            resp = await self.client.chat.completions.create(**kwargs)
            content = (resp.choices[0].message.content or "").strip()
            extracted = self._extract_json(content)
            try:
                return json.loads(extracted)
            except json.JSONDecodeError:
                # Final retry with assistant priming
                logger.warning("Retrying deterministic with assistant priming...")
                kwargs["messages"] = [
                    {"role": "system", "content": system_with_json},
                    {"role": "user", "content": prompt_with_json},
                    {"role": "assistant", "content": "{"},
                ]
                resp = await self.client.chat.completions.create(**kwargs)
                content = (resp.choices[0].message.content or "").strip()
                if not content.startswith("{") and not content.startswith("["):
                    content = "{" + content
                extracted = self._extract_json(content)
                try:
                    return json.loads(extracted)
                except json.JSONDecodeError:
                    logger.error(f"All retries exhausted. Raw content:\n{content[:500]}...")
                    raise ValueError(f"LM Studio returned invalid JSON")

    async def embed(self, inputs: list[str]) -> list[list[float]]:
        """Generate embeddings using OpenAI-compatible endpoint."""
        resp = await self.client.embeddings.create(
            model=settings.embed_model,
            input=inputs,
        )
        return [item.embedding for item in resp.data]


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

    # Handle LM Studio provider (OpenAI-compatible API)
    if ai_provider == "openai" and settings.lm_studio_chat_endpoint:
        llm = LMStudioProvider(
            api_key=settings.openai_api_key,
            openai_base_url=settings.openai_api_base,
        )
    elif ai_provider == "ollama":
        llm = OllamaProvider(settings.ai_base_url)
    else:
        llm = OpenAiProvider(settings.openai_api_key, base_url=settings.openai_api_base)
    
    if embed_provider == "ollama":
        embed = OllamaProvider(settings.embed_base_url, is_embed=True)
    else:
        embed = OpenAiProvider(settings.openai_api_key, base_url=settings.openai_api_base)

    return AiClients(llm=llm, embed=embed)
