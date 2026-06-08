import { useEffect, useState } from 'react';
import {
  Box,
  Collapse,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export default function BottomSheet({
  children,
  formContent,
  hasResult,
  tabs,
  activeTab,
  onTabChange,
  warnings,
}) {
  const [expanded, setExpanded] = useState(!hasResult);

  useEffect(() => {
    setExpanded(!hasResult);
  }, [hasResult]);

  const sheetContent = hasResult ? (
    <>
      <Tabs
        value={activeTab}
        onChange={(_, v) => onTabChange(v)}
        variant="fullWidth"
        sx={{ borderBottom: '1px solid', borderColor: 'divider', minHeight: 48 }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.id} label={tab.label} value={tab.id} />
        ))}
      </Tabs>
      <Box sx={{ overflow: 'auto', flex: 1, px: { xs: 2, md: 3 }, py: 2 }}>
        {tabs.find((t) => t.id === activeTab)?.content}
      </Box>
    </>
  ) : (
    <Box sx={{ overflow: 'auto', flex: 1, px: { xs: 2, md: 3 }, py: 2 }}>
      {formContent}
    </Box>
  );

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        bgcolor: 'background.paper',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        boxShadow: '0 -8px 32px rgba(15, 23, 42, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: expanded ? (hasResult ? '58vh' : '52vh') : '72px',
        transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 1,
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        <Box sx={{ width: 40, height: 4, bgcolor: 'divider', borderRadius: 2, mr: 1 }} />
        <IconButton size="small" sx={{ color: 'text.secondary' }}>
          {expanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
        </IconButton>
        {!expanded && hasResult && (
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Tap to expand — Summary · Stops · Logs
          </Typography>
        )}
      </Box>

      <Collapse in={expanded} sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {warnings}
        {sheetContent}
      </Collapse>

      {children}
    </Box>
  );
}
