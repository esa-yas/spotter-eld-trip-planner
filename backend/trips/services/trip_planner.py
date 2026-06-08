"""Orchestrates route calculation, HOS planning, and log generation."""

from .hos_service import events_to_stops, plan_trip
from .log_generator import generate_daily_logs, validate_daily_logs
from .route_service import calculate_route, leg_to_dict


def plan_full_trip(
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
    current_cycle_used: float,
) -> dict:
    route = calculate_route(current_location, pickup_location, dropoff_location)
    trip_plan = plan_trip(route, current_cycle_used)
    daily_logs = generate_daily_logs(trip_plan.events)
    log_warnings = validate_daily_logs(daily_logs)
    stops = events_to_stops(trip_plan.events)

    on_duty_total = sum(
        e.duration_hours
        for e in trip_plan.events
        if e.duty_status in ("driving", "on_duty_not_driving")
    )

    return {
        "summary": {
            "total_miles": route.total_miles,
            "estimated_drive_hours": route.total_drive_hours,
            "total_trip_hours": trip_plan.total_trip_hours,
            "number_of_days": len(daily_logs),
            "remaining_cycle_hours": trip_plan.remaining_cycle_hours,
            "on_duty_hours": round(on_duty_total, 2),
        },
        "route": {
            "geometry": route.geometry,
            "legs": [leg_to_dict(leg) for leg in route.legs],
        },
        "stops": stops,
        "daily_logs": daily_logs,
        "warnings": trip_plan.warnings + log_warnings,
    }
