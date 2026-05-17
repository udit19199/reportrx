# Changes Made for LM Studio Integration

## Modified Files

### 1. `apps/api/.env`

**Before:**
```
AI_PROVIDER=ollama
EMBED_PROVIDER=ollama
AI_MODEL=gpt-oss-20b
EMBED_MODEL=nomic-embed-text
AI_BASE_URL=http://localhost:11434
EMBED_BASE_URL=http://localhost:11434
OPENAI_API_KEY=sk-proj-xxx...  # Old OpenAI key
```

**After:**
```
AI_PROVIDER=openai
EMBED_PROVIDER=openai
AI_MODEL=gpt-oss-20b
EMBED_MODEL=nomic-embed-text
OPENAI_API_BASE=http://127.0.0.1:1234/v1
OPENAI_API_KEY=lm-studio
```

**Why:** LM Studio provides an OpenAI-compatible API on port 1234, so we switched from Ollama to OpenAI provider.

---

### 2. `apps/api/src/config.py`

**Added:**
```python
openai_api_base: str = "https://api.openai.com/v1"
ai_base_url: str = "http://localhost:11434"  # Kept for Ollama fallback
embed_base_url: str = "http://localhost:11434"  # Kept for Ollama fallback
```

**Why:** Added support for custom OpenAI base URLs (for LM Studio), while keeping Ollama fallback settings.

---

### 3. `apps/api/src/ai_clients.py`

**Changed OpenAiProvider.__init__:**
```python
# Before:
def __init__(self, api_key: str):
    self.client = AsyncOpenAI(api_key=api_key)

# After:
def __init__(self, api_key: str, base_url: str = None):
    kwargs = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
    self.client = AsyncOpenAI(**kwargs)
```

**Changed create_ai_clients():**
```python
# Before:
llm = OllamaProvider(...) if ai_provider == "ollama" else OpenAiProvider(api_key)

# After:
if ai_provider == "ollama":
    llm = OllamaProvider(settings.ai_base_url)
else:
    llm = OpenAiProvider(settings.openai_api_key, base_url=settings.openai_api_base)
```

**Why:** Added support for custom base URL so OpenAiProvider can point to LM Studio instead of OpenAI's servers.

---

## Summary of Changes

| File | Changes | Why |
|------|---------|-----|
| `.env` | Provider: ollama→openai, Base URL: 127.0.0.1:1234/v1 | Use LM Studio instead of Ollama |
| `config.py` | Added openai_api_base setting | Support custom OpenAI endpoints |
| `ai_clients.py` | OpenAiProvider accepts base_url parameter | Point to LM Studio instead of OpenAI |

---

## Backwards Compatibility

✅ Still supports Ollama (ai_base_url and embed_base_url kept)
✅ Still supports real OpenAI (if you update .env and remove base_url override)
✅ Can easily switch between LM Studio, Ollama, or OpenAI by editing .env

---

## How It Works Now

1. **Frontend** (Next.js) → uploads PDF
2. **Backend** (FastAPI) → receives upload
3. **Config** → reads `OPENAI_API_BASE=http://127.0.0.1:1234/v1`
4. **OpenAiProvider** → connects to LM Studio (not OpenAI)
5. **Models** → gpt-oss-20b (generation), nomic-embed-text (embeddings)
6. **Response** → returns summary, insights, next actions

All through LM Studio's OpenAI-compatible API! 🚀
