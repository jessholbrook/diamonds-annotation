# syntax=docker/dockerfile:1.7

# ---- Stage 1: build the React frontend ---------------------------------------
FROM node:20-slim AS frontend
WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install --no-audit --no-fund

COPY frontend/ ./
RUN npm run build


# ---- Stage 2: Python runtime -------------------------------------------------
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    HOST=0.0.0.0 \
    PORT=8080 \
    DATA_DIR=/data \
    FRONTEND_DIST=/app/frontend_dist

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

COPY backend/ /app/backend/
COPY --from=frontend /frontend/dist/ /app/frontend_dist/

# Run from /app/backend so relative paths in config.py resolve consistently.
WORKDIR /app/backend

EXPOSE 8080

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
