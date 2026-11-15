# Expense Tracker

Expense Tracker is a full-stack application with a FastAPI backend, a Next.js
frontend, and PostgreSQL for persistence.

## Repository structure

- `backend/` - FastAPI application, domain modules, and Alembic migrations
- `frontend/` - Next.js application
- `docs/` - requirements and engineering documentation
- `compose.yaml` - local PostgreSQL, backend, and frontend services

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ and npm (for running the frontend outside Docker)
- Python 3.13+ and [uv](https://docs.astral.sh/uv/) (for running the backend outside Docker)

## Run with Docker Compose

From the repository root:

```bash
docker compose up --build
```

The services are available at:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>
- API documentation: <http://localhost:8000/docs>

The backend runs database migrations automatically when it starts.

To stop the services:

```bash
docker compose down
```

## Run services locally

Start PostgreSQL separately, then copy the environment examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Install backend dependencies and run migrations:

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run fastapi dev src/main.py
```

In another terminal, install and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Useful commands

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Backend:

```bash
cd backend
uv run alembic upgrade head
```

## Configuration

Use the example environment files as a starting point. Do not commit local
`.env` files or production credentials. Generate a unique `SECRET_KEY` for
non-development environments.
