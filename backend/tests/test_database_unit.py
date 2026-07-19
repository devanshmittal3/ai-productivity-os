import pytest
import sys
import importlib
from unittest.mock import MagicMock, patch

def test_database_init_mock():
    # Test fallback to mock database
    with patch("app.core.config.settings.FIREBASE_CREDENTIALS_PATH", None), \
         patch("app.core.config.settings.FIREBASE_PROJECT_ID", None):
        if "app.core.database" in sys.modules:
            importlib.reload(sys.modules["app.core.database"])
        import app.core.database as db_mod
        assert db_mod.is_mock_db is True
        assert db_mod.get_db() is None

def test_database_init_project_id():
    # Test initialization with Firebase Project ID
    with patch("app.core.config.settings.FIREBASE_CREDENTIALS_PATH", None), \
         patch("app.core.config.settings.FIREBASE_PROJECT_ID", "test-project-123"), \
         patch("firebase_admin.initialize_app") as mock_init, \
         patch("firebase_admin.firestore.client") as mock_client:
        
        mock_client.return_value = "db-client"
        if "app.core.database" in sys.modules:
            importlib.reload(sys.modules["app.core.database"])
        import app.core.database as db_mod
        assert db_mod.is_mock_db is False
        assert db_mod.get_db() == "db-client"

def test_database_init_credentials_path():
    # Test initialization with Credentials Path
    with patch("app.core.config.settings.FIREBASE_CREDENTIALS_PATH", "fake_path.json"), \
         patch("app.core.config.settings.FIREBASE_PROJECT_ID", None), \
         patch("os.path.exists", return_value=True), \
         patch("firebase_admin.credentials.Certificate") as mock_cert, \
         patch("firebase_admin.initialize_app") as mock_init, \
         patch("firebase_admin.firestore.client") as mock_client:
        
        mock_client.return_value = "db-client-cert"
        if "app.core.database" in sys.modules:
            importlib.reload(sys.modules["app.core.database"])
        import app.core.database as db_mod
        assert db_mod.is_mock_db is False
        assert db_mod.get_db() == "db-client-cert"

def test_database_init_exception():
    # Test initialization raising exception
    with patch("app.core.config.settings.FIREBASE_PROJECT_ID", "test-project-123"), \
         patch("firebase_admin.initialize_app", side_effect=Exception("Firebase Fail")):
        if "app.core.database" in sys.modules:
            importlib.reload(sys.modules["app.core.database"])
        import app.core.database as db_mod
        assert db_mod.is_mock_db is True
        assert db_mod.get_db() is None

@pytest.fixture(scope="module", autouse=True)
def restore_database_module():
    # Yield and reload database module at end to restore normal state for other tests
    yield
    if "app.core.database" in sys.modules:
        importlib.reload(sys.modules["app.core.database"])
