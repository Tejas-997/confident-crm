from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Lead, Note, Profile

User = get_user_model()


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    extra = 0


# Show role inline on the user admin so managers can be created here.
class UserAdmin(BaseUserAdmin):
    inlines = [ProfileInline]
    list_display = ("username", "email", "get_role", "is_staff")

    @admin.display(description="Role")
    def get_role(self, obj):
        return getattr(getattr(obj, "profile", None), "role", "—")


admin.site.unregister(User)
admin.site.register(User, UserAdmin)


class NoteInline(admin.TabularInline):
    model = Note
    extra = 0
    readonly_fields = ("author", "created_at")


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("name", "property_type", "configuration", "preferred_location",
                    "status", "assigned_to", "created_at")
    list_filter = ("status", "property_type", "source", "assigned_to")
    search_fields = ("name", "email", "phone", "preferred_location")
    list_editable = ("status",)
    autocomplete_fields = ("assigned_to",)
    readonly_fields = ("location_geo", "created_by", "created_at", "updated_at")
    inlines = [NoteInline]


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "phone")
    list_filter = ("role",)
