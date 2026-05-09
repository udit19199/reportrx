# Medical Report Analyzer (Local Demo)

## Requirements
- Node 24.15.0
- Postgres running locally
- Milvus running locally (for embeddings)

## Server setup
1. Copy env file:
   ```bash
   cp server/.env.example server/.env
   ```
2. Fill in `DATABASE_URL`, `JWT_SECRET`, `LLAMAPARSE_API_KEY`, `OPENAI_API_KEY`.
3. Install deps:
   ```bash
   cd server
   pnpm install
   pnpm prisma:migrate --name init
   pnpm prisma:generate
   pnpm dev
   ```

## Web setup
1. Copy env file:
   ```bash
   cp web/.env.example web/.env.local
   ```
2. Install deps:
   ```bash
   cd web
   pnpm install
   pnpm dev
   ```

## Run
- API: http://localhost:4000
- Web: http://localhost:3000
