// src/lib/url.js (เวอร์ชันกันพัง)
export function toPublicUrl(p) {
  // บังคับให้เป็น string เสมอ
  const base = String(import.meta.env?.VITE_API_URL ?? '').trim();
  const path = p == null ? '' : String(p).trim();

  // ถ้า path เป็น URL เต็มอยู่แล้ว ก็ส่งกลับเลย
  if (/^https?:\/\//i.test(path)) return path;

  // ถ้าฐานว่าง (ลืมตั้ง VITE_API_URL ตอน build) → คืน null เพื่อไม่ให้ img/src ได้ ""
  if (!base) return null;

  const origin = base.replace(/\/api\/?$/, '');
  // join path ให้เนียน ไม่ซ้ำหรือขาด '/'
  return origin.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
}
