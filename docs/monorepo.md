# Monorepo structure

This project uses a small pnpm workspace with two apps:

- `apps/api` - Express + TypeScript backend
- `apps/web` - Next.js frontend

## Why the root exists

The repository root should stay lightweight and only coordinate shared tooling:

- workspace package manager config
- root-level scripts for dev/build/typecheck/clean
- project documentation
- shared ignore rules

## Key conventions

- Keep framework code inside each app.
- Put feature-specific code close to the feature.
- Extract shared UI or helpers only when they are genuinely reused.
- Prefer clear folders over deep generic abstraction layers.

## Common commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm clean
```
