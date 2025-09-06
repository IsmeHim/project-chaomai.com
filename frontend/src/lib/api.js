// src/lib/api.js
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('token') // 👈 ต้องมี key นี้จริง
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

// // src/lib/api.js
// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     if (err?.response?.status === 401) {
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       const next = encodeURIComponent(window.location.pathname + window.location.search);
//       window.location.href = `/login?next=${next}`;
//     }
//     return Promise.reject(err);
//   }
// );

