import pytest
from app.repositories.base import (
    BaseRepository,
    UserRepositoryInterface,
    TaskRepositoryInterface,
    CalendarRepositoryInterface,
    MeetingRepositoryInterface,
    DocumentRepositoryInterface,
    WorkflowRepositoryInterface
)

class ConcreteUserRepository(UserRepositoryInterface):
    async def get(self, id: str):
        return await super().get(id)
    async def get_all(self, **filters):
        return await super().get_all(**filters)
    async def create(self, entity):
        return await super().create(entity)
    async def update(self, id: str, entity):
        return await super().update(id, entity)
    async def delete(self, id: str):
        return await super().delete(id)
    async def get_by_email(self, email: str):
        return await super().get_by_email(email)

class ConcreteTaskRepository(TaskRepositoryInterface):
    async def get(self, id: str): pass
    async def get_all(self, **filters): pass
    async def create(self, entity): pass
    async def update(self, id: str, entity): pass
    async def delete(self, id: str): pass
    async def get_by_user(self, user_id: str, **filters):
        return await super().get_by_user(user_id, **filters)

class ConcreteCalendarRepository(CalendarRepositoryInterface):
    async def get(self, id: str): pass
    async def get_all(self, **filters): pass
    async def create(self, entity): pass
    async def update(self, id: str, entity): pass
    async def delete(self, id: str): pass
    async def get_by_user_timeframe(self, user_id: str, start: float, end: float):
        return await super().get_by_user_timeframe(user_id, start, end)

class ConcreteMeetingRepository(MeetingRepositoryInterface):
    async def get(self, id: str): pass
    async def get_all(self, **filters): pass
    async def create(self, entity): pass
    async def update(self, id: str, entity): pass
    async def delete(self, id: str): pass
    async def get_by_user(self, user_id: str):
        return await super().get_by_user(user_id)

class ConcreteDocumentRepository(DocumentRepositoryInterface):
    async def get(self, id: str): pass
    async def get_all(self, **filters): pass
    async def create(self, entity): pass
    async def update(self, id: str, entity): pass
    async def delete(self, id: str): pass
    async def get_by_user(self, user_id: str):
        return await super().get_by_user(user_id)

class ConcreteWorkflowRepository(WorkflowRepositoryInterface):
    async def get(self, id: str): pass
    async def get_all(self, **filters): pass
    async def create(self, entity): pass
    async def update(self, id: str, entity): pass
    async def delete(self, id: str): pass
    async def get_by_user(self, user_id: str):
        return await super().get_by_user(user_id)

@pytest.mark.asyncio
async def test_interface_fallback_calls():
    user_repo = ConcreteUserRepository()
    await user_repo.get("1")
    await user_repo.get_all()
    await user_repo.create({})
    await user_repo.update("1", {})
    await user_repo.delete("1")
    await user_repo.get_by_email("test")

    task_repo = ConcreteTaskRepository()
    await task_repo.get_by_user("test")

    cal_repo = ConcreteCalendarRepository()
    await cal_repo.get_by_user_timeframe("test", 0, 1)

    meet_repo = ConcreteMeetingRepository()
    await meet_repo.get_by_user("test")

    doc_repo = ConcreteDocumentRepository()
    await doc_repo.get_by_user("test")

    wf_repo = ConcreteWorkflowRepository()
    await wf_repo.get_by_user("test")
