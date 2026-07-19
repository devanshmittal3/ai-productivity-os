import pytest
import io
from fastapi import status
from fastapi.testclient import TestClient

def test_read_documents_empty(client: TestClient):
    response = client.get("/api/v1/documents")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_upload_document_success_txt(client: TestClient):
    file_content = b"This is a study note about RDBMS normalization."
    file = ("normalization.txt", io.BytesIO(file_content), "text/plain")
    
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": file}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "doc_id" in data
    assert data["filename"] == "normalization.txt"
    assert data["file_type"] == "txt"

def test_upload_document_invalid_extension(client: TestClient):
    file_content = b"dummy_content"
    file = ("image.png", io.BytesIO(file_content), "image/png")
    
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": file}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Only PDF, DOCX, and TXT" in response.json()["detail"]

def test_upload_document_file_too_large(client: TestClient):
    large_content = b"a" * (10 * 1024 * 1024 + 100) # Slightly larger than 10MB
    file = ("huge.pdf", io.BytesIO(large_content), "application/pdf")
    
    response = client.post(
        "/api/v1/documents/upload",
        files={"file": file}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "exceeds maximum limit" in response.json()["detail"]

def test_get_document_insights_success(client: TestClient):
    # Upload first
    file = ("notes.txt", io.BytesIO(b"Notes about ACID"), "text/plain")
    upload_resp = client.post("/api/v1/documents/upload", files={"file": file}).json()
    
    # Get insights
    response = client.get(f"/api/v1/documents/{upload_resp['doc_id']}/insights")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["doc_id"] == upload_resp["doc_id"]
    assert "summary" in data
    assert "flashcards" in data
    assert "quiz" in data

def test_get_document_insights_not_found(client: TestClient):
    response = client.get("/api/v1/documents/nonexistent-id/insights")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_search_documents(client: TestClient):
    # Upload first
    file = ("rdbms.txt", io.BytesIO(b"ACID means Atomicity Consistency Isolation Durability"), "text/plain")
    client.post("/api/v1/documents/upload", files={"file": file})
    
    # Search
    response = client.post(
        "/api/v1/documents/search",
        json={"query": "What does ACID mean?", "document_ids": []}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "answer" in data
    assert "sources" in data
