import os
from pathlib import Path

import api.bootstrap  # noqa: F401  (boots Django before anything else)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from django.core.asgi import get_asgi_application

from api.routes import auth, dashboard, leads, notes, users

BASE_DIR = Path(__file__).resolve().parent.parent
DIST = BASE_DIR / "frontend" / "dist"

app = FastAPI(title="Lead CRM API", version="1.0.0")

# CORS for the React frontend (set FRONTEND_ORIGINS in prod).
origins = os.environ.get("FRONTEND_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(leads.router)
app.include_router(notes.router)
app.include_router(dashboard.router)
app.include_router(users.router)


@app.get("/api/health", tags=["meta"])
async def health():
    return {"status": "ok"}


# Mount the full Django app (admin + static) under /django.
# Gives you a working internal CRM UI with zero extra code.
app.mount(os.environ.get("DJANGO_MOUNT", "/django"), get_asgi_application())


# Serve the built React SPA (if present). API and Django are matched first
# because they're registered before this block. The catch-all returns
# index.html so client-side routes like /leads/5 survive a refresh.
if (DIST / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/")
    async def spa_root():
        return FileResponse(DIST / "index.html")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        if full_path.startswith(("api/", "django")):
            raise HTTPException(404)
        candidate = DIST / full_path
        if candidate.is_file():  # favicon, etc.
            return FileResponse(candidate)
        return FileResponse(DIST / "index.html")
