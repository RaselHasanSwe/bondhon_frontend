import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor — attach Bearer token
// Falls back to the Zustand persisted store when the standalone auth_token key is
// missing (e.g. after a partial clear or a previous 401 that only removed auth_token).
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('auth_token');

    if (!token) {
      // Try to recover from the Zustand persist store ('bondhon-auth')
      try {
        const persisted = localStorage.getItem('bondhon-auth');
        if (persisted) {
          const state = JSON.parse(persisted)?.state;
          if (state?.token) {
            token = state.token as string;
            // Re-sync the standalone key so future requests don't need to fall back
            localStorage.setItem('auth_token', token as string);
          }
        }
      } catch { /* ignore parse errors */ }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — handle 401
// Clears BOTH auth_token and the Zustand persisted store so the dashboard layout
// correctly detects the logged-out state on the next render and redirects to /login
// without triggering an infinite 401 → redirect loop.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Remove standalone token key
      localStorage.removeItem('auth_token');
      // Remove / reset the Zustand persisted store so isAuthenticated becomes false
      try {
        const persisted = localStorage.getItem('bondhon-auth');
        if (persisted) {
          const parsed = JSON.parse(persisted);
          if (parsed?.state) {
            parsed.state = { user: null, token: null, isAuthenticated: false };
            localStorage.setItem('bondhon-auth', JSON.stringify(parsed));
          }
        }
      } catch { /* ignore */ }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

