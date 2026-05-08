#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f backend/.env ]; then
  echo "✗ backend/.env not found. Run ./setup.sh first."
  exit 1
fi

# Free any old processes
lsof -ti:1337 -ti:8080 2>/dev/null | xargs -r kill -9 2>/dev/null || true

echo "→ Starting backend on http://localhost:1337"
cd backend
# shellcheck disable=SC1091
source venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 1337 &
BACKEND_PID=$!
deactivate
cd ..

echo "→ Starting frontend on http://localhost:8080"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo
echo "✓ Running:"
echo "  Frontend  → http://localhost:8080"
echo "  Backend   → http://localhost:1337"
echo "  API docs  → http://localhost:1337/docs"
echo
echo "Press Ctrl+C to stop."

trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 0' INT TERM
wait
