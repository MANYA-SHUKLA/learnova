#!/usr/bin/env bash
# Used when Render Root Directory = apps/backend
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
corepack enable
pnpm install --frozen-lockfile
pnpm exec turbo run build --filter=@learnova/backend
