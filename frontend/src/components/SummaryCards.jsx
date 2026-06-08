import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import TimelapseOutlinedIcon from '@mui/icons-material/TimelapseOutlined';
import BatteryChargingFullOutlinedIcon from '@mui/icons-material/BatteryChargingFullOutlined';
import colors from '../colors';

const cards = [
  {
    key: 'total_miles',
    label: 'Total Miles',
    icon: StraightenOutlinedIcon,
    format: (v) => `${v?.toLocaleString()} mi`,
    color: colors.accent.miles,
  },
  {
    key: 'estimated_drive_hours',
    label: 'Drive Time',
    icon: ScheduleOutlinedIcon,
    format: (v) => `${v} hrs`,
    color: colors.accent.drive,
  },
  {
    key: 'total_trip_hours',
    label: 'Total Trip Time',
    icon: TimelapseOutlinedIcon,
    format: (v) => `${v} hrs`,
    color: colors.accent.trip,
  },
  {
    key: 'number_of_days',
    label: 'Log Sheets',
    icon: CalendarMonthOutlinedIcon,
    format: (v) => `${v} day${v === 1 ? '' : 's'}`,
    color: colors.accent.logs,
  },
  {
    key: 'remaining_cycle_hours',
    label: 'Cycle Remaining',
    icon: BatteryChargingFullOutlinedIcon,
    format: (v) => `${v} hrs`,
    color: colors.accent.cycle,
  },
];

export default function SummaryCards({ summary }) {
  if (!summary) return null;

  return (
    <Grid container spacing={2}>
      {cards.map(({ key, label, icon: Icon, format, color }) => (
        <Grid key={key} size={{ xs: 6, sm: 4, md: 2.4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${color}14`,
                    color,
                  }}
                >
                  <Icon fontSize="small" />
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {label}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {format(summary[key])}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
