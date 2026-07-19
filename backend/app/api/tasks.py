from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, List, Dict

from app.api.deps import get_current_user, get_task_repository, TaskRepositoryInterface
from app.models.task import (
    TaskCreateSchema,
    TaskUpdateSchema,
    TaskResponseSchema,
    NLPPromptSchema,
    TaskNLPResponseSchema
)
from app.services.ai_service import AIService

router = APIRouter()

@router.get("", response_model=List[TaskResponseSchema])
async def read_tasks(
    status: str = None,
    priority: str = None,
    category: str = None,
    current_user: Dict = Depends(get_current_user),
    task_repo: TaskRepositoryInterface = Depends(get_task_repository)
) -> Any:
    filters = {}
    if status:
        filters["status"] = status
    if priority:
        filters["priority"] = priority
    if category:
        filters["category"] = category
        
    tasks = await task_repo.get_by_user(current_user["id"], **filters)
    return tasks

@router.post("", response_model=TaskResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreateSchema,
    current_user: Dict = Depends(get_current_user),
    task_repo: TaskRepositoryInterface = Depends(get_task_repository)
) -> Any:
    task_dict = task_in.model_dump()
    task_dict["userId"] = current_user["id"]
    task_dict["status"] = "todo"
    task_dict["actualMinutes"] = 0
    task_dict["subtasks"] = []
    
    task = await task_repo.create(task_dict)
    return task

@router.put("/{id}", response_model=TaskResponseSchema)
async def update_task(
    id: str,
    task_in: TaskUpdateSchema,
    current_user: Dict = Depends(get_current_user),
    task_repo: TaskRepositoryInterface = Depends(get_task_repository)
) -> Any:
    # Ensure task belongs to user
    task = await task_repo.get(id)
    if not task or task.get("userId") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Task not found")
        
    update_data = task_in.model_dump(exclude_unset=True)
    updated = await task_repo.update(id, update_data)
    return updated

@router.delete("/{id}", response_model=Dict[str, Any])
async def delete_task(
    id: str,
    current_user: Dict = Depends(get_current_user),
    task_repo: TaskRepositoryInterface = Depends(get_task_repository)
) -> Any:
    task = await task_repo.get(id)
    if not task or task.get("userId") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Task not found")
        
    success = await task_repo.delete(id)
    return {"id": id, "success": success}

@router.post("/parse-nlp", response_model=TaskNLPResponseSchema)
async def parse_nlp_task(
    prompt_in: NLPPromptSchema,
    current_user: Dict = Depends(get_current_user)
) -> Any:
    """Accepts natural language prompts and structures them into tasks using Gemini."""
    system_instr = (
        "You are an expert task coordinator. Parse the user's natural language input "
        "and return a JSON object listing the tasks they need to do, estimating the time, "
        "recommending priorities, and assigning appropriate categories."
    )
    # Generate structured JSON matching TaskNLPResponseSchema
    parsed_json = AIService.generate_json(
        prompt=prompt_in.prompt,
        response_schema=TaskNLPResponseSchema,
        system_instruction=system_instr
    )
    return parsed_json
