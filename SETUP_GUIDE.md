# ReportRx Setup Guide - Local AI Processing

## ✅ Changes Completed

### 1. **File Size Limit: 20MB → 10MB**
- Frontend: `apps/web/src/lib/config.ts`
- Backend: `apps/api/src/config.py`
- API validation in `apps/api/src/routes/reports.py`

### 2. **Improved Error Handling**
- Better exception handling in `apps/api/src/ingestion.py`
- Nested try-except-finally blocks ensure status updates
- Reports never stuck in "processing" due to exceptions

### 3. **Watchdog Worker**
- New: `apps/api/src/workers/watchdog.py`
- Runs every 60 seconds
- Auto-fails reports stuck >10 minutes
- Integrated into FastAPI startup (`main.py`)

### 4. **Local AI Configuration**
- Updated `.env` to use Ollama/LM Studio
- Model: `gpt-oss-20b` (for text generation)
- Embedding: `nomic-embed-text` (768-dimensional)
- Embedding dim: 3072 → 768

### 5. **Test Infrastructure**
- Test PDF: `test_report.pdf` (1 KB)
- Test script: `test_upload.py`
- Database: Cleared (fresh start)

---

## 🚀 Running the Application

### Step 1: Start Ollama with Models

**Option A: Using Ollama CLI**
```bash
# Terminal 1: Start Ollama server
ollama serve

# Terminal 2: Pull and load models
ollama pull gpt-oss-20b
ollama pull nomic-embed-text

# Verify connection
curl http://localhost:11434/api/tags
```

**Option B: Using LM Studio**
1. Open LM Studio GUI
2. Search for and load `gpt-oss-20b`
3. Search for and load `nomic-embed-text`
4. Click "Start Server" in Developer tab
5. Verify port 11434 or 1234 is active

### Step 2: Start Backend API

```bash
cd apps/api

# Install dependencies (if needed)
pip install -r requirements.txt

# Start server
python -m src.main
# or
uvicorn src.main:app --reload --port 4000
```

You should see:
```
[Watchdog] Starting watchdog loop (interval: 60s, timeout: 10min)
```

### Step 3: Test Upload Flow

```bash
cd apps/api

# Create test token
python test_upload.py --setup

# Run upload test
python test_upload.py --test
```

Expected output:
```
✅ Upload successful!
   Report ID: xxx-xxx-xxx
   Status: pending

[3s] Status: processing
[6s] Status: processing
[9s] Status: ready
✅ Processing complete!
```

### Step 4: Start Frontend

```bash
cd apps/web
npm run dev
```

Open http://localhost:3000

---

## 📊 Monitoring

### Check Watchdog Activity
- Look for `[Watchdog]` log lines in API server
- Every 60 seconds: "No stale reports found" or "Found X reports..."

### Check Ingestion Logs
- `[IngestionWorker]` lines show parsing, embedding, summary progress
- On success: "Completed job for report XXX"
- On failure: "Failed job for report XXX: {error}"

### Database Status
Check SQLite directly:
```bash
cd apps/api
python -c "
from src.database import SessionLocal
from src.models import Report
db = SessionLocal()
reports = db.query(Report).all()
for r in reports:
    print(f'{r.id}: {r.status.value} - {r.filename}')
"
```

---

## 🐛 Troubleshooting

### Upload fails with "File size exceeds 10MB"
- Reduce PDF size or split into multiple reports
- Watermark PDFs to reduce size

### Report stuck in "processing"
- Watchdog will auto-fail after 10 minutes
- Check logs for specific error: `api.log` or terminal output
- Likely causes:
  - Ollama/LM Studio not running
  - Model too large for available memory
  - Complex PDF with many images

### Ollama not responding
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If fails, restart Ollama
ollama serve

# Check model is loaded
ollama list
```

### gpt-oss-20b model missing
```bash
ollama pull gpt-oss-20b
ollama show gpt-oss-20b
```

### nomic-embed-text model missing
```bash
ollama pull nomic-embed-text
```

---

## 📈 Performance Notes

- **gpt-oss-20b**: ~20B parameters, requires ~40GB VRAM
- **nomic-embed-text**: ~137M parameters, fast embeddings
- **Processing time**: 1-2 minutes for typical 10MB PDF
- **Watchdog check interval**: 60 seconds (configurable)
- **Processing timeout**: 10 minutes (configurable in watchdog.py)

---

## 🔧 Configuration

Edit these files to customize behavior:

**Watchdog timeout** (`src/workers/watchdog.py`):
```python
PROCESSING_TIMEOUT_MINUTES = 10  # Change this
```

**Watchdog interval** (`src/main.py`):
```python
asyncio.create_task(start_watchdog_loop(interval_seconds=60))  # Change interval
```

**File size limit** (`src/config.py` and `apps/web/src/lib/config.ts`):
```python
max_upload_mb: int = 10  # Change max size
```

---

## 🎯 Next Steps

1. ✅ Start Ollama with models
2. ✅ Run API server
3. ✅ Run test script
4. ✅ Check logs and watchdog activity
5. ✅ Test through web UI
6. ✅ Monitor for any errors

Good luck! 🚀
