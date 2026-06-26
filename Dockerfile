# ---- Stage 1: build the React frontend ----
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Python backend that serves the built frontend ----
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Overlay the compiled SPA from stage 1
COPY --from=frontend /app/frontend/dist ./frontend/dist

# Collect Django admin static (no DB needed)
RUN python manage.py collectstatic --noinput

EXPOSE 8000
# Entrypoint runs migrations + seed, then starts the server (free-tier safe).
RUN chmod +x start.sh
CMD ["sh", "start.sh"]