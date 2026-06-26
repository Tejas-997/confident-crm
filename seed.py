"""Seed users (with roles) and real-estate leads. Run: python seed.py

On a machine with internet, leads are geocoded so maps populate.
"""
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
import django

django.setup()

import asyncio
from django.contrib.auth import get_user_model
from leads.models import Lead, LeadStatus, Note, Profile, PropertyType, Role
from api.enrichment import geocode_location

User = get_user_model()


def make_user(username, password, role, email, is_superuser=False):
    u, _ = User.objects.get_or_create(username=username, defaults={"email": email})
    u.email = email
    u.is_staff = True  # so all roles can reach Django admin if needed
    u.is_superuser = is_superuser
    u.set_password(password)
    u.save()
    prof, _ = Profile.objects.get_or_create(user=u)
    prof.role = role
    prof.save()
    return u


admin = make_user("admin", "admin12345", Role.ADMIN, "admin@confident.example", is_superuser=True)
manager = make_user("rohit.manager", "manager123", Role.MANAGER, "rohit@confident.example")
aisha = make_user("aisha.agent", "agent123", Role.AGENT, "aisha@confident.example")
karan = make_user("karan.agent", "agent123", Role.AGENT, "karan@confident.example")
print("Users:")
print("  admin / admin12345           (Admin)")
print("  rohit.manager / manager123   (Sales Manager)")
print("  aisha.agent / agent123       (Sales Agent)")
print("  karan.agent / agent123       (Sales Agent)")

P = PropertyType
S = LeadStatus
SAMPLE = [
    # name, phone, prop, config, bmin, bmax, location, status, agent
    ("Suresh Kumar",   "+91 9845011111", P.APARTMENT, "3 BHK", 120, 150, "Whitefield, Bangalore",       S.SITE_VISIT,  aisha),
    ("Lakshmi Menon",  "+91 9845022222", P.VILLA,     "4 BHK", 250, 350, "Sarjapur Road, Bangalore",    S.NEGOTIATION, aisha),
    ("Imran Sheikh",   "+91 9845033333", P.APARTMENT, "2 BHK",  75,  95, "Electronic City, Bangalore",  S.CONTACTED,   karan),
    ("Deepa Rao",      "+91 9845044444", P.PLOT,      "—",     180, 220, "Kanakapura Road, Bangalore",  S.NEW,         karan),
    ("Vijay Anand",    "+91 9845055555", P.APARTMENT, "3 BHK", 110, 140, "Hebbal, Bangalore",           S.BOOKED,      aisha),
    ("Fatima Noor",    "+91 9845066666", P.VILLA,     "5 BHK", 400, 600, "Yelahanka, Bangalore",        S.SITE_VISIT,  karan),
    ("Arvind Nair",    "+91 9845077777", P.COMMERCIAL,"Office",500, 800, "MG Road, Bangalore",          S.NEGOTIATION, manager),
    ("Priya Shetty",   "+91 9845088888", P.APARTMENT, "2 BHK",  65,  80, "Marathahalli, Bangalore",     S.NEW,         None),
    ("Rahul Bose",     "+91 9845099999", P.APARTMENT, "3 BHK", 130, 160, "JP Nagar, Bangalore",         S.LOST,        aisha),
    ("Anjali Verma",   "+91 9845000000", P.VILLA,     "4 BHK", 300, 380, "Devanahalli, Bangalore",      S.CONTACTED,   karan),
]


async def geocode_all(items):
    return await asyncio.gather(*(geocode_location(loc) for *_, loc, _s, _a in items))


geos = asyncio.run(geocode_all(SAMPLE))
created = 0
for (name, phone, prop, config, bmin, bmax, loc, status, agent), geo in zip(SAMPLE, geos):
    lead, was_new = Lead.objects.get_or_create(
        name=name,
        defaults=dict(
            phone=phone, property_type=prop, configuration=config,
            budget_min=bmin, budget_max=bmax, preferred_location=loc,
            location_geo=geo, status=status, assigned_to=agent, created_by=manager,
        ),
    )
    if was_new:
        created += 1
        Note.objects.create(lead=lead, author=agent or manager,
                            body=f"Enquiry for {config} {prop} in {loc.split(',')[0]}.")

geocoded = sum(1 for g in geos if g.get("geocoded"))
print(f"\nSeeded {created} new leads (total {Lead.objects.count()}); {geocoded} geocoded.")
