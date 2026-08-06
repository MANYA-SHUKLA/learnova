# ADR 0001: Monorepo with pnpm + Turborepo

- **Status:** Accepted
- **Date:** 2026-08-06
- **Deciders:** Platform team

## Context

Learnova spans a Next.js frontend, Express API, BullMQ worker, and shared contracts (types, UI, permissions). Multiple repos would duplicate tooling and drift on types.

## Decision

Use a **pnpm workspaces + Turborepo** monorepo:

| Piece | Why |
| --- | --- |
| **pnpm** | Strict deps, fast installs, native workspaces |
| **Turborepo** | Cached `build` / `lint` / `typecheck` with `^build` graph |
| **apps/** | Deployable units (`frontend`, `backend`, `worker`) |
| **packages/** | Shared libraries (`types`, `shared`, `ui`, `config`, …) |

## Consequences

- One PR can change API contract + consumer safely
- CI must build packages before apps
- Repo size and onboarding surface are larger than a single app

## Alternatives considered

| Option | Why not |
| --- | --- |
| Polyrepo (separate FE/BE/worker) | Type drift; duplicated ESLint/TS/CI |
| Nx | Heavier; Turborepo is enough for our task graph |
| npm/yarn workspaces | pnpm’s isolation and disk efficiency preferred |
