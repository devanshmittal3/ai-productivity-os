from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import Any, List, Dict
import json

from app.api.deps import (
    get_current_user,
    get_task_repository,
    get_calendar_repository,
    TaskRepositoryInterface,
    CalendarRepositoryInterface
)
from app.models.copilot import (
    ChatMessageSchema,
    RecommendationResponseSchema,
    EmailGenerateSchema,
    EmailResponseSchema
)
from app.services.ai_service import AIService

router = APIRouter()

@router.post("/chat/stream")
async def chat_stream(
    msg_in: ChatMessageSchema,
    current_user: Dict = Depends(get_current_user)
) -> Any:
    """Streams token by token answers for real-time Copilot chat experience."""
    system_instr = (
        f"You are Antigravity, an elite AI Productivity OS Copilot. "
        f"The user is named '{current_user.get('name', 'Professional')}'. "
        f"Be direct, action-oriented, and helpful. You can guide them on managing tasks, "
        f"planning study schedules, setting up automation triggers, and avoiding burnout."
    )
    
    async def event_generator():
        # Stream response chunks from AIService
        for token in AIService.generate_stream(prompt=msg_in.message, system_instruction=system_instr):
            yield f"data: {json.dumps({'text': token})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/recommendations", response_model=RecommendationResponseSchema)
async def get_recommendations(
    current_user: Dict = Depends(get_current_user),
    task_repo: TaskRepositoryInterface = Depends(get_task_repository)
) -> Any:
    """Uses LLM to analyze the tasks backlog and return actionable scheduling shifts."""
    tasks = await task_repo.get_by_user(current_user["id"], status="todo")
    
    # Run a simple heuristic or prompt Gemini. In Phase 1 we return quick smart structural changes.
    recommendations = []
    
    if len(tasks) > 2:
        recommendations.append({
            "title": "Group Coding Tasks",
            "description": f"You have {len(tasks)} active coding tasks. Let's schedule a unified 90-minute Focus block tomorrow to finish them together.",
            "actionType": "schedule_block",
            "actionPayload": {"duration": 90, "label": "Coding Focus Session"}
        })
        
    recommendations.append({
        "title": "Take a Recharge Break",
        "description": "You have a long work session scheduled for tomorrow. I suggest slotting a 15-minute break in between tasks.",
        "actionType": "break_suggestion",
        "actionPayload": {"duration": 15}
    })
    
    return {"recommendations": recommendations}

@router.post("/email/draft", response_model=EmailResponseSchema)
async def draft_email(
    email_in: EmailGenerateSchema,
    current_user: Dict = Depends(get_current_user)
) -> Any:
    """Generates email drafts with custom categories and tones."""
    prompt = (
        f"Draft an email with the following request: '{email_in.prompt}'. "
        f"Category: {email_in.category}. Tone: {email_in.tone}. "
        f"Sender: {current_user.get('name', 'Professional')}."
    )
    system_instr = (
        "You are an expert executive secretary. Output a JSON block containing two strings: "
        "'subject' and 'body'. Do not output anything else."
    )
    
    # We want a structured response
    result = AIService.generate_json(
        prompt=prompt,
        response_schema=EmailResponseSchema,
        system_instruction=system_instr
    )
    return result
