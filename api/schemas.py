from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    username: str
    email: str = ""
    role: str = "agent"


class LeadIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    phone: str = ""
    source: str = ""
    status: str = "new"
    property_type: str = ""
    configuration: str = ""
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    preferred_location: str = ""
    assigned_to: Optional[int] = None


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    property_type: Optional[str] = None
    configuration: Optional[str] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    preferred_location: Optional[str] = None


class LeadOut(BaseModel):
    id: int
    name: str
    email: str = ""
    phone: str = ""
    source: str = ""
    status: str
    property_type: str = ""
    configuration: str = ""
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    preferred_location: str = ""
    location_geo: dict = {}
    assigned_to_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class LeadPage(BaseModel):
    count: int
    page: int
    page_size: int
    results: list[LeadOut]


class NoteIn(BaseModel):
    body: str = Field(min_length=1)


class NoteOut(BaseModel):
    id: int
    lead_id: int
    author_id: Optional[int] = None
    author_name: Optional[str] = None
    body: str
    created_at: datetime


class StatusUpdate(BaseModel):
    status: str


class AssignUpdate(BaseModel):
    assigned_to: Optional[int] = None


class DashboardOut(BaseModel):
    total_leads: int
    by_status: dict
    booked_rate: float
    created_last_7_days: int
    recent: list[LeadOut]
    scope: str  # "all" for managers, "mine" for agents
