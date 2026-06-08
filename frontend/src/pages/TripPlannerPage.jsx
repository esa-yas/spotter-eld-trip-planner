import { useState } from 'react';
import {
  Alert,
  Box,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import TripForm from '../components/TripForm';
import SummaryCards from '../components/SummaryCards';
import RouteMap from '../components/RouteMap';
import StopsTimeline from '../components/StopsTimeline';
import DailyLogSheet from '../components/DailyLogSheet';
import ComplianceWarnings from '../components/ComplianceWarnings';
import { planTrip } from '../services/api';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';

export default function TripPlannerPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await planTrip(formData);
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.current_cycle_used?.[0] ||
        err.message ||
        'Failed to plan trip. Please try again.';
      setError(typeof message === 'string' ? message : JSON.stringify(message));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #06B6D4 100%)',
          color: 'white',
          py: { xs: 4, md: 6 },
          mb: 4,
        }}
      >
        <Container maxWidth="xl">
          <Typography variant="h4" sx={{ mb: 1, maxWidth: 720 }}>
            FMCSA-Compliant Trip Planning & ELD Logs
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 640 }}>
            Plan truck routes with legal driving windows, mandatory breaks, fuel stops, and
            auto-generated daily log sheets — built for property-carrying drivers.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl">
        <Stack spacing={3}>
          <TripForm onSubmit={handleSubmit} loading={loading} />

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {loading && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Calculating route, applying HOS rules, and generating daily log sheets…
            </Alert>
          )}

          {result && (
            <>
              <ComplianceWarnings warnings={result.warnings} />
              <SummaryCards summary={result.summary} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 7 }}>
                  <RouteMap route={result.route} legs={result.route?.legs} />
                </Grid>
                <Grid size={{ xs: 12, lg: 5 }}>
                  <StopsTimeline stops={result.stops} />
                </Grid>
              </Grid>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <MapOutlinedIcon color="primary" />
                  <Typography variant="h5">Daily Log Sheets</Typography>
                </Box>
                <Stack spacing={3}>
                  {result.daily_logs?.map((log, index) => (
                    <DailyLogSheet key={index} log={log} />
                  ))}
                </Stack>
              </Box>
            </>
          )}

          {!result && !loading && !error && (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 2,
                borderRadius: 3,
                border: '2px dashed',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <MapOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No trip planned yet
              </Typography>
              <Typography variant="body2" color="text.secondary" maxWidth={420} mx="auto">
                Enter your locations and current cycle hours above, or load the sample trip to see
                a full route plan with ELD log sheets.
              </Typography>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
