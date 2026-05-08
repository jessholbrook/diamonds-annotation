from fastapi import APIRouter, HTTPException

from ..database import get_conn
from ..models import Annotation, Conversation, ConversationDetail, Message

router = APIRouter()


def _row_to_conversation(row) -> Conversation:
    return Conversation(
        id=row["id"],
        title=row["title"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _row_to_message(row) -> Message:
    return Message(
        id=row["id"],
        conversation_id=row["conversation_id"],
        role=row["role"],
        content=row["content"],
        created_at=row["created_at"],
    )


def _row_to_annotation(row) -> Annotation:
    return Annotation(
        id=row["id"],
        conversation_id=row["conversation_id"],
        duty={"score": row["duty_score"], "salience": row["duty_salience"]},
        intellect={"score": row["intellect_score"], "salience": row["intellect_salience"]},
        adversity={"score": row["adversity_score"], "salience": row["adversity_salience"]},
        mating={"score": row["mating_score"], "salience": row["mating_salience"]},
        positivity={"score": row["positivity_score"], "salience": row["positivity_salience"]},
        negativity={"score": row["negativity_score"], "salience": row["negativity_salience"]},
        deception={"score": row["deception_score"], "salience": row["deception_salience"]},
        sociality={"score": row["sociality_score"], "salience": row["sociality_salience"]},
        notes=row["notes"] or "",
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.get("", response_model=list[Conversation])
async def list_conversations() -> list[Conversation]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC"
        ).fetchall()
    return [_row_to_conversation(r) for r in rows]


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(conversation_id: str) -> ConversationDetail:
    with get_conn() as conn:
        conv = conn.execute(
            "SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?",
            (conversation_id,),
        ).fetchone()
        if not conv:
            raise HTTPException(404, "Conversation not found")

        message_rows = conn.execute(
            "SELECT id, conversation_id, role, content, created_at FROM messages "
            "WHERE conversation_id = ? ORDER BY created_at",
            (conversation_id,),
        ).fetchall()

        ann_row = conn.execute(
            "SELECT * FROM annotations WHERE conversation_id = ?",
            (conversation_id,),
        ).fetchone()

    return ConversationDetail(
        **_row_to_conversation(conv).model_dump(),
        messages=[_row_to_message(r) for r in message_rows],
        annotation=_row_to_annotation(ann_row) if ann_row else None,
    )


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: str) -> None:
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
        if cur.rowcount == 0:
            raise HTTPException(404, "Conversation not found")
