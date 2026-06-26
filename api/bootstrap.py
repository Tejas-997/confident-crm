"""Boot Django as a library so its ORM/admin/auth are usable inside FastAPI.

Import this module (or `import api.bootstrap`) BEFORE importing any Django model.
"""
import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()
