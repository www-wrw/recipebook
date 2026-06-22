import axios from 'axios';

// Backend mounts all routes under /api, so the base URL includes it.
// VITE_API_URL is the backend origin (e.g. https://recipebook-backend-b8ji.onrender.com).
const ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${ORIGIN}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
