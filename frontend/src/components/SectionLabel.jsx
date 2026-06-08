import { Typography } from '@mui/material';

export default function SectionLabel({ children }) {
  return (
    <Typography
      variant="caption"
      sx={{
        color: 'text.secondary',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        display: 'block',
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  );
}
