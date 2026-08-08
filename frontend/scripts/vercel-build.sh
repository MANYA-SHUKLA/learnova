#!/usr/bin/env bash
# Used when Vercel Root Directory = frontend
# (vercel.json already encodes this; kept for manual / debugging use)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
corepack enable
pnpm install --frozen-lockfile
pnpm exec turbo run build --filter=@learnova/frontend
