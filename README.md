# Confident CRM — Real-estate sales CRM (Django + FastAPI + React)

A role-based real-estate CRM for the technical assignment. **Django** is the data
layer (ORM, migrations, auth, admin); **FastAPI** is the only HTTP server and
calls Django's async ORM directly; **React (Vite + Tailwind)** is the UI, served
by FastAPI as one app.

## Features (maps to the assignment + extra mile)

- **Login** — JWT auth backed by Django users
- **Roles (RBAC)** — Admin, Sales Manager, Sales Agent. Agents see only leads
  assigned to them; managers/admins see all, assign/reassign, and delete.
- **Lead management** — full CRUD with real-estate fields: property type,
  configuration (2 BHK / villa / plot…), budget range, preferred location
- **Real-estate pipeline** — New → Contacted → Site visit → Negotiation → Booked → Lost
- **Pipeline board** — drag-and-drop Kanban to move leads between stages
- **Dashboard** — totals, booked-rate, stage distribution (scoped per role)
- **Search & filters** — name / phone / email / location, plus status & property type
- **Notes** — per-lead, attributed to the author
- **External API** — geocodes the preferred location (OpenStreetMap, keyless) and
  shows it on an interactive map
- **Team page + Admin** — manage users/roles; Django admin at `/django/admin/`
- Interactive API docs at `/docs`

## Demo accounts (after `seed.py`)

| Username | Password | Role | Sees |
|---|---|---|---|
| `rohit.manager` | `manager123` | Sales Manager | all leads, can assign & delete |
| `aisha.agent` | `agent123` | Sales Agent | only leads assigned to her |
| `karan.agent` | `agent123` | Sales Agent | only his leads |
| `admin` | `admin12345` | Admin | everything + Django admin |

## Quickstart (local — uses SQLite, no DB setup)

The data model changed in this version, so if you ran an older build, delete the
old database first.

```bash
pip install -r requirements.txt
# Windows PowerShell: del db.sqlite3   |   macOS/Linux: rm -f db.sqlite3
python manage.py migrate
python seed.py            # users (with roles) + real-estate leads (geocoded if online)
```

**Run it (one server, pre-built UI included):**

```bash
python -m uvicorn api.main:app --reload
```

Open `http://127.0.0.1:8000`, sign in with any account above.
Also: `…/docs` (API), `…/django/admin/` (admin).

**Live frontend editing (optional, two terminals):**

```bash
python -m uvicorn api.main:app --reload         # backend :8000
cd frontend && npm install && npm run dev        # Vite :5173 (proxies /api)
```

## Roles & permissions

| Action | Agent | Manager / Admin |
|---|---|---|
| See leads | only assigned to them | all |
| Create lead | yes (auto-assigned to self) | yes (assign to anyone) |
| Edit / status / notes | own leads | all |
| Assign / reassign | no | yes |
| Delete lead | no | yes |
| Team page & user list | no | yes |

Enforced server-side in `api/auth.py` (role attached to the request) and the
route layer — not just hidden in the UI.

## External API (Task 2) — location geocoding

On create/edit, the lead's preferred location is geocoded via OpenStreetMap's
keyless Nominatim API (`api/enrichment.py`), and the coordinates render on an
interactive Leaflet map in the lead view. Best-effort: a timeout or no-match
never blocks the save. Pluggable for Google/Mapbox geocoding with a key.

## Deploy (Render — one service, free)

A multi-stage `Dockerfile` builds the React bundle (Node) and serves it from
FastAPI (Python). `render.yaml` provisions the web service + free Postgres.

1. Push to GitHub → Render → **New → Blueprint** → select the repo.
2. After first deploy, set `CSRF_TRUSTED_ORIGINS` to your URL
   (e.g. `https://confident-crm-xxxx.onrender.com`) so admin logins work.
3. Open the Render **Shell** and run `python seed.py` to create the demo users.

**Keep it warm for the interview:** Render's free tier sleeps after 15 min idle
(~50s cold start). Add a free monitor at cron-job.org or UptimeRobot hitting
`/api/health` every 10 minutes, and open the site a few minutes before your call.

## "What would you change at 2× users?" (the Stage-3 question)

Request path: **React → FastAPI (JWT, async) → Django ORM → PostgreSQL**.

1. **Stateless API + horizontal scale** — JWT means no server sessions; add workers behind the load balancer.
2. **Connection pooling** — PgBouncer so workers don't exhaust Postgres connections.
3. **Cache the dashboard** — its aggregates are the heaviest read; Redis with a short TTL.
4. **Pagination + indexes** — already paginated and indexed on `status`, `created_at`, `assigned_to`.
5. **Move geocoding off the request path** — push the external call to a background worker (Celery/RQ) so saves never wait on a third party.
6. **Read replica** — send dashboard/list reads to a replica if reads dominate.

## Layout

```
core/      Django settings + admin urlconf
leads/     models (Lead, Note, Profile/Role) + admin + migrations
api/       FastAPI app
  auth.py         JWT + role attachment + manager guard
  enrichment.py   geocoding (external API)
  routes/         auth, leads, notes, dashboard, users
frontend/  React (Vite + Tailwind)
  src/pages/      Login, Dashboard, Leads, LeadDetail, Pipeline (Kanban), Team
  src/status.js   real-estate status color language + budget formatting
Dockerfile  multi-stage: Node builds SPA -> Python serves it
seed.py    users with roles + real-estate leads
```
