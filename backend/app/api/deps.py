from typing import Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import logging

from app.core.config import settings
from app.core.database import get_db, is_mock_db
from app.core.security import decode_access_token

# Import interfaces
from app.repositories.base import (
    UserRepositoryInterface,
    TaskRepositoryInterface,
    CalendarRepositoryInterface,
    MeetingRepositoryInterface,
    DocumentRepositoryInterface,
    WorkflowRepositoryInterface
)

# Import implementations
from app.repositories.mock_impl import (
    MockUserRepository,
    MockTaskRepository,
    MockCalendarRepository,
    MockMeetingRepository,
    MockDocumentRepository,
    MockWorkflowRepository
)
from app.repositories.firestore_impl import (
    FirestoreUserRepository,
    FirestoreTaskRepository,
    FirestoreCalendarRepository,
    FirestoreMeetingRepository,
    FirestoreDocumentRepository,
    FirestoreWorkflowRepository
)

logger = logging.getLogger(__name__)
reusable_oauth2 = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

# Shared instances for Mock (singleton behavior)
_mock_user_repo = MockUserRepository()
_mock_task_repo = MockTaskRepository()
_mock_calendar_repo = MockCalendarRepository()
_mock_meeting_repo = MockMeetingRepository()
_mock_document_repo = MockDocumentRepository()
_mock_workflow_repo = MockWorkflowRepository()

def get_user_repository() -> UserRepositoryInterface:
    if is_mock_db:
        return _mock_user_repo
    return FirestoreUserRepository(get_db())

def get_task_repository() -> TaskRepositoryInterface:
    if is_mock_db:
        return _mock_task_repo
    return FirestoreTaskRepository(get_db())

def get_calendar_repository() -> CalendarRepositoryInterface:
    if is_mock_db:
        return _mock_calendar_repo
    return FirestoreCalendarRepository(get_db())

def get_meeting_repository() -> MeetingRepositoryInterface:
    if is_mock_db:
        return _mock_meeting_repo
    return FirestoreMeetingRepository(get_db())

def get_document_repository() -> DocumentRepositoryInterface:
    if is_mock_db:
        return _mock_document_repo
    return FirestoreDocumentRepository(get_db())

def get_workflow_repository() -> WorkflowRepositoryInterface:
    if is_mock_db:
        return _mock_workflow_repo
    return FirestoreWorkflowRepository(get_db())

async def get_current_user(
    token: str = Depends(reusable_oauth2),
    user_repo: UserRepositoryInterface = Depends(get_user_repository)
) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_exception
    user = await user_repo.get(user_id)
    if user is None:
        raise credentials_exception
    return user
