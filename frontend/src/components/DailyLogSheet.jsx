import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import LogGrid from './LogGrid';

const TOTAL_LABELS = {
  off_duty: 'Off Duty',
  sleeper_berth: 'Sleeper',
  driving: 'Driving',
  on_duty_not_driving: 'On Duty (ND)',
};

export default function DailyLogSheet({ log }) {
  const totalHours = Object.values(log.totals || {}).reduce((a, b) => a + b, 0);

  return (
    <Card variant="outlined" sx={{ borderColor: 'divider' }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6">{log.date_label}</Typography>
            <Typography variant="body2" color="text.secondary">
              {log.date} · {log.total_miles} miles
            </Typography>
          </Box>
          <Chip
            label={`Total: ${totalHours.toFixed(1)}h / 24h`}
            color={Math.abs(totalHours - 24) < 0.2 ? 'success' : 'warning'}
            variant="outlined"
          />
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 9 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                24-Hour Duty Status Grid
              </Typography>
              <LogGrid entries={log.entries} />
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, lg: 3 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Daily Totals
              </Typography>
              {Object.entries(log.totals || {}).map(([key, value]) => (
                <Box
                  key={key}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 0.75,
                    borderBottom: '1px dashed',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2">{TOTAL_LABELS[key]}</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {value}h
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>

        {log.remarks?.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Remarks
            </Typography>
            {log.remarks.map((remark, i) => (
              <Typography key={i} variant="body2" color="text.secondary">
                • {remark}
              </Typography>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
