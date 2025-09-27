// src/pages/AllProperties.jsx — Single smart search, no dark mode, keep scroll-to-top
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import Footer from "../components/Footer";
import HeartButton from "../components/buttons/HeartButton";
import { fetchWishlist, toggleWishlist } from "../lib/wishlist";
import { Search, MapPin, BedDouble, ShowerHead, Ruler } from "lucide-react";

// toPublicUrl: keep consistent with other pages
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

/** -------------------- Smart query parser --------------------
 * รองรับตัวอย่าง:
 *  - "5000-8000"          → min=5000, max=8000
 *  - "<8000", "ไม่เกิน 8k" → max=8000
 *  - ">5000", "มากกว่า 5,000" → min=5000
 *  - "บ้านเดี่ยว 7000-1.2หมื่น" → type="บ้านเดี่ยว", min=7000, max=12000
 *  - "อพาร์ตเมนต์ <5k"   → type="อพาร์ตเมนต์", max=5000
 *  - "คอนโด 8พัน"        → price≈8000 (ตีความเป็น min=8000)
 */
function parseSmartQuery(input) {
  const raw = String(input || "").trim();
  if (!raw) return { q: "", min: "", max: "", type: "" };

  // helper: number with k/พัน/หมื่น
  const normalizeNum = (s) => {
    const t = s.replace(/[,\s]/g, "").toLowerCase();
    // 1.2k, 12k
    if (/^\d+(\.\d+)?k$/.test(t)) return Math.round(parseFloat(t) * 1000);
    // 8พัน / 8 พัน
    if (/^(\d+(\.\d+)?)(พัน)$/.test(t)) return Math.round(parseFloat(t) * 1000);
    // 1.2หมื่น / 12หมื่น
    if (/^(\d+(\.\d+)?)(หมื่น)$/.test(t)) return Math.round(parseFloat(t) * 10000);
    // ตัวเลขล้วน
    if (/^\d+(\.\d+)?$/.test(t)) return Math.round(parseFloat(t));
    return Number.NaN;
  };

  let q = raw;
  let min = "";
  let max = "";
  let type = "";

  // 1) จับช่วงราคา a-b
  //    รองรับตัวเลขไทยปนหน่วย k/พัน/หมื่น เช่น "7k-1.2หมื่น"
  const rangeMatch = raw.match(
    /([0-9.,]+(?:k|พัน|หมื่น)?)\s*[-–]\s*([0-9.,]+(?:k|พัน|หมื่น)?)/i
  );
  if (rangeMatch) {
    const n1 = normalizeNum(rangeMatch[1]);
    const n2 = normalizeNum(rangeMatch[2]);
    if (Number.isFinite(n1) && Number.isFinite(n2)) {
      min = String(Math.min(n1, n2));
      max = String(Math.max(n1, n2));
      // เอาคำอื่นที่ไม่ใช่ตัวเลขช่วงมาเป็น q/type ต่อ
      q = raw.replace(rangeMatch[0], "").trim();
    }
  }

  // 2) จับ "<N", "≤N", "ไม่เกิน N"
  if (!max) {
    const le = raw.match(/(?:<=|≤|<|ไม่เกิน|ต่ำกว่า)\s*([0-9.,]+(?:k|พัน|หมื่น)?)/i);
    if (le) {
      const n = normalizeNum(le[1]);
      if (Number.isFinite(n)) {
        max = String(n);
        q = raw.replace(le[0], "").trim();
      }
    }
  }

  // 3) จับ ">N", "≥N", "มากกว่า N"
  if (!min) {
    const ge = raw.match(/(?:>=|≥|>|มากกว่า|อย่างน้อย)\s*([0-9.,]+(?:k|พัน|หมื่น)?)/i);
    if (ge) {
      const n = normalizeNum(ge[1]);
      if (Number.isFinite(n)) {
        min = String(n);
        q = raw.replace(ge[0], "").trim();
      }
    }
  }

  // 4) ถ้าเจอเลขโดด ๆ เพียงรูปแบบเดียว เช่น "คอนโด 8พัน"
  if (!min && !max) {
    const singleNum = raw.match(/([0-9.,]+(?:k|พัน|หมื่น)?)/i);
    if (singleNum) {
      const n = normalizeNum(singleNum[1]);
      if (Number.isFinite(n)) {
        // ตีความเป็นงบตั้งต้น (min)
        min = String(n);
        q = raw.replace(singleNum[0], "").trim();
      }
    }
  }

  // 5) เดาจำพวก/ประเภทจากคำยอดฮิต (ปล่อยเป็น free text -> ส่งไป backend ช่อง type)
  //    คุณจะเปลี่ยนชุดคำนี้ให้ตรงกับระบบได้ตามจริง เช่น map เป็นรหัสประเภท
  const typeDict = [
    "บ้านเดี่ยว",
    "ทาวน์เฮ้าส์",
    "ทาวน์โฮม",
    "อพาร์ตเมนต์",
    "อพาร์ทเมนท์",
    "คอนโด",
    "หอพัก",
    "ห้องเช่า",
    "บ้านเช่า",
    "เชิงพาณิชย์",
    "โกดัง",
    "สำนักงาน",
  ];
  for (const t of typeDict) {
    if (raw.includes(t)) {
      type = t;
      // ไม่ต้องลบออกจาก q เสมอไป—ให้ q เป็นคีย์เวิร์ดต่อการค้นชื่อ/ที่อยู่
      break;
    }
  }

  // q ที่เหลือ: ใช้เป็นคีย์เวิร์ดชื่อ/ที่อยู่
  return {
    q: q.trim(),
    min,
    max,
    type,
  };
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

  // ===== force scroll to top on mount =====
  useEffect(() => {
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
            type: type || undefined, // backend ของคุณรองรับ free-text type อยู่แล้ว
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
    if (patch.q !== undefined || patch.sort !== undefined || patch.min !== undefined || patch.max !== undefined || patch.type !== undefined) {
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

  // ===== Single smart search handlers =====
  const [inputVal, setInputVal] = useState(q ? buildSmartInputFromParams({ q, minPrice, maxPrice, type }) : "");

  function buildSmartInputFromParams({ q, minPrice, maxPrice, type }) {
    const parts = [];
    if (type) parts.push(type);
    if (minPrice && maxPrice) parts.push(`${Number(minPrice).toLocaleString()}-${Number(maxPrice).toLocaleString()}`);
    else if (minPrice) parts.push(`>${Number(minPrice).toLocaleString()}`);
    else if (maxPrice) parts.push(`<${Number(maxPrice).toLocaleString()}`);
    if (q) parts.push(q);
    return parts.join(" ").trim();
  }

  const onSubmitSmart = (e) => {
    e?.preventDefault?.();
    const parsed = parseSmartQuery(inputVal);
    updateParam({
      q: parsed.q,
      min: parsed.min,
      max: parsed.max,
      type: parsed.type,
      page: 1,
    });
  };

  return (
    <>
      {/* Force light appearance for this page only (no dark mode) */}
      <section className="pt-16 pb-16 bg-gray-50 min-h-screen [color-scheme:light]">
        {/* breadcrumbs (light only) */}
        <nav className="max-w-7xl mx-auto px-4 py-4 text-sm text-gray-500">
          <Link to="/" className="hover:text-gray-700">หน้าแรก</Link>
          <span className="mx-2">/</span>
          <Link to="/search" className="hover:text-gray-700">ค้นหา</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">บ้านเช่าทั้งหมด</span>
        </nav>

        <div className="max-w-7xl mx-auto px-4">
          {/* Title + count */}
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">บ้านเช่าทั้งหมด</h1>
            {!loading && !err && (
              <p className="text-gray-600 mt-1 text-sm">{total.toLocaleString("th-TH")} รายการ</p>
            )}
          </div>

          {/* Single smart search capsule */}
          <div className="sticky top-[72px] z-30 mb-6">
            <div className="rounded-2xl bg-white/85 backdrop-blur border border-gray-200 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.15)] px-3 py-3 md:px-4 md:py-4">
              <form onSubmit={onSubmitSmart} className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Search size={16} />
                  </span>
                  <input
                    className="w-full h-11 pl-9 pr-28 rounded-xl bg-white border border-gray-200 text-sm"
                    placeholder="พิมพ์ได้เลย เช่น “คอนโด 7000-12000 บางนา” หรือ “บ้านเดี่ยว 8พัน”"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                  >
                    ค้นหา
                  </button>
                </div>
              </form>
              {/* คำอธิบายสั้น ๆ */}
              <div className="mt-2 text-xs text-gray-500">
                ตัวอย่าง: <span className="font-medium">“อพาร์ตเมนต์ 5k-8k ยะลา”</span>, <span className="font-medium">“คอนโด &lt;12000 บางนา”</span>, <span className="font-medium">“บ้านเดี่ยว มากกว่า 7000”</span>
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
              <p className="text-gray-500 text-sm mt-1">ลองพิมพ์คำค้นใหม่ หรือพิมพ์ช่วงราคา เช่น 5000-8000</p>
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

                    {/* Specs row */}
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
                className={`px-4 py-2 rounded-lg border ${page <= 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
              >
                ก่อนหน้า
              </button>
              {Array.from({ length: totalPages }).slice(0, 7).map((_, idx) => {
                const p = idx + 1;
                return (
                  <button
                    key={p}
                    onClick={() => updateParam({ page: p })}
                    className={`px-4 py-2 rounded-lg border ${p === page ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}
                  >
                    {p}
                  </button>
                );
              })}
              {totalPages > 7 && <span className="px-2">…</span>}
              <button
                disabled={page >= totalPages}
                onClick={() => updateParam({ page: page + 1 })}
                className={`px-4 py-2 rounded-lg border ${page >= totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
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
