from fastapi import APIRouter, Depends, HTTPException

from api.auth import get_current_user
from api.schemas import NoteIn, NoteOut
from api.serializers import note_to_dict

import api.bootstrap  # noqa: F401
from leads.models import Lead, Note

router = APIRouter(prefix="/api/leads/{lead_id}/notes", tags=["notes"])


async def _ensure_access(lead_id: int, user):
    qs = Lead.objects.filter(id=lead_id)
    if user.role == "agent":
        qs = qs.filter(assigned_to=user)
    if not await qs.aexists():
        raise HTTPException(404, "Lead not found")


@router.get("", response_model=list[NoteOut])
async def list_notes(lead_id: int, user=Depends(get_current_user)):
    await _ensure_access(lead_id, user)
    return [note_to_dict(n) async for n in
            Note.objects.select_related("author").filter(lead_id=lead_id)]


@router.post("", response_model=NoteOut, status_code=201)
async def add_note(lead_id: int, payload: NoteIn, user=Depends(get_current_user)):
    await _ensure_access(lead_id, user)
    note = await Note.objects.acreate(lead_id=lead_id, author=user, body=payload.body)
    note.author = user  # ensure serializer has it without a lazy fetch
    return note_to_dict(note)
