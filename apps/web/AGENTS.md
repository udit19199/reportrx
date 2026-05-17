## Repo structure

Monorepo with two apps under `apps/`:
- `web/` — Next.js 16 frontend (port 3000)
- `api/` — FastAPI backend (port 4000), Python 3.11+

The web app talks to the API via `NEXT_PUBLIC_API_URL`. There are no Next.js API routes — all data goes through the external FastAPI backend.

## Commands

```
pnpm dev          # starts both web + api in parallel
pnpm dev:web      # web only
pnpm dev:api      # api only (uses apps/api/.venv/bin/python)
pnpm build        # api then web
pnpm lint         # eslint (web only)
pnpm typecheck    # tsc --noEmit for both apps
pnpm clean        # removes .next, dist, tsbuildinfo files
```

All commands use `pnpm` (v10.33.0). No npm/yarn.

API Python deps: `apps/api/.venv` — create with `python -m venv .venv && .venv/bin/pip install -e .` (or `pip install -r pyproject.toml` deps).

## Web app architecture

- **Auth**: Email/password with JWT cookies. API sets httpOnly `token` cookie on login/register. Server-side uses `getSession()` from `src/lib/session.ts` which calls `GET /api/auth/me`. Client-side API calls include cookies via `credentials: "include"`.
- **API client** (`src/lib/api.ts`): all requests go to `${API_URL}/api/*`. Includes `login()`, `register()`, `logout()` methods. 401 responses trigger `window.location.assign("/auth/login")`.
- **Auth routes**: `/auth/login` (sign in), `/auth/signup` (register)
- **Routes**: `/` (landing), `/app` (workspace), `/settings`, `/auth/*` (login/signup pages)
- **Features**: single `workspace/` feature containing report list, sidebar, upload, and analysis UI
- **UI**: Tailwind v4, shadcn, base-ui, lucide icons
- **Path alias**: `@/*` maps to `./src/*`

## API app architecture

- **Framework**: FastAPI with `uvicorn` for dev (`tsx watch` is NOT used — it's Python)
- **Database**: SQLite via SQLAlchemy 2.0 (not Prisma). DB file at `apps/api/prisma/dev.db`. Schema auto-created on startup via `Base.metadata.create_all()`. No migrations.
- **Models**: `src/models.py` — `User`, `Report`, `ReportStatus` enum
- **Routes**: `src/routes/auth.py`, `src/routes/reports.py`, `src/routes/analyze.py` — all mounted under `/api/*` prefix
- **Auth middleware**: in `main.py` — supports both cookie JWT and Bearer Auth0 tokens. Skips `/api/auth/*` and `/`.
- **Vector store**: Milvus Lite (local `.db` file), started/stopped in app lifespan. Collection: `medical_reports`.
- **AI clients**: `src/ai_clients.py` — pluggable providers (OpenAI-compatible, Ollama, LM Studio). Created in lifespan, stored on `app.state.ai_clients`.
  - LLM: `AI_PROVIDER` (openai/ollama), model via `AI_MODEL`
  - Embeddings: `EMBED_PROVIDER` (openai/ollama), model via `EMBED_MODEL`
  - LM Studio: set `LM_STUDIO_CHAT_ENDPOINT` for custom chat path; embeddings use `OPENAI_API_BASE`
- **Document parsing**: LiteParse via `lit` CLI (`npm i -g @llamaindex/liteparse`). Chunks at 1200 chars with 200 char overlap.
- **Ingestion**: `src/ingestion.py` — synchronous per-report pipeline: parse → embed batches (10/batch) → upsert vectors → generate summary → mark ready. Retries (3x) on each step.
- **Watchdog**: `src/workers/watchdog.py` — background task fails reports stuck in `processing` > 10 min.
- **File uploads**: stored in `uploads/` dir, max size from `MAX_UPLOAD_MB` env var.

## Key conventions

- API config: `src/config.py` with pydantic-settings, validated at startup. Reads `.env` (not `.env.local`).
- API uses standard Python imports (no `.js` extensions).
- Web uses `.env.local` (gitignored); API uses `.env` (gitignored).
- See `.env.example` in each app for required vars.

## AI model setup (LM Studio)

Current `.env` config for local LM Studio:
- `AI_MODEL=qwen/qwen3.5-9b` — chat model
- `EMBED_MODEL=text-embedding-embeddinggemma-300m` — embedding model
- `OPENAI_API_BASE=http://127.0.0.1:1234/v1`
- `LM_STUDIO_CHAT_ENDPOINT=http://127.0.0.1:1234/api/v1/chat`
- `OPENAI_API_KEY=lm-studio` (any non-empty value works)

Both providers set to `openai` which routes through the OpenAI-compatible client. LM Studio chat uses the custom endpoint (`/api/v1/chat` with `system_prompt`/`input` params), embeddings use standard `/v1/embeddings`.
