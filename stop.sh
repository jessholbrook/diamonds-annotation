#!/usr/bin/env bash
set -euo pipefail

PIDS=$(lsof -ti:1337 -ti:8080 2>/dev/null || true)
if [ -z "$PIDS" ]; then
  echo "Nothing running on ports 1337 or 8080."
  exit 0
fi
echo "$PIDS" | xargs kill -9 2>/dev/null || true
echo "✓ Stopped."
