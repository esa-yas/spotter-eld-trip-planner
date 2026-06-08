"""
Generate FMCSA-style daily log sheets from trip events.
Each log covers one calendar day from 00:00 to 24:00 (midnight to midnight).
Segments crossing midnight are split at the day boundary.
"""

from datetime import datetime, timedelta

from .hos_service import MAX_DRIVING_HOURS, TripEvent

STATUS_KEYS = ("off_duty", "sleeper_berth", "driving", "on_duty_not_driving")


def _hours_between(start: datetime, end: datetime) -> float:
    return (end - start).total_seconds() / 3600


def _calendar_midnight(dt: datetime) -> datetime:
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)


def _merge_adjacent(entries: list[dict]) -> list[dict]:
    if not entries:
        return []
    merged = [entries[0].copy()]
    for entry in entries[1:]:
        last = merged[-1]
        if entry["status"] == last["status"] and entry["start"] == last["end"]:
            last["end"] = entry["end"]
            last["remarks"] = last["remarks"] or entry["remarks"]
        else:
            merged.append(entry.copy())
    return merged


def _fill_gaps(entries: list[dict], default_location: str) -> list[dict]:
    """Ensure continuous 00:00–24:00 coverage; pre-trip idle time is off duty."""
    filled: list[dict] = []
    sorted_entries = sorted(entries, key=lambda e: _hhmm_to_minutes(e["start"]))
    cursor_minutes = 0

    for entry in sorted_entries:
        start_min = _hhmm_to_minutes(entry["start"])
        end_min = _hhmm_to_minutes(entry["end"])

        if start_min > cursor_minutes:
            filled.append(
                {
                    "start": _minutes_to_hhmm(cursor_minutes),
                    "end": _minutes_to_hhmm(start_min),
                    "status": "off_duty",
                    "location": default_location,
                    "remarks": "",
                }
            )
        filled.append(entry)
        cursor_minutes = max(cursor_minutes, end_min)

    if cursor_minutes < 24 * 60:
        filled.append(
            {
                "start": _minutes_to_hhmm(cursor_minutes),
                "end": "24:00",
                "status": "off_duty",
                "location": default_location,
                "remarks": "",
            }
        )

    return _merge_adjacent(filled)


def _hhmm_to_minutes(hhmm: str) -> int:
    if hhmm == "24:00":
        return 24 * 60
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def _minutes_to_hhmm(minutes: int) -> str:
    if minutes >= 24 * 60:
        return "24:00"
    h, m = divmod(minutes, 60)
    return f"{h:02d}:{m:02d}"


def _event_to_day_entries(event: TripEvent, day_start: datetime, day_end: datetime) -> list[dict]:
    """Clip an event to a single calendar day; returns empty if no overlap."""
    if event.end_time <= day_start or event.start_time >= day_end:
        return []

    effective_start = max(event.start_time, day_start)
    effective_end = min(event.end_time, day_end)

    if effective_end <= effective_start:
        return []

    start_minutes = round(_hours_between(day_start, effective_start) * 60)
    end_minutes = round(_hours_between(day_start, effective_end) * 60)

    return [
        {
            "start": _minutes_to_hhmm(start_minutes),
            "end": _minutes_to_hhmm(end_minutes),
            "status": event.duty_status,
            "location": event.location,
            "remarks": event.remarks,
        }
    ]


def _compute_totals(entries: list[dict]) -> dict[str, float]:
    totals = {key: 0.0 for key in STATUS_KEYS}
    for entry in entries:
        duration = (_hhmm_to_minutes(entry["end"]) - _hhmm_to_minutes(entry["start"])) / 60
        totals[entry["status"]] = round(totals[entry["status"]] + duration, 2)

    total = sum(totals.values())
    if abs(total - 24.0) > 0.01 and entries:
        diff = round(24.0 - total, 2)
        last_status = entries[-1]["status"]
        totals[last_status] = round(totals[last_status] + diff, 2)

    return totals


def validate_daily_logs(daily_logs: list[dict]) -> list[str]:
    """Warn when any calendar day exceeds the 11-hour driving limit."""
    warnings: list[str] = []
    for log in daily_logs:
        driving = log["totals"].get("driving", 0)
        if driving > MAX_DRIVING_HOURS + 0.05:
            warnings.append(
                f"{log['date_label']} ({log['date']}): {driving}h driving exceeds the "
                f"11-hour daily limit."
            )
        total = sum(log["totals"].values())
        if abs(total - 24.0) > 0.1:
            warnings.append(
                f"{log['date_label']} ({log['date']}): duty totals sum to {total}h, not 24h."
            )
    return warnings


def generate_daily_logs(events: list[TripEvent]) -> list[dict]:
    if not events:
        return []

    trip_start = events[0].start_time
    trip_end = events[-1].end_time
    first_calendar_day = _calendar_midnight(trip_start)
    last_calendar_day = _calendar_midnight(trip_end)
    num_days = (last_calendar_day - first_calendar_day).days + 1

    daily_logs = []
    default_location = events[0].location

    for day_index in range(num_days):
        day_start = first_calendar_day + timedelta(days=day_index)
        day_end = day_start + timedelta(days=1)

        day_entries: list[dict] = []
        day_miles = 0.0

        for event in events:
            if event.end_time <= day_start or event.start_time >= day_end:
                continue

            day_entries.extend(_event_to_day_entries(event, day_start, day_end))

            if event.duty_status == "driving" and event.duration_hours > 0:
                overlap_start = max(event.start_time, day_start)
                overlap_end = min(event.end_time, day_end)
                overlap_hours = _hours_between(overlap_start, overlap_end)
                day_miles += event.miles * (overlap_hours / event.duration_hours)

        day_entries = _merge_adjacent(day_entries)
        day_entries = _fill_gaps(day_entries, default_location)
        totals = _compute_totals(day_entries)
        remarks_list = list(dict.fromkeys(e["remarks"] for e in day_entries if e.get("remarks")))

        daily_logs.append(
            {
                "date_label": f"Day {day_index + 1}",
                "date": day_start.strftime("%Y-%m-%d"),
                "total_miles": round(day_miles, 1),
                "entries": day_entries,
                "remarks": remarks_list,
                "totals": totals,
            }
        )

    return daily_logs
