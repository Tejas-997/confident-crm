def lead_to_dict(lead) -> dict:
    assigned = getattr(lead, "assigned_to", None)
    return {
        "id": lead.id,
        "name": lead.name,
        "email": lead.email,
        "phone": lead.phone,
        "source": lead.source,
        "status": lead.status,
        "property_type": lead.property_type,
        "configuration": lead.configuration,
        "budget_min": lead.budget_min,
        "budget_max": lead.budget_max,
        "preferred_location": lead.preferred_location,
        "location_geo": lead.location_geo or {},
        "assigned_to_id": lead.assigned_to_id,
        "assigned_to_name": assigned.username if assigned else None,
        "created_by_id": lead.created_by_id,
        "created_at": lead.created_at,
        "updated_at": lead.updated_at,
    }


def note_to_dict(note) -> dict:
    author = getattr(note, "author", None)
    return {
        "id": note.id,
        "lead_id": note.lead_id,
        "author_id": note.author_id,
        "author_name": author.username if author else None,
        "body": note.body,
        "created_at": note.created_at,
    }
