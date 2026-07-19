import os
import logging
import firebase_admin
from firebase_admin import credentials, firestore
from app.core.config import settings

logger = logging.getLogger(__name__)

db = None
firebase_app = None
is_mock_db = True

try:
    if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_app = firebase_admin.initialize_app(cred)
        db = firestore.client()
        is_mock_db = False
        logger.info("Firebase Admin SDK successfully initialized via credentials file.")
    elif settings.FIREBASE_PROJECT_ID:
        # Fallback using application default credentials or project ID
        firebase_app = firebase_admin.initialize_app(options={
            'projectId': settings.FIREBASE_PROJECT_ID,
        })
        db = firestore.client()
        is_mock_db = False
        logger.info(f"Firebase Admin SDK initialized with project ID: {settings.FIREBASE_PROJECT_ID}")
    else:
        logger.warning("No Firebase credentials provided. Falling back to local In-Memory Mock Database.")
except Exception as e:
    logger.error(f"Error initializing Firebase Admin SDK: {e}. Falling back to In-Memory Mock Database.")
    db = None
    is_mock_db = True

def get_db():
    """Dependency provider for the Firestore client."""
    if is_mock_db:
        return None
    return db
