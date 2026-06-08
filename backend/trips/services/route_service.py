"""
Route calculation service with OSRM integration and mock fallback.
"""

import math
from dataclasses import dataclass
from typing import Any

import requests
from django.conf import settings

# Known coordinates for demo / fallback geocoding
CITY_COORDINATES: dict[str, tuple[float, float]] = {
    "chicago, il": (41.8781, -87.6298),
    "indianapolis, in": (39.7684, -86.1581),
    "atlanta, ga": (33.7490, -84.3880),
    "new york, ny": (40.7128, -74.0060),
    "los angeles, ca": (34.0522, -118.2437),
    "dallas, tx": (32.7767, -96.7970),
    "denver, co": (39.7392, -104.9903),
    "memphis, tn": (35.1495, -90.0490),
    "nashville, tn": (36.1627, -86.7816),
    "st. louis, mo": (38.6270, -90.1994),
    "kansas city, mo": (39.0997, -94.5786),
    "phoenix, az": (33.4484, -112.0740),
    "houston, tx": (29.7604, -95.3698),
    "miami, fl": (25.7617, -80.1918),
    "seattle, wa": (47.6062, -122.3321),
    "portland, or": (45.5152, -122.6784),
    "columbus, oh": (39.9612, -82.9988),
    "detroit, mi": (42.3314, -83.0458),
    "philadelphia, pa": (39.9526, -75.1652),
    "boston, ma": (42.3601, -71.0589),
}

AVG_TRUCK_SPEED_MPH = 55
ROAD_FACTOR = 1.25  # straight-line to road distance multiplier


@dataclass
class GeoPoint:
    name: str
    lat: float
    lng: float


@dataclass
class RouteLeg:
    from_location: str
    to_location: str
    distance_miles: float
    duration_hours: float
    geometry: list[list[float]]


@dataclass
class RouteResult:
    total_miles: float
    total_drive_hours: float
    geometry: list[list[float]]
    legs: list[RouteLeg]
    waypoints: list[GeoPoint]


def _normalize_location(name: str) -> str:
    return name.strip().lower()


def geocode(location: str) -> GeoPoint:
    """Resolve a location string to lat/lng coordinates."""
    normalized = _normalize_location(location)

    if normalized in CITY_COORDINATES:
        lat, lng = CITY_COORDINATES[normalized]
        return GeoPoint(name=location, lat=lat, lng=lng)

    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": location, "format": "json", "limit": 1},
            headers={"User-Agent": "SpotterTripPlanner/1.0"},
            timeout=10,
        )
        response.raise_for_status()
        results = response.json()
        if results:
            return GeoPoint(
                name=location,
                lat=float(results[0]["lat"]),
                lng=float(results[0]["lon"]),
            )
    except requests.RequestException:
        pass

    # Hash-based pseudo-coordinates for unknown locations (deterministic fallback)
    seed = sum(ord(c) for c in normalized)
    lat = 30.0 + (seed % 1500) / 100.0
    lng = -100.0 - (seed % 5000) / 100.0
    return GeoPoint(name=location, lat=lat, lng=lng)


def _haversine_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 3958.8
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _interpolate_geometry(
    start: GeoPoint, end: GeoPoint, num_points: int = 20
) -> list[list[float]]:
    points = []
    for i in range(num_points + 1):
        t = i / num_points
        lat = start.lat + (end.lat - start.lat) * t
        lng = start.lng + (end.lng - start.lng) * t
        points.append([lat, lng])
    return points


def _fetch_osrm_route(points: list[GeoPoint]) -> dict[str, Any] | None:
    if settings.USE_MOCK_ROUTING:
        return None

    coords = ";".join(f"{p.lng},{p.lat}" for p in points)
    url = f"{settings.OSRM_BASE_URL}/route/v1/driving/{coords}"
    params = {"overview": "full", "geometries": "geojson", "steps": "false"}

    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        if data.get("code") == "Ok" and data.get("routes"):
            return data
    except requests.RequestException:
        pass
    return None


def _mock_leg(from_point: GeoPoint, to_point: GeoPoint) -> RouteLeg:
    straight = _haversine_miles(from_point.lat, from_point.lng, to_point.lat, to_point.lng)
    miles = round(straight * ROAD_FACTOR, 1)
    hours = round(miles / AVG_TRUCK_SPEED_MPH, 2)
    geometry = _interpolate_geometry(from_point, to_point)
    return RouteLeg(
        from_location=from_point.name,
        to_location=to_point.name,
        distance_miles=miles,
        duration_hours=hours,
        geometry=geometry,
    )


def calculate_route(
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
) -> RouteResult:
    """
    Calculate full trip route: current -> pickup -> dropoff.
    Uses OSRM when available, otherwise estimates from coordinates.
    """
    current = geocode(current_location)
    pickup = geocode(pickup_location)
    dropoff = geocode(dropoff_location)
    waypoints = [current, pickup, dropoff]

    osrm_data = _fetch_osrm_route(waypoints)

    legs: list[RouteLeg] = []
    all_geometry: list[list[float]] = []

    if osrm_data:
        route = osrm_data["routes"][0]
        osrm_legs = route.get("legs", [])
        coords = route["geometry"]["coordinates"]
        all_geometry = [[c[1], c[0]] for c in coords]

        leg_pairs = [
            (current, pickup),
            (pickup, dropoff),
        ]
        for i, (from_pt, to_pt) in enumerate(leg_pairs):
            if i < len(osrm_legs):
                leg_data = osrm_legs[i]
                miles = round(leg_data["distance"] / 1609.34, 1)
                hours = round(leg_data["duration"] / 3600, 2)
            else:
                miles = round(_haversine_miles(from_pt.lat, from_pt.lng, to_pt.lat, to_pt.lng) * ROAD_FACTOR, 1)
                hours = round(miles / AVG_TRUCK_SPEED_MPH, 2)
            legs.append(
                RouteLeg(
                    from_location=from_pt.name,
                    to_location=to_pt.name,
                    distance_miles=miles,
                    duration_hours=hours,
                    geometry=_interpolate_geometry(from_pt, to_pt),
                )
            )
    else:
        leg_pairs = [(current, pickup), (pickup, dropoff)]
        for from_pt, to_pt in leg_pairs:
            leg = _mock_leg(from_pt, to_pt)
            legs.append(leg)
            if all_geometry and leg.geometry:
                all_geometry.extend(leg.geometry[1:])
            else:
                all_geometry.extend(leg.geometry)

    total_miles = round(sum(leg.distance_miles for leg in legs), 1)
    total_drive_hours = round(sum(leg.duration_hours for leg in legs), 2)

    return RouteResult(
        total_miles=total_miles,
        total_drive_hours=total_drive_hours,
        geometry=all_geometry,
        legs=legs,
        waypoints=waypoints,
    )


def leg_to_dict(leg: RouteLeg) -> dict:
    return {
        "from": leg.from_location,
        "to": leg.to_location,
        "distance_miles": leg.distance_miles,
        "duration_hours": leg.duration_hours,
    }
