import { Box, Typography } from '@mui/material';
import colors from '../colors';

const ROWS = [
  { key: 'off_duty', label: 'Off Duty', color: colors.duty.offDuty },
  { key: 'sleeper_berth', label: 'Sleeper Berth', color: colors.duty.sleeper },
  { key: 'driving', label: 'Driving', color: colors.duty.driving },
  { key: 'on_duty_not_driving', label: 'On Duty (ND)', color: colors.duty.onDuty },
];

function timeToMinutes(time) {
  if (time === '24:00') return 24 * 60;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function HourLabels() {
  const hours = Array.from({ length: 25 }, (_, i) => i);
  return (
    <Box sx={{ display: 'flex', ml: '100px', mb: 0.5 }}>
      {hours.map((h) => (
        <Box
          key={h}
          sx={{
            flex: h === 24 ? 0 : 1,
            width: h === 24 ? 0 : undefined,
            textAlign: h < 24 ? 'left' : 'right',
            fontSize: 10,
            color: 'text.secondary',
            transform: h < 24 ? 'translateX(-50%)' : undefined,
            display: h === 24 ? 'none' : 'block',
          }}
        >
          {h % 2 === 0 ? `${String(h).padStart(2, '0')}` : ''}
        </Box>
      ))}
    </Box>
  );
}

export default function LogGrid({ entries }) {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <HourLabels />
      <Box sx={{ minWidth: 640 }}>
        {ROWS.map((row) => (
          <Box key={row.key} sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
            <Typography
              variant="caption"
              sx={{
                width: 100,
                flexShrink: 0,
                fontWeight: 600,
                color: 'text.secondary',
                pr: 1,
              }}
            >
              {row.label}
            </Typography>
            <Box
              sx={{
                position: 'relative',
                flex: 1,
                height: 28,
                bgcolor: colors.bgSubtle,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                backgroundImage:
                  `repeating-linear-gradient(to right, transparent, transparent calc(100% / 24 - 1px), ${colors.border} calc(100% / 24 - 1px), ${colors.border} calc(100% / 24))`,
              }}
            >
              {entries
                .filter((e) => e.status === row.key)
                .map((entry, i) => {
                  const start = timeToMinutes(entry.start);
                  const end = timeToMinutes(entry.end);
                  const left = (start / (24 * 60)) * 100;
                  const width = ((end - start) / (24 * 60)) * 100;
                  return (
                    <Box
                      key={i}
                      title={`${entry.start}–${entry.end} ${entry.location}`}
                      sx={{
                        position: 'absolute',
                        top: 3,
                        bottom: 3,
                        left: `${left}%`,
                        width: `${Math.max(width, 0.4)}%`,
                        bgcolor: row.color,
                        borderRadius: 0.5,
                        opacity: 0.95,
                      }}
                    />
                  );
                })}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
