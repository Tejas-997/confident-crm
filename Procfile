web: gunicorn api.main:app -k uvicorn.workers.UvicornWorker -b 0.0.0.0:$PORT --workers 2
release: python manage.py migrate
