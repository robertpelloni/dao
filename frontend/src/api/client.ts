import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Since the PoC UI switches users constantly by passing a new userId, we fetch a token per request.
// In a real application, the user would login once, and we would cache the token.
async function getJwtToken(userId: string) {
  try {
    const res = await axios.post('/api/auth/login', { userId });
    return res.data.token;
  } catch (err) {
    console.error('Failed to obtain JWT', err);
    return null;
  }
}

api.interceptors.request.use(async (config) => {
  const userId = config.data?.userId || 'alice'; // Default for PoC

  // Always fetch a fresh token for the requested user context
  const jwtToken = await getJwtToken(userId);

  if (jwtToken) {
    config.headers['Authorization'] = `Bearer ${jwtToken}`;
  }
  return config;
});

export default api;
