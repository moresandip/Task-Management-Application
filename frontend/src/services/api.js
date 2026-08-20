import axios from 'axios';

/**
 * Shared Axios instance for all API calls.
 *
 * In development, Vite proxies /api/* → http://localhost:5000/api/*
 * so VITE_API_URL is not needed locally (see vite.config.js).
 *
 * In production, set VITE_API_URL in your Vercel/Netlify environment variables
 * to your deployed backend URL, e.g. https://task-api.onrender.com/api
 */
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor — automatically attaches the JWT Bearer token
 * to every outgoing request if one is stored in localStorage.
 */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor — handles 401 Unauthorized globally.
 * If the server responds with 401, the stale token is cleared
 * and the user is redirected to the login page.
 */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Force a full page redirect so React state is fully reset
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Task API helpers ──────────────────────────────────────────────────────────

export const taskApi = {
  getAll: (params) => API.get('/tasks', { params }),
  getById: (id) => API.get(`/tasks/${id}`),
  create: (formData) =>
    API.post('/tasks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, formData) =>
    API.put(`/tasks/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => API.delete(`/tasks/${id}`),
};

// ── Auth API helpers ──────────────────────────────────────────────────────────

export const authApi = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
};

export default API;
