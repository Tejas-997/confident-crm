"""External API integration (Task 2) — location geocoding.

For a real-estate CRM, the useful enrichment is *where* the lead wants to buy.
We geocode the lead's preferred location via OpenStreetMap's Nominatim API
(keyless) and store lat/lon + a normalized display name, which the frontend
renders on an interactive map.

Best-effort: a timeout, no-match, or rate-limit NEVER blocks lead creation —
the lead just saves without coordinates. Pluggable: swap `geocode_location`
for Google/Mapbox geocoding (with a key) without touching the routes.
"""
import httpx

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
# Nominatim's usage policy requires a descriptive User-Agent.
HEADERS = {"User-Agent": "confident-lead-crm/1.0 (demo)"}


async def geocode_location(location: str = "") -> dict:
    location = (location or "").strip()
    if not location:
        return {}
    params = {"q": location, "format": "json", "limit": 1, "addressdetails": 0}
    try:
        async with httpx.AsyncClient(timeout=5.0, headers=HEADERS) as client:
            resp = await client.get(NOMINATIM_URL, params=params)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:  # network, timeout, rate-limit — never fatal
        return {"geocoded": False, "query": location, "error": str(exc)[:200]}
    if not data:
        return {"geocoded": False, "query": location, "reason": "no match"}
    top = data[0]
    return {
        "geocoded": True,
        "query": location,
        "lat": float(top["lat"]),
        "lon": float(top["lon"]),
        "display_name": top.get("display_name"),
    }
