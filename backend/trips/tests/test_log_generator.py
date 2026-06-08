from datetime import datetime, timedelta

from django.test import SimpleTestCase

from trips.services.hos_service import TripEvent, plan_trip
from trips.services.log_generator import generate_daily_logs, validate_daily_logs
from trips.services.route_service import GeoPoint, RouteLeg, RouteResult
from trips.services.trip_planner import plan_full_trip


def _make_route(total_miles: float = 500) -> RouteResult:
    half = total_miles / 2
    leg_hours = half / 55
    return RouteResult(
        total_miles=total_miles,
        total_drive_hours=round(total_miles / 55, 2),
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


class LogGeneratorTests(SimpleTestCase):
    def test_midnight_split_rest_and_driving(self):
        """Rest spanning midnight splits; post-rest driving belongs to the new day."""
        base = datetime(2025, 6, 1, 18, 45, 0)
        events = [
            TripEvent("drive", "A", datetime(2025, 6, 1, 6, 0), 11.0, "driving", 600),
            TripEvent(
                "rest",
                "B",
                base,
                10.0,
                "sleeper_berth",
                remarks="10-hour off-duty reset",
            ),
            TripEvent(
                "drive",
                "C",
                base + timedelta(hours=10),
                1.5,
                "driving",
                80,
                remarks="Driving toward destination",
            ),
        ]

        logs = generate_daily_logs(events)
        self.assertEqual(len(logs), 2)

        day1 = logs[0]
        day2 = logs[1]

        day1_sleeper = [e for e in day1["entries"] if e["status"] == "sleeper_berth"]
        self.assertTrue(any(e["end"] == "24:00" for e in day1_sleeper))

        day2_sleeper = [e for e in day2["entries"] if e["status"] == "sleeper_berth"]
        self.assertTrue(any(e["start"] == "00:00" for e in day2_sleeper))

        day2_driving = [e for e in day2["entries"] if e["status"] == "driving"]
        self.assertEqual(len(day2_driving), 1)
        self.assertEqual(day2_driving[0]["start"], "04:45")

        for log in logs:
            self.assertAlmostEqual(sum(log["totals"].values()), 24.0, places=1)

    def test_calendar_day_totals_24_hours(self):
        route = _make_route(800)
        plan = plan_trip(route, current_cycle_used=10)
        logs = generate_daily_logs(plan.events)
        self.assertGreater(len(logs), 0)
        for log in logs:
            self.assertAlmostEqual(sum(log["totals"].values()), 24.0, places=1)

    def test_sample_trip_day1_driving_exactly_11_hours(self):
        result = plan_full_trip("Chicago, IL", "Indianapolis, IN", "Atlanta, GA", 12)
        logs = result["daily_logs"]
        self.assertGreaterEqual(len(logs), 2)

        day1 = logs[0]
        self.assertEqual(day1["date"], "2025-06-01")
        self.assertAlmostEqual(day1["totals"]["driving"], 11.0, places=1)
        self.assertGreater(logs[1]["totals"]["driving"], 0.5)

        day1_driving_ends = [
            e["end"] for e in day1["entries"] if e["status"] == "driving"
        ]
        self.assertNotIn("24:00", day1_driving_ends)

    def test_validate_daily_logs_flags_over_11_hours(self):
        logs = [
            {
                "date_label": "Day 1",
                "date": "2025-06-01",
                "totals": {
                    "off_duty": 0,
                    "sleeper_berth": 10,
                    "driving": 12,
                    "on_duty_not_driving": 2,
                },
            }
        ]
        warnings = validate_daily_logs(logs)
        self.assertTrue(any("11-hour" in w for w in warnings))
