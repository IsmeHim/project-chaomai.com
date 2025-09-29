import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeartButton from '../components/buttons/HeartButton';
import { fetchWishlist, toggleWishlist } from '../lib/wishlist';
// เพิ่มไอคอน
import { MapPin, ArrowRight, BedDouble, ShowerHead, Ruler } from 'lucide-react';


export default function FeaturedProperties({ items = [], loading = false, error = '' }) {
  // ----- Wishlist state -----
  const [wishlistIds, setWishlistIds] = useState(new Set());

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!localStorage.getItem('token')) {
        setWishlistIds(new Set());
        return;
      }
      const { ids } = await fetchWishlist();
      if (alive) setWishlistIds(ids);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const onWishClear = () => setWishlistIds(new Set());
    const onAuthChanged = async (e) => {
      const authed = !!e?.detail?.authed;
      if (!authed) {
        // ออกจากระบบ → เคลียร์ทันที
        setWishlistIds(new Set());
      } else {
        // เผื่อกรณีกลับมา login แล้ว อยากรีโหลด
        try {
          const { ids } = await fetchWishlist();
          setWishlistIds(ids);
        } catch {/* เงียบไว้ */}
      }
    };
    window.addEventListener('wishlist:clear', onWishClear);
    window.addEventListener('auth:changed', onAuthChanged);
    return () => {
      window.removeEventListener('wishlist:clear', onWishClear);
      window.removeEventListener('auth:changed', onAuthChanged);
    };
  }, []);

  const onWishChange = async (id, next) => {
  // ⛔ ยังไม่ล็อกอิน → ส่งไปหน้า login
  const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }

    try {
      const prev = wishlistIds.has(id);
      await toggleWishlist(id, prev);
      setWishlistIds(prevSet => {
        const s = new Set(prevSet);
        if (next) s.add(id); else s.delete(id);
        return s;
      });
      window.dispatchEvent(new CustomEvent('wishlist:changed', { detail: { id, added: next } }));
    } catch (err) {
      console.error('เปลี่ยนสถานะ wishlist ไม่สำเร็จ', err);
    }
  };

  // ----- Loading -----
  if (loading) {
    return (
      <section id="Featured" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h3 className="text-4xl font-bold text-gray-800 mb-2">ที่พักแนะนำ</h3>
              <p className="text-gray-600 text-lg">กำลังโหลดรายการ…</p>
            </div>
            <div className="opacity-0">placeholder</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 bg-white rounded-xl shadow animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ----- Error -----
  if (error) {
    return (
      <section id="Featured" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">ที่พักแนะนำ</h3>
          </div>
          <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        </div>
      </section>
    );
  }

  // ----- Normal render -----
  return (
    <section id="Featured" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h3 className="text-4xl font-bold text-gray-800 mb-2">แนะนำ</h3>
            <p className="text-gray-600 text-lg">รายการที่ยอดนิยมและมีคุณภาพ</p>
          </div>
          <Link to="/properties" className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
            ดูทั้งหมด <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((p) => (
            <div key={p.id} className="hover:bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl/30 transition-all duration-300 transform hover:-translate-y-2">
              <div className="relative w-full aspect-[3/2]">
                <Link to={`/properties/${p.id}`} aria-label={p.title}>
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                </Link>

                {p.badge && (
                  <span className={`absolute top-3 left-3 ${p.badgeColor || 'bg-green-500'} text-white px-2 py-0.5 rounded-full text-xs font-medium`}>
                    {p.badge}
                  </span>
                )}

                <HeartButton
                  id={p.id}
                  isWished={wishlistIds.has(p.id)}
                  onChange={(next) => onWishChange(p.id, next)}
                />
              </div>

              <div className="p-4">
                <div className="text-blue-600 font-bold text-lg">
                  ฿{Number(p.price || 0).toLocaleString('th-TH')} <span className="text-gray-500 text-sm">/เดือน</span>
                </div>
                <Link to={`/properties/${p.id}`} className="font-semibold text-gray-800 text-sm mt-1 line-clamp-2">
                  {p.title}
                </Link>
                <p className="text-gray-500 text-xs mt-1 flex items-center">
                  <MapPin className="text-red-500 w-4 h-4 mr-1" /> {p.location || '-'}
                </p>

                {(p.bedrooms != null || p.bathrooms != null || p.area != null) && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-gray-600">
                    <div className="flex items-center gap-1 min-w-0">
                      <BedDouble className="w-3.5 h-3.5" />
                      <span className="truncate">{p.bedrooms != null ? `${p.bedrooms} ห้องนอน` : '—'}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 min-w-0">
                      <ShowerHead className="w-3.5 h-3.5" />
                      <span className="truncate">{p.bathrooms != null ? `${p.bathrooms} ห้องน้ำ` : '—'}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end min-w-0">
                      <Ruler className="w-3.5 h-3.5" />
                      <span className="truncate">{p.area != null ? `${p.area} ตร.ม.` : '—'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
