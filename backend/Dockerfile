FROM python:3.13-slim-bookworm

# Copy official uv binary for fast package management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Configure uv and Python environment
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH="/app"

# Install dependencies first (layer caching)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project

# Copy application code and Alembic migrations
COPY alembic.ini ./
COPY migrations ./migrations
COPY src ./src

# Install project
RUN uv sync --frozen

# Place virtual environment executables in PATH
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

# Default command: run migrations and start server with hot reload
CMD ["sh", "-c", "alembic upgrade head && fastapi dev src/main.py --host 0.0.0.0 --port 8000"]
