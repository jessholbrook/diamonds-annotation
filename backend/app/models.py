from typing import Literal

from pydantic import BaseModel, Field

Salience = Literal["none", "low", "moderate", "high"]

DIMENSIONS = (
    "duty",
    "intellect",
    "adversity",
    "mating",
    "positivity",
    "negativity",
    "deception",
    "sociality",
)


class Message(BaseModel):
    id: str
    conversation_id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: str


class Conversation(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str


class ChatRequest(BaseModel):
    conversation_id: str | None = None
    message: str = Field(..., min_length=1)


class DimensionScore(BaseModel):
    score: float = Field(..., ge=0.0, le=1.0)
    salience: Salience


class AnnotationInput(BaseModel):
    duty: DimensionScore
    intellect: DimensionScore
    adversity: DimensionScore
    mating: DimensionScore
    positivity: DimensionScore
    negativity: DimensionScore
    deception: DimensionScore
    sociality: DimensionScore
    notes: str = ""


class Annotation(AnnotationInput):
    id: str
    conversation_id: str
    created_at: str
    updated_at: str


class ConversationDetail(Conversation):
    messages: list[Message]
    annotation: Annotation | None = None


class DimensionStats(BaseModel):
    mean_score: float
    salience_counts: dict[Salience, int]


class AnnotationStats(BaseModel):
    total: int
    dimensions: dict[str, DimensionStats]
