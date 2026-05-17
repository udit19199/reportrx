# 🚀 Quick Start - ReportRx with Local AI

## ⚡ 5-Minute Setup

### Terminal 1: Start Ollama
```bash
ollama serve
```

### Terminal 2: Load Models
```bash
ollama pull gpt-oss-20b
ollama pull nomic-embed-text
sleep 5
curl http://localhost:11434/api/tags  # Verify running
```

### Terminal 3: Start API
```bash
cd /Users/uditagarwal19199/Workspace/projects/reportrx/apps/api
python -m src.main
```

Watch for:
```
[Watchdog] Starting watchdog loop (interval: 60s, timeout: 10min)
```

### Terminal 4: Test Upload
```bash
cd /Users/uditagarwal19199/Workspace/projects/reportrx/apps/api
python test_upload.py --test
```

Expected output:
```
✅ Upload successful!
✅ Processing complete!
```

### Terminal 5: Start Frontend
```bash
cd /Users/uditagarwal19199/Workspace/projects/reportrx/apps/web
npm run dev
```

Open http://localhost:3000 and test the UI!

---

## 📊 What Was Fixed

| Issue | Fix | File |
|-------|-----|------|
| Stuck "processing" reports | Better error handling + 10-min watchdog | ingestion.py, watchdog.py |
| File size not enforced | Added 10MB limit validation | routes/reports.py |
| Expensive API calls | Switched to free local models | .env |
| No error visibility | Detailed error messages in DB | ingestion.py |

---

## 🐛 Debugging

**Check Watchdog:**
```bash
# Look for [Watchdog] lines in API terminal
# Should say "No stale reports found" every 60s
```

**Check Ingestion:**
```bash
# Look for [IngestionWorker] lines
# Should show: Parsing → Embedding → Summary → Complete
```

**Check Database:**
```bash
cd apps/api
python -c "
from src.database import SessionLocal
from src.models import Report
db = SessionLocal()
for r in db.query(Report).all():
    print(f'{r.filename}: {r.status.value}')
"
```

**Test Ollama Connection:**
```bash
curl -s http://localhost:11434/api/tags | jq .
```

---

## ✅ Success Criteria

- [ ] Ollama running with gpt-oss-20b loaded
- [ ] API server starting with watchdog message
- [ ] `test_upload.py --test` completes successfully
- [ ] Frontend shows uploaded report with "ready" status
- [ ] Sidebar updates in real-time (no stuck "processing")
- [ ] Watchdog logs appear every 60 seconds

---

**All set! You're running ReportRx with local AI. 🎉**
