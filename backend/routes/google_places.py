"""
Google Places proxy — searches for nearby vets and suppliers.
Set the GOOGLE_PLACES_API_KEY environment variable to enable.
Returns an empty list when the key is absent so the rest of the app
continues working without any Google credentials.
"""

import os
from typing import Optional
import httpx
from fastapi import APIRouter, Query

router = APIRouter(prefix="/places", tags=["places"])

API_KEY   = os.getenv("GOOGLE_PLACES_API_KEY", "")
SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
DETAIL_URL = "https://maps.googleapis.com/maps/api/place/details/json"


def _maps_url(place_id: str, name: str) -> str:
    from urllib.parse import quote
    return (
        f"https://www.google.com/maps/search/?api=1"
        f"&query={quote(name)}&query_place_id={place_id}"
    )


def _format_result(r: dict) -> dict:
    geo = r.get("geometry", {}).get("location", {})
    return {
        "place_id":           r.get("place_id", ""),
        "name":               r.get("name", ""),
        "address":            r.get("formatted_address", r.get("vicinity", "")),
        "rating":             r.get("rating"),
        "user_ratings_total": r.get("user_ratings_total"),
        "lat":                geo.get("lat"),
        "lng":                geo.get("lng"),
        "open_now":           r.get("opening_hours", {}).get("open_now"),
        "maps_url":           _maps_url(r.get("place_id", ""), r.get("name", "")),
    }


async def _text_search(query: str, lat: Optional[float], lng: Optional[float]) -> list[dict]:
    if not API_KEY:
        return []

    params: dict = {"query": query, "key": API_KEY}
    if lat is not None and lng is not None:
        params["location"] = f"{lat},{lng}"
        params["radius"]   = "50000"

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(SEARCH_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        return []

    return [_format_result(r) for r in data.get("results", [])[:10]]


@router.get("/vets")
async def google_vets(
    country: Optional[str] = Query(None),
    state:   Optional[str] = Query(None),
    lat:     Optional[float] = Query(None),
    lng:     Optional[float] = Query(None),
):
    """Search Google Places for veterinary clinics near a farming location."""
    location_str = ", ".join(filter(None, [state, country])) or "Africa"
    query = f"veterinarian OR animal clinic OR livestock vet in {location_str}"
    try:
        return await _text_search(query, lat, lng)
    except Exception:
        return []


@router.get("/suppliers")
async def google_suppliers(
    country: Optional[str] = Query(None),
    state:   Optional[str] = Query(None),
    lat:     Optional[float] = Query(None),
    lng:     Optional[float] = Query(None),
):
    """Search Google Places for agrovet / veterinary supply stores near a farming location."""
    location_str = ", ".join(filter(None, [state, country])) or "Africa"
    query = f"agrovet OR veterinary supplies OR animal feed store in {location_str}"
    try:
        return await _text_search(query, lat, lng)
    except Exception:
        return []
