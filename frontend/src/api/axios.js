import axios from 'axios';

const API_BASE_URL =
  (typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL) ||
  '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor - Attach Auth Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Global Error Normalization & 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.error ||
        'An unexpected error occurred. Please try again.',
      errors: error.response?.data?.errors || null,
    };

    // Auto logout on 401 unauthenticated response (unless it's the login endpoint itself)
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Dispatch custom event so AuthContext can handle redirect without hard reload
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return Promise.reject(customError);
  }
);

export default apiClient;
