// src/pages/AllProperties.jsx — Revamp cards to match SearchPage, remove dark mode styling, add scroll-to-top fix
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import Footer from "../components/Footer";
import HeartButton from "../components/buttons/HeartButton";
import { fetchWishlist, toggleWishlist } from "../lib/wishlist";
import { Search, SlidersHorizontal, MapPin, BedDouble, ShowerHead, Ruler } from "lucide-react";

// toPublicUrl: keep consistent with other pages
// ให้รูปจาก backend ใช้ได้ทั้ง dev/prod (อิงแนวเดียวกับ Home.jsx)
function toPublicUrl(u) {
  if (!u) return "/placeholder.svg";
  if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u)) return u;
  try {
    const base = (api?.defaults?.baseURL || "").replace(/\/+$/, "");
    const origin = base.replace(/\/api(?:\/)?$/, "");
    return `${origin}${u.startsWith("/") ? u : `/${u}`}`;
  } catch {
    return u;
  }
}

export default function AllProperties() {
  const [params, setParams] = useSearchParams();

  // ===== query state from URL =====
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));
  const pageSize = Math.min(24, Math.max(6, parseInt(params.get("pageSize") || "12", 10)));
  const q = params.get("q") || "";
  const sort = params.get("sort") || "-createdAt";
  const minPrice = params.get("min") || "";
  const maxPrice = params.get("max") || "";
  const type = params.get("type") || "";

  // ===== data state =====
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ===== force scroll to top on mount (avoid landing near footer on mobile) =====
  useEffect(() => {
    // Some browsers keep scroll position between route changes
    // Ensure we start at the top of the list every time this page mounts
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // ===== load list =====
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await api.get("/properties", {
          params: {
            page,
            pageSize,
            q,
            sort,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            type: type || undefined,
          },
        });

        const rawList = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        const totalCount = typeof data?.total === "number" ? data.total : rawList.length;

        const mapped = (rawList || []).map((p) => {
          const imgs = Array.isArray(p.images) ? p.images : [];
          const cover = imgs.find((im) => im.isCover) || imgs[0];
          return {
            id: String(p._id),
            title: p.title,
            price: Number(p.price || 0),
            location: p.address || "-",
            image: toPublicUrl(cover?.url),
            approved: p.approvalStatus === "approved",
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            area: p.area,
          };
        });

        if (!alive) return;
        setItems(mapped);
        setTotal(totalCount);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "โหลดรายการไม่สำเร็จ");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [page, pageSize, q, sort, minPrice, maxPrice, type]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const updateParam = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") next.delete(k);
      else next.set(k, String(v));
    });
    if (
      patch.q !== undefined ||
      patch.sort !== undefined ||
      patch.min !== undefined ||
      patch.max !== undefined ||
      patch.type !== undefined
    ) {
      next.set("page", "1");
    }
    setParams(next, { replace: true });
  };

  // ===== wishlist for current user =====
  const [wishlistIds, setWishlistIds] = useState(new Set());
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!localStorage.getItem("token")) {
        setWishlistIds(new Set());
        return;
      }
      try {
        const { ids } = await fetchWishlist();
        if (alive) setWishlistIds(ids || new Set());
      } catch {
        if (alive) setWishlistIds(new Set());
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleWishChange = async (id, next) => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    try {
      const prev = wishlistIds.has(id);
      await toggleWishlist(id, prev);
      setWishlistIds((prevSet) => {
        const s = new Set(prevSet);
        if (next) s.add(id);
        else s.delete(id);
        return s;
      });
      window.dispatchEvent(new CustomEvent("wishlist:changed", { detail: { id, added: next } }));
    } catch (err) {
      console.error("เปลี่ยนสถานะ wishlist ไม่สำเร็จ", err);
    }
  };

  return (
    <>
      {/* Force light appearance for this page only */}
      <section className="pt-16 pb-16 bg-gray-50 min-h-screen [color-scheme:light]">
        {/* breadcrumbs */}
        <nav className="max-w-7xl mx-auto px-4 py-4 text-sm text-gray-500 dark:text-slate-400">
          <Link to="/" className="hover:text-gray-700 dark:hover:text-slate-200">หน้าแรก</Link>
          <span className="mx-2">/</span>
          <Link to="/search" className="hover:text-gray-700 dark:hover:text-slate-200">ค้นหา</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-slate-200">บ้านเช่าทั้งหมด</span>
        </nav>
        <div className="max-w-7xl mx-auto px-4">
          {/* Title + count */}
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">บ้านเช่าทั้งหมด</h1>
            {!loading && !err && (
              <p className="text-gray-600 mt-1 text-sm">{total.toLocaleString("th-TH")} รายการ</p>
            )}
          </div>

          {/* Filter capsule (sticky like SearchPage) */}
          <div className="sticky top-[72px] z-30 mb-6">
            <div className="rounded-2xl bg-white/85 backdrop-blur border border-gray-200 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.15)] px-3 py-3 md:px-4 md:py-4">
              <div className="grid grid-cols-1 gap-2 md:gap-3 md:flex md:flex-nowrap md:items-stretch md:[&>*]:min-w-0">
                {/* Keyword */}
                <div className="relative w-full md:w-[320px] md:flex-none">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Search size={16} />
                  </span>
                  <input
                    className="w-full h-11 pl-9 pr-3 rounded-xl bg-white border border-gray-200 text-sm"
                    placeholder="คำค้น (ชื่อ/ที่อยู่)"
                    value={q}
                    onChange={(e) => updateParam({ q: e.target.value })}
                  />
                </div>

                {/* Price min */}
                <div className="w-full md:w-[180px] md:flex-none">
                  <input
                    type="number"
                    className="w-full h-11 rounded-xl bg-white border border-gray-200 px-3 text-sm"
                    placeholder="ราคาเริ่มต้น (฿)"
                    value={minPrice}
                    onChange={(e) => updateParam({ min: e.target.value })}
                  />
                </div>

                {/* Price max */}
                <div className="w-full md:w-[180px] md:flex-none">
                  <input
                    type="number"
                    className="w-full h-11 rounded-xl bg-white border border-gray-200 px-3 text-sm"
                    placeholder="ราคาสูงสุด (฿)"
                    value={maxPrice}
                    onChange={(e) => updateParam({ max: e.target.value })}
                  />
                </div>

                {/* Type */}
                <div className="w-full md:w-[220px] md:flex-none">
                  <input
                    className="w-full h-11 rounded-xl bg-white border border-gray-200 px-3 text-sm"
                    placeholder="ประเภท (บ้าน/อพาร์ตเมนต์/ฯลฯ)"
                    value={type}
                    onChange={(e) => updateParam({ type: e.target.value })}
                  />
                </div>

                {/* Sort */}
                <div className="w-full md:w-[200px] md:flex-none">
                  <select
                    className="w-full h-11 rounded-xl bg-white border border-gray-200 px-3 text-sm appearance-none"
                    value={sort}
                    onChange={(e) => updateParam({ sort: e.target.value })}
                  >
                    <option value="-createdAt">ใหม่ล่าสุด</option>
                    <option value="price">ราคาต่ำ → สูง</option>
                    <option value="-price">ราคาสูง → ต่ำ</option>
                    <option value="title">ชื่อ (ก-ฮ)</option>
                  </select>
                </div>

                {/* Clear */}
                <div className="w-full md:w-auto md:flex-none">
                  <button
                    onClick={() => updateParam({ q: "", min: "", max: "", type: "", sort: "-createdAt" })}
                    className="w-full md:w-auto h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <SlidersHorizontal size={16} /> ล้างตัวกรอง
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* List / states */}
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
              {items.map((p) => (
                <Link
                  key={p.id}
                  to={`/properties/${encodeURIComponent(p.id)}`}
                  className="group block bg-white rounded-3xl overflow-hidden ring-1 ring-gray-200 hover:ring-blue-300/60 shadow-sm hover:shadow-xl/30 transition-all duration-300 transform hover:-translate-y-2"
                  aria-label={p.title}
                >
                  {/* Image */}
                  <div className="relative w-full aspect-[3/2]">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "/images/placeholder.svg";
                      }}
                    />

                    {/* Approved badge */}
                    {p.approved && (
                      <span className="absolute top-3 left-3 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white bg-emerald-600">
                        แนะนำ
                      </span>
                    )}

                    {/* Heart (absolute top-right) */}
                    <div>
                      <HeartButton
                        id={p.id}
                        isWished={wishlistIds.has(p.id)}
                        onChange={(next) => handleWishChange(p.id, next)}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Title + Price (right) */}
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="block font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                          {p.title}
                        </div>
                      </div>
                      <div className="shrink-0 text-right leading-none">
                        <span className="text-[15px] md:text-[16px] font-extrabold tracking-tight text-gray-900">
                          ฿{Number(p.price || 0).toLocaleString("th-TH")}
                        </span>
                        <span className="ml-1 align-baseline text-[12px] md:text-[12.5px] font-medium text-blue-700">
                          /เดือน
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="mt-2 text-gray-600 text-xs flex items-start">
                      <MapPin className="text-red-500 w-4 h-4 mr-1 mt-[1px]" />
                      <span className="line-clamp-1">{p.location}</span>
                    </div>

                    {/* Specs row: bedrooms / bathrooms / area */}
                    {(p.bedrooms != null || p.bathrooms != null || p.area != null) && (
                      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-gray-600">
                        <div className="flex items-center gap-1 min-w-0">
                          <BedDouble className="w-3.5 h-3.5" />
                          <span className="truncate">{p.bedrooms != null ? `${p.bedrooms} ห้องนอน` : "—"}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 min-w-0">
                          <ShowerHead className="w-3.5 h-3.5" />
                          <span className="truncate">{p.bathrooms != null ? `${p.bathrooms} ห้องน้ำ` : "—"}</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end min-w-0">
                          <Ruler className="w-3.5 h-3.5" />
                          <span className="truncate">{p.area != null ? `${p.area} ตร.ม.` : "—"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !err && items.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => updateParam({ page: page - 1 })}
                className={`px-4 py-2 rounded-lg border ${
                  page <= 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
                }`}
              >
                ก่อนหน้า
              </button>
              {Array.from({ length: totalPages }).slice(0, 7).map((_, idx) => {
                const p = idx + 1;
                return (
                  <button
                    key={p}
                    onClick={() => updateParam({ page: p })}
                    className={`px-4 py-2 rounded-lg border ${
                      p === page ? "bg-gray-900 text-white" : "hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              {totalPages > 7 && <span className="px-2">…</span>}
              <button
                disabled={page >= totalPages}
                onClick={() => updateParam({ page: page + 1 })}
                className={`px-4 py-2 rounded-lg border ${
                  page >= totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"
                }`}
              >
                ถัดไป
              </button>

              <select
                className="ml-3 rounded-lg border px-3 py-2 text-sm"
                value={pageSize}
                onChange={(e) => updateParam({ pageSize: e.target.value, page: 1 })}
              >
                {[6, 12, 16, 24].map((n) => (
                  <option key={n} value={n}>
                    {n} ต่อหน้า
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
