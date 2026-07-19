from fastapi import APIRouter, Depends, status
from typing import Any, List, Dict
from datetime import datetime, timedelta

from app.api.deps import (
    get_current_user,
    get_calendar_repository,
    get_task_repository,
    CalendarRepositoryInterface,
    TaskRepositoryInterface
)
from app.models.calendar import (
    CalendarEventCreateSchema,
    CalendarEventResponseSchema,
    AutoScheduleRequestSchema,
    RebalanceRequestSchema,
    ScheduleReportSchema
)
from app.services.scheduler import SchedulerService

router = APIRouter()

@router.get("", response_model=List[CalendarEventResponseSchema])
async def read_events(
    start: str,
    end: str,
    current_user: Dict = Depends(get_current_user),
    cal_repo: CalendarRepositoryInterface = Depends(get_calendar_repository)
) -> Any:
    # Convert ISO strings to datetime
    start_dt = datetime.fromisoformat(start.replace("Z", "+00:00").replace(" ", "+"))
    end_dt = datetime.fromisoformat(end.replace("Z", "+00:00").replace(" ", "+"))
    
    events = await cal_repo.get_by_user_timeframe(current_user["id"], start_dt, end_dt)
    return events

@router.post("", response_model=CalendarEventResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_in: CalendarEventCreateSchema,
    current_user: Dict = Depends(get_current_user),
    cal_repo: CalendarRepositoryInterface = Depends(get_calendar_repository)
) -> Any:
    event_dict = event_in.model_dump()
    event_dict["userId"] = current_user["id"]
    
    event = await cal_repo.create(event_dict)
    return event

@router.post("/auto-schedule", response_model=ScheduleReportSchema)
async def auto_schedule(
    req: AutoScheduleRequestSchema,
    current_user: Dict = Depends(get_current_user),
    task_repo: TaskRepositoryInterface = Depends(get_task_repository),
    cal_repo: CalendarRepositoryInterface = Depends(get_calendar_repository)
) -> Any:
    """Invokes the greedy auto-scheduler algorithm on active tasks and saves the events."""
    tasks = await task_repo.get_by_user(current_user["id"], status="todo")
    start_dt = datetime.now()
    end_dt = start_dt + timedelta(days=30)
    existing = await cal_repo.get_by_user_timeframe(current_user["id"], start_dt, end_dt)
    
    # Run service
    new_events = SchedulerService.auto_schedule_tasks(
        tasks=tasks, 
        existing_events=existing,
        start_hours=current_user.get("settings", {}).get("workHoursStart", "09:00"),
        end_hours=current_user.get("settings", {}).get("workHoursEnd", "17:00")
    )
    
    saved_events = []
    for evt in new_events:
        saved = await cal_repo.create(evt)
        # Update task with autoScheduledSlot reference
        await task_repo.update(evt["relatedTaskId"], {
            "autoScheduledSlot": {
                "start": evt["start"],
                "end": evt["end"]
            }
        })
        saved_events.append(saved)
        
    return {
        "events_scheduled": len(saved_events),
        "conflicts_resolved": 0,
        "schedule": saved_events
    }

@router.post("/rebalance", response_model=ScheduleReportSchema)
async def rebalance_calendar(
    req: RebalanceRequestSchema,
    current_user: Dict = Depends(get_current_user),
    task_repo: TaskRepositoryInterface = Depends(get_task_repository),
    cal_repo: CalendarRepositoryInterface = Depends(get_calendar_repository)
) -> Any:
    from datetime import timedelta
    tasks = await task_repo.get_by_user(current_user["id"], status="todo")
    
    # Get range for target date
    start_dt = req.target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_dt = start_dt + timedelta(days=1)
    
    existing = await cal_repo.get_by_user_timeframe(current_user["id"], start_dt, end_dt)
    for evt in existing:
        if evt.get("type") == "task_execution":
            await cal_repo.delete(evt["id"])
            
    new_events = SchedulerService.auto_schedule_tasks(
        tasks=tasks,
        existing_events=[],
        start_hours=current_user.get("settings", {}).get("workHoursStart", "09:00"),
        end_hours=current_user.get("settings", {}).get("workHoursEnd", "17:00")
    )
    
    saved_events = []
    for evt in new_events:
        saved = await cal_repo.create(evt)
        saved_events.append(saved)
        
    return {
        "events_scheduled": len(saved_events),
        "conflicts_resolved": len(existing),
        "schedule": saved_events
    }
