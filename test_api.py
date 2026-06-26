"""End-to-end smoke test (run after seed.py). python test_api.py"""
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
from fastapi.testclient import TestClient
from api.main import app

c = TestClient(app)


def login(u, p):
    r = c.post("/api/auth/login", data={"username": u, "password": p})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


mgr = login("rohit.manager", "manager123")
agent = login("aisha.agent", "agent123")

# RBAC: manager sees all, agent sees only theirs
all_count = c.get("/api/leads", headers=mgr).json()["count"]
mine = c.get("/api/leads", headers=agent).json()["count"]
assert mine < all_count, "agent should see fewer leads than manager"
print(f"RBAC: manager {all_count} leads, agent {mine} -> OK")

# agent cannot delete
some = c.get("/api/leads", headers=agent).json()["results"][0]["id"]
assert c.delete(f"/api/leads/{some}", headers=agent).status_code == 403
print("agent delete blocked (403) -> OK")

# create real-estate lead
r = c.post("/api/leads", headers=mgr, json={
    "name": "Smoke Test", "property_type": "apartment", "configuration": "2 BHK",
    "budget_min": 70, "budget_max": 90, "preferred_location": "Indiranagar, Bangalore"})
assert r.status_code == 201 and r.json()["property_type"] == "apartment"
lid = r.json()["id"]
print("create real-estate lead -> OK")

# status + notes
assert c.patch(f"/api/leads/{lid}/status", headers=mgr, json={"status": "site_visit"}).json()["status"] == "site_visit"
assert c.post(f"/api/leads/{lid}/notes", headers=mgr, json={"body": "Site visit booked."}).status_code == 201
print("status change + note -> OK")

# users endpoint
assert c.get("/api/users", headers=mgr).status_code == 200
assert c.get("/api/users", headers=agent).status_code == 403
print("users endpoint (manager-only) -> OK")

c.delete(f"/api/leads/{lid}", headers=mgr)
print("\nALL CHECKS PASSED.")
