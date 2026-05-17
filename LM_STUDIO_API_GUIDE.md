# LM Studio API Integration Guide

## 🎯 Current Configuration

Your ReportRx is now configured to use **LM Studio's actual API endpoints**:

### **Endpoints**

1. **Embeddings** (OpenAI-compatible)
   ```
   POST http://127.0.0.1:1234/v1/embeddings
   ```
   - Model: `text-embedding-nomic-embed-text-v1.5`
   - Format: Standard OpenAI API

2. **Chat** (Custom LM Studio format)
   ```
   POST http://127.0.0.1:1234/api/v1/chat
   ```
   - Model: `openai/gpt-oss-20b`
   - Format: `{"model": "...", "system_prompt": "...", "input": "..."}`

### **Configuration Files**

**`.env` (apps/api/.env)**
```
AI_MODEL=openai/gpt-oss-20b
EMBED_MODEL=text-embedding-nomic-embed-text-v1.5
OPENAI_API_BASE=http://127.0.0.1:1234/v1
LM_STUDIO_CHAT_ENDPOINT=http://127.0.0.1:1234/api/v1/chat
```

---

## 🔄 How the Integration Works

### **Embeddings Flow**
```
ReportRx
  ↓
LMStudioProvider.embed()
  ↓
Opens AsyncOpenAI client with base_url=http://127.0.0.1:1234/v1
  ↓
POST /v1/embeddings with model="text-embedding-nomic-embed-text-v1.5"
  ↓
LM Studio returns embedding vectors
```

### **Chat/Summary Flow**
```
ReportRx
  ↓
LMStudioProvider.generate()
  ↓
POST http://127.0.0.1:1234/api/v1/chat
  {
    "model": "openai/gpt-oss-20b",
    "system_prompt": "You are a medical report analyzer...",
    "input": "Summarize this report..."
  }
  ↓
LM Studio returns response with "output" field
  ↓
Extract and return output string
```

---

## ✅ Testing the Integration

### **Test Embeddings**
```bash
curl http://127.0.0.1:1234/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-nomic-embed-text-v1.5",
    "input": "Test embedding"
  }'
```

Expected response: JSON with `data[].embedding` array

### **Test Chat**
```bash
curl http://127.0.0.1:1234/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-oss-20b",
    "system_prompt": "You are helpful",
    "input": "Hello, how are you?"
  }'
```

Expected response: JSON with `output` or `response` field

---

## 🚀 Running ReportRx

```bash
$ pnpm dev
```

This will:
1. ✅ Start API server on http://localhost:4000
2. ✅ Start frontend on http://localhost:3000
3. ✅ Connect to LM Studio on http://127.0.0.1:1234
4. ✅ Use correct endpoints and model names

---

## 📝 Implementation Details

### **LMStudioProvider Class** (ai_clients.py)

Handles both embeddings and chat:

```python
class LMStudioProvider(LlmProvider, EmbeddingProvider):
    def __init__(self, api_key, openai_base_url, chat_endpoint):
        self.chat_endpoint = chat_endpoint  # /api/v1/chat
        self.embed_client = AsyncOpenAI(...)  # For embeddings

    async def generate(self, prompt, system, max_tokens):
        # POST to /api/v1/chat with system_prompt + input
        # Extract output from response

    async def embed(self, inputs):
        # Uses embed_client (OpenAI-compatible)
        # POST to /v1/embeddings
```

### **Smart Provider Detection** (create_ai_clients)

```python
if ai_provider == "openai" and settings.lm_studio_chat_endpoint:
    # Use LMStudioProvider (has custom chat endpoint)
    llm = LMStudioProvider(...)
elif ai_provider == "ollama":
    # Use OllamaProvider
    llm = OllamaProvider(...)
else:
    # Use standard OpenAiProvider
    llm = OpenAiProvider(...)
```

---

## 🛠️ Troubleshooting

### Embeddings fail but chat works
- Check `/v1/embeddings` endpoint
- Verify model name: `text-embedding-nomic-embed-text-v1.5`
- Check LM Studio embeddings are loaded

### Chat fails but embeddings work
- Check `/api/v1/chat` endpoint  
- Verify model name: `openai/gpt-oss-20b`
- Check request format uses `system_prompt` and `input` fields
- Verify response has `output` or `response` field

### Both fail
- Verify LM Studio is running: `curl http://127.0.0.1:1234/api/tags`
- Check `.env` has correct endpoints and model names
- Check firewall/network access to 127.0.0.1:1234

---

## 📊 Model Information

| Model | Type | Size | Use Case |
|-------|------|------|----------|
| `openai/gpt-oss-20b` | Chat/Completion | ~40GB in memory | Text generation, summaries |
| `text-embedding-nomic-embed-text-v1.5` | Embeddings | ~400MB | Vector generation for search |

---

## ✨ Advanced Customization

### Change LM Studio port
Edit `.env`:
```
OPENAI_API_BASE=http://127.0.0.1:5000/v1
LM_STUDIO_CHAT_ENDPOINT=http://127.0.0.1:5000/api/v1/chat
```

### Use different models
1. Load models in LM Studio GUI
2. Update `.env` with new model names:
   ```
   AI_MODEL=<new_chat_model>
   EMBED_MODEL=<new_embed_model>
   ```

### Remote LM Studio server
Update `.env` endpoints to point to remote server IP

---

**All set! Run `pnpm dev` to start. 🚀**
