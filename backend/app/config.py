import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-opus-4-7").strip()
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "1337"))

# Override DATA_DIR in deployment to point at a mounted volume (e.g. /data on Fly).
DATA_DIR = Path(os.getenv("DATA_DIR", str(BACKEND_DIR / "data")))
DB_PATH = DATA_DIR / "diamonds.db"

# Optional HTTP basic auth. When both are set, the entire app requires this
# username/password. Leave unset to expose publicly (don't do this with a real
# API key — anyone with the URL can spend your Anthropic credits).
APP_USERNAME = os.getenv("APP_USERNAME", "").strip()
APP_PASSWORD = os.getenv("APP_PASSWORD", "").strip()

# Path to the built frontend (Vite output). When this directory exists, the
# backend serves it at /. Used in the Docker image; ignored in dev.
FRONTEND_DIST = Path(
    os.getenv("FRONTEND_DIST", str(BACKEND_DIR.parent / "frontend" / "dist"))
)
