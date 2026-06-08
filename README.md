# Spotter AI Trip Planner & ELD Log Generator

A production-quality full-stack assessment app for FMCSA-compliant truck trip planning. Enter route details and current Hours of Service (HOS) cycle usage — get back a route map, planned stops/rests, and auto-generated daily ELD log sheets.

## Features

- **Trip planning** — Current location → Pickup → Dropoff with distance and drive time estimates
- **Interactive route map** — Leaflet map with OSRM routing (mock fallback included)
- **HOS compliance engine** — 11-hour driving, 14-hour window, 30-minute breaks, 70-hour/8-day cycle
- **Stops timeline** — Pickup, dropoff, fuel, breaks, and mandatory rest periods
- **Daily ELD log sheets** — 24-hour grid with duty status bars, totals, and remarks
- **Multi-day trips** — Automatic log sheet generation for longer hauls
- **Warnings** — Alerts when cycle limits or compliance constraints are exceeded

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, Material UI, React Router, Axios, React Leaflet |
| Backend | Python, Django, Django REST Framework, django-cors-headers |
| Database | SQLite (local development) |
| Routing | OSRM public API + abstraction layer with coordinate fallback |
| Deployment | Vercel (frontend), Render/Railway (backend) |

## Project Structure

```
├── backend/
│   ├── config/              # Django project settings
│   ├── trips/
│   │   ├── services/
│   │   │   ├── route_service.py    # Geocoding & routing
│   │   │   ├── hos_service.py      # FMCSA HOS simulation
│   │   │   ├── log_generator.py    # Daily log sheet builder
│   │   │   └── trip_planner.py     # Orchestration
│   │   ├── tests/           # HOS unit tests
│   │   ├── views.py
│   │   └── serializers.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # TripPlannerPage
│   │   └── services/        # API client
│   └── vercel.json
└── README.md
```

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # optional — defaults work for local dev
python manage.py migrate
python manage.py runserver
```

Backend runs at **http://localhost:8000**

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # optional — uses Vite proxy by default
npm run dev
```

Frontend runs at **http://localhost:5173**

The Vite dev server proxies `/api` requests to the Django backend.

### Run Tests

```bash
cd backend
source venv/bin/activate
python manage.py test trips.tests
```

## Sample Trip

| Field | Value |
|-------|-------|
| Current Location | Chicago, IL |
| Pickup Location | Indianapolis, IN |
| Dropoff Location | Atlanta, GA |
| Current Cycle Used | 12 |

Click **Load Sample Trip** in the UI or POST to the API directly.

## API Documentation

### `GET /api/health/`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "Spotter AI Trip Planner"
}
```

### `POST /api/trips/plan/`

Plan a trip with HOS-compliant stops and daily logs.

**Request:**
```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "Indianapolis, IN",
  "dropoff_location": "Atlanta, GA",
  "current_cycle_used": 12
}
```

**Response:**
```json
{
  "summary": {
    "total_miles": 716.4,
    "estimated_drive_hours": 13.02,
    "total_trip_hours": 28.5,
    "number_of_days": 2,
    "remaining_cycle_hours": 42.5,
    "on_duty_hours": 27.5
  },
  "route": {
    "geometry": [[41.87, -87.63], ...],
    "legs": [
      {
        "from": "Chicago, IL",
        "to": "Indianapolis, IN",
        "distance_miles": 183.2,
        "duration_hours": 3.33
      }
    ]
  },
  "stops": [
    {
      "type": "pretrip",
      "location": "Chicago, IL",
      "time": "2025-06-01 06:00",
      "duration_hours": 0.25,
      "duty_status": "on_duty_not_driving"
    }
  ],
  "daily_logs": [
    {
      "date_label": "Day 1",
      "date": "2025-06-01",
      "total_miles": 412.5,
      "entries": [
        {
          "start": "00:00",
          "end": "06:00",
          "status": "off_duty",
          "location": "Chicago, IL",
          "remarks": ""
        }
      ],
      "totals": {
        "off_duty": 10.0,
        "sleeper_berth": 8.0,
        "driving": 4.5,
        "on_duty_not_driving": 1.5
      }
    }
  ],
  "warnings": []
}
```

## HOS Assumptions

| Rule | Implementation |
|------|---------------|
| Driver type | Property-carrying |
| Cycle | 70 hours / 8 days |
| Driving limit | 11 hours per shift |
| On-duty window | 14 hours after 10 consecutive hours off duty |
| Break | 30 minutes after 8 cumulative driving hours |
| Rest between shifts | 10 consecutive hours off duty / sleeper berth |
| Pickup time | 1 hour on-duty not driving |
| Dropoff time | 1 hour on-duty not driving |
| Fuel stops | Every 1,000 miles, 30 minutes on-duty not driving |
| Pre/Post-trip | 15 minutes each, on-duty not driving |
| Adverse conditions | Not applied |
| Average speed | 55 mph (when estimating drive segments) |
| Daily logs | Each totals exactly 24 hours |

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `True` | Django debug mode |
| `SECRET_KEY` | dev key | Django secret key |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated hosts |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Frontend origins |
| `OSRM_BASE_URL` | `http://router.project-osrm.org` | OSRM routing API |
| `USE_MOCK_ROUTING` | `False` | Force mock routing |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api` | Backend API base URL |

## Deployment

### Frontend — Vercel

1. Import the `frontend/` directory as a Vercel project
2. Set `VITE_API_BASE_URL` to your deployed backend URL (e.g. `https://your-api.onrender.com/api`)
3. Deploy — `vercel.json` handles SPA routing

### Backend — Render / Railway

1. Deploy from `backend/` directory
2. Set build command: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
3. Set start command: `gunicorn config.wsgi --bind 0.0.0.0:$PORT`
4. Configure environment variables:
   - `SECRET_KEY` — generate a secure key
   - `DEBUG=False`
   - `ALLOWED_HOSTS=your-app.onrender.com`
   - `CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app`

## Screenshots

> Add screenshots to `docs/screenshots/` after running locally:
> - `placeholder.png` — Dashboard with sample trip results
> - `form.png` — Trip input form
> - `logs.png` — Daily log sheet grid

## License

MIT — built as a coding assessment project.
