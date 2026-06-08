import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

export const checkHealth = async () => {
  const { data } = await api.get('/health/');
  return data;
};

export const planTrip = async (tripData) => {
  const { data } = await api.post('/trips/plan/', tripData);
  return data;
};

export default api;
