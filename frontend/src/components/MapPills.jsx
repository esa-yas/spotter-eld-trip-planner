import { Box, Chip } from '@mui/material';
import StraightenIcon from '@mui/icons-material/Straighten';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';

const PILLS = [
  { key: 'total_miles', icon: StraightenIcon, format: (v) => `${v?.toLocaleString()} mi` },
  { key: 'estimated_drive_hours', icon: ScheduleIcon, format: (v) => `${v}h drive` },
  { key: 'number_of_days', icon: CalendarMonthIcon, format: (v) => `${v} log${v === 1 ? '' : 's'}` },
  { key: 'remaining_cycle_hours', icon: BatteryFullIcon, format: (v) => `${v}h left` },
];

export default function MapPills({ summary }) {
  if (!summary) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1000,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        justifyContent: 'flex-end',
        maxWidth: { xs: '60%', sm: 'auto' },
      }}
    >
      {PILLS.map(({ key, icon: Icon, format }) => (
        <Chip
          key={key}
          icon={<Icon sx={{ fontSize: '16px !important' }} />}
          label={format(summary[key])}
          sx={{
            bgcolor: 'background.paper',
            fontWeight: 600,
            fontSize: '0.8rem',
            boxShadow: '0 2px 12px rgba(15, 23, 42, 0.1)',
            border: '1px solid',
            borderColor: 'divider',
            '& .MuiChip-icon': { color: 'primary.main' },
          }}
        />
      ))}
    </Box>
  );
}
