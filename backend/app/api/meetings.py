from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import Any, List, Dict, Optional
from datetime import datetime, timezone

from app.api.deps import (
    get_current_user,
    get_meeting_repository,
    get_task_repository,
    MeetingRepositoryInterface,
    TaskRepositoryInterface
)
from app.models.meeting import (
    MeetingNotesRequestSchema,
    MeetingResponseSchema,
    MeetingAISummarySchema
)
from app.services.ai_service import AIService

router = APIRouter()

@router.get("", response_model=List[MeetingResponseSchema])
async def read_meetings(
    current_user: Dict = Depends(get_current_user),
    meeting_repo: MeetingRepositoryInterface = Depends(get_meeting_repository)
) -> Any:
    meetings = await meeting_repo.get_by_user(current_user["id"])
    return meetings

@router.post("/analyze", response_model=MeetingResponseSchema)
async def analyze_meeting(
    title: Optional[str] = Form("Untitled Meeting"),
    notes: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: Dict = Depends(get_current_user),
    meeting_repo: MeetingRepositoryInterface = Depends(get_meeting_repository),
    task_repo: TaskRepositoryInterface = Depends(get_task_repository)
) -> Any:
    """Processes audio files or raw text notes, extracts action items and creates tasks."""
    raw_content = ""
    
    if file:
        # Verify format
        extension = file.filename.split(".")[-1].lower()
        if extension not in ("txt", "mp3", "wav", "m4a"):
            raise HTTPException(status_code=400, detail="Unsupported audio/text format")
            
        file_bytes = await file.read()
        if extension == "txt":
            raw_content = file_bytes.decode("utf-8", errors="ignore")
        else:
            # Under a full pipeline, we'd upload the audio binary to Gemini.
            # In Phase 1 we stub it with transcription logs.
            raw_content = f"[Audio Transcription Log for {file.filename}]: Team discussed code integration paths and set deadlines."
    elif notes:
        raw_content = notes
    else:
        raise HTTPException(status_code=400, detail="Either notes or file must be provided")

    # Run AI Analysis using Gemini JSON Mode
    system_instr = (
        "You are an elite meeting scribe. Read the transcript/notes, synthesize, "
        "and return a JSON meeting summary including overview, keyDecisions, nextAgenda, "
        "and actionItems (each actionItem needs a 'text', optional 'assignee', and optional 'deadline' as ISO datetime)."
    )
    ai_summary = AIService.generate_json(
        prompt=raw_content,
        response_schema=MeetingAISummarySchema,
        system_instruction=system_instr
    )

    # Automatically create tasks from action items
    tasks_created = []
    for item in ai_summary.get("actionItems", []):
        task_dict = {
            "userId": current_user["id"],
            "title": f"Action Item: {item.get('text')}",
            "description": f"Generated from meeting: {title}. Assignee: {item.get('assignee', 'Unassigned')}",
            "status": "todo",
            "priority": "medium",
            "deadline": item.get("deadline"),
            "estimatedMinutes": 45,
            "actualMinutes": 0,
            "tags": ["Meeting", "ActionItem"],
            "category": "Work",
            "dependencies": [],
            "subtasks": []
        }
        created_task = await task_repo.create(task_dict)
        tasks_created.append(created_task["id"])

    # Create meeting document
    meeting_dict = {
        "userId": current_user["id"],
        "title": title,
        "date": datetime.now(timezone.utc),
        "rawInput": raw_content,
        "audioUrl": f"gs://uploads/{file.filename}" if file and extension != "txt" else None,
        "aiSummary": ai_summary,
        "tasksCreated": tasks_created
    }
    
    meeting = await meeting_repo.create(meeting_dict)
    return meeting
