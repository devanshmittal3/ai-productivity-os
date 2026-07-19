from fastapi import APIRouter, Depends
from typing import Any, Dict
from datetime import datetime, timezone, timedelta

from app.api.deps import (
    get_current_user,
    get_task_repository,
    get_calendar_repository,
    TaskRepositoryInterface,
    CalendarRepositoryInterface
)
from app.models.analytics import (
    FocusInsightsSchema,
    DailyBriefingSchema
)
from app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/insights", response_model=FocusInsightsSchema)
async def get_insights(
    current_user: Dict = Depends(get_current_user),
    task_repo: TaskRepositoryInterface = Depends(get_task_repository),
    cal_repo: CalendarRepositoryInterface = Depends(get_calendar_repository)
) -> Any:
    """Retrieves computed statistics regarding task completion, focus times, and burnout alerts."""
    tasks = await task_repo.get_by_user(current_user["id"])
    
    start_dt = datetime.now(timezone.utc) - timedelta(days=7)
    end_dt = datetime.now(timezone.utc) + timedelta(days=7)
    events = await cal_repo.get_by_user_timeframe(current_user["id"], start_dt, end_dt)
    
    insights = AnalyticsService.calculate_focus_insights(tasks, events)
    return insights

@router.get("/briefing", response_model=DailyBriefingSchema)
async def get_daily_briefing(
    current_user: Dict = Depends(get_current_user),
    task_repo: TaskRepositoryInterface = Depends(get_task_repository),
    cal_repo: CalendarRepositoryInterface = Depends(get_calendar_repository)
) -> Any:
    """Combines tasks and events into a single executive morning summary briefing."""
    tasks = await task_repo.get_by_user(current_user["id"], status="todo")
    
    # Filter priorities
    priorities = [t for t in tasks if t.get("priority") in ("high", "urgent")][:3]
    
    # Fetch today's events
    start_today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    end_today = start_today + timedelta(days=1)
    events = await cal_repo.get_by_user_timeframe(current_user["id"], start_today, end_today)
    
    # Generate schedule preview
    suggested_schedule = []
    for index, evt in enumerate(events):
        suggested_schedule.append({
            "time": f"{evt.get('start').strftime('%H:%M') if isinstance(evt.get('start'), datetime) else '09:00'} - {evt.get('end').strftime('%H:%M') if isinstance(evt.get('end'), datetime) else '10:00'}",
            "activity": evt.get("title")
        })
        
    greeting = f"Good morning, {current_user.get('name', 'Professional')}. Let's make today productive!"
    
    # Simple advice list
    recommendations = [
        "Your calendar looks moderately busy. Make sure to step away for a 10-minute break after meetings.",
        "Focus on completing 'Action Item' tasks first to clear your backlog."
    ]
    
    return {
        "date": datetime.now(timezone.utc),
        "greeting": greeting,
        "priorities": tasks[:3],  # Return up to 3 tasks
        "events": events,
        "suggestedSchedule": suggested_schedule,
        "recommendations": recommendations
    }
