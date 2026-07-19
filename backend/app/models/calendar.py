from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class CalendarEventCreateSchema(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = ""
    start: datetime
    end: datetime
    type: str = Field(default="task_execution", pattern="^(task_execution|meeting|focus_session|personal)$")
    relatedTaskId: Optional[str] = None

class CalendarEventResponseSchema(BaseModel):
    id: str
    userId: str
    title: str
    description: str
    start: datetime
    end: datetime
    type: str
    relatedTaskId: Optional[str] = None
    createdAt: datetime

class AutoScheduleRequestSchema(BaseModel):
    optimize_for_burnout: bool = True

class RebalanceRequestSchema(BaseModel):
    target_date: datetime

class ScheduleReportSchema(BaseModel):
    events_scheduled: int
    conflicts_resolved: int
    schedule: List[CalendarEventResponseSchema]
