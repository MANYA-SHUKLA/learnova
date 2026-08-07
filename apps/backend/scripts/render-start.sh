#!/usr/bin/env bash
# Start API when Render Root Directory = apps/backend
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
exec pnpm --filter @learnova/backend start:prod
