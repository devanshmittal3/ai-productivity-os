import pytest
from unittest.mock import MagicMock, patch
from app.services.ai_service import AIService
from pydantic import BaseModel

class DummySchema(BaseModel):
    value: str

@pytest.mark.parametrize("prefer_pro,expected", [(True, "gemini-1.5-pro"), (False, "gemini-1.5-flash")])
def test_get_model_name(prefer_pro, expected):
    assert AIService.get_model_name(prefer_pro) == expected

def test_generate_text_mock():
    with patch("app.services.ai_service.is_mock_ai", True):
        # Email prompt
        res = AIService.generate_text("draft email")
        assert "Subject" in res
        
        # Calendar prompt
        res2 = AIService.generate_text("suggest schedule")
        assert "concentration" in res2

        # Other prompt
        res3 = AIService.generate_text("how are you?")
        assert "AI Copilot" in res3

def test_generate_stream_mock():
    with patch("app.services.ai_service.is_mock_ai", True):
        tokens = list(AIService.generate_stream("hello"))
        assert len(tokens) > 0
        assert any("AI" in t or "Copilot" in t or "help" in t for t in tokens)

def test_generate_json_mock():
    with patch("app.services.ai_service.is_mock_ai", True):
        # Task
        res = AIService.generate_json("nlp task parsing", "TaskNLP")
        assert "tasks" in res
        
        # Meeting
        res2 = AIService.generate_json("meeting note summary", "MeetingSummary")
        assert "overview" in res2

        # Document
        res3 = AIService.generate_json("analyse doc insights", "DocInsights")
        assert "flashcards" in res3

        # Email fallback
        res4 = AIService.generate_json("draft email schema", "EmailResponseSchema")
        assert "subject" in res4

        # Fallback
        res5 = AIService.generate_json("unknown", "UnknownSchema")
        assert res5 == {}

@patch("google.generativeai.GenerativeModel")
def test_generate_text_live_success(mock_model_class):
    mock_model = MagicMock()
    mock_model.generate_content.return_value.text = "live generated text"
    mock_model_class.return_value = mock_model

    with patch("app.services.ai_service.is_mock_ai", False):
        res = AIService.generate_text("some prompt")
        assert res == "live generated text"
        mock_model.generate_content.assert_called_once_with("some prompt", request_options={"timeout": 15})

@patch("google.generativeai.GenerativeModel")
def test_generate_text_live_failure(mock_model_class):
    mock_model = MagicMock()
    mock_model.generate_content.side_effect = Exception("API Error")
    mock_model_class.return_value = mock_model

    with patch("app.services.ai_service.is_mock_ai", False):
        res = AIService.generate_text("email")
        # Should fallback to mock response
        assert "Subject" in res

@patch("google.generativeai.GenerativeModel")
def test_generate_json_live_success(mock_model_class):
    mock_model = MagicMock()
    mock_model.generate_content.return_value.text = '{"value": "output"}'
    mock_model_class.return_value = mock_model

    with patch("app.services.ai_service.is_mock_ai", False):
        res = AIService.generate_json("nlp task parsing", DummySchema)
        assert res == {"value": "output"}

@patch("google.generativeai.GenerativeModel")
def test_generate_json_live_failure(mock_model_class):
    mock_model = MagicMock()
    mock_model.generate_content.side_effect = Exception("JSON API Error")
    mock_model_class.return_value = mock_model

    with patch("app.services.ai_service.is_mock_ai", False):
        res = AIService.generate_json("task parsing", "TaskNLP")
        # Should fallback to mock json response
        assert "tasks" in res

@patch("google.generativeai.GenerativeModel")
def test_generate_stream_live_success(mock_model_class):
    mock_chunk1 = MagicMock()
    mock_chunk1.text = "Hello "
    mock_chunk2 = MagicMock()
    mock_chunk2.text = "World"
    
    mock_model = MagicMock()
    mock_model.generate_content.return_value = [mock_chunk1, mock_chunk2]
    mock_model_class.return_value = mock_model

    with patch("app.services.ai_service.is_mock_ai", False):
        tokens = list(AIService.generate_stream("say hello"))
        assert tokens == ["Hello ", "World"]

@patch("google.generativeai.GenerativeModel")
def test_generate_stream_live_history(mock_model_class):
    mock_chunk = MagicMock()
    mock_chunk.text = "History response"
    
    mock_model = MagicMock()
    mock_model.generate_content.return_value = [mock_chunk]
    mock_model_class.return_value = mock_model

    with patch("app.services.ai_service.is_mock_ai", False):
        history = [{"role": "user", "content": "Hi"}, {"role": "model", "content": "Hello"}]
        tokens = list(AIService.generate_stream("say hello", history=history))
        assert tokens == ["History response"]

@patch("google.generativeai.GenerativeModel")
def test_generate_stream_live_failure(mock_model_class):
    mock_model = MagicMock()
    mock_model.generate_content.side_effect = Exception("Stream Error")
    mock_model_class.return_value = mock_model

    with patch("app.services.ai_service.is_mock_ai", False):
        tokens = list(AIService.generate_stream("email"))
        res = "".join(tokens)
        assert "Streaming Error" in res
        assert "Subject" in res
