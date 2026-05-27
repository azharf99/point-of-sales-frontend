import axios from 'axios';

// Helper to extract a cookie value by name (Exact implementation from @FRONTEND.md)
const getCookie = (name: string): string | null | undefined => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
};

// Create Axios Instance
export const api = axios.create({
  // Aligning default with documentation fallback
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  withCredentials: true, // Crucial for CORS and Cookie transmission
});

// Request Interceptor: Inject CSRF Token and JWT (Exact logic from @FRONTEND.md)
api.interceptors.request.use((config) => {
  // 1. Double-Submit CSRF Token
  const csrfToken = getCookie('csrf_token');
  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  // 2. JWT Bearer Token
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Session expiration handling
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
