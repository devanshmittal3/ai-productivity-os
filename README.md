# 🚀 AI Productivity OS

> An enterprise-grade AI-powered productivity platform that combines intelligent task management, smart scheduling, meeting intelligence, document understanding, workflow automation, and an AI Copilot into a unified workspace.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.11-yellow?logo=python)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)
![Google Gemini](https://img.shields.io/badge/Google-Gemini-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

# 📌 Overview

AI Productivity OS is a modern AI-first productivity platform designed to help individuals and teams organize work, automate repetitive tasks, analyze meetings, understand documents, and improve productivity using Generative AI.

Instead of using separate tools for task management, calendars, meetings, notes, automation, and AI assistants, this application unifies everything into a single intelligent workspace.

The project was developed as a production-ready submission for the **Hack2Skill PromptWars AI Challenge**.

---

# ✨ Features

## 🤖 AI Productivity Copilot

- Natural language conversations
- Streaming AI responses
- Task generation
- Schedule recommendations
- Productivity suggestions
- Context-aware assistance

---

## ✅ Smart Task Manager

- Kanban board
- List view
- Priority management
- Due dates
- Labels
- Subtasks
- AI task parsing
- Natural language task creation

Example:

```
Finish project tomorrow at 4 PM
```

Automatically becomes

```
Task
Due Date
Priority
Estimated Duration
```

---

## 📅 AI Calendar

- Interactive planner
- Automatic scheduling
- Deadline conflict detection
- Intelligent workload balancing
- Focus time recommendations
- Meeting optimization

---

## 🎙 Meeting Assistant

Upload:

- MP3
- WAV

Automatically generates

- Transcript
- Summary
- Key decisions
- Action items
- Follow-up tasks

---

## 📚 Document Intelligence

Supports

- PDF
- DOCX
- TXT

Features

- AI Summaries
- Flashcards
- Practice quizzes
- Semantic search
- Retrieval-Augmented Generation (RAG)

---

## 🔄 Workflow Automation

Visual workflow builder supporting

Trigger

↓

Condition

↓

Action

Examples

- Meeting finished → Create tasks
- Document uploaded → Generate flashcards
- Task overdue → Notify user
- Deadline approaching → Reschedule calendar

---

## 📊 Productivity Analytics

Real-time analytics dashboard including

- Focus Score
- Productivity Index
- Burnout Detection
- Weekly Trends
- Workload Balance
- Task Completion Rate

---

## 🔒 Security

- JWT Authentication
- Input Validation
- Secure API Design
- Security Headers
- CORS Protection
- Environment Variable Management
- Rate Limiting Ready

---

## ♿ Accessibility

Designed with WCAG AA compliance

- Keyboard navigation
- Skip links
- ARIA labels
- Screen reader support
- Reduced motion support
- High contrast design

---

# 🏗 Architecture

```
                    +---------------------+
                    |    React Frontend   |
                    +----------+----------+
                               |
                               |
                         REST APIs / SSE
                               |
                               |
                    +----------v----------+
                    |    FastAPI Backend  |
                    +----------+----------+
                               |
      +------------------------+------------------------+
      |                        |                        |
      |                        |                        |
+-----v------+          +-------v------+        +-------v------+
| Firestore  |          | Gemini API   |        | Mock Services|
+------------+          +--------------+        +--------------+
```

---

# 🛠 Tech Stack

## Frontend

- React
- TypeScript
- Vite
- React Router
- Recharts
- Lucide Icons
- CSS

## Backend

- FastAPI
- Python
- Pydantic
- Firebase Admin SDK
- Uvicorn

## AI

- Google Gemini API
- Prompt Engineering
- RAG
- Streaming Responses

## Database

- Firebase Firestore
- Mock In-Memory Database

## DevOps

- Docker
- Docker Compose
- GitHub Actions
- Cloud Run Ready

---

# 📂 Project Structure

```
AI Productivity OS

backend/
│
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── repositories/
│   ├── services/
│   ├── schemas/
│   └── main.py
│
├── tests/
│
└── requirements.txt

frontend/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── contexts/
│   ├── services/
│   ├── tests/
│   └── App.tsx
│
├── public/
│
└── package.json

docs/
├── adr/
├── ARCHITECTURE.md
├── SECURITY.md
├── TESTING.md
└── PERFORMANCE.md
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-productivity-os.git

cd ai-productivity-os
```

---

# Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend runs at

```
http://127.0.0.1:8000
```

Swagger

```
http://127.0.0.1:8000/docs
```

---

# Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend

```
http://localhost:5173
```

---

# Environment Variables

## Backend

Create

```
backend/.env
```

```env
GEMINI_API_KEY=YOUR_API_KEY

FIREBASE_PROJECT_ID=YOUR_PROJECT_ID

FIREBASE_CLIENT_EMAIL=YOUR_CLIENT_EMAIL

FIREBASE_PRIVATE_KEY=YOUR_PRIVATE_KEY
```

If no credentials are provided the application automatically falls back to:

- Mock Database
- Mock AI Service

---

# Testing

Backend

```bash
pytest

pytest --cov
```

Frontend

```bash
npm run test
```

End-to-End

```bash
npx playwright test
```

---

# Build

```bash
npm run build
```

---

# Docker

```bash
docker compose up --build
```

---

# CI/CD

GitHub Actions automatically performs

- Build
- Unit Tests
- Linting
- Coverage
- Production Verification

---

# Performance Optimizations

- Code Splitting
- Lazy Loading
- React.memo
- useMemo
- useCallback
- Manual Chunk Splitting
- Optimized Vite Build
- Tree Shaking

---

# Screenshots

Add screenshots here.

```
Dashboard

Task Manager

Calendar

Meeting Assistant

Documents

Workflow Builder

Analytics

Copilot
```

---

# Future Enhancements

- Multi-user collaboration
- OAuth Login
- Mobile Application
- AI Voice Assistant
- Real-time Collaboration
- Email Integration
- Slack Integration
- Google Calendar Sync
- Outlook Integration
- AI Agent Marketplace

---

# Production Readiness

✅ Docker Ready

✅ Cloud Run Ready

✅ GitHub Actions

✅ Unit Testing

✅ End-to-End Testing

✅ Accessibility

✅ Security Hardened

✅ Documentation

✅ Mock + Live Service Support

---

# Contributing

Contributions are welcome.

1. Fork the repository

2. Create your feature branch

```
git checkout -b feature/new-feature
```

3. Commit changes

```
git commit -m "Add feature"
```

4. Push

```
git push origin feature/new-feature
```

5. Open a Pull Request

---

# License

This project is licensed under the MIT License.

---

# Author

**Devansh Mittal**

GitHub

https://github.com/devanshmittal3

LinkedIn

https://www.linkedin.com/

---

## ⭐ If you found this project useful, please consider giving it a star.
