from fastapi import APIRouter, Depends, HTTPException, Query

from api.auth import get_current_user, require_manager
from api.enrichment import geocode_location
from api.schemas import (AssignUpdate, LeadIn, LeadOut, LeadPage, LeadUpdate,
                         StatusUpdate)
from api.serializers import lead_to_dict

import api.bootstrap  # noqa: F401
from django.contrib.auth import get_user_model
from django.db.models import Q

from leads.models import Lead, LeadStatus, PropertyType

User = get_user_model()
router = APIRouter(prefix="/api/leads", tags=["leads"])

VALID_STATUSES = {s.value for s in LeadStatus}
VALID_PROPERTY_TYPES = {p.value for p in PropertyType} | {""}


def base_qs(user):
    """Agents only see leads assigned to them; managers/admins see all."""
    qs = Lead.objects.select_related("assigned_to", "created_by")
    if user.role == "agent":
        qs = qs.filter(assigned_to=user)
    return qs


async def get_owned_lead(lead_id: int, user):
    try:
        return await base_qs(user).aget(id=lead_id)
    except Lead.DoesNotExist:
        raise HTTPException(404, "Lead not found")


@router.get("", response_model=LeadPage)
async def list_leads(
    q: str = Query(""),
    status: str = Query(""),
    property_type: str = Query(""),
    assigned_to: int | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user=Depends(get_current_user),
):
    qs = base_qs(user)
    if q:
        qs = qs.filter(
            Q(name__icontains=q) | Q(email__icontains=q)
            | Q(phone__icontains=q) | Q(preferred_location__icontains=q)
        )
    if status:
        qs = qs.filter(status=status)
    if property_type:
        qs = qs.filter(property_type=property_type)
    if assigned_to is not None and user.role != "agent":
        qs = qs.filter(assigned_to_id=assigned_to)

    count = await qs.acount()
    offset = (page - 1) * page_size
    results = [lead_to_dict(l) async for l in qs[offset: offset + page_size]]
    return LeadPage(count=count, page=page, page_size=page_size, results=results)


@router.post("", response_model=LeadOut, status_code=201)
async def create_lead(payload: LeadIn, user=Depends(get_current_user)):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(400, f"Invalid status. Use one of {sorted(VALID_STATUSES)}")
    if payload.property_type not in VALID_PROPERTY_TYPES:
        raise HTTPException(400, "Invalid property type")

    # Assignment: managers may assign to anyone; agents own what they create.
    assignee = user
    if user.role in ("manager", "admin") and payload.assigned_to is not None:
        try:
            assignee = await User.objects.aget(id=payload.assigned_to)
        except User.DoesNotExist:
            raise HTTPException(400, "assigned_to user does not exist")

    geo = await geocode_location(payload.preferred_location)
    lead = await Lead.objects.acreate(
        name=payload.name, email=payload.email or "", phone=payload.phone,
        source=payload.source, status=payload.status,
        property_type=payload.property_type, configuration=payload.configuration,
        budget_min=payload.budget_min, budget_max=payload.budget_max,
        preferred_location=payload.preferred_location, location_geo=geo,
        assigned_to=assignee, created_by=user,
    )
    return lead_to_dict(lead)


@router.get("/{lead_id}", response_model=LeadOut)
async def get_lead(lead_id: int, user=Depends(get_current_user)):
    return lead_to_dict(await get_owned_lead(lead_id, user))


@router.patch("/{lead_id}", response_model=LeadOut)
async def update_lead(lead_id: int, payload: LeadUpdate, user=Depends(get_current_user)):
    lead = await get_owned_lead(lead_id, user)
    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in VALID_STATUSES:
        raise HTTPException(400, "Invalid status")
    if "property_type" in data and data["property_type"] not in VALID_PROPERTY_TYPES:
        raise HTTPException(400, "Invalid property type")
    if "email" in data and data["email"] is not None:
        data["email"] = str(data["email"])
    relocate = "preferred_location" in data and data["preferred_location"] != lead.preferred_location
    for field, value in data.items():
        if value is not None or field in ("budget_min", "budget_max"):
            setattr(lead, field, value)
    if relocate:
        lead.location_geo = await geocode_location(lead.preferred_location)
    await lead.asave()
    return lead_to_dict(lead)


@router.patch("/{lead_id}/status", response_model=LeadOut)
async def set_status(lead_id: int, payload: StatusUpdate, user=Depends(get_current_user)):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(400, "Invalid status")
    lead = await get_owned_lead(lead_id, user)
    lead.status = payload.status
    await lead.asave(update_fields=["status", "updated_at"])
    return lead_to_dict(lead)


@router.patch("/{lead_id}/assign", response_model=LeadOut)
async def assign_lead(lead_id: int, payload: AssignUpdate, user=Depends(require_manager)):
    try:
        lead = await Lead.objects.select_related("assigned_to", "created_by").aget(id=lead_id)
    except Lead.DoesNotExist:
        raise HTTPException(404, "Lead not found")
    if payload.assigned_to is None:
        lead.assigned_to = None
    else:
        try:
            lead.assigned_to = await User.objects.aget(id=payload.assigned_to)
        except User.DoesNotExist:
            raise HTTPException(400, "assigned_to user does not exist")
    await lead.asave(update_fields=["assigned_to", "updated_at"])
    return lead_to_dict(lead)


@router.delete("/{lead_id}", status_code=204)
async def delete_lead(lead_id: int, user=Depends(require_manager)):
    deleted, _ = await Lead.objects.filter(id=lead_id).adelete()
    if not deleted:
        raise HTTPException(404, "Lead not found")
