// src/pages/AllProperties.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import Footer from "../components/Footer";
import HeartButton from '../components/buttons/HeartButton';
import { fetchWishlist } from '../lib/wishlist';

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
  // const nav = useNavigate(); ไม่ได้ใช้

  // ===== query state จาก URL =====
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));
  const pageSize = Math.min(24, Math.max(6, parseInt(params.get("pageSize") || "12", 10)));
  const q = params.get("q") || "";
  const sort = params.get("sort") || "-createdAt"; // createdAt ใหม่ก่อน
  const minPrice = params.get("min") || "";
  const maxPrice = params.get("max") || "";
  const type = params.get("type") || ""; // เผื่อ backend รองรับ type

  // ===== data state =====
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ===== โหลดรายการ =====
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // สมมุติ backend รองรับ query: page, pageSize, q, sort, minPrice, maxPrice, type
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

        // รองรับทั้งกรณี backend ส่ง {items,total} หรือ ส่งเป็น array ธรรมดา
        const rawList = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        const totalCount = typeof data?.total === "number" ? data.total : rawList.length;

        const mapped = (rawList || []).map((p) => {
          const imgs = Array.isArray(p.images) ? p.images : [];
          const cover = imgs.find((im) => im.isCover) || imgs[0];
          return {
            id: p._id,
            title: p.title,
            price: Number(p.price || 0),
            address: p.address || "-",
            image: toPublicUrl(cover?.url),
            approved: p.approvalStatus === "approved",
          };
        });

        if (!alive) return;
        setItems(mapped);
        setTotal(totalCount);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "โหลดรายการไม่สำเร็จ");
      } finally {
        if (alive) {
          setLoading(false);
        }
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
    // รีเซ็ต page เมื่อเปลี่ยน filter
    if (patch.q !== undefined || patch.sort !== undefined || patch.min !== undefined || patch.max !== undefined || patch.type !== undefined) {
      next.set("page", "1");
    }
    setParams(next, { replace: true });
  };

  // ===== โหลด wishlist =====
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
    return () => { alive = false };
  }, []);

  // helper เปลี่ยนสถานะหัวใจหลังคลิก
  const handleWishChange = (id, next) => {
    setWishlistIds(prev => {
      const s = new Set(prev);
      if (next) s.add(id); else s.delete(id);
      return s;
    });
  };

  return (
    <>
      <section className="py-25 bg-gray-50 min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">ที่พักทั้งหมด</h1>
              <p className="text-gray-600">ค้นหา กรอง และดูรายการทั้งหมด</p>
            </div>

            {/* ค้นหา + จัดเรียง */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className="w-full sm:w-72 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                placeholder="ค้นหาชื่อ/ที่อยู่…"
                value={q}
                onChange={(e) => updateParam({ q: e.target.value })}
              />
              <select
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                value={sort}
                onChange={(e) => updateParam({ sort: e.target.value })}
              >
                <option value="-createdAt">ใหม่ล่าสุด</option>
                <option value="price">ราคาต่ำ → สูง</option>
                <option value="-price">ราคาสูง → ต่ำ</option>
                <option value="title">ชื่อ (ก-ฮ)</option>
              </select>
            </div>
          </div>

          {/* ฟิลเตอร์ราคา/ประเภท */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="number"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              placeholder="ราคาเริ่มต้น (฿/เดือน)"
              value={minPrice}
              onChange={(e) => updateParam({ min: e.target.value })}
            />
            <input
              type="number"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              placeholder="ราคาสูงสุด (฿/เดือน)"
              value={maxPrice}
              onChange={(e) => updateParam({ max: e.target.value })}
            />
            <input
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              placeholder="ประเภท (เช่น อพาร์ตเมนต์/บ้าน/ทาวน์เฮ้าส์)"
              value={type}
              onChange={(e) => updateParam({ type: e.target.value })}
            />
            <button
              onClick={() => {
                // ล้างฟิลเตอร์
                updateParam({ q: "", min: "", max: "", type: "", sort: "-createdAt" });
              }}
              className="rounded-lg bg-gray-800 text-white px-4 py-2 text-sm hover:bg-gray-900"
            >
              ล้างตัวกรอง
            </button>
          </div>

          {/* สถานะโหลด/ผิดพลาด */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-56 bg-white rounded-xl shadow animate-pulse" />
              ))}
            </div>
          )}
          {err && !loading && (
            <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">{err}</div>
          )}

          {/* รายการ */}
          {!loading && !err && (
            <>
              {items.length === 0 ? (
                <div className="p-6 text-center text-gray-600 bg-white rounded-xl border">ไม่พบรายการที่ตรงกับเงื่อนไข</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {items.map((p) => (
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
                          onChange={(next) => handleWishChange(p.id, next)}
                        />
                      </div>
                      <div className="p-4">
                        <div className="text-blue-600 font-bold">
                          ฿{Number(p.price || 0).toLocaleString("th-TH")}
                          <span className="text-gray-500 text-sm"> /เดือน</span>
                        </div>
                        <h4 className="font-semibold text-gray-800 text-sm mt-1 line-clamp-2">{p.title}</h4>
                        <p className="text-gray-500 text-xs mt-1">
                          <i className="fas fa-map-marker-alt text-red-500 mr-1" />
                          {p.address}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* เปลี่ยนหน้า */}
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
                      className={`px-4 py-2 rounded-lg border ${p === page ? "bg-gray-800 text-white" : "hover:bg-gray-100"}`}
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

                {/* เลือกจำนวนต่อหน้า */}
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
            </>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}