# Medical Report Analyzer

A small pnpm monorepo with:

- `apps/api` - Express + TypeScript backend
- `apps/web` - Next.js frontend

## Requirements
- Node 24.15.0+
- Postgres running locally
- Vector store support for embeddings (local file-backed in dev, Milvus server optional)

## Getting started
1. Copy env files:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```
2. Fill in the required API env vars:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `LLAMAPARSE_API_KEY`
   - `OPENAI_API_KEY`
3. Install dependencies from the repo root:
   ```bash
   pnpm install
   ```
4. Start both apps:
   ```bash
   pnpm dev
   ```
5. Optional checks:
   ```bash
   pnpm build
   pnpm lint
   pnpm typecheck
   pnpm clean
   ```

## Repository layout
See [docs/monorepo.md](docs/monorepo.md) for the intended workspace structure and conventions.

## Local URLs
- API: http://localhost:4000
- Web: http://localhost:3000
