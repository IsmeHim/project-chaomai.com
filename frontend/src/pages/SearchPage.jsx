// src/pages/SearchPage.jsx — Single smart search, no dark mode
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import HeartButton from '../components/buttons/HeartButton';
import { fetchWishlist } from '../lib/wishlist';
import { Search, MapPin, BedDouble, ShowerHead, Ruler } from 'lucide-react';
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

/** ---------- Smart query parser ----------
 * รองรับ:
 *  "5000-8000"     → minPrice=5000, maxPrice=8000
 *  "<8000", "≤8000", "ไม่เกิน 8k" → maxPrice=8000
 *  ">5000", "≥5000", "มากกว่า 5,000" → minPrice=5000
 *  "คอนโด 8พัน บางนา" → q="คอนโด บางนา", min≈8000
 */
function parseSmartQuery(input) {
  const raw = String(input || '').trim();
  if (!raw) return { q: '', minPrice: '', maxPrice: '' };

  const normalizeNum = (s) => {
    const t = s.replace(/[,\s]/g, '').toLowerCase();
    if (/^\d+(\.\d+)?k$/.test(t)) return Math.round(parseFloat(t) * 1000);
    if (/^(\d+(\.\d+)?)(พัน)$/.test(t)) return Math.round(parseFloat(t) * 1000);
    if (/^(\d+(\.\d+)?)(หมื่น)$/.test(t)) return Math.round(parseFloat(t) * 10000);
    if (/^\d+(\.\d+)?$/.test(t)) return Math.round(parseFloat(t));
    return Number.NaN;
  };

  let q = raw;
  let minPrice = '';
  let maxPrice = '';

  // ช่วงราคา a-b
  const rangeMatch = raw.match(/([0-9.,]+(?:k|พัน|หมื่น)?)\s*[-–]\s*([0-9.,]+(?:k|พัน|หมื่น)?)/i);
  if (rangeMatch) {
    const n1 = normalizeNum(rangeMatch[1]);
    const n2 = normalizeNum(rangeMatch[2]);
    if (Number.isFinite(n1) && Number.isFinite(n2)) {
      minPrice = String(Math.min(n1, n2));
      maxPrice = String(Math.max(n1, n2));
      q = raw.replace(rangeMatch[0], '').trim();
    }
  }

  // ≤ / < / ไม่เกิน
  if (!maxPrice) {
    const le = raw.match(/(?:<=|≤|<|ไม่เกิน|ต่ำกว่า)\s*([0-9.,]+(?:k|พัน|หมื่น)?)/i);
    if (le) {
      const n = normalizeNum(le[1]);
      if (Number.isFinite(n)) {
        maxPrice = String(n);
        q = raw.replace(le[0], '').trim();
      }
    }
  }

  // ≥ / > / มากกว่า / อย่างน้อย
  if (!minPrice) {
    const ge = raw.match(/(?:>=|≥|>|มากกว่า|อย่างน้อย)\s*([0-9.,]+(?:k|พัน|หมื่น)?)/i);
    if (ge) {
      const n = normalizeNum(ge[1]);
      if (Number.isFinite(n)) {
        minPrice = String(n);
        q = raw.replace(ge[0], '').trim();
      }
    }
  }

  // เจอเลขโดด ๆ (ตีความเป็น min)
  if (!minPrice && !maxPrice) {
    const singleNum = raw.match(/([0-9.,]+(?:k|พัน|หมื่น)?)/i);
    if (singleNum) {
      const n = normalizeNum(singleNum[1]);
      if (Number.isFinite(n)) {
        minPrice = String(n);
        q = raw.replace(singleNum[0], '').trim();
      }
    }
  }

  return { q: q.trim(), minPrice, maxPrice };
}

