from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ActionItemSchema(BaseModel):
    text: str
    assignee: Optional[str] = None
    deadline: Optional[datetime] = None

class MeetingAISummarySchema(BaseModel):
    overview: str
    keyDecisions: List[str] = Field(default_factory=list)
    actionItems: List[ActionItemSchema] = Field(default_factory=list)
    nextAgenda: List[str] = Field(default_factory=list)

class MeetingNotesRequestSchema(BaseModel):
    title: Optional[str] = "Untitled Meeting"
    notes: str = Field(..., min_length=5)

class MeetingResponseSchema(BaseModel):
    id: str
    userId: str
    title: str
    date: datetime
    rawInput: str
    audioUrl: Optional[str] = None
    aiSummary: MeetingAISummarySchema
    tasksCreated: List[str] = Field(default_factory=list)
    createdAt: datetime
