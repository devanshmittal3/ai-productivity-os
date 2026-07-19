import pytest
from unittest.mock import MagicMock, patch
from google.cloud import firestore
from app.repositories.firestore_impl import (
    FirestoreBaseRepository,
    FirestoreUserRepository,
    FirestoreTaskRepository,
    FirestoreCalendarRepository,
    FirestoreMeetingRepository,
    FirestoreDocumentRepository,
    FirestoreWorkflowRepository
)

@pytest.fixture
def mock_db():
    db = MagicMock()
    return db

@pytest.mark.asyncio
async def test_firestore_base_repository_runtime_error():
    repo = FirestoreBaseRepository(None, "test_collection")
    with pytest.raises(RuntimeError):
        _ = repo.coll

@pytest.mark.asyncio
async def test_firestore_get_not_exists(mock_db):
    mock_coll = MagicMock()
    mock_doc = MagicMock()
    mock_doc.get.return_value.exists = False
    mock_coll.document.return_value = mock_doc
    mock_db.collection.return_value = mock_coll

    repo = FirestoreBaseRepository(mock_db, "test_collection")
    result = await repo.get("nonexistent_id")
    assert result is None

@pytest.mark.asyncio
async def test_firestore_get_exists(mock_db):
    mock_coll = MagicMock()
    mock_doc = MagicMock()
    mock_doc.get.return_value.exists = True
    mock_doc.get.return_value.to_dict.return_value = {"field": "value"}
    mock_doc.get.return_value.id = "doc_id"
    mock_coll.document.return_value = mock_doc
    mock_db.collection.return_value = mock_coll

    repo = FirestoreBaseRepository(mock_db, "test_collection")
    result = await repo.get("doc_id")
    assert result == {"id": "doc_id", "field": "value"}

@pytest.mark.asyncio
async def test_firestore_get_all(mock_db):
    mock_coll = MagicMock()
    mock_doc1 = MagicMock()
    mock_doc1.id = "id1"
    mock_doc1.to_dict.return_value = {"name": "doc1"}
    mock_doc2 = MagicMock()
    mock_doc2.id = "id2"
    mock_doc2.to_dict.return_value = {"name": "doc2"}

    mock_coll.where.return_value = mock_coll
    mock_coll.stream.return_value = [mock_doc1, mock_doc2]
    mock_db.collection.return_value = mock_coll

    repo = FirestoreBaseRepository(mock_db, "test_collection")
    result = await repo.get_all(active=True)
    assert len(result) == 2
    assert result[0] == {"id": "id1", "name": "doc1"}

@pytest.mark.asyncio
async def test_firestore_create_with_id(mock_db):
    mock_coll = MagicMock()
    mock_doc = MagicMock()
    mock_coll.document.return_value = mock_doc
    mock_db.collection.return_value = mock_coll

    repo = FirestoreBaseRepository(mock_db, "test_collection")
    entity = {"id": "custom_id", "value": "test"}
    result = await repo.create(entity)
    assert result == entity
    mock_coll.document.assert_called_with("custom_id")
    mock_doc.set.assert_called_with(entity)

@pytest.mark.asyncio
async def test_firestore_create_without_id(mock_db):
    mock_coll = MagicMock()
    mock_doc = MagicMock()
    mock_doc.id = "generated_id"
    mock_coll.document.return_value = mock_doc
    mock_db.collection.return_value = mock_coll

    repo = FirestoreBaseRepository(mock_db, "test_collection")
    entity = {"value": "test"}
    result = await repo.create(entity)
    assert result["id"] == "generated_id"
    mock_doc.set.assert_called_with(entity)

@pytest.mark.asyncio
async def test_firestore_update_not_found(mock_db):
    mock_coll = MagicMock()
    mock_doc = MagicMock()
    mock_doc.get.return_value.exists = False
    mock_coll.document.return_value = mock_doc
    mock_db.collection.return_value = mock_coll

    repo = FirestoreBaseRepository(mock_db, "test_collection")
    result = await repo.update("doc_id", {"val": 1})
    assert result is None

