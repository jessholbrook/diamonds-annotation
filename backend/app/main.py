from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL
from .database import init_db
from .routes import annotations, chat, conversations


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan, title="DIAMONDS Annotation")

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
