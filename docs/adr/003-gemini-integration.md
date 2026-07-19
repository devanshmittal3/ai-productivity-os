# ADR-003: Gemini API Integration Strategy

## Status
**Accepted** — July 2026

## Context
Multiple features require LLM capabilities: Copilot chat, meeting transcript analysis, document summarization, email drafting, and workflow recommendations. We needed a unified integration strategy for Google Gemini.

## Decision
Integrate **Google Gemini API** (via `google-generativeai` SDK) through a centralized `GeminiService` class that all feature services consume.

### Architecture
```
Route Handler → Feature Service → GeminiService → Gemini API
                                       ↑
                              Shared prompt templates
                              Rate limiting & retries
                              Response parsing
```

### Key Design Choices
- Single service class manages the Gemini client lifecycle
- Prompt templates are stored as constants, separated from business logic
- Streaming responses used for Copilot chat (SSE to frontend)
- Non-streaming for structured outputs (meeting analysis, document summaries)
- Configurable model selection via environment variables (flash vs. pro)

## Consequences
- **Positive**: Centralized error handling, rate limiting, and API key management; easy to swap models or add fallback providers
- **Negative**: Single point of failure if the service class has bugs; prompt templates may drift from model capabilities across versions
