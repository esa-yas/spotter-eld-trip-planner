import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import EditRoadOutlinedIcon from '@mui/icons-material/EditRoadOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';

const NAV_ITEMS = [
  { id: 'plan', label: 'Plan Trip', icon: EditRoadOutlinedIcon },
  { id: 'route', label: 'Route Overview', icon: MapOutlinedIcon, requiresResult: true },
  { id: 'logs', label: 'ELD Logs', icon: ArticleOutlinedIcon, requiresResult: true },
];

const SIDEBAR_WIDTH = 220;

function SidebarContent({ activeView, onViewChange, hasResult, onNavigate }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          px: 2,
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.35)',
          }}
        >
          <LocalShippingOutlinedIcon sx={{ fontSize: 20, color: 'white' }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ lineHeight: 1.2, fontWeight: 700 }}>
            Spotter AI
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Fleet Command
          </Typography>
        </Box>
      </Box>

      <List sx={{ px: 1, py: 2, flex: 1 }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon, requiresResult }) => {
          const disabled = requiresResult && !hasResult;
          return (
            <ListItemButton
              key={id}
              selected={activeView === id}
              disabled={disabled}
              onClick={() => {
                onViewChange(id);
                onNavigate?.();
              }}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                py: 1,
                '&.Mui-selected': {
                  bgcolor: 'rgba(59, 130, 246, 0.15)',
                  borderLeft: '3px solid',
                  borderColor: 'primary.main',
                  '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.2)' },
                },
                '&.Mui-disabled': { opacity: 0.35 },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: activeView === id ? 'primary.main' : 'text.secondary' }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  fontSize: '0.8rem',
                  fontWeight: activeView === id ? 700 : 500,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ px: 2, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          FMCSA · 70/8 Cycle
        </Typography>
        <Typography variant="caption" color="primary.main" fontWeight={600}>
          {hasResult ? '● Trip Active' : '○ Awaiting Plan'}
        </Typography>
      </Box>
    </Box>
  );
}

export default function AppSidebar({ activeView, onViewChange, hasResult }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: 1300,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': { bgcolor: 'background.paper' },
          }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          PaperProps={{
            sx: { width: SIDEBAR_WIDTH, bgcolor: 'background.paper', borderRight: '1px solid #2A3441' },
          }}
        >
          <SidebarContent
            activeView={activeView}
            onViewChange={onViewChange}
            hasResult={hasResult}
            onNavigate={() => setMobileOpen(false)}
          />
        </Drawer>
      </>
    );
  }

  return (
    <Box
      component="nav"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}
    >
      <SidebarContent activeView={activeView} onViewChange={onViewChange} hasResult={hasResult} />
    </Box>
  );
}

export { SIDEBAR_WIDTH };
