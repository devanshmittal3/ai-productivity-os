from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, List, Dict

from app.api.deps import (
    get_current_user,
    get_workflow_repository,
    WorkflowRepositoryInterface
)
from app.models.workflow import (
    WorkflowCreateSchema,
    WorkflowResponseSchema
)
from app.services.workflow_runner import WorkflowRunner

router = APIRouter()

@router.get("", response_model=List[WorkflowResponseSchema])
async def read_workflows(
    current_user: Dict = Depends(get_current_user),
    flow_repo: WorkflowRepositoryInterface = Depends(get_workflow_repository)
) -> Any:
    flows = await flow_repo.get_by_user(current_user["id"])
    return flows

@router.post("", response_model=WorkflowResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    flow_in: WorkflowCreateSchema,
    current_user: Dict = Depends(get_current_user),
    flow_repo: WorkflowRepositoryInterface = Depends(get_workflow_repository)
) -> Any:
    flow_dict = flow_in.model_dump()
    flow_dict["userId"] = current_user["id"]
    flow_dict["isActive"] = True
    
    flow = await flow_repo.create(flow_dict)
    return flow

@router.put("/{id}/toggle", response_model=WorkflowResponseSchema)
async def toggle_workflow(
    id: str,
    current_user: Dict = Depends(get_current_user),
    flow_repo: WorkflowRepositoryInterface = Depends(get_workflow_repository)
) -> Any:
    flow = await flow_repo.get(id)
    if not flow or flow.get("userId") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    updated = await flow_repo.update(id, {"isActive": not flow.get("isActive", True)})
    return updated

@router.post("/{id}/execute", response_model=Dict[str, Any])
async def execute_workflow(
    id: str,
    payload: Dict[str, Any] = None,
    current_user: Dict = Depends(get_current_user),
    flow_repo: WorkflowRepositoryInterface = Depends(get_workflow_repository)
) -> Any:
    flow = await flow_repo.get(id)
    if not flow or flow.get("userId") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    trigger_payload = payload or {}
    execution_result = await WorkflowRunner.execute_workflow(flow, trigger_payload)
    return execution_result

@router.post("/{id}/run", response_model=Dict[str, Any])
async def run_workflow_alias(
    id: str,
    current_user: Dict = Depends(get_current_user),
    flow_repo: WorkflowRepositoryInterface = Depends(get_workflow_repository)
) -> Any:
    """Alias for /execute used by the visual frontend canvas."""
    flow = await flow_repo.get(id)
    if not flow or flow.get("userId") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    execution_result = await WorkflowRunner.execute_workflow(flow, {})
    return execution_result

from app.models.workflow import WorkflowUpdateSchema

@router.put("/{id}", response_model=WorkflowResponseSchema)
async def update_workflow(
    id: str,
    flow_in: WorkflowUpdateSchema,
    current_user: Dict = Depends(get_current_user),
    flow_repo: WorkflowRepositoryInterface = Depends(get_workflow_repository)
) -> Any:
    # Ensure workflow belongs to user
    flow = await flow_repo.get(id)
    if not flow or flow.get("userId") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    update_data = flow_in.model_dump(exclude_unset=True)
    updated = await flow_repo.update(id, update_data)
    return updated

@router.delete("/{id}", response_model=Dict[str, Any])
async def delete_workflow(
    id: str,
    current_user: Dict = Depends(get_current_user),
    flow_repo: WorkflowRepositoryInterface = Depends(get_workflow_repository)
) -> Any:
    flow = await flow_repo.get(id)
    if not flow or flow.get("userId") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    success = await flow_repo.delete(id)
    return {"id": id, "success": success}
