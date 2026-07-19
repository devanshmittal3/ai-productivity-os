from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class WorkflowNodeSchema(BaseModel):
    id: str
    type: str = Field(..., pattern="^(trigger|action)$")
    config: Dict[str, Any] = Field(default_factory=dict)

class WorkflowCreateSchema(BaseModel):
    title: str = Field(..., min_length=1)
    nodes: List[WorkflowNodeSchema] = Field(default_factory=list)

class WorkflowUpdateSchema(BaseModel):
    title: Optional[str] = None
    isActive: Optional[bool] = None
    nodes: Optional[List[WorkflowNodeSchema]] = None

class WorkflowResponseSchema(BaseModel):
    id: str
    userId: str
    title: str
    isActive: bool
    nodes: List[WorkflowNodeSchema]
    createdAt: datetime
