import os
from datetime import datetime, timedelta, timezone

import jwt
from asgiref.sync import sync_to_async
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

import api.bootstrap  # noqa: F401  (boots Django)
from django.contrib.auth import get_user_model

from leads.models import Profile

User = get_user_model()

SECRET = os.environ.get("SECRET_KEY", "dev-insecure-change-me")
ALGORITHM = "HS256"
TOKEN_TTL_MIN = int(os.environ.get("TOKEN_TTL_MIN", "720"))  # 12h

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

MANAGER_ROLES = {"manager", "admin"}


def create_access_token(user) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "username": user.username,
        "iat": now,
        "exp": now + timedelta(minutes=TOKEN_TTL_MIN),
    }
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)


async def _role_for(user) -> str:
    if user.is_superuser:
        return "admin"
    try:
        prof = await Profile.objects.aget(user=user)
        return prof.role
    except Profile.DoesNotExist:
        return "agent"


async def authenticate(username: str, password: str):
    try:
        user = await User.objects.aget(username=username, is_active=True)
    except User.DoesNotExist:
        return None
    ok = await sync_to_async(user.check_password)(password)
    return user if ok else None


async def get_current_user(token: str = Depends(oauth2_scheme)):
    creds_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except jwt.PyJWTError:
        raise creds_error
    try:
        user = await User.objects.aget(id=user_id, is_active=True)
    except User.DoesNotExist:
        raise creds_error
    # Attach the role onto the instance so routes can branch on it.
    user.role = await _role_for(user)
    return user


async def require_manager(user=Depends(get_current_user)):
    if user.role not in MANAGER_ROLES:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Managers and admins only")
    return user
