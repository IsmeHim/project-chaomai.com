// src/lib/url.js
export function toPublicUrl(p) {
  if (!p) return "";
  // baseURL ของ axios: e.g. http://localhost:5000/api
  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api");
  const origin = apiBase.replace(/\/api\/?$/, ""); // -> http://localhost:5000
  return /^https?:\/\//i.test(p) ? p : origin + p; // ต่อเป็น URL เต็ม
}
