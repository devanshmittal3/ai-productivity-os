from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class SubTaskSchema(BaseModel):
    id: str
    title: str
    status: str = Field(default="todo", pattern="^(todo|completed)$")

class AutoScheduledSlotSchema(BaseModel):
    start: datetime
    end: datetime

class TaskCreateSchema(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = ""
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    deadline: Optional[datetime] = None
    estimatedMinutes: int = Field(default=30, ge=5)
    tags: List[str] = Field(default_factory=list)
    category: str = Field(default="Work")
    dependencies: List[str] = Field(default_factory=list)

class TaskUpdateSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(todo|in_progress|completed)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    deadline: Optional[datetime] = None
    estimatedMinutes: Optional[int] = None
    actualMinutes: Optional[int] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    dependencies: Optional[List[str]] = None
    subtasks: Optional[List[SubTaskSchema]] = None
    autoScheduledSlot: Optional[AutoScheduledSlotSchema] = None

class TaskResponseSchema(BaseModel):
    id: str
    userId: str
    title: str
    description: str
    status: str
    priority: str
    deadline: Optional[datetime] = None
    estimatedMinutes: int
    actualMinutes: int
    tags: List[str]
    category: str
    dependencies: List[str]
    subtasks: List[SubTaskSchema] = []
    autoScheduledSlot: Optional[AutoScheduledSlotSchema] = None
    createdAt: datetime
    updatedAt: datetime

class NLPPromptSchema(BaseModel):
    prompt: str = Field(..., min_length=1)

class TaskNLPResponseSchema(BaseModel):
    tasks: List[TaskCreateSchema]
    reasoning: str
