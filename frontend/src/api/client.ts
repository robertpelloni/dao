import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Mock authentication header for PoC
api.interceptors.request.use((config) => {
  const userId = config.data?.userId || 'alice'; // Default for PoC
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  return config;
});

export default api;