export default function SearchPage() {
  const qsp = useQuery();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');

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

  // โหลดผลลัพธ์
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const params = new URLSearchParams();
        const keyword  = qsp.get('q');
        const minPrice = qsp.get('minPrice');
        const maxPrice = qsp.get('maxPrice');

        if (keyword)  params.set('q', keyword);
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
  }, [qsp]);

  // ช่องค้นหาเดียว (initial จาก URL)
  const [smartInput, setSmartInput] = useState(() => {
    const parts = [];
    const q = qsp.get('q') || '';
    const min = qsp.get('minPrice');
    const max = qsp.get('maxPrice');
    if (min && max) parts.push(`${min}-${max}`);
    else if (min) parts.push(`>${min}`);
    else if (max) parts.push(`<${max}`);
    if (q) parts.push(q);
    return parts.join(' ').trim();
  });

  const submitSmart = (e) => {
    e?.preventDefault?.();
    const parsed = parseSmartQuery(smartInput);
    const params = new URLSearchParams();
    if (parsed.q) params.set('q', parsed.q);
    if (parsed.minPrice) params.set('minPrice', parsed.minPrice);
    if (parsed.maxPrice) params.set('maxPrice', parsed.maxPrice);
    navigate(`/search${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const clearAll = () => {
    setSmartInput('');
    navigate('/search');
  };

  return (
    <>
      {/* บังคับโทนสว่างทั้งหน้า */}
      <section className="pt-16 pb-16 bg-gray-50 min-h-screen [color-scheme:light]">
        {/* breadcrumbs (light only) */}
        <nav className="max-w-7xl mx-auto px-4 py-4 text-sm text-gray-500">
          <Link to="/" className="hover:text-gray-700">หน้าแรก</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">ค้นหา</span>
        </nav>

        <div className="max-w-7xl mx-auto px-4">
          {/* Title + count */}
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">ผลการค้นหา</h1>
            {!loading && !err && (
              <p className="text-gray-600 mt-1 text-sm">{items.length.toLocaleString('th-TH')} รายการ</p>
            )}
          </div>

          {/* Single smart search capsule */}
          {/* Single smart search capsule */}
          <div className="sticky top-[72px] z-30 mb-6">
            <form
              onSubmit={submitSmart}
              className="rounded-2xl bg-white/85 backdrop-blur border border-gray-200 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.15)] px-3 py-3 md:px-4 md:py-4"
            >
              {/* แถว input: สูงคงที่ */}
              <div className="relative h-11">
                {/* icon คงที่ ไม่รับคลิก */}
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 leading-none">
                  <Search size={16} />
                </span>

                {/* input: เผื่อพื้นที่ปุ่มขวาให้พอ */}
                <input
                  className="w-full h-11 pl-9 pr-32 rounded-xl bg-white border border-gray-200 text-sm"
                  placeholder='พิมพ์ได้เลย เช่น "คอนโด 7000-12000 บางนา" หรือ "บ้านเดี่ยว 8พัน"'
                  value={smartInput}
                  onChange={(e) => setSmartInput(e.target.value)}
                />

                {/* ปุ่มค้นหา: วาง absolute กึ่งกลางแนวตั้ง */}
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                >
                  ค้นหา
                </button>
              </div>

              {/* บรรทัดคำอธิบาย + ปุ่มล้าง (อยู่นอก div.relative) */}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <div className="text-xs text-gray-500">
                  ตัวอย่าง: <span className="font-medium">“อพาร์ตเมนต์ 5k-8k ยะลา”</span>, <span className="font-medium">“คอนโด &lt;12000 บางนา”</span>, <span className="font-medium">“บ้านเดี่ยว มากกว่า 7000”</span>
                </div>
                {(qsp.get('q') || qsp.get('minPrice') || qsp.get('maxPrice')) && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs text-gray-600 underline underline-offset-2"
                  >
                    ล้างเงื่อนไขทั้งหมด
                  </button>
                )}
              </div>
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
              <p className="text-gray-500 text-sm mt-1">ลองพิมพ์คำค้นใหม่ หรือพิมพ์ช่วงราคา เช่น 5000-8000</p>
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
                    {p.approved && (
                      <span className="absolute top-3 left-3 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white bg-emerald-600">
                        แนะนำ
                      </span>
                    )}
                    {/* Heart ปักขวาบน */}
                    <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10">
                      <HeartButton
                        id={p.id}
                        isWished={wishlistIds.has(p.id)}
                        onChange={(next) => onWishChange(p.id, next)}
                      />
                    </div>
                  </div>

                  {/* เนื้อหา */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="block font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                          {p.title}
                        </div>
                      </div>
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
