from fastapi import APIRouter, Depends

from api.auth import require_manager
from api.schemas import UserOut

import api.bootstrap  # noqa: F401
from django.contrib.auth import get_user_model
from leads.models import Profile

User = get_user_model()
router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserOut])
async def list_users(user=Depends(require_manager)):
    """Agents/managers available for lead assignment."""
    roles = {p.user_id: p.role async for p in Profile.objects.all()}
    out = []
    async for u in User.objects.filter(is_active=True).order_by("username"):
        role = "admin" if u.is_superuser else roles.get(u.id, "agent")
        out.append(UserOut(id=u.id, username=u.username, email=u.email, role=role))
    return out
