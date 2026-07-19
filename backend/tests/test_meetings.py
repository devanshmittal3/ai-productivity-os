import pytest
import io
from fastapi import status
from fastapi.testclient import TestClient

def test_read_meetings_empty(client: TestClient):
    response = client.get("/api/v1/meetings")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_analyze_meeting_with_notes(client: TestClient):
    form_data = {
        "title": "Notes Sync",
        "notes": "Discuss database schema updates next Monday."
    }
    response = client.post("/api/v1/meetings/analyze", data=form_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Notes Sync"
    assert "aiSummary" in data
    assert len(data["tasksCreated"]) > 0

def test_analyze_meeting_with_text_file(client: TestClient):
    file_content = b"ACID Compliance review for SQL databases."
    file = ("meeting_transcript.txt", io.BytesIO(file_content), "text/plain")
    
    response = client.post(
        "/api/v1/meetings/analyze",
        data={"title": "Text File Meeting"},
        files={"file": file}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Text File Meeting"
    assert data["rawInput"] == "ACID Compliance review for SQL databases."

def test_analyze_meeting_with_audio_file(client: TestClient):
    file_content = b"dummy_audio_bytes"
    file = ("meeting_audio.mp3", io.BytesIO(file_content), "audio/mpeg")
    
    response = client.post(
        "/api/v1/meetings/analyze",
        data={"title": "Audio File Meeting"},
        files={"file": file}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "[Audio Transcription Log for meeting_audio.mp3]" in data["rawInput"]
    assert data["audioUrl"] == "gs://uploads/meeting_audio.mp3"

def test_analyze_meeting_invalid_format(client: TestClient):
    file_content = b"some_image_bytes"
    file = ("profile_pic.jpg", io.BytesIO(file_content), "image/jpeg")
    
    response = client.post(
        "/api/v1/meetings/analyze",
        data={"title": "Invalid File Meeting"},
        files={"file": file}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Unsupported audio/text format" in response.json()["detail"]

def test_analyze_meeting_empty_body(client: TestClient):
    response = client.post("/api/v1/meetings/analyze", data={"title": "Empty Meeting"})
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Either notes or file must be provided" in response.json()["detail"]
