# Packages to Install

Managed via **pnpm workspaces**. Run `pnpm install` at the repo root.

## Root (tooling)

| Package | Purpose |
| --- | --- |
| turbo | Monorepo task runner |
| typescript | Shared TS |
| prettier + prettier-plugin-tailwindcss | Formatting |
| husky | Git hooks |
| lint-staged | Pre-commit lint/format |
| @commitlint/cli + config-conventional | Commit message policy |
| tsx | Run TS scripts |
| rimraf | Clean builds |

## Frontend (`@learnova/frontend`)

| Package | Purpose |
| --- | --- |
| next@15 | App framework |
| react@19 / react-dom@19 | UI runtime |
| next-intl | i18n (en/hi/te+) |
| next-themes | Dark/light mode |
| @tanstack/react-query | Server state |
| @tanstack/react-table | Data tables |
| zustand | Client state |
| react-hook-form + @hookform/resolvers | Forms |
| zod | Validation |
| recharts | Analytics charts |
| @monaco-editor/react | Code editor |
| @xterm/xterm + @xterm/addon-fit | Terminal |
| lucide-react | Icons |
| socket.io-client | Realtime |
| tailwindcss@4 + @tailwindcss/postcss | Styling |
| class-variance-authority / clsx / tailwind-merge | Class utilities |
| @learnova/ui, types, shared, config | Workspace packages |

## Backend (`@learnova/backend`)

| Package | Purpose |
| --- | --- |
| express@5 | HTTP server |
| mongoose | MongoDB ODM (connection ready; models later) |
| ioredis | Redis client |
| bullmq | Job queues |
| socket.io | Realtime |
| jsonwebtoken + bcrypt | Auth primitives (prepared) |
| zod | Validation |
| helmet / cors / compression / cookie-parser | Hardening & parsing |
| express-rate-limit + rate-limit-redis | Rate limiting |
| pino + pino-http | Structured logging |
| uuid | Request IDs |
| @learnova/types, shared, config | Workspace packages |

## Worker (`@learnova/worker`)

| Package | Purpose |
| --- | --- |
| bullmq | Job processing |
| ioredis | Queue connection |
| pino | Logging |
| zod | Env validation |
| @learnova/types, shared, config | Workspace packages |

## Packages

| Package | Key deps |
| --- | --- |
| `@learnova/ui` | Radix primitives, CVA, lucide, Tailwind |
| `@learnova/types` | (none — pure types) |
| `@learnova/constants` | (none — pure constants) |
| `@learnova/events` | (none — event name catalog) |
| `@learnova/feature-flags` | (none — env-driven flags) |
| `@learnova/validation` | zod, @learnova/constants |
| `@learnova/utils` | @learnova/constants |
| `@learnova/logger` | pino |
| `@learnova/shared` | zod, @learnova/types, constants, validation, utils |
| `@learnova/config` | zod |
| `@learnova/eslint-config` | typescript-eslint, eslint-plugin-react, next |
| `@learnova/tsconfig` | (JSON only) |

## Infrastructure (Docker images, not npm)

- `mongo:7`
- `redis:7-alpine`
- `judge0/judge0` (optional, commented)
- `node:22-alpine` (app images)
