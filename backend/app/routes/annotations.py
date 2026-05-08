import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..database import get_conn
from ..models import (
    DIMENSIONS,
    Annotation,
    AnnotationInput,
    AnnotationStats,
    DimensionStats,
    Salience,
)

router = APIRouter()

SALIENCE_VALUES: tuple[Salience, ...] = ("none", "low", "moderate", "high")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


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


@router.put("/{conversation_id}", response_model=Annotation)
async def upsert_annotation(conversation_id: str, payload: AnnotationInput) -> Annotation:
    with get_conn() as conn:
        conv = conn.execute(
            "SELECT id FROM conversations WHERE id = ?", (conversation_id,)
        ).fetchone()
        if not conv:
            raise HTTPException(404, "Conversation not found")

        existing = conn.execute(
            "SELECT id, created_at FROM annotations WHERE conversation_id = ?",
            (conversation_id,),
        ).fetchone()

        ts = _now()
        ann_id = existing["id"] if existing else str(uuid.uuid4())
        created_at = existing["created_at"] if existing else ts

        values = {
            "id": ann_id,
            "conversation_id": conversation_id,
            "duty_score": payload.duty.score,
            "duty_salience": payload.duty.salience,
            "intellect_score": payload.intellect.score,
            "intellect_salience": payload.intellect.salience,
            "adversity_score": payload.adversity.score,
            "adversity_salience": payload.adversity.salience,
            "mating_score": payload.mating.score,
            "mating_salience": payload.mating.salience,
            "positivity_score": payload.positivity.score,
            "positivity_salience": payload.positivity.salience,
            "negativity_score": payload.negativity.score,
            "negativity_salience": payload.negativity.salience,
            "deception_score": payload.deception.score,
            "deception_salience": payload.deception.salience,
            "sociality_score": payload.sociality.score,
            "sociality_salience": payload.sociality.salience,
            "notes": payload.notes,
            "created_at": created_at,
            "updated_at": ts,
        }

        cols = ", ".join(values.keys())
        placeholders = ", ".join(":" + k for k in values.keys())
        update_clause = ", ".join(
            f"{k} = excluded.{k}"
            for k in values.keys()
            if k not in ("id", "conversation_id", "created_at")
        )
        conn.execute(
            f"INSERT INTO annotations ({cols}) VALUES ({placeholders}) "
            f"ON CONFLICT(conversation_id) DO UPDATE SET {update_clause}",
            values,
        )

        row = conn.execute(
            "SELECT * FROM annotations WHERE conversation_id = ?", (conversation_id,)
        ).fetchone()

    return _row_to_annotation(row)


@router.delete("/{conversation_id}", status_code=204)
async def delete_annotation(conversation_id: str) -> None:
    with get_conn() as conn:
        cur = conn.execute(
            "DELETE FROM annotations WHERE conversation_id = ?", (conversation_id,)
        )
        if cur.rowcount == 0:
            raise HTTPException(404, "Annotation not found")


@router.get("/stats", response_model=AnnotationStats)
async def annotation_stats() -> AnnotationStats:
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM annotations").fetchall()

    total = len(rows)
    dimensions: dict[str, DimensionStats] = {}

    for dim in DIMENSIONS:
        score_col = f"{dim}_score"
        salience_col = f"{dim}_salience"
        scores = [r[score_col] for r in rows]
        mean_score = sum(scores) / total if total else 0.0
        salience_counts: dict[Salience, int] = {s: 0 for s in SALIENCE_VALUES}
        for r in rows:
            salience_counts[r[salience_col]] += 1
        dimensions[dim] = DimensionStats(
            mean_score=mean_score, salience_counts=salience_counts
        )

    return AnnotationStats(total=total, dimensions=dimensions)
