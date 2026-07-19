import os
import json
import logging
from typing import List, Dict, Any, Optional, Generator
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize GenAI
is_mock_ai = True
try:
    if settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        is_mock_ai = False
        logger.info("Gemini API service successfully configured with API Key.")
    else:
        logger.warning("No GEMINI_API_KEY found. Running AI service in Mock Mode.")
except Exception as e:
    logger.error(f"Error configuring Gemini API: {e}. Running in Mock Mode.")
    is_mock_ai = True

class AIService:
    @staticmethod
    def get_model_name(prefer_pro: bool = False) -> str:
        return "gemini-1.5-pro" if prefer_pro else "gemini-1.5-flash"

    @classmethod
    def generate_text(cls, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Synchronous text generation."""
        if is_mock_ai:
            return cls._get_mock_text_response(prompt)
        
        try:
            model = genai.GenerativeModel(
                model_name=cls.get_model_name(),
                system_instruction=system_instruction
            )
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error during Gemini text generation: {e}")
            return f"[AI Error Fallback]: Could not complete request. Local mock response: {cls._get_mock_text_response(prompt)}"

    @classmethod
    def generate_stream(cls, prompt: str, system_instruction: Optional[str] = None, history: Optional[List[Dict[str, str]]] = None) -> Generator[str, None, None]:
        """Streams tokens from Gemini API."""
        if is_mock_ai:
            mock_resp = cls._get_mock_text_response(prompt)
            # Yield in small chunks to simulate streaming
            words = mock_resp.split(" ")
            for i in range(0, len(words), 3):
                yield " ".join(words[i:i+3]) + " "
            return

        try:
            # Prepare chat or direct generation
            if history:
                # Convert standard role-content list to Gemini structure
                contents = []
                for msg in history:
                    contents.append({
                        "role": "user" if msg["role"] == "user" else "model",
                        "parts": [msg["content"]]
                    })
                # Add current user prompt
                contents.append({"role": "user", "parts": [prompt]})
                
                model = genai.GenerativeModel(
                    model_name=cls.get_model_name(),
                    system_instruction=system_instruction
                )
                response = model.generate_content(contents, stream=True)
            else:
                model = genai.GenerativeModel(
                    model_name=cls.get_model_name(),
                    system_instruction=system_instruction
                )
                response = model.generate_content(prompt, stream=True)
                
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Error during Gemini streaming: {e}")
            yield f"\n[Streaming Error]: Falling back to local data.\n{cls._get_mock_text_response(prompt)}"

    @classmethod
    def generate_json(cls, prompt: str, response_schema: Any, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        """Generates structured JSON adhering to the target response_schema."""
        if is_mock_ai:
            return cls._get_mock_json_response(prompt, response_schema)

        try:
            model = genai.GenerativeModel(
                model_name=cls.get_model_name(),
                system_instruction=system_instruction
            )
            # Enforce JSON mode and schema
            config = genai.types.GenerationConfig(
                response_mime_type="application/json",
                response_schema=response_schema
            )
            response = model.generate_content(prompt, generation_config=config)
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Error during Gemini JSON generation: {e}")
            # Fallback to local mock data matching schema
            return cls._get_mock_json_response(prompt, response_schema)

    @classmethod
    def _get_mock_text_response(cls, prompt: str) -> str:
        prompt_lower = prompt.lower()
        if "email" in prompt_lower:
            return (
                "Subject: Project Status Sync & Milestones Update\n\n"
                "Hi Team,\n\n"
                "I hope you are doing well. I wanted to touch base regarding our current project timeline. "
                "We have completed the foundational setup and are moving into the secondary integration phase. "
                "Please let me know your availability for a quick 15-minute sync tomorrow afternoon.\n\n"
                "Best regards,\n[AI Copilot]"
            )
        elif "calendar" in prompt_lower or "schedule" in prompt_lower:
            return (
                "I have analyzed your workload for this week. It looks like you have high-concentration blocks "
                "available on Tuesday morning. I suggest scheduling your deep-work tasks then to prevent burnout."
            )
        return (
            "Hello! I am your AI Copilot. I can help you organize tasks, manage your calendar, summarize meetings, "
            "and create workflows. I am currently running in Mock Mode because no Gemini API key is configured. "
            "How can I assist you today?"
        )

    @classmethod
    def _get_mock_json_response(cls, prompt: str, schema_class: Any) -> Dict[str, Any]:
        """Generates structured dummy data matching the Pydantic/Gemini target schema."""
        schema_name = getattr(schema_class, "__name__", str(schema_class)).lower()
        
        # Match Task parsing
        if "task" in schema_name or "nlp" in schema_name:
            return {
                "tasks": [
                    {
                        "title": "Finish DBMS Assignment",
                        "description": "Complete the SQL schema questions and practice normalization queries.",
                        "priority": "high",
                        "estimatedMinutes": 120,
                        "tags": ["DBMS", "University"],
                        "category": "College",
                        "dependencies": []
                    },
                    {
                        "title": "Prepare for Coding Contest",
                        "description": "Solve 3 practice algorithms on graphs and dynamic programming.",
                        "priority": "medium",
                        "estimatedMinutes": 90,
                        "tags": ["Coding", "Competitive"],
                        "category": "Work",
                        "dependencies": []
                    }
                ],
                "reasoning": "Extracted two core items from the prompt. Classified 'DBMS' as high priority due to near term college deadlines."
            }
        
        # Match Meeting analysis
        elif "meeting" in schema_name or "summary" in schema_name:
            return {
                "overview": "The team aligned on the Phase 1 foundations release. We discussed resolving local write permission blocks and finalized folder paths.",
                "keyDecisions": [
                    "Approved the use of standard in-memory fallbacks when Firebase credentials are not present.",
                    "Decided to deploy the backend on Google Cloud Run and the frontend on Vercel."
                ],
                "actionItems": [
                    {
                        "text": "Setup Vite frontend and configure Tailwind variables.",
                        "assignee": "Frontend Team",
                        "deadline": None
                    },
                    {
                        "text": "Implement Pydantic base models and API routers.",
                        "assignee": "Backend Team",
                        "deadline": None
                    }
                ],
                "nextAgenda": ["Review Task Manager and Copilot streaming implementation."]
            }
        
        # Match Document Intelligence Analysis
        elif "doc" in schema_name or "insights" in schema_name:
            return {
                "summary": "This document covers the principles of modern relational databases, including SQL queries, ACID transactions, and index structures.",
                "keyPoints": [
                    "Relational databases structure data in tables with primary/foreign key connections.",
                    "ACID compliance ensures database transactions are processed reliably.",
                    "Indexes improve search speeds at the cost of write performance."
                ],
                "flashcards": [
                    {"question": "What does ACID stand for?", "answer": "Atomicity, Consistency, Isolation, Durability."},
                    {"question": "What is a Foreign Key?", "answer": "A column that references the primary key of another table."}
                ],
                "quiz": [
                    {
                        "question": "Which SQL keyword is used to retrieve only unique values?",
                        "options": ["DISTINCT", "UNIQUE", "DIFFERENT", "SINGLE"],
                        "answerIndex": 0
                    }
                ],
                "importantDates": [
                    {"event": "DBMS Midterm exam date mentioned", "date": "2026-07-25T09:00:00Z"}
                ]
            }
        
        # Generic fallback
        if "email" in schema_name:
            return {
                "subject": "Mock Subject: Project Sync",
                "body": "This is a mock body for email generation. Best regards."
            }
        return {}
