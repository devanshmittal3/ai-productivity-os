from abc import ABC, abstractmethod
from typing import List, Optional, TypeVar, Generic, Dict, Any

T = TypeVar('T')

class BaseRepository(Generic[T], ABC):
    @abstractmethod
    async def get(self, id: str) -> Optional[T]:
        pass

    @abstractmethod
    async def get_all(self, **filters) -> List[T]:
        pass

    @abstractmethod
    async def create(self, entity: T) -> T:
        pass

    @abstractmethod
    async def update(self, id: str, entity: Dict[str, Any]) -> Optional[T]:
        pass

    @abstractmethod
    async def delete(self, id: str) -> bool:
        pass

class UserRepositoryInterface(BaseRepository[Dict[str, Any]], ABC):
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        pass

class TaskRepositoryInterface(BaseRepository[Dict[str, Any]], ABC):
    @abstractmethod
    async def get_by_user(self, user_id: str, **filters) -> List[Dict[str, Any]]:
        pass

class CalendarRepositoryInterface(BaseRepository[Dict[str, Any]], ABC):
    @abstractmethod
    async def get_by_user_timeframe(self, user_id: str, start: Any, end: Any) -> List[Dict[str, Any]]:
        pass

class MeetingRepositoryInterface(BaseRepository[Dict[str, Any]], ABC):
    @abstractmethod
    async def get_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        pass

class DocumentRepositoryInterface(BaseRepository[Dict[str, Any]], ABC):
    @abstractmethod
    async def get_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        pass

class WorkflowRepositoryInterface(BaseRepository[Dict[str, Any]], ABC):
    @abstractmethod
    async def get_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        pass
