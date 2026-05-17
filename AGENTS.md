## Repo structure

pnpm workspace with two apps under `apps/`:
- `web/` — Next.js 16 frontend (port 3000), see `apps/web/AGENTS.md` for full details
- `api/` — FastAPI + Python 3.11 backend (port 4000)

No shared packages. Each app is self-contained.

## Commands

```
pnpm dev          # starts both web + api in parallel
pnpm dev:web      # web only
pnpm dev:api      # api only (uses apps/api/.venv/bin/python)
pnpm build        # api then web
pnpm lint         # eslint (web only)
pnpm typecheck    # tsc --noEmit (web only)
pnpm clean        # removes .next, dist, tsbuildinfo files
```

All commands use `pnpm` (v10.33.0). No npm/yarn.

## API setup

Python deps live in `apps/api/.venv`. If missing:
```
cd apps/api && python -m venv .venv && .venv/bin/pip install -e .
```

API reads `.env` (not `.env.local`). Config validated at startup in `src/config.py` — missing required vars crash on boot.

## Database

SQLite via SQLAlchemy 2.0. DB file at `apps/api/prisma/dev.db`. The `prisma/` dir is just where the SQLite file lives — **no Prisma, no migrations**. Schema auto-created via `Base.metadata.create_all()` on startup.

## Architecture highlights

- **Auth**: JWT cookies (httpOnly `token`). API also accepts Bearer Auth0 tokens. Auth middleware skips `/api/auth/*` and `/`.
- **Vector store**: Qdrant (Docker server), initialized in app lifespan. Connects to `QDRANT_URL` (default `http://localhost:6333`). Collection: `medical_reports`.
- **AI clients**: Pluggable providers (OpenAI-compatible, Ollama, LM Studio). Created in lifespan, stored on `app.state.ai_clients`.
- **Document parsing**: LiteParse via `lit` CLI (`npm i -g @llamaindex/liteparse`). Chunks at 1200 chars, 200 char overlap.
- **Ingestion**: Synchronous per-report pipeline (parse → embed → upsert → summary). Retries 3x per step.
- **Watchdog**: Background task fails reports stuck `processing` > 10 min.
- **File uploads**: Stored in `apps/api/uploads/`, max size from `MAX_UPLOAD_MB`.

## Key gotchas

- API is **FastAPI + Python**, not Express or Node (README is stale)
- **No Prisma, no PostgreSQL** — SQLAlchemy + SQLite
- **No migrations** — schema created on startup
- Web has **no Next.js API routes** — all data goes through external FastAPI at `NEXT_PUBLIC_API_URL`
- LM Studio uses non-standard `/api/v1/chat` endpoint with `system_prompt`/`input` params — set `LM_STUDIO_CHAT_ENDPOINT`
- API env uses `AI_PROVIDER`/`EMBED_PROVIDER` (openai/ollama), not a single provider flag

## AI model setup (LM Studio)

Current `.env` config:
- `AI_MODEL=qwen/qwen3.5-9b`
- `EMBED_MODEL=text-embedding-embeddinggemma-300m`
- `OPENAI_API_BASE=http://127.0.0.1:1234/v1`
- `LM_STUDIO_CHAT_ENDPOINT=http://127.0.0.1:1234/api/v1/chat`
- `OPENAI_API_KEY=lm-studio` (any non-empty value works)
