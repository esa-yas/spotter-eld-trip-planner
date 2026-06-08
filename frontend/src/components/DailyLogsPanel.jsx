import { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import CommandPanel from './CommandPanel';
import DailyLogSheet from './DailyLogSheet';

export default function DailyLogsPanel({ dailyLogs }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!dailyLogs?.length) {
    return (
      <CommandPanel title="ELD Log Sheets" subtitle="No logs generated">
        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
          Plan a trip to generate daily log sheets.
        </Box>
      </CommandPanel>
    );
  }

  return (
    <CommandPanel
      title="ELD Log Sheets"
      subtitle={`${dailyLogs.length} daily record${dailyLogs.length === 1 ? '' : 's'} · 24h duty grid`}
      noPadding
    >
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: 40,
          px: 1,
          '& .MuiTab-root': { minHeight: 40 },
        }}
      >
        {dailyLogs.map((log, i) => (
          <Tab
            key={i}
            label={`${log.date_label} · ${log.total_miles}mi`}
            sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
          />
        ))}
      </Tabs>
      <Box sx={{ p: 2 }}>
        <DailyLogSheet log={dailyLogs[activeTab]} />
      </Box>
    </CommandPanel>
  );
}
