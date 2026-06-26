from datetime import timedelta

from fastapi import APIRouter, Depends

from api.auth import get_current_user
from api.schemas import DashboardOut
from api.serializers import lead_to_dict

import api.bootstrap  # noqa: F401
from django.db.models import Count
from django.utils import timezone

from leads.models import Lead, LeadStatus

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
async def dashboard(user=Depends(get_current_user)):
    qs = Lead.objects.select_related("assigned_to")
    scope = "all"
    if user.role == "agent":
        qs = qs.filter(assigned_to=user)
        scope = "mine"

    total = await qs.acount()
    by_status = {s.value: 0 for s in LeadStatus}
    async for row in qs.values("status").annotate(n=Count("id")).order_by():
        by_status[row["status"]] = row["n"]

    booked = by_status.get(LeadStatus.BOOKED.value, 0)
    booked_rate = round((booked / total) * 100, 1) if total else 0.0

    since = timezone.now() - timedelta(days=7)
    last_7 = await qs.filter(created_at__gte=since).acount()
    recent = [lead_to_dict(l) async for l in qs[:5]]

    return DashboardOut(
        total_leads=total, by_status=by_status, booked_rate=booked_rate,
        created_last_7_days=last_7, recent=recent, scope=scope,
    )
