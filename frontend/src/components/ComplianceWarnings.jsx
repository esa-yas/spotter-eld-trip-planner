import { Alert, AlertTitle, Box, Stack } from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

export default function ComplianceWarnings({ warnings }) {
  if (!warnings?.length) return null;

  return (
    <Box>
      <Stack spacing={1.5}>
        {warnings.map((warning, index) => (
          <Alert
            key={index}
            severity="warning"
            icon={<WarningAmberOutlinedIcon />}
            sx={{ borderRadius: 2 }}
          >
            <AlertTitle sx={{ fontWeight: 600 }}>HOS Compliance Notice</AlertTitle>
            {warning}
          </Alert>
        ))}
      </Stack>
    </Box>
  );
}
