import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import DriveEtaOutlinedIcon from '@mui/icons-material/DriveEtaOutlined';

const TYPE_CONFIG = {
  pretrip: { label: 'Pre-Trip', color: 'default', icon: BuildOutlinedIcon },
  posttrip: { label: 'Post-Trip', color: 'default', icon: BuildOutlinedIcon },
  pickup: { label: 'Pickup', color: 'primary', icon: Inventory2OutlinedIcon },
  dropoff: { label: 'Dropoff', color: 'secondary', icon: FlagOutlinedIcon },
  fuel: { label: 'Fuel', color: 'warning', icon: LocalGasStationOutlinedIcon },
  break: { label: 'Break', color: 'info', icon: CoffeeOutlinedIcon },
  rest: { label: 'Rest / Drive', color: 'success', icon: HotelOutlinedIcon },
};

const DUTY_LABELS = {
  off_duty: 'Off Duty',
  sleeper_berth: 'Sleeper Berth',
  driving: 'Driving',
  on_duty_not_driving: 'On Duty (Not Driving)',
};

function StopIcon({ stop }) {
  const isDriving = stop.duty_status === 'driving';
  const config = isDriving
    ? { label: 'Driving', color: 'primary', icon: DriveEtaOutlinedIcon }
    : TYPE_CONFIG[stop.type] || TYPE_CONFIG.rest;
  const Icon = config.icon;

  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        bgcolor: 'background.default',
        border: '2px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon fontSize="small" color={isDriving ? 'primary' : 'action'} />
    </Box>
  );
}

export default function StopsTimeline({ stops }) {
  if (!stops?.length) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Stops & Rest Timeline
          </Typography>
          <Typography color="text.secondary">No stops scheduled.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Typography variant="h6" gutterBottom>
          Stops & Rest Timeline
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Planned stops, fuel breaks, rests, and duty changes along the route.
        </Typography>

        <Stack spacing={0} divider={<Divider flexItem sx={{ ml: 5 }} />}>
          {stops.map((stop, index) => {
            const isDriving = stop.duty_status === 'driving';
            const config = isDriving
              ? { label: 'Driving', color: 'primary' }
              : TYPE_CONFIG[stop.type] || { label: stop.type, color: 'default' };

            return (
              <Box key={index} sx={{ display: 'flex', gap: 2, py: 2 }}>
                <StopIcon stop={stop} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Chip label={config.label} size="small" color={config.color} variant="outlined" />
                    <Chip
                      label={DUTY_LABELS[stop.duty_status] || stop.duty_status}
                      size="small"
                      variant="filled"
                      sx={{ bgcolor: 'action.hover' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {stop.duration_hours}h
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" noWrap>
                    {stop.label || stop.location}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stop.location}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stop.time}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
