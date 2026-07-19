from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ChatMessageSchema(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None

class RecommendationItemSchema(BaseModel):
    title: str
    description: str
    actionType: str  # e.g., "schedule_block", "shift_priority", "break_suggestion"
    actionPayload: Dict[str, Any]

class RecommendationResponseSchema(BaseModel):
    recommendations: List[RecommendationItemSchema] = Field(default_factory=list)

class EmailGenerateSchema(BaseModel):
    prompt: str = Field(..., min_length=5)
    category: str = Field(default="reply", pattern="^(professional|leave_application|follow_up|client_proposal|cold_email|reply|meeting_invitation)$")
    tone: str = Field(default="professional", pattern="^(professional|casual|friendly|formal|urgent)$")

class EmailResponseSchema(BaseModel):
    subject: str
    body: str
