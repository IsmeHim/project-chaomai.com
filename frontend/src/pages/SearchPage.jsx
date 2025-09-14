// src/pages/SearchPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import HeartButton from '../components/buttons/HeartButton';
import { fetchWishlist } from '../lib/wishlist';
import { Search, SlidersHorizontal, MapPin, X, BedDouble, ShowerHead, Ruler } from 'lucide-react';
import Footer from '../components/Footer';

function toPublicUrl(u) {
  if (!u) return '/images/placeholder.svg';
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

  // wishlist
  const [wishlistIds, setWishlistIds] = useState(new Set());
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!localStorage.getItem('token')) { setWishlistIds(new Set()); return; }
      try {
        const { ids } = await fetchWishlist();
        if (alive) setWishlistIds(ids || new Set());
      } catch { if (alive) setWishlistIds(new Set()); }
    })();
    return () => { alive = false };
  }, []);
  const onWishChange = (id, next) => {
    setWishlistIds(prev => {
      const s = new Set(prev);
      if (next) s.add(id); else s.delete(id);
      return s;
    });
    window.dispatchEvent(new CustomEvent('wishlist:changed', { detail: { id, added: next } }));
  };

  // โหลดประเภท
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get('/types');
        const list = (data || []).map(t => ({ id: t._id, name: t.name }));
        if (alive) setTypes(list);
      } catch {
        // {*/ เงียบ ๆ ไว้ */}
      }
    })();
    return () => { alive = false };
  }, []);

  // โหลดผลลัพธ์
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const params = new URLSearchParams();
        const type = q.get('type');
        const keyword = q.get('q');
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
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            area: p.area,
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

  // ฟอร์มฟิลเตอร์
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

  const clearOne = (key) => {
    const params = new URLSearchParams(q.toString());
    params.delete(key);
    navigate(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const clearAll = () => navigate('/search');

  const activeChips = [
    q.get('type') && { key: 'type', label: types.find(t => t.id === q.get('type'))?.name || 'ประเภท' },
    q.get('q') && { key: 'q', label: `คำค้น: ${q.get('q')}` },
    (q.get('minPrice') || q.get('maxPrice')) && {
      key: 'price',
      label: q.get('maxPrice')
        ? `ราคา: ${q.get('minPrice') || 0} - ${q.get('maxPrice')}`
        : `ราคา: ${q.get('minPrice')}+`,
    },
  ].filter(Boolean);

  return (
    <>
      <section className="pt-16 pb-16 bg-gray-50 min-h-screen">
        {/* breadcrumbs */}
        <nav className="max-w-7xl mx-auto px-4 py-4 text-sm text-gray-500 dark:text-slate-400">
          <Link to="/" className="hover:text-gray-700 dark:hover:text-slate-200">หน้าแรก</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-slate-200">ค้นหา</span>
        </nav>
        <div className="max-w-7xl mx-auto px-4">
          {/* Title + count */}
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">ผลการค้นหา</h1>
            {!loading && !err && (
              <p className="text-gray-600 mt-1 text-sm">{items.length.toLocaleString('th-TH')} รายการ</p>
            )}
          </div>

          {/* Filter capsule (sticky) */}
          <div className="sticky top-[72px] z-30 mb-6">
            <form
              onSubmit={applyFilter}
              className="rounded-2xl bg-white/85 backdrop-blur border border-gray-200 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.15)] px-3 py-3 md:px-4 md:py-4"
            >
              <div className="grid grid-cols-1 gap-2 md:gap-3 md:flex md:flex-nowrap md:items-stretch md:[&>*]:min-w-0">
                {/* Type */}
                <div className="w-full md:w-[220px] md:flex-none">
                  <select
                    value={form.type}
                    onChange={setField('type')}
                    className="w-full h-11 rounded-xl bg-white border border-gray-200 px-3 text-sm appearance-none"
                  >
                    <option value="">ทุกประเภท</option>
                    {types.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Keyword */}
                <div className="relative w-full md:w-[320px] md:flex-none">
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
                <div className="w-full md:w-[200px] md:flex-none">
                  <select
                    value={form.price}
                    onChange={setField('price')}
                    className="w-full h-11 rounded-xl bg-white border border-gray-200 px-3 text-sm appearance-none"
                  >
                    <option value="">ทุกช่วงราคา</option>
                    <option value="0-5000">ต่ำกว่า 5,000</option>
                    <option value="5000-10000">5,000 - 10,000</option>
                    <option value="10000-20000">10,000 - 20,000</option>
                    <option value="20000+">มากกว่า 20,000</option>
                  </select>
                </div>

                {/* Submit */}
                <div className="w-full md:w-auto md:flex-none">
                  <button
                    type="submit"
                    className="w-full md:w-auto h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <SlidersHorizontal size={16} />
                    ใช้ตัวกรอง
                  </button>
                </div>
              </div>

              {/* Active filter chips */}
              {activeChips.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {activeChips.map(ch => (
                    <span
                      key={ch.key}
                      className="inline-flex items-center gap-1 text-sm rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1"
                    >
                      {ch.label}
                      <button
                        type="button"
                        className="p-1 hover:text-blue-900"
                        onClick={() => {
                          if (ch.key === 'price') {
                            const params = new URLSearchParams(q.toString());
                            params.delete('minPrice'); params.delete('maxPrice');
                            navigate(`/search${params.toString() ? `?${params.toString()}` : ''}`);
                          } else {
                            clearOne(ch.key);
                          }
                        }}
                        aria-label="ลบตัวกรอง"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-sm text-gray-600 hover:text-gray-800 underline underline-offset-2"
                  >
                    ล้างทั้งหมด
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Results */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white ring-1 ring-gray-200">
                  <div className="w-full aspect-[3/2] bg-gray-200 animate-pulse" />
                  <div className="p-4">
                    <div className="h-5 w-28 bg-gray-200 rounded mb-2 animate-pulse" />
                    <div className="h-4 w-full bg-gray-200 rounded mb-1 animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : err ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">{err}</div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center text-2xl">🔎</div>
              <p className="text-gray-800 font-semibold">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
              <p className="text-gray-500 text-sm mt-1">ลองปรับตัวกรองหรือล้างทั้งหมดแล้วค้นหาใหม่</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {items.map(p => (
                <Link
                  key={p.id}
                  to={`/properties/${encodeURIComponent(p.id)}`}
                  className="group block bg-white rounded-3xl overflow-hidden ring-1 ring-gray-200 hover:ring-blue-300/60 shadow-sm hover:shadow-xl/30 transition-all duration-300 transform hover:-translate-y-2"
                >
                  {/* รูป */}
                  <div className="relative w-full aspect-[3/2]">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = '/images/placeholder.svg'; }}
                    />

                    {/* badge แนะนำถ้า approved */}
                    {p.approved && (
                      <span className="absolute top-3 left-3 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white bg-emerald-600">
                        แนะนำ
                      </span>
                    )}

                    {/* Heart: ชิดขอบขวาบนจริง ๆ — ลบ wrapper กลมที่เกะกะออก */}
                    <div className="top-2 right-2 md:top-3 md:right-3 z-10">
                      <HeartButton
                        id={p.id}
                        isWished={wishlistIds.has(p.id)}
                        onChange={(next) => onWishChange(p.id, next)}
                      />
                    </div>
                  </div>

                  {/* เนื้อหา */}
                  {/* -------- BLOCK: ชื่อ + ราคา (ขวา) บรรทัดเดียว -------- */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="block font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                          {p.title}
                        </div>
                      </div>

                      {/* ✅ ราคา + /เดือน ในบรรทัดเดียว */}
                      <div className="shrink-0 text-right leading-none">
                        <span className="text-[15px] md:text-[16px] font-extrabold tracking-tight text-gray-900">
                          ฿{Number(p.price || 0).toLocaleString('th-TH')}
                        </span>
                        <span className="ml-1 align-baseline text-[12px] md:text-[12.5px] font-medium text-blue-700">
                          /เดือน
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 text-gray-600 text-xs flex items-start">
                      <MapPin className="text-red-500 w-4 h-4 mr-1 mt-[1px]" />
                      <span className="line-clamp-1">{p.location}</span>
                    </div>

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
