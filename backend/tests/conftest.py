import pytest
from fastapi.testclient import TestClient
from typing import Dict, Any

from app.main import app
from app.api.deps import (
    get_user_repository,
    get_task_repository,
    get_calendar_repository,
    get_meeting_repository,
    get_document_repository,
    get_workflow_repository,
    get_current_user
)
from app.repositories.mock_impl import _mock_db

# Mocked current user definition
MOCK_USER = {
    "id": "test_user_id",
    "email": "test@example.com",
    "name": "Test User",
    "role": "professional",
    "hashedPassword": "mocked_hashed_password",
    "settings": {
        "workHoursStart": "09:00",
        "workHoursEnd": "17:00",
        "focusSessionDuration": 25,
        "burnoutThresholdHours": 40
    }
}

async def override_get_current_user() -> Dict[str, Any]:
    return MOCK_USER

@pytest.fixture(autouse=True)
def reset_mock_db():
    """Clear all in-memory mock database tables before each test execution."""
    _mock_db.users.clear()
    _mock_db.tasks.clear()
    _mock_db.events.clear()
    _mock_db.meetings.clear()
    _mock_db.documents.clear()
    _mock_db.workflows.clear()
    
    # Pre-populate with our mock user so that user retrieval works out of the box
    _mock_db.users[MOCK_USER["id"]] = MOCK_USER.copy()
    yield

@pytest.fixture
def client() -> TestClient:
    """FastAPI TestClient configured with test overrides."""
    # Inject user override
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    with TestClient(app) as test_client:
        yield test_client
        
    app.dependency_overrides.clear()
