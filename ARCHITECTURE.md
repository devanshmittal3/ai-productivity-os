# Antigravity OS — Architecture Overview

> AI-Powered Productivity Operating System

## System Overview

Antigravity OS is a full-stack AI productivity platform that combines task management, calendar scheduling, meeting intelligence, document analysis, workflow automation, and an AI copilot into a unified workspace.

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Sidebar  │ │  Views   │ │  Navbar  │ │ Copilot Panel │  │
│  │ (Nav)    │ │ (Router) │ │ (Search) │ │ (Chat/Email)  │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API + SSE
┌────────────────────────▼────────────────────────────────────┐
│                  Backend (FastAPI + Python)                  │
│  ┌──────────┐ ┌──────────────┐ ┌─────────────────────────┐ │
│  │  Routes  │→│   Services   │→│     Repositories        │ │
│  │ (API v1) │ │ (Biz Logic)  │ │ (Firestore Abstraction) │ │
│  └──────────┘ └──────┬───────┘ └─────────────────────────┘ │
│                      │                                      │
│              ┌───────▼────────┐                             │
│              │ Gemini Service │                             │
│              │ (LLM Gateway)  │                             │
│              └────────────────┘                             │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────▼──────────────┐
          │   Google Cloud Firestore    │
          │   (Document Database)       │
          └─────────────────────────────┘
```

## Frontend Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 18 + TypeScript | Component-based UI |
| Bundler | Vite | Fast HMR, optimized builds |
| Routing | React Router DOM v6 | Client-side navigation |
| Styling | Vanilla CSS + Glassmorphism | Dark-theme premium design |
| Charts | Recharts | Dashboard analytics visualization |
| Icons | Lucide React | Consistent icon system |

### View Modules
- **AuthView** — Login/register with JWT token handling
- **DashboardView** — Metrics grid, productivity charts, AI daily briefing
- **TasksView** — Kanban-style task management with priority and status
- **CalendarView** — AI-powered event scheduling with smart suggestions
- **MeetingsView** — Transcript paste → AI extracts decisions & action items
- **DocumentsView** — Upload documents, RAG-powered Q&A
- **WorkflowsView** — Node-based automation builder with live execution logs
- **SettingsView** — Profile, work hours, focus session, burnout thresholds

### Copilot Panel (Always-On Sidebar)
- **Chat** — Streaming conversation via SSE
- **Email Draft** — Category + tone-aware email generation
- **Advice** — AI-driven schedule optimization recommendations

## Backend Architecture

### Layered Design
```
Routes (thin) → Services (business logic) → Repositories (data access)
                      ↓
               GeminiService (LLM)
```

### API Modules (`/api/v1/`)
| Module | Endpoints | Key Features |
|--------|-----------|--------------|
| `/auth` | login, register, me, settings | JWT issuance, bcrypt hashing |
| `/tasks` | CRUD, bulk operations | Priority scoring, status tracking |
| `/calendar` | events, smart-schedule | AI-suggested time blocks |
| `/meetings` | analyze transcript | Decision & action item extraction |
| `/documents` | upload, search, summarize | RAG pipeline with embeddings |
| `/workflows` | CRUD, run, logs | DAG execution engine |
| `/analytics` | telemetry, briefing | Productivity metrics aggregation |
| `/copilot` | chat/stream, email/draft, recommendations | Streaming LLM responses |

### Security
- JWT authentication on all protected routes
- Security headers middleware (X-Content-Type-Options, X-Frame-Options, HSTS, XSS Protection)
- CORS restricted to configured origins
- Input validation via Pydantic models

## Data Architecture

**Google Cloud Firestore** (Native mode) with the following top-level collections:

| Collection | Document Structure | Subcollections |
|------------|-------------------|----------------|
| `users` | Profile, settings, preferences | — |
| `tasks` | Title, description, priority, status, due date | `subtasks` |
| `events` | Title, start/end datetime, type, recurrence | — |
| `meetings` | Transcript, summary, decisions | `action_items` |
| `documents` | Title, content, upload date | `chunks` (embeddings) |
| `workflows` | Title, node DAG, active status | `execution_logs` |

## Testing Strategy

| Level | Tool | Target |
|-------|------|--------|
| Backend Unit/Integration | Pytest + pytest-cov | 95%+ coverage |
| Frontend Unit/Integration | Vitest + React Testing Library | 90%+ coverage |
| End-to-End | Playwright (Chromium) | Full user journey |

## Key Architecture Decision Records

| ADR | Title | Status |
|-----|-------|--------|
| [001](docs/adr/001-repository-pattern.md) | Repository Pattern for Data Access | Accepted |
| [002](docs/adr/002-firestore-abstraction.md) | Firestore as Primary Datastore | Accepted |
| [003](docs/adr/003-gemini-integration.md) | Gemini API Integration Strategy | Accepted |
| [004](docs/adr/004-rag-pipeline.md) | RAG Pipeline for Document Intelligence | Accepted |
| [005](docs/adr/005-auth-strategy.md) | JWT Authentication Strategy | Accepted |
| [006](docs/adr/006-workflow-engine.md) | Node-Based Workflow Engine | Accepted |

## Build & Performance

- **Chunk splitting**: `vendor` (React/Router), `ui` (Lucide/Recharts), `app` (business logic)
- **Skip-to-content link**: WCAG accessibility for keyboard users
- **Zero npm vulnerabilities**: Verified via `npm audit`
