# 🚀 SUPER QUICK START

## Step 1: Make sure LM Studio is running
```
LM Studio → Developer tab → Click "Start Server" (green checkmark = running)
```

## Step 2: From repo root, run:
```bash
pnpm dev
```

## Step 3: Open browser
```
http://localhost:3000
```

Done! Upload a PDF and watch it process. 🎉

---

## If It Doesn't Work

### LM Studio not responding?
```bash
curl http://127.0.0.1:1234/v1/models
```
Should return JSON. If not, check LM Studio is actually running.

### Different LM Studio port?
Edit `apps/api/.env`:
```
OPENAI_API_BASE=http://localhost:5000/v1  # your port
```

### Stuck in "processing"?
• Check LM Studio models are loaded (Developer tab)
• Check CPU/RAM available
• Watchdog auto-fails after 10 minutes

---

See `LM_STUDIO_SETUP.md` for detailed config info.
