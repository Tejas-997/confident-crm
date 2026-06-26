#!/usr/bin/env sh
set -e

echo "==================  BOOT: applying migrations  =================="
python manage.py migrate --noinput

echo "==================  BOOT: seeding demo data  =================="
python seed.py || echo "seed step skipped/failed (non-fatal), continuing"

echo "==================  BOOT: starting gunicorn  =================="
exec gunicorn api.main:app -k uvicorn.workers.UvicornWorker -b 0.0.0.0:${PORT:-8000} --workers 2