from django.conf import settings
from django.db import models


# --- Roles (RBAC) -----------------------------------------------------------
class Role(models.TextChoices):
    ADMIN = "admin", "Admin"
    MANAGER = "manager", "Sales Manager"
    AGENT = "agent", "Sales Agent"


class Profile(models.Model):
    """One per user; carries their role and contact number."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.AGENT)
    phone = models.CharField(max_length=40, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


# --- Real-estate lead -------------------------------------------------------
class LeadStatus(models.TextChoices):
    NEW = "new", "New"
    CONTACTED = "contacted", "Contacted"
    SITE_VISIT = "site_visit", "Site visit"
    NEGOTIATION = "negotiation", "Negotiation"
    BOOKED = "booked", "Booked"
    LOST = "lost", "Lost"


class PropertyType(models.TextChoices):
    APARTMENT = "apartment", "Apartment"
    VILLA = "villa", "Villa"
    PLOT = "plot", "Plot"
    COMMERCIAL = "commercial", "Commercial"
    OTHER = "other", "Other"


class Lead(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    source = models.CharField(max_length=100, blank=True)
    status = models.CharField(
        max_length=20, choices=LeadStatus.choices, default=LeadStatus.NEW
    )

    # Real-estate requirement
    property_type = models.CharField(
        max_length=20, choices=PropertyType.choices, blank=True
    )
    configuration = models.CharField(max_length=40, blank=True)  # e.g. "2 BHK"
    budget_min = models.PositiveIntegerField(null=True, blank=True)  # in INR lakhs
    budget_max = models.PositiveIntegerField(null=True, blank=True)  # in INR lakhs
    preferred_location = models.CharField(max_length=200, blank=True)
    # Geocoded preferred_location (lat/lon/display_name) from the external API
    location_geo = models.JSONField(default=dict, blank=True)

    # Ownership / assignment
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="assigned_leads",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="created_leads",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["-created_at"]),
            models.Index(fields=["assigned_to"]),
        ]

    def __str__(self):
        return self.name


class Note(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="notes")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Note on {self.lead_id}"
