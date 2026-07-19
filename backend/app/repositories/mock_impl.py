import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.repositories.base import (
    UserRepositoryInterface,
    TaskRepositoryInterface,
    CalendarRepositoryInterface,
    MeetingRepositoryInterface,
    DocumentRepositoryInterface,
    WorkflowRepositoryInterface
)

class MockDatabase:
    """In-memory dictionary mock database representation."""
    def __init__(self):
        self.users: Dict[str, Dict[str, Any]] = {}
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self.events: Dict[str, Dict[str, Any]] = {}
        self.meetings: Dict[str, Dict[str, Any]] = {}
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.workflows: Dict[str, Dict[str, Any]] = {}

# Single global instance for in-memory persistence
_mock_db = MockDatabase()

class MockUserRepository(UserRepositoryInterface):
    async def get(self, id: str) -> Optional[Dict[str, Any]]:
        return _mock_db.users.get(id)

    async def get_all(self, **filters) -> List[Dict[str, Any]]:
        return list(_mock_db.users.values())

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        for user in _mock_db.users.values():
            if user.get("email") == email:
                return user
        return None

    async def create(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in entity:
            entity["id"] = str(uuid.uuid4())
        entity["createdAt"] = datetime.now(timezone.utc)
        entity["updatedAt"] = datetime.now(timezone.utc)
        _mock_db.users[entity["id"]] = entity
        return entity

    async def update(self, id: str, entity: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if id not in _mock_db.users:
            return None
        current = _mock_db.users[id]
        current.update(entity)
        current["updatedAt"] = datetime.now(timezone.utc)
        _mock_db.users[id] = current
        return current

    async def delete(self, id: str) -> bool:
        if id in _mock_db.users:
            del _mock_db.users[id]
            return True
        return False

class MockTaskRepository(TaskRepositoryInterface):
    async def get(self, id: str) -> Optional[Dict[str, Any]]:
        return _mock_db.tasks.get(id)

    async def get_all(self, **filters) -> List[Dict[str, Any]]:
        return list(_mock_db.tasks.values())

    async def get_by_user(self, user_id: str, **filters) -> List[Dict[str, Any]]:
        results = []
        for task in _mock_db.tasks.values():
            if task.get("userId") == user_id:
                match = True
                for k, v in filters.items():
                    if task.get(k) != v:
                        match = False
                        break
                if match:
                    results.append(task)
        return results

    async def create(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in entity:
            entity["id"] = str(uuid.uuid4())
        entity["createdAt"] = datetime.now(timezone.utc)
        entity["updatedAt"] = datetime.now(timezone.utc)
        _mock_db.tasks[entity["id"]] = entity
        return entity

    async def update(self, id: str, entity: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if id not in _mock_db.tasks:
            return None
        current = _mock_db.tasks[id]
        current.update(entity)
        current["updatedAt"] = datetime.now(timezone.utc)
        _mock_db.tasks[id] = current
        return current

    async def delete(self, id: str) -> bool:
        if id in _mock_db.tasks:
            del _mock_db.tasks[id]
            return True
        return False

class MockCalendarRepository(CalendarRepositoryInterface):
    async def get(self, id: str) -> Optional[Dict[str, Any]]:
        return _mock_db.events.get(id)

    async def get_all(self, **filters) -> List[Dict[str, Any]]:
        return list(_mock_db.events.values())

    async def get_by_user_timeframe(self, user_id: str, start: datetime, end: datetime) -> List[Dict[str, Any]]:
        results = []
        for event in _mock_db.events.values():
            if event.get("userId") == user_id:
                # Basic timestamp parsing support
                e_start = event.get("start")
                e_end = event.get("end")
                if isinstance(e_start, str):
                    e_start = datetime.fromisoformat(e_start.replace("Z", "+00:00"))
                if isinstance(e_end, str):
                    e_end = datetime.fromisoformat(e_end.replace("Z", "+00:00"))
                
                # Check overlaps
                if e_start < end and e_end > start:
                    results.append(event)
        return results

    async def create(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in entity:
            entity["id"] = str(uuid.uuid4())
        entity["createdAt"] = datetime.now(timezone.utc)
        _mock_db.events[entity["id"]] = entity
        return entity

    async def update(self, id: str, entity: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if id not in _mock_db.events:
            return None
        current = _mock_db.events[id]
        current.update(entity)
        _mock_db.events[id] = current
        return current

    async def delete(self, id: str) -> bool:
        if id in _mock_db.events:
            del _mock_db.events[id]
            return True
        return False

class MockMeetingRepository(MeetingRepositoryInterface):
    async def get(self, id: str) -> Optional[Dict[str, Any]]:
        return _mock_db.meetings.get(id)

    async def get_all(self, **filters) -> List[Dict[str, Any]]:
        return list(_mock_db.meetings.values())

    async def get_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        return [m for m in _mock_db.meetings.values() if m.get("userId") == user_id]

    async def create(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in entity:
            entity["id"] = str(uuid.uuid4())
        entity["createdAt"] = datetime.now(timezone.utc)
        _mock_db.meetings[entity["id"]] = entity
        return entity

    async def update(self, id: str, entity: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if id not in _mock_db.meetings:
            return None
        current = _mock_db.meetings[id]
        current.update(entity)
        _mock_db.meetings[id] = current
        return current

    async def delete(self, id: str) -> bool:
        if id in _mock_db.meetings:
            del _mock_db.meetings[id]
            return True
        return False

class MockDocumentRepository(DocumentRepositoryInterface):
    async def get(self, id: str) -> Optional[Dict[str, Any]]:
        return _mock_db.documents.get(id)

    async def get_all(self, **filters) -> List[Dict[str, Any]]:
        return list(_mock_db.documents.values())

    async def get_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        return [d for d in _mock_db.documents.values() if d.get("userId") == user_id]

    async def create(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in entity:
            entity["id"] = str(uuid.uuid4())
        entity["createdAt"] = datetime.now(timezone.utc)
        _mock_db.documents[entity["id"]] = entity
        return entity

    async def update(self, id: str, entity: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if id not in _mock_db.documents:
            return None
        current = _mock_db.documents[id]
        current.update(entity)
        _mock_db.documents[id] = current
        return current

    async def delete(self, id: str) -> bool:
        if id in _mock_db.documents:
            del _mock_db.documents[id]
            return True
        return False

class MockWorkflowRepository(WorkflowRepositoryInterface):
    async def get(self, id: str) -> Optional[Dict[str, Any]]:
        return _mock_db.workflows.get(id)

    async def get_all(self, **filters) -> List[Dict[str, Any]]:
        return list(_mock_db.workflows.values())

    async def get_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        return [w for w in _mock_db.workflows.values() if w.get("userId") == user_id]

    async def create(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in entity:
            entity["id"] = str(uuid.uuid4())
        entity["createdAt"] = datetime.now(timezone.utc)
        _mock_db.workflows[entity["id"]] = entity
        return entity

    async def update(self, id: str, entity: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if id not in _mock_db.workflows:
            return None
        current = _mock_db.workflows[id]
        current.update(entity)
        _mock_db.workflows[id] = current
        return current

    async def delete(self, id: str) -> bool:
        if id in _mock_db.workflows:
            del _mock_db.workflows[id]
            return True
        return False
