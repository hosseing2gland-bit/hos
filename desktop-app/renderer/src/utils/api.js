import axios from 'axios';

// Get API URL from electron store or use default
const getApiUrl = async () => {
  if (window.electronAPI) {
    try {
      const url = await window.electronAPI.store.get('apiUrl');
      return url || 'http://localhost:3000/api/v1';
    } catch (error) {
      return 'http://localhost:3000/api/v1';
    }
  }
  return 'http://localhost:3000/api/v1';
};

// Create axios instance
const api = axios.create({
  baseURL: await getApiUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookies
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Get auth token from store
    const authStore = localStorage.getItem('auth-storage');
    if (authStore) {
      try {
        const { state } = JSON.parse(authStore);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (error) {
        console.error('Failed to parse auth token:', error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const response = await axios.post(
          `${await getApiUrl()}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;

        // Update token in localStorage
        const authStore = localStorage.getItem('auth-storage');
        if (authStore) {
          const parsed = JSON.parse(authStore);
          parsed.state.token = accessToken;
          localStorage.setItem('auth-storage', JSON.stringify(parsed));
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
