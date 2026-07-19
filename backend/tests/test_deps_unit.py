import pytest
from fastapi import HTTPException
from unittest.mock import MagicMock, patch
from app.api.deps import (
    get_user_repository,
    get_task_repository,
    get_calendar_repository,
    get_meeting_repository,
    get_document_repository,
    get_workflow_repository,
    get_current_user
)

@pytest.mark.asyncio
async def test_deps_repos_live():
    with patch("app.api.deps.is_mock_db", False), patch("app.api.deps.get_db") as mock_get_db:
        mock_db_instance = MagicMock()
        mock_get_db.return_value = mock_db_instance
        
        user_repo = get_user_repository()
        assert user_repo is not None
        
        task_repo = get_task_repository()
        assert task_repo is not None
        
        cal_repo = get_calendar_repository()
        assert cal_repo is not None
        
        meet_repo = get_meeting_repository()
        assert meet_repo is not None
        
        doc_repo = get_document_repository()
        assert doc_repo is not None
        
        wf_repo = get_workflow_repository()
        assert wf_repo is not None

@pytest.mark.asyncio
async def test_get_current_user_invalid_token():
    mock_repo = MagicMock()
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(token="invalid_token", user_repo=mock_repo)
    assert exc_info.value.status_code == 401

@pytest.mark.asyncio
async def test_get_current_user_not_found():
    from unittest.mock import AsyncMock
    mock_repo = MagicMock()
    mock_repo.get = AsyncMock(return_value=None)
    
    with patch("app.api.deps.decode_access_token") as mock_decode:
        mock_decode.return_value = "user_id_123"
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(token="valid_token", user_repo=mock_repo)
        assert exc_info.value.status_code == 401

@pytest.mark.asyncio
async def test_get_current_user_success():
    from unittest.mock import AsyncMock
    mock_repo = MagicMock()
    user_data = {"id": "user_id_123", "email": "test@example.com"}
    mock_repo.get = AsyncMock(return_value=user_data)
    
    with patch("app.api.deps.decode_access_token") as mock_decode:
        mock_decode.return_value = "user_id_123"
        user = await get_current_user(token="valid_token", user_repo=mock_repo)
        assert user == user_data
