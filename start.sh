#!/bin/bash
set -e

cd "$(dirname "$0")"

npm install

npx tsc --noEmit && echo "[OK] Type check passed"

echo "[INFO] Starting dev server..."
npx vite --host 0.0.0.0
