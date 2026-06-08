import { Box, Typography } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';

export default function MapHeader() {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 2,
        py: 1.25,
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.12)',
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LocalShippingOutlinedIcon sx={{ fontSize: 20 }} />
      </Box>
      <Box>
        <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>
          Spotter AI
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Trip Planner
        </Typography>
      </Box>
    </Box>
  );
}
