"""
FMCSA Hours of Service trip planning engine.
Property-carrying driver, 70-hour / 8-day cycle, no adverse conditions.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Literal

from .route_service import RouteLeg, RouteResult

StopType = Literal[
    "pickup", "dropoff", "fuel", "rest", "break", "pretrip", "posttrip", "drive"
]
DutyStatus = Literal["off_duty", "sleeper_berth", "driving", "on_duty_not_driving"]

MAX_DRIVING_HOURS = 11.0
MAX_DUTY_WINDOW_HOURS = 14.0
MIN_OFF_DUTY_RESET = 10.0
BREAK_AFTER_DRIVING_HOURS = 8.0
BREAK_DURATION_HOURS = 0.5
FUEL_INTERVAL_MILES = 1000
FUEL_DURATION_HOURS = 0.5
PICKUP_DURATION_HOURS = 1.0
DROPOFF_DURATION_HOURS = 1.0
PRETRIP_DURATION_HOURS = 0.25
POSTTRIP_DURATION_HOURS = 0.25
CYCLE_LIMIT_HOURS = 70.0
AVG_SPEED_MPH = 55.0

# Map internal event types to API stop types
STOP_TYPE_MAP: dict[str, str] = {
    "pretrip": "pretrip",
    "posttrip": "posttrip",
    "pickup": "pickup",
    "dropoff": "dropoff",
    "fuel": "fuel",
    "break": "break",
    "rest": "rest",
    "drive": "rest",  # driving shown via duty_status in timeline
}


@dataclass
class TripEvent:
    event_type: StopType
    location: str
    start_time: datetime
    duration_hours: float
    duty_status: DutyStatus
    miles: float = 0.0
    remarks: str = ""

    @property
    def end_time(self) -> datetime:
        return self.start_time + timedelta(hours=self.duration_hours)


@dataclass
class TripPlan:
    events: list[TripEvent] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    total_trip_hours: float = 0.0
    number_of_days: int = 0
    remaining_cycle_hours: float = 0.0


@dataclass
class ShiftState:
    driving_hours: float = 0.0
    duty_window_hours: float = 0.0
    driving_since_break: float = 0.0
    off_duty_consecutive: float = 10.0
    active: bool = True
    miles_since_fuel: float = 0.0


def _fmt_time(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d %H:%M")


def _add_event(
    events: list[TripEvent],
    event_type: StopType,
    location: str,
    start: datetime,
    duration: float,
    duty_status: DutyStatus,
    miles: float = 0.0,
    remarks: str = "",
) -> datetime:
    if duration <= 0:
        return start
    events.append(
        TripEvent(
            event_type=event_type,
            location=location,
            start_time=start,
            duration_hours=round(duration, 4),
            duty_status=duty_status,
            miles=round(miles, 1),
            remarks=remarks,
        )
    )
    return start + timedelta(hours=duration)


def _add_rest(
    events: list[TripEvent],
    location: str,
    start: datetime,
    hours: float,
    remarks: str,
) -> tuple[datetime, ShiftState]:
    end = _add_event(events, "rest", location, start, hours, "sleeper_berth", remarks=remarks)
    return end, ShiftState(off_duty_consecutive=hours)


def plan_trip(
    route: RouteResult,
    current_cycle_used: float,
    trip_start: datetime | None = None,
) -> TripPlan:
    warnings: list[str] = []
    events: list[TripEvent] = []
    cycle_used = current_cycle_used

    if current_cycle_used < 0 or current_cycle_used > CYCLE_LIMIT_HOURS:
        warnings.append(
            f"Current cycle used ({current_cycle_used}h) is invalid. Must be between 0 and {CYCLE_LIMIT_HOURS}."
        )
        current_cycle_used = max(0, min(current_cycle_used, CYCLE_LIMIT_HOURS))
        cycle_used = current_cycle_used

    clock = trip_start or datetime(2025, 6, 1, 6, 0, 0)
    shift = ShiftState()

    clock = _add_event(
        events,
        "pretrip",
        route.waypoints[0].name,
        clock,
        PRETRIP_DURATION_HOURS,
        "on_duty_not_driving",
        remarks="Pre-trip inspection",
    )
    cycle_used += PRETRIP_DURATION_HOURS
    shift.duty_window_hours += PRETRIP_DURATION_HOURS

    for leg_index, leg in enumerate(route.legs):
        clock, cycle_used, shift = _simulate_driving_leg(
            events, leg, clock, cycle_used, shift, warnings
        )

        if leg_index == 0:
            clock = _add_event(
                events,
                "pickup",
                leg.to_location,
                clock,
                PICKUP_DURATION_HOURS,
                "on_duty_not_driving",
                remarks="Loading at pickup",
            )
            cycle_used += PICKUP_DURATION_HOURS
            shift.duty_window_hours += PICKUP_DURATION_HOURS

        if leg_index == 1:
            clock = _add_event(
                events,
                "dropoff",
                leg.to_location,
                clock,
                DROPOFF_DURATION_HOURS,
                "on_duty_not_driving",
                remarks="Unloading at drop-off",
            )
            cycle_used += DROPOFF_DURATION_HOURS
            shift.duty_window_hours += DROPOFF_DURATION_HOURS

            clock = _add_event(
                events,
                "posttrip",
                leg.to_location,
                clock,
                POSTTRIP_DURATION_HOURS,
                "on_duty_not_driving",
                remarks="Post-trip inspection",
            )
            cycle_used += POSTTRIP_DURATION_HOURS

    remaining_cycle = round(CYCLE_LIMIT_HOURS - cycle_used, 2)
    if cycle_used > CYCLE_LIMIT_HOURS:
        warnings.append(
            f"Trip requires {round(cycle_used, 1)}h on-duty time but only "
            f"{CYCLE_LIMIT_HOURS - current_cycle_used:.1f}h remain in the 70-hour/8-day cycle. "
            "A 34-hour restart may be required."
        )

    trip_start_time = events[0].start_time if events else clock
    trip_end_time = events[-1].end_time if events else clock
    total_hours = (trip_end_time - trip_start_time).total_seconds() / 3600
    number_of_days = max(1, int(total_hours // 24) + (1 if total_hours % 24 > 0 else 0))

    return TripPlan(
        events=events,
        warnings=warnings,
        total_trip_hours=round(total_hours, 2),
        number_of_days=number_of_days,
        remaining_cycle_hours=max(0, remaining_cycle),
    )


def _simulate_driving_leg(
    events: list[TripEvent],
    leg: RouteLeg,
    clock: datetime,
    cycle_used: float,
    shift: ShiftState,
    warnings: list[str],
) -> tuple[datetime, float, ShiftState]:
    miles_remaining = leg.distance_miles
    location = leg.from_location

    while miles_remaining > 0.01:
        shift_exhausted = (
            shift.driving_hours >= MAX_DRIVING_HOURS
            or shift.duty_window_hours >= MAX_DUTY_WINDOW_HOURS
        )

        if shift_exhausted:
            if shift.off_duty_consecutive < MIN_OFF_DUTY_RESET:
                rest_needed = MIN_OFF_DUTY_RESET - shift.off_duty_consecutive
                clock, shift = _add_rest(
                    events,
                    location,
                    clock,
                    rest_needed,
                    f"10-hour off-duty reset ({rest_needed:.1f}h)",
                )
            else:
                clock, shift = _add_rest(
                    events, location, clock, MIN_OFF_DUTY_RESET, "Mandatory 10-hour rest period"
                )
            continue

        if shift.driving_since_break >= BREAK_AFTER_DRIVING_HOURS:
            clock = _add_event(
                events,
                "break",
                location,
                clock,
                BREAK_DURATION_HOURS,
                "on_duty_not_driving",
                remarks="30-minute break after 8 hours driving",
            )
            cycle_used += BREAK_DURATION_HOURS
            shift.duty_window_hours += BREAK_DURATION_HOURS
            shift.driving_since_break = 0.0
            shift.off_duty_consecutive = 0.0
            continue

        if shift.miles_since_fuel >= FUEL_INTERVAL_MILES:
            clock = _add_event(
                events,
                "fuel",
                location,
                clock,
                FUEL_DURATION_HOURS,
                "on_duty_not_driving",
                remarks="Fueling stop (every 1,000 miles)",
            )
            cycle_used += FUEL_DURATION_HOURS
            shift.duty_window_hours += FUEL_DURATION_HOURS
            shift.off_duty_consecutive = 0.0
            shift.miles_since_fuel = 0.0
            continue

        max_drive_by_limit = MAX_DRIVING_HOURS - shift.driving_hours
        max_drive_by_window = MAX_DUTY_WINDOW_HOURS - shift.duty_window_hours
        max_drive_by_break = BREAK_AFTER_DRIVING_HOURS - shift.driving_since_break
        max_drive_hours = max(0.01, min(max_drive_by_limit, max_drive_by_window, max_drive_by_break))

        drive_miles = min(miles_remaining, max_drive_hours * AVG_SPEED_MPH)
        drive_hours = drive_miles / AVG_SPEED_MPH

        if drive_hours < 0.01:
            clock, shift = _add_rest(events, location, clock, MIN_OFF_DUTY_RESET, "Mandatory rest period")
            continue

        clock = _add_event(
            events,
            "drive",
            f"{location} → {leg.to_location}",
            clock,
            drive_hours,
            "driving",
            miles=drive_miles,
            remarks=f"Driving toward {leg.to_location}",
        )
        cycle_used += drive_hours
        shift.driving_hours += drive_hours
        shift.duty_window_hours += drive_hours
        shift.driving_since_break += drive_hours
        shift.off_duty_consecutive = 0.0
        shift.miles_since_fuel += drive_miles
        miles_remaining -= drive_miles

    return clock, cycle_used, shift


def events_to_stops(events: list[TripEvent]) -> list[dict]:
    """Build timeline stops, merging consecutive drive segments."""
    stops: list[dict] = []
    drive_accum: TripEvent | None = None

    def flush_drive():
        nonlocal drive_accum
        if drive_accum:
            stops.append(
                {
                    "type": "rest",
                    "location": drive_accum.location,
                    "time": _fmt_time(drive_accum.start_time),
                    "duration_hours": round(drive_accum.duration_hours, 2),
                    "duty_status": "driving",
                    "label": f"Driving ({round(drive_accum.miles, 0)} mi)",
                }
            )
            drive_accum = None

    for event in events:
        if event.event_type == "drive":
            if drive_accum is None:
                drive_accum = TripEvent(
                    event_type="drive",
                    location=event.location,
                    start_time=event.start_time,
                    duration_hours=event.duration_hours,
                    duty_status="driving",
                    miles=event.miles,
                )
            else:
                drive_accum.duration_hours += event.duration_hours
                drive_accum.miles += event.miles
        else:
            flush_drive()
            stops.append(
                {
                    "type": STOP_TYPE_MAP.get(event.event_type, event.event_type),
                    "location": event.location,
                    "time": _fmt_time(event.start_time),
                    "duration_hours": round(event.duration_hours, 2),
                    "duty_status": event.duty_status,
                    "label": event.remarks or event.event_type.replace("_", " ").title(),
                }
            )

    flush_drive()
    return stops
