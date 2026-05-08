import json
import uuid
from datetime import datetime, timezone

from anthropic import AsyncAnthropic
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL
from ..database import get_conn
from ..models import ChatRequest

router = APIRouter()

SYSTEM_PROMPT = (
    "You are Claude, a helpful AI assistant built by Anthropic. "
    "Respond conversationally and helpfully."
)

_client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


@router.post("/stream")
async def stream_chat(req: ChatRequest):
    if _client is None:
        raise HTTPException(500, "ANTHROPIC_API_KEY is not set in backend/.env")

    conv_id = req.conversation_id or str(uuid.uuid4())
    user_msg_id = str(uuid.uuid4())
    assistant_msg_id = str(uuid.uuid4())
    ts = _now()

    with get_conn() as conn:
        existing = conn.execute(
            "SELECT id FROM conversations WHERE id = ?", (conv_id,)
        ).fetchone()
        is_new = existing is None
        if is_new:
            title = req.message.strip().splitlines()[0][:60] or "New conversation"
            conn.execute(
                "INSERT INTO conversations (id, title, created_at, updated_at) "
                "VALUES (?, ?, ?, ?)",
                (conv_id, title, ts, ts),
            )

        conn.execute(
            "INSERT INTO messages (id, conversation_id, role, content, created_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (user_msg_id, conv_id, "user", req.message, ts),
        )
        conn.execute(
            "UPDATE conversations SET updated_at = ? WHERE id = ?", (ts, conv_id)
        )

        history_rows = conn.execute(
            "SELECT role, content FROM messages WHERE conversation_id = ? "
            "ORDER BY created_at",
            (conv_id,),
        ).fetchall()

    history = [{"role": r["role"], "content": r["content"]} for r in history_rows]

    async def event_stream():
        yield _sse(
            {
                "type": "start",
                "conversation_id": conv_id,
                "user_message_id": user_msg_id,
                "assistant_message_id": assistant_msg_id,
                "is_new_conversation": is_new,
            }
        )

        chunks: list[str] = []
        try:
            async with _client.messages.stream(
                model=ANTHROPIC_MODEL,
                max_tokens=16000,
                system=SYSTEM_PROMPT,
                messages=history,
            ) as stream:
                async for text in stream.text_stream:
                    chunks.append(text)
                    yield _sse({"type": "delta", "text": text})

            response_text = "".join(chunks)
            done_ts = _now()
            with get_conn() as conn:
                conn.execute(
                    "INSERT INTO messages (id, conversation_id, role, content, created_at) "
                    "VALUES (?, ?, ?, ?, ?)",
                    (assistant_msg_id, conv_id, "assistant", response_text, done_ts),
                )
                conn.execute(
                    "UPDATE conversations SET updated_at = ? WHERE id = ?",
                    (done_ts, conv_id),
                )

            yield _sse({"type": "end", "created_at": done_ts})
        except Exception as exc:
            yield _sse({"type": "error", "message": str(exc)})

    return StreamingResponse(event_stream(), media_type="text/event-stream")
