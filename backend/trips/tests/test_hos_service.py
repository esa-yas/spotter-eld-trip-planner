from datetime import datetime

from django.test import SimpleTestCase

from trips.services.hos_service import (
    BREAK_AFTER_DRIVING_HOURS,
    MAX_DRIVING_HOURS,
    MIN_OFF_DUTY_RESET,
    plan_trip,
)
from trips.services.log_generator import generate_daily_logs
from trips.services.route_service import RouteLeg, RouteResult, GeoPoint


def _make_route(total_miles: float = 500) -> RouteResult:
    half = total_miles / 2
    hours = total_miles / 55
    leg_hours = half / 55
    return RouteResult(
        total_miles=total_miles,
        total_drive_hours=round(hours, 2),
        geometry=[[41.88, -87.63], [39.77, -86.16], [33.75, -84.39]],
        legs=[
            RouteLeg("Chicago, IL", "Indianapolis, IN", half, leg_hours, [[41.88, -87.63]]),
            RouteLeg("Indianapolis, IN", "Atlanta, GA", half, leg_hours, [[39.77, -86.16]]),
        ],
        waypoints=[
            GeoPoint("Chicago, IL", 41.8781, -87.6298),
            GeoPoint("Indianapolis, IN", 39.7684, -86.1581),
            GeoPoint("Atlanta, GA", 33.7490, -84.3880),
        ],
    )


class HOSTripPlanningTests(SimpleTestCase):
    def test_short_trip_generates_events(self):
        route = _make_route(200)
        plan = plan_trip(route, current_cycle_used=5)
        self.assertGreater(len(plan.events), 0)
        self.assertGreater(plan.total_trip_hours, 0)

    def test_long_trip_includes_rest_periods(self):
        route = _make_route(1500)
        plan = plan_trip(route, current_cycle_used=0)
        rest_events = [e for e in plan.events if e.event_type == "rest"]
        self.assertGreater(len(rest_events), 0)
        for rest in rest_events:
            self.assertGreaterEqual(rest.duration_hours, MIN_OFF_DUTY_RESET - 0.1)

    def test_daily_logs_total_24_hours(self):
        route = _make_route(800)
        plan = plan_trip(route, current_cycle_used=10)
        logs = generate_daily_logs(plan.events)
        self.assertGreater(len(logs), 0)
        for log in logs:
            total = sum(log["totals"].values())
            self.assertAlmostEqual(total, 24.0, places=1)

    def test_driving_never_exceeds_11_hours_per_shift(self):
        route = _make_route(1200)
        plan = plan_trip(route, current_cycle_used=0)
        shift_driving = 0.0
        for event in plan.events:
            if event.event_type == "rest" and event.duty_status == "sleeper_berth":
                if event.duration_hours >= MIN_OFF_DUTY_RESET - 0.1:
                    shift_driving = 0.0
            if event.duty_status == "driving":
                shift_driving += event.duration_hours
                self.assertLessEqual(shift_driving, MAX_DRIVING_HOURS + 0.1)

    def test_break_after_8_hours_driving(self):
        route = _make_route(600)
        plan = plan_trip(route, current_cycle_used=0)
        driving_since_break = 0.0
        saw_break = False
        for event in plan.events:
            if event.event_type == "break":
                saw_break = True
                driving_since_break = 0.0
            elif event.duty_status == "driving":
                driving_since_break += event.duration_hours
                if driving_since_break >= BREAK_AFTER_DRIVING_HOURS - 0.1:
                    # break should follow soon
                    pass
        # 600 miles ~ 10.9 hours driving — should trigger at least one break
        self.assertTrue(saw_break)

    def test_invalid_cycle_generates_warning(self):
        route = _make_route(100)
        plan = plan_trip(route, current_cycle_used=80)
        self.assertTrue(any("invalid" in w.lower() for w in plan.warnings))
