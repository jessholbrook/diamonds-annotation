#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "→ Setting up backend"
cd backend
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  Created backend/.env — edit it to add your ANTHROPIC_API_KEY"
fi
if [ ! -d venv ]; then
  python3 -m venv venv
  echo "  Created Python virtualenv"
fi
# shellcheck disable=SC1091
source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
deactivate
cd ..

echo "→ Setting up frontend"
cd frontend
npm install --silent
cd ..

echo
echo "✓ Done. Next steps:"
echo "  1. Edit backend/.env and set ANTHROPIC_API_KEY"
echo "  2. Run ./start.sh"
