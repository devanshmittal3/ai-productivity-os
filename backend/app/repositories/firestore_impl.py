from typing import List, Optional, Dict, Any
from google.cloud import firestore
from app.repositories.base import (
    UserRepositoryInterface,
    TaskRepositoryInterface,
    CalendarRepositoryInterface,
    MeetingRepositoryInterface,
    DocumentRepositoryInterface,
    WorkflowRepositoryInterface
)

class FirestoreBaseRepository:
    def __init__(self, db: Any, collection_name: str):
        self.db = db
        self.collection_name = collection_name

    @property
    def coll(self):
        if self.db is None:
            raise RuntimeError(f"Database client not initialized. Cannot access collection '{self.collection_name}'.")
        return self.db.collection(self.collection_name)

    async def get(self, id: str) -> Optional[Dict[str, Any]]:
        doc = self.coll.document(id).get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            return data
        return None

    async def get_all(self, **filters) -> List[Dict[str, Any]]:
        query = self.coll
        for key, val in filters.items():
            query = query.where(key, "==", val)
        docs = query.stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            results.append(data)
        return results

    async def create(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        # If id is specified, write to that document; otherwise auto-generate
        if "id" in entity and entity["id"]:
            doc_id = entity["id"]
            self.coll.document(doc_id).set(entity)
        else:
            doc_ref = self.coll.document()
            entity["id"] = doc_ref.id
            doc_ref.set(entity)
        return entity

    async def update(self, id: str, entity: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        doc_ref = self.coll.document(id)
        if not doc_ref.get().exists:
            return None
        doc_ref.update(entity)
        # Fetch fresh data
        updated_doc = doc_ref.get()
        data = updated_doc.to_dict()
        data["id"] = updated_doc.id
        return data

    async def delete(self, id: str) -> bool:
        doc_ref = self.coll.document(id)
        if doc_ref.get().exists:
            doc_ref.delete()
            return True
        return False

class FirestoreUserRepository(FirestoreBaseRepository, UserRepositoryInterface):
    def __init__(self, db: Any):
        super().__init__(db, "users")

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        docs = self.coll.where("email", "==", email).limit(1).stream()
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            return data
        return None

class FirestoreTaskRepository(FirestoreBaseRepository, TaskRepositoryInterface):
    def __init__(self, db: Any):
        super().__init__(db, "tasks")

    async def get_by_user(self, user_id: str, **filters) -> List[Dict[str, Any]]:
        query = self.coll.where("userId", "==", user_id)
        for key, val in filters.items():
            query = query.where(key, "==", val)
        docs = query.stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            results.append(data)
        return results

class FirestoreCalendarRepository(FirestoreBaseRepository, CalendarRepositoryInterface):
    def __init__(self, db: Any):
        super().__init__(db, "events")

    async def get_by_user_timeframe(self, user_id: str, start: Any, end: Any) -> List[Dict[str, Any]]:
        query = (
            self.coll.where("userId", "==", user_id)
            .where("start", "<", end)
            .where("end", ">", start)
        )
        docs = query.stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            results.append(data)
        return results

class FirestoreMeetingRepository(FirestoreBaseRepository, MeetingRepositoryInterface):
    def __init__(self, db: Any):
        super().__init__(db, "meetings")

    async def get_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        return await self.get_all(userId=user_id)

class FirestoreDocumentRepository(FirestoreBaseRepository, DocumentRepositoryInterface):
    def __init__(self, db: Any):
        super().__init__(db, "documents")

    async def get_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        return await self.get_all(userId=user_id)

class FirestoreWorkflowRepository(FirestoreBaseRepository, WorkflowRepositoryInterface):
    def __init__(self, db: Any):
        super().__init__(db, "workflows")

    async def get_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        return await self.get_all(userId=user_id)
