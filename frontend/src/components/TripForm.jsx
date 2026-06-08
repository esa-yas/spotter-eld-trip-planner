import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';

const INITIAL = {
  current_location: '',
  pickup_location: '',
  dropoff_location: '',
  current_cycle_used: '',
};

export default function TripForm({ onSubmit, loading }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    if (!form.current_location.trim()) next.current_location = 'Required';
    if (!form.pickup_location.trim()) next.pickup_location = 'Required';
    if (!form.dropoff_location.trim()) next.dropoff_location = 'Required';

    const cycle = parseFloat(form.current_cycle_used);
    if (form.current_cycle_used === '' || Number.isNaN(cycle)) {
      next.current_cycle_used = 'Enter hours used (0–70)';
    } else if (cycle < 0 || cycle > 70) {
      next.current_cycle_used = 'Must be between 0 and 70';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      current_location: form.current_location.trim(),
      pickup_location: form.pickup_location.trim(),
      dropoff_location: form.dropoff_location.trim(),
      current_cycle_used: parseFloat(form.current_cycle_used),
    });
  };

  const fillSample = () => {
    setForm({
      current_location: 'Chicago, IL',
      pickup_location: 'Indianapolis, IN',
      dropoff_location: 'Atlanta, GA',
      current_cycle_used: '12',
    });
    setErrors({});
  };

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Plan Your Trip
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter route details and current HOS cycle usage. We&apos;ll compute a compliant route,
            stops, and daily ELD logs.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Current Location"
                value={form.current_location}
                onChange={handleChange('current_location')}
                error={Boolean(errors.current_location)}
                helperText={errors.current_location}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MyLocationOutlinedIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Pickup Location"
                value={form.pickup_location}
                onChange={handleChange('pickup_location')}
                error={Boolean(errors.pickup_location)}
                helperText={errors.pickup_location}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PlaceOutlinedIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Dropoff Location"
                value={form.dropoff_location}
                onChange={handleChange('dropoff_location')}
                error={Boolean(errors.dropoff_location)}
                helperText={errors.dropoff_location}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FlagOutlinedIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Current Cycle Used (hours)"
                type="number"
                inputProps={{ min: 0, max: 70, step: 0.5 }}
                value={form.current_cycle_used}
                onChange={handleChange('current_cycle_used')}
                error={Boolean(errors.current_cycle_used)}
                helperText={errors.current_cycle_used || '70-hour / 8-day property-carrying cycle'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTimeOutlinedIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RouteOutlinedIcon />}
            >
              {loading ? 'Calculating Route…' : 'Generate Trip Plan'}
            </Button>
            <Button variant="outlined" onClick={fillSample} disabled={loading}>
              Load Sample Trip
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
