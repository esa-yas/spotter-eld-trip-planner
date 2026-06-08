import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import colors from '../colors';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MAP_HEIGHT = 400;

function MapController({ geometry }) {
  const map = useMap();

  useEffect(() => {
    const refresh = () => {
      map.invalidateSize({ animate: false, pan: false });
    };

    refresh();
    const timers = [0, 50, 150, 350].map((ms) => setTimeout(refresh, ms));

    if (geometry?.length > 1) {
      const bounds = L.latLngBounds(geometry.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
      setTimeout(refresh, 100);
    }

    const container = map.getContainer()?.parentElement;
    const observer = container ? new ResizeObserver(refresh) : null;
    if (container && observer) observer.observe(container);

    window.addEventListener('resize', refresh);
    return () => {
      timers.forEach(clearTimeout);
      observer?.disconnect();
      window.removeEventListener('resize', refresh);
    };
  }, [geometry, map]);

  return null;
}

export default function RouteMap({ route, legs }) {
  const geometry = route?.geometry || [];
  const containerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const center = useMemo(() => {
    if (geometry.length) {
      const mid = geometry[Math.floor(geometry.length / 2)];
      return [mid[0], mid[1]];
    }
    return [39.8283, -98.5795];
  }, [geometry]);

  const mapKey = useMemo(() => {
    if (!geometry.length) return 'empty';
    const first = geometry[0];
    const last = geometry[geometry.length - 1];
    return `${geometry.length}-${first[0]}-${first[1]}-${last[0]}-${last[1]}`;
  }, [geometry]);

  const waypointMarkers = useMemo(() => {
    if (!geometry.length) return [];
    const points = [geometry[0]];
    if (legs?.length >= 2) {
      const totalMiles = legs[0].distance_miles + legs[1].distance_miles;
      const ratio = totalMiles > 0 ? legs[0].distance_miles / totalMiles : 0.5;
      const approxMid = geometry[Math.floor(geometry.length * ratio)];
      if (approxMid) points.push(approxMid);
    }
    points.push(geometry[geometry.length - 1]);
    return points;
  }, [geometry, legs]);

  const labels = ['Current', 'Pickup', 'Dropoff'];

  useEffect(() => {
    setMapReady(false);
    const el = containerRef.current;
    if (!el) return undefined;

    const check = () => {
      if (el.offsetWidth > 0 && el.offsetHeight > 0) {
        setMapReady(true);
      }
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    const timer = setTimeout(check, 50);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [mapKey]);

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Typography variant="h6" gutterBottom>
          Route Map
        </Typography>
        <Box
          ref={containerRef}
          sx={{
            height: MAP_HEIGHT,
            width: '100%',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: colors.bgSubtle,
            position: 'relative',
          }}
        >
          {geometry.length > 0 && mapReady ? (
            <MapContainer
              key={mapKey}
              center={center}
              zoom={5}
              style={{ height: MAP_HEIGHT, width: '100%' }}
              scrollWheelZoom
              attributionControl
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Polyline
                positions={geometry}
                pathOptions={{ color: colors.routeLine, weight: 5, opacity: 0.9 }}
              />
              <MapController geometry={geometry} />
              {waypointMarkers.map((pos, i) => (
                <Marker key={`${mapKey}-marker-${i}`} position={pos}>
                  <Popup>{labels[i] || `Stop ${i + 1}`}</Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : geometry.length > 0 ? (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography color="text.secondary">Loading map…</Typography>
            </Box>
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography color="text.secondary">No route geometry available</Typography>
            </Box>
          )}
        </Box>
        {legs?.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {legs.map((leg, i) => (
              <Typography key={i} variant="body2" color="text.secondary">
                <strong>Leg {i + 1}:</strong> {leg.from} → {leg.to} ({leg.distance_miles} mi,{' '}
                {leg.duration_hours}h)
              </Typography>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
