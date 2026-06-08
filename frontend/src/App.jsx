import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import AppHeader from './components/AppHeader';
import TripPlannerPage from './pages/TripPlannerPage';

function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader />
      <Routes>
        <Route path="/" element={<TripPlannerPage />} />
        <Route path="*" element={<TripPlannerPage />} />
      </Routes>
    </Box>
  );
}

export default App;