@pytest.mark.asyncio
async def test_firestore_update_success(mock_db):
    mock_coll = MagicMock()
    mock_doc = MagicMock()
    mock_doc.get.return_value.exists = True
    mock_doc.get.return_value.to_dict.return_value = {"val": 2}
    mock_doc.get.return_value.id = "doc_id"
    mock_coll.document.return_value = mock_doc
    mock_db.collection.return_value = mock_coll

    repo = FirestoreBaseRepository(mock_db, "test_collection")
    result = await repo.update("doc_id", {"val": 2})
    assert result == {"id": "doc_id", "val": 2}
    mock_doc.update.assert_called_with({"val": 2})

@pytest.mark.asyncio
async def test_firestore_delete_not_found(mock_db):
    mock_coll = MagicMock()
    mock_doc = MagicMock()
    mock_doc.get.return_value.exists = False
    mock_coll.document.return_value = mock_doc
    mock_db.collection.return_value = mock_coll

    repo = FirestoreBaseRepository(mock_db, "test_collection")
    result = await repo.delete("doc_id")
    assert result is False

@pytest.mark.asyncio
async def test_firestore_delete_success(mock_db):
    mock_coll = MagicMock()
    mock_doc = MagicMock()
    mock_doc.get.return_value.exists = True
    mock_coll.document.return_value = mock_doc
    mock_db.collection.return_value = mock_coll

    repo = FirestoreBaseRepository(mock_db, "test_collection")
    result = await repo.delete("doc_id")
    assert result is True
    mock_doc.delete.assert_called_once()

@pytest.mark.asyncio
async def test_user_repo_get_by_email(mock_db):
    mock_coll = MagicMock()
    mock_doc = MagicMock()
    mock_doc.id = "user_id"
    mock_doc.to_dict.return_value = {"email": "test@example.com"}
    mock_coll.where.return_value.limit.return_value.stream.return_value = [mock_doc]
    mock_db.collection.return_value = mock_coll

    repo = FirestoreUserRepository(mock_db)
    result = await repo.get_by_email("test@example.com")
    assert result == {"id": "user_id", "email": "test@example.com"}

@pytest.mark.asyncio
async def test_user_repo_get_by_email_none(mock_db):
    mock_coll = MagicMock()
    mock_coll.where.return_value.limit.return_value.stream.return_value = []
    mock_db.collection.return_value = mock_coll

    repo = FirestoreUserRepository(mock_db)
    result = await repo.get_by_email("test@example.com")
    assert result is None

@pytest.mark.asyncio
async def test_task_repo_get_by_user(mock_db):
    mock_coll = MagicMock()
    mock_doc = MagicMock()
    mock_doc.id = "task_id"
    mock_doc.to_dict.return_value = {"title": "Task 1"}
    mock_coll.where.return_value.where.return_value.stream.return_value = [mock_doc]
    mock_db.collection.return_value = mock_coll

    repo = FirestoreTaskRepository(mock_db)
    result = await repo.get_by_user("user_id", priority="high")
    assert len(result) == 1
    assert result[0] == {"id": "task_id", "title": "Task 1"}

@pytest.mark.asyncio
async def test_calendar_repo_get_by_user_timeframe(mock_db):
    mock_coll = MagicMock()
    mock_doc = MagicMock()
    mock_doc.id = "evt_id"
    mock_doc.to_dict.return_value = {"title": "Event 1"}
    mock_coll.where.return_value.where.return_value.where.return_value.stream.return_value = [mock_doc]
    mock_db.collection.return_value = mock_coll

    repo = FirestoreCalendarRepository(mock_db)
    result = await repo.get_by_user_timeframe("user_id", "start_time", "end_time")
    assert len(result) == 1
    assert result[0] == {"id": "evt_id", "title": "Event 1"}

@pytest.mark.asyncio
async def test_other_repos_get_by_user(mock_db):
    mock_coll = MagicMock()
    mock_doc = MagicMock()
    mock_doc.id = "item_id"
    mock_doc.to_dict.return_value = {"title": "Item"}
    mock_coll.where.return_value.stream.return_value = [mock_doc]
    mock_db.collection.return_value = mock_coll

    meeting_repo = FirestoreMeetingRepository(mock_db)
    r1 = await meeting_repo.get_by_user("user_id")
    assert len(r1) == 1

    doc_repo = FirestoreDocumentRepository(mock_db)
    r2 = await doc_repo.get_by_user("user_id")
    assert len(r2) == 1

    workflow_repo = FirestoreWorkflowRepository(mock_db)
    r3 = await workflow_repo.get_by_user("user_id")
    assert len(r3) == 1
