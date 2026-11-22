# LingoBridge 🌉

Real-time chat with on-the-fly machine translation, built with FastAPI, Next.js, and Supabase.

## Architecture

```
Next.js frontend  --HTTP/WS-->  FastAPI backend  --service role-->  Supabase (auth + Postgres + RLS)
                                         |
                                         +-- local --> HuggingFace transformers (M2M100)
```

- **Backend** (`backend/`): FastAPI app (`app/main.py`), JWT-verified endpoints, WebSocket broadcast chat, local translation.
- **Frontend** (`frontend/`): Next.js 14 client.
- **Database/Auth**: Supabase with Row Level Security. Migrations in `backend/supabase/migrations/`.

## Tech Stack

FastAPI · Next.js · Supabase · PostgreSQL · HuggingFace Transformers (M2M100) · WebSockets

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Environment
Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API: http://localhost:8000 — docs at `/docs`, health at `/health`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

## Configuration

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Service role key (backend only) |
| `SUPABASE_JWT_SECRET` | yes | Supabase JWT secret |
| `ALLOWED_ORIGINS` | no | Comma-separated CORS origins |
| `TRANSLATION_MODEL_NAME` | no | HuggingFace model id (default `facebook/m2m100_418M`) |
| `MAX_TEXT_LENGTH` | no | Max translated text length (default 5000) |
