import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import HeartButton from '../components/buttons/HeartButton';
import { fetchWishlist } from '../lib/wishlist';
import { Search, SlidersHorizontal } from 'lucide-react';
import Footer from '../components/Footer';

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

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function SearchPage() {
  const q = useQuery();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');
  const [types, setTypes] = useState([]);

  // wishlist state
  const [wishlistIds, setWishlistIds] = useState(new Set());
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!localStorage.getItem('token')) { setWishlistIds(new Set()); return; }
      const { ids } = await fetchWishlist();
      if (alive) setWishlistIds(ids);
    })();
    return () => { alive = false };
  }, []);
  const onWishChange = (id, next) => {
    setWishlistIds(prev => {
      const s = new Set(prev);
      if (next) s.add(id); else s.delete(id);
      return s;
    });
  };

  // โหลดประเภทสำหรับฟิลเตอร์
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get('/types');
        const list = (data || []).map(t => ({ id: t._id, name: t.name }));
        if (alive) setTypes(list);
      } catch { /* ignore */ }
    })();
    return () => { alive = false };
  }, []);

  // โหลดผลลัพธ์ตามพารามิเตอร์จริงของ backend
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const params = new URLSearchParams();
        const type = q.get('type');
        const keyword = q.get('q'); // backend ค้น title
        const minPrice = q.get('minPrice');
        const maxPrice = q.get('maxPrice');

        if (type) params.set('type', type);
        if (keyword) params.set('q', keyword);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);

        const { data } = await api.get(`/properties?${params.toString()}`);
        const list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

        const mapped = list.map(p => {
          const imgs = Array.isArray(p.images) ? p.images : [];
          const cover = imgs.find(im => im.isCover) || imgs[0];
          return {
            id: String(p._id),
            title: p.title,
            price: Number(p.price || 0),
            location: p.address || '-',
            image: toPublicUrl(cover?.url),
            approved: p.approvalStatus === 'approved',
          };
        });

        if (alive) setItems(mapped);
      } catch (e) {
        if (alive) setErr(e?.response?.data?.message || 'ค้นหาไม่สำเร็จ');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false };
  }, [q]);

  // ฟอร์มกรองด้านบน (sync กับ URL)
  const [form, setForm] = useState({
    type: q.get('type') || '',
    keyword: q.get('q') || '',
    price: (() => {
      const min = q.get('minPrice'), max = q.get('maxPrice');
      if (min && max) return `${min}-${max}`;
      if (min && !max) return `${min}+`;
      return '';
    })(),
  });

  useEffect(() => {
    setForm({
      type: q.get('type') || '',
      keyword: q.get('q') || '',
      price: (() => {
        const min = q.get('minPrice'), max = q.get('maxPrice');
        if (min && max) return `${min}-${max}`;
        if (min && !max) return `${min}+`;
        return '';
      })(),
    });
  }, [q]);

  const setField = (k) => (e) => setForm(s => ({ ...s, [k]: e.target.value }));

  const applyFilter = (e) => {
    e?.preventDefault?.();
    const params = new URLSearchParams();
    if (form.type) params.set('type', form.type);
    if (form.keyword) params.set('q', form.keyword.trim());
    if (form.price) {
      if (form.price.includes('-')) {
        const [a, b] = form.price.split('-').map(v => parseInt(v, 10));
        if (!isNaN(a)) params.set('minPrice', String(a));
        if (!isNaN(b)) params.set('maxPrice', String(b));
      } else if (form.price.endsWith('+')) {
        const a = parseInt(form.price, 10);
        if (!isNaN(a)) params.set('minPrice', String(a));
      }
    }
    navigate(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <>
        <section className="pt-25 pb-16 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4">
            {/* Header + Filter bar */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                ผลการค้นหา
            </h1>

            <form onSubmit={applyFilter} className="w-full md:w-auto">
                <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                {/* Type */}
                <select
                    value={form.type}
                    onChange={setField('type')}
                    className="md:w-56 h-11 rounded-xl bg-white border border-gray-200 px-3 text-sm"
                >
                    <option value="">ทุกประเภท</option>
                    {types.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>

                {/* Keyword (ค้นชื่อประกาศตาม backend ปัจจุบัน) */}
                <div className="relative md:w-72">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Search size={16} />
                    </span>
                    <input
                    value={form.keyword}
                    onChange={setField('keyword')}
                    placeholder="คำค้น (ชื่อประกาศ)"
                    className="w-full h-11 pl-9 pr-3 rounded-xl bg-white border border-gray-200 text-sm"
                    />
                </div>

                {/* Price */}
                <select
                    value={form.price}
                    onChange={setField('price')}
                    className="md:w-48 h-11 rounded-xl bg-white border border-gray-200 px-3 text-sm"
                >
                    <option value="">ทุกช่วงราคา</option>
                    <option value="0-5000">ต่ำกว่า 5,000</option>
                    <option value="5000-10000">5,000 - 10,000</option>
                    <option value="10000-20000">10,000 - 20,000</option>
                    <option value="20000+">มากกว่า 20,000</option>
                </select>

                <button
                    type="submit"
                    className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center gap-2"
                >
                    <SlidersHorizontal size={16} />
                    ใช้ตัวกรอง
                </button>
                </div>
            </form>
            </div>

            {/* Results */}
            {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-56 bg-white rounded-xl shadow animate-pulse" />
                ))}
            </div>
            ) : err ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">{err}</div>
            ) : items.length === 0 ? (
            <div className="p-8 rounded-xl bg-white border text-center text-gray-600">
                ไม่พบรายการที่ตรงกับเงื่อนไข ลองเปลี่ยนตัวกรองดูนะครับ
            </div>
            ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {items.map(p => (
                <Link
                    key={p.id}
                    to={`/properties/${p.id}`}
                    className="block bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition"
                >
                    <div className="relative h-40 w-full">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                    {p.approved && (
                        <span className="absolute top-3 left-3 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                        แนะนำ
                        </span>
                    )}
                    <HeartButton
                        id={p.id}
                        isWished={wishlistIds.has(p.id)}
                        onChange={(next) => onWishChange(p.id, next)}
                    />
                    </div>
                    <div className="p-4">
                    <div className="text-blue-600 font-bold">
                        ฿{p.price.toLocaleString('th-TH')} <span className="text-gray-500 text-sm">/เดือน</span>
                    </div>
                    <div className="font-semibold text-gray-800 text-sm mt-1 line-clamp-2">
                        {p.title}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                        <i className="fas fa-map-marker-alt text-red-500 mr-1" />
                        {p.location}
                    </div>
                    </div>
                </Link>
                ))}
            </div>
            )}
        </div>
        </section>
        <Footer />
    </>
  );
}
