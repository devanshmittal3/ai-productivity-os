from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models.task import TaskResponseSchema
from app.models.calendar import CalendarEventResponseSchema

class TimeDistributionSchema(BaseModel):
    workMinutes: int = 0
    personalMinutes: int = 0
    meetingMinutes: int = 0
    focusMinutes: int = 0

class FocusInsightsSchema(BaseModel):
    focusScore: int = Field(default=0, ge=0, le=100)
    burnoutRisk: str = Field(default="low", pattern="^(low|medium|high|critical)$")
    productivityScore: int = Field(default=0, ge=0, le=100)
    completionRate: float = Field(default=0.0, ge=0.0, le=1.0)
    timeDistribution: TimeDistributionSchema = Field(default_factory=TimeDistributionSchema)
    insights: List[str] = Field(default_factory=list)

class DailyBriefingSchema(BaseModel):
    date: datetime
    greeting: str
    priorities: List[TaskResponseSchema] = Field(default_factory=list)
    events: List[CalendarEventResponseSchema] = Field(default_factory=list)
    suggestedSchedule: List[Dict[str, Any]] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
