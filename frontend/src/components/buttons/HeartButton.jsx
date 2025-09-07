import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toggleWishlist } from '../../lib/wishlist';
import { Heart } from 'lucide-react'; // <-- import lucide icons

export default function HeartButton({ id, isWished, onChange }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [busy, setBusy] = useState(false);

  const authed = !!localStorage.getItem('token');

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!authed) {
      const next = encodeURIComponent(loc.pathname + loc.search);
      nav(`/login?next=${next}`);
      return;
    }

    if (busy) return;
    setBusy(true);
    try {
      await toggleWishlist(id, isWished);
      onChange?.(!isWished);

      // 👉 แจ้งทั่วแอปว่า wishlist เปลี่ยน
      window.dispatchEvent(
        new CustomEvent('wishlist:changed', { detail: { id, added: !isWished } })
      );
    } finally {
      setBusy(false);
    }
  };

  // เลือก icon lucide
  const Icon = Heart;

  return (
    <button
      onClick={onClick}
      aria-label={isWished ? 'เอาออกจากถูกใจ' : 'เพิ่มเข้าถูกใจ'}
      className={`absolute top-3 right-3 inline-flex items-center justify-center rounded-full
                  ${isWished ? 'bg-rose-600 text-white' : 'bg-white/90 text-rose-600'}
                  hover:scale-105 transition p-2 shadow`}
      disabled={busy}
      title={isWished ? 'เอาออกจากถูกใจ' : 'เพิ่มเข้าถูกใจ'}
    >
      {/* ใช้ไอคอน fontawesome ที่คุณใช้อยู่แล้ว */}
      <Icon className={`w-5 h-5 ${isWished ? 'text-white' : 'text-rose-600'}`} />{/* <-- ใช้ Icon ของ lucide */}
    </button>
  );
}
