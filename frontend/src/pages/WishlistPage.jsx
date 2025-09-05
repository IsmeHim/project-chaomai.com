import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { fetchWishlist, removeFromWishlist } from '../lib/wishlist';
import Footer from '../components/Footer';

// ให้ URL รูปใช้ได้ทั้ง dev/prod
function toPublicUrl(u) {
  if (!u) return '/placeholder.svg';
  if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u)) return u;
  try {
    const base = (api?.defaults?.baseURL || '').replace(/\/+$/, '');
    const origin = base.replace(/\/api(?:\/)?$/, '');
    return `${origin}${u.startsWith('/') ? u : `/${u}`}`;
  } catch {
    return u;
  }
}

export default function WishlistPage() {
  const nav = useNavigate();
  const authed = !!localStorage.getItem('token');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authed) {
      nav('/login?next=/wishlist', { replace: true });
      return;
    }
    (async () => {
      setLoading(true);
      const { items } = await fetchWishlist();
      setItems(items);
      setLoading(false);
    })();
  }, [authed, nav]);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">ถูกใจของฉัน</h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) =>
              <div key={i} className="h-56 bg-white rounded-xl shadow animate-pulse" />
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
        <section className="py-25 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">ถูกใจของฉัน</h1>
            {items.length > 0 && (
                <span className="text-sm text-gray-600">ทั้งหมด {items.length} รายการ</span>
            )}
            </div>

            {items.length === 0 ? (
            <div className="bg-white border rounded-xl p-8 text-center text-gray-600">
                ยังไม่มีรายการที่ถูกใจ ลองกดหัวใจในหน้ารายการที่พักดูสิ!
            </div>
            ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {items.map(p => (
                <div key={p.id} className="bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition">
                    <Link to={`/properties/${p.id}`} className="block relative h-40">
                    <img src={toPublicUrl(p.image)} alt={p.title} className="w-full h-full object-cover" />
                    {p.approved && (
                        <span className="absolute top-3 left-3 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                        แนะนำ
                        </span>
                    )}
                    </Link>
                    <div className="p-4">
                    <div className="text-blue-600 font-bold">
                        ฿{Number(p.price || 0).toLocaleString('th-TH')}
                        <span className="text-gray-500 text-sm"> /เดือน</span>
                    </div>
                    <Link to={`/properties/${p.id}`} className="font-semibold text-gray-800 text-sm mt-1 line-clamp-2">
                        {p.title}
                    </Link>
                    <p className="text-gray-500 text-xs mt-1">
                        <i className="fas fa-map-marker-alt text-red-500 mr-1" />
                        {p.address}
                    </p>

                        <button
                            onClick={async () => {
                                await removeFromWishlist(p.id);
                                setItems(s => s.filter(x => x.id !== p.id));

                                // 🔔 แจ้ง Navbar ให้รีโหลดจำนวนแบบเรียลไทม์
                                window.dispatchEvent(new CustomEvent('wishlist:changed', { detail: { id: p.id, added: false } }));
                            }}
                            className="mt-3 inline-flex items-center gap-2 text-rose-600 hover:text-rose-700"
                            >
                            <i className="fa-solid fa-heart-crack" />
                            เอาออกจากถูกใจ
                        </button>

                    </div>
                </div>
                ))}
            </div>
            )}
        </div>
        </section>
        <Footer />
    </>
  );
}
