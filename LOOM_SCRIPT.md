# Loom Demo Script — Spotter AI Trip Planner & ELD Log Generator

**Estimated length:** 5–7 minutes

---

## 1. Introduction (30 sec)

> "Hi, I'm walking through Spotter AI Trip Planner and ELD Log Generator — a full-stack app I built for FMCSA-compliant truck trip planning.
>
> It takes current location, pickup, dropoff, and how many hours the driver has already used in their 70-hour cycle, then outputs a route map, planned stops and rests, and filled daily ELD log sheets.
>
> Stack: React with Material UI on the frontend, Django REST Framework on the backend, OSRM for routing with a clean fallback layer."

---

## 2. Trip Input Form (45 sec)

> "Here's the main dashboard. The form collects four inputs: current location, pickup, dropoff, and current cycle used in hours.
>
> Validation ensures all locations are filled in and cycle hours stay between 0 and 70. I'll click **Load Sample Trip** to populate the assessment example."

**Action:** Click "Load Sample Trip"

> "That fills in Chicago to Indianapolis pickup, then dropoff in Atlanta, with 12 hours already used on the cycle."

---

## 3. Submit & Loading State (20 sec)

**Action:** Click "Generate Trip Plan"

> "While the backend calculates the route and applies HOS rules, you see a loading state. The API hits our Django endpoint which orchestrates routing, HOS planning, and log generation."

---

## 4. Summary Cards & Route Map (60 sec)

> "Results come back in sections. Summary cards show total miles, estimated drive time, total trip duration, number of log sheet days, and remaining cycle hours.
>
> The map uses React Leaflet with OpenStreetMap tiles. The blue polyline is the full route: current location → pickup → dropoff. Leg distances are shown below the map."

**Action:** Pan/zoom the map briefly

---

## 5. HOS Logic Explanation (90 sec)

> "Let me explain the Hours of Service logic baked into the backend.
>
> **11-hour driving limit:** A driver can drive at most 11 hours per shift.
>
> **14-hour window:** All on-duty time must fit within 14 hours after coming on duty — that includes driving, pickup, drop-off, fueling, and pre/post-trip.
>
> **30-minute break:** After 8 cumulative hours of driving, the planner inserts a 30-minute break.
>
> **70-hour / 8-day cycle:** Total on-duty time is tracked against the 70-hour limit. We start from the driver's current cycle used and warn if the trip won't fit.
>
> **Fuel every 1,000 miles:** Each fuel stop is 30 minutes on-duty not driving.
>
> **Pickup and drop-off:** Each is 1 hour on-duty not driving, not counted as driving time.
>
> **10-hour rest:** When the 11-hour or 14-hour limit is hit, the engine schedules a 10-hour sleeper berth rest before the next driving shift."

**Action:** Scroll to Stops & Rest Timeline

> "The timeline shows every planned stop — pre-trip, driving blocks, breaks, fuel, pickup, dropoff, and mandatory rest periods — with duty status chips."

---

## 6. Daily Log Sheets (60 sec)

**Action:** Scroll to Daily Log Sheets

> "For trips longer than one day, we generate one log sheet per 24-hour period. Each sheet has the classic four-row grid: Off Duty, Sleeper Berth, Driving, and On Duty Not Driving.
>
> Horizontal bars show duty status across the 24-hour timeline. Totals on the right always sum to 24 hours. Remarks capture inspections, loading, fueling, and break notes."

**Action:** If multiple days, scroll to Day 2

> "Multi-day trips split driving into legal shifts automatically — you can see rest periods carrying into the next day's log."

---

## 7. Backend & Frontend Architecture (60 sec)

> "On the backend, business logic lives in service modules — not views.
>
> - `route_service.py` — geocoding and OSRM routing with mock fallback
> - `hos_service.py` — FMCSA rule simulation
> - `log_generator.py` — 24-hour daily log assembly
> - `trip_planner.py` — orchestrates everything
>
> The API exposes `POST /api/trips/plan/` and `GET /api/health/`.
>
> On the frontend, `TripForm` handles validation, `RouteMap` renders Leaflet, `LogGrid` draws the duty bars, and `DailyLogSheet` composes the full log card layout."

---

## 8. Extensibility & Close (30 sec)

> "The architecture is modular. You could swap in a commercial routing API, connect to real ELD hardware, add authentication and saved trips in the database, or deploy the frontend to Vercel and backend to Render with environment-based CORS and API URLs.
>
> Thanks for watching — happy to walk through the HOS algorithm or deployment setup in more detail."

---

## Sample Trip Data (for reference)

| Field | Value |
|-------|-------|
| Current Location | Chicago, IL |
| Pickup Location | Indianapolis, IN |
| Dropoff Location | Atlanta, GA |
| Current Cycle Used | 12 |
