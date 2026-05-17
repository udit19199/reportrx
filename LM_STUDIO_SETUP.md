# LM Studio Configuration for ReportRx

## ✅ Quick Start (3 Steps)

### 1. Verify LM Studio is Running

In LM Studio:
- Go to **Developer** tab
- Click **Start Server**
- Look for the green "Server is running" message
- **Default port: 1234** (or check the URL shown in LM Studio)

Check connection:
```bash
curl http://127.0.0.1:1234/v1/models
```

You should see your loaded models:
- `gpt-oss-20b`
- `nomic-embed-text`

### 2. Run the Application

From the root directory:
```bash
pnpm dev
```

This will start:
- ✅ API server on http://localhost:4000
- ✅ Frontend on http://localhost:3000
- ✅ Watchdog monitoring (auto-fails stuck reports)

### 3. Test Upload

Open http://localhost:3000 and try uploading a PDF!

---

## 🔧 Configuration Details

**`.env` Settings:**
```
AI_PROVIDER=openai           # LM Studio is OpenAI-compatible
EMBED_PROVIDER=openai
OPENAI_API_BASE=http://127.0.0.1:1234/v1
OPENAI_API_KEY=lm-studio    # Dummy key (LM Studio doesn't require auth)
```

**Why OpenAI provider?**
- LM Studio exposes an OpenAI-compatible API
- Simpler than custom integrations
- Works with standard OpenAI client library

---

## 🐛 Troubleshooting

### API won't start - "Connection refused"
```bash
# Check if LM Studio is running
curl http://127.0.0.1:1234/v1/models

# If fails, start LM Studio and click "Start Server"
```

### gpt-oss-20b or nomic-embed-text not showing in `/v1/models`
- Open LM Studio
- Go to Models tab
- Search for and load both models
- Wait for "Loaded" status
- Models will appear in `/v1/models`

### Port 1234 already in use
- Check what's using it: `lsof -i :1234`
- Change LM Studio port in Settings
- Update `OPENAI_API_BASE` in `.env` to match new port

### Models loading slowly
- This is normal for large models (gpt-oss-20b is ~40GB in memory)
- Processing time depends on your hardware
- Watchdog will auto-fail if stuck >10 minutes

---

## 📊 Expected Behavior

When you upload a PDF:

**Frontend:** Shows "processing..." status
**API logs:** 
```
[IngestionWorker] Starting job for report xxx
[IngestionWorker] Parsed 50 chunks
[IngestionWorker] Processing embedding batch 1/5
[IngestionWorker] Upserted 50 vectors
[IngestionWorker] Generated structured summary
[IngestionWorker] Completed job for report xxx
```

**Watchdog logs:** (every 60 seconds)
```
[Watchdog] No stale reports found
```

**Frontend updates:** "ready" status with summary, insights, next actions

---

## 🚀 Next: Custom Port or Remote LM Studio?

If you need to use a different port or remote server:

Edit `.env`:
```bash
# Remote LM Studio on port 5000
OPENAI_API_BASE=http://192.168.1.100:5000/v1

# Different local port
OPENAI_API_BASE=http://localhost:5000/v1
```

Then restart: `pnpm dev`

---

**You're all set! Run `pnpm dev` and enjoy! 🎉**
