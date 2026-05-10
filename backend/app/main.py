import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from .config import (
    ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL,
    APP_PASSWORD,
    APP_USERNAME,
    FRONTEND_DIST,
)
from .database import init_db
from .routes import annotations, chat, conversations


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan, title="DIAMONDS Annotation")


# --- Optional HTTP basic auth ---------------------------------------------------

class BasicAuthMiddleware(BaseHTTPMiddleware):
    """Gate every request behind HTTP basic auth when credentials are configured."""

    def __init__(self, app, username: str, password: str) -> None:
        super().__init__(app)
        self.username = username
        self.password = password

    async def dispatch(self, request: Request, call_next):
        # /health is reachable without auth so Fly's checks can hit it.
        if request.url.path == "/health":
            return await call_next(request)

        auth = request.headers.get("Authorization", "")
        if auth.startswith("Basic "):
            import base64

            try:
                decoded = base64.b64decode(auth[6:]).decode("utf-8", errors="replace")
                user, _, pw = decoded.partition(":")
            except Exception:
                user, pw = "", ""
            if secrets.compare_digest(user, self.username) and secrets.compare_digest(
                pw, self.password
            ):
                return await call_next(request)

        return Response(
            "Authentication required",
            status_code=status.HTTP_401_UNAUTHORIZED,
            headers={"WWW-Authenticate": 'Basic realm="diamonds-annotation"'},
        )


if APP_USERNAME and APP_PASSWORD:
    app.add_middleware(
        BasicAuthMiddleware, username=APP_USERNAME, password=APP_PASSWORD
    )


# --- CORS (dev only — same-origin in production) --------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- API routes -----------------------------------------------------------------

app.include_router(conversations.router, prefix="/api/conversations", tags=["conversations"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(annotations.router, prefix="/api/annotations", tags=["annotations"])


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "model": ANTHROPIC_MODEL,
        "api_key_configured": bool(ANTHROPIC_API_KEY),
    }


# --- Static frontend ------------------------------------------------------------
# In production the built React app sits in FRONTEND_DIST. We mount /assets for
# the hashed JS/CSS and serve index.html for any other non-API path so client
# routing works.

if FRONTEND_DIST.is_dir():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    index_file = FRONTEND_DIST / "index.html"

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        candidate = FRONTEND_DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(index_file)
