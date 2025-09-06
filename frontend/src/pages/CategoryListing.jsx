// src/pages/CategoryListing.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import Footer from "../components/Footer";
import HeartButton from "../components/buttons/HeartButton";
import { fetchWishlist, toggleWishlist } from "../lib/wishlist";

// ให้รูปจาก backend ใช้ได้ทั้ง dev/prod (ยึดแนวเดียวกับ Home/AllProperties)
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

export default function CategoryListing() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();

  // ===== paginations & sort =====
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));
  const pageSize = Math.min(
    24,
    Math.max(6, parseInt(params.get("pageSize") || "12", 10))
  );
  const sort = params.get("sort") || "-createdAt"; // ใหม่ก่อน

  // ===== UI/data state =====
  const [categoryId, setCategoryId] = useState(null);
  const [categoryName, setCategoryName] = useState(slug);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // 1) resolve slug -> categoryId โดยไม่ยิงรายตัว เพื่อตัด 404 noise
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: list } = await api.get("/categories");
        const found = (list || []).find(
          (c) => c.slug === slug || c._id === slug
        );
        if (alive && found) {
          setCategoryId(found._id);
          setCategoryName(found.name || slug);
        } else if (alive) {
          setCategoryId(null);
          setCategoryName(slug);
        }
      } catch {
        if (alive) {
          setCategoryId(null);
          setCategoryName(slug);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  // 2) โหลดรายการตามหมวดด้วย categoryId (ObjectId)
  useEffect(() => {
    let alive = true;
    if (!categoryId) {
      // ถ้าหมวดยังไม่ resolve ก็อย่าเพิ่งยิง
      return;
    }
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await api.get("/properties", {
          params: {
            page,
            pageSize,
            sort,
            category: categoryId, // ✅ ส่งเป็น ObjectId ตามโมเดล
          },
        });

        const raw = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        const totalCount =
          typeof data?.total === "number" ? data.total : raw.length;

        const mapped = (raw || []).map((p) => {
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
  }, [categoryId, page, pageSize, sort]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const updateParam = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") next.delete(k);
      else next.set(k, String(v));
    });
    if (patch.sort !== undefined) next.set("page", "1");
    setParams(next, { replace: true });
  };

  // ===== โหลด wishlist สำหรับ user ปัจจุบัน =====
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // โหลด wishlist ตอน mount
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!localStorage.getItem("token")) {
        setWishlistIds(new Set());
        return;
      }
      const { ids } = await fetchWishlist();
      if (alive) setWishlistIds(ids);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // เปลี่ยนสถานะหัวใจ (sync backend + อัพเดต local state)
  const handleWishChange = async (id, next) => {
    // ⛔ ยังไม่ล็อกอิน → ส่งไปหน้า login
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = `/login?next=${encodeURIComponent(
        window.location.pathname + window.location.search
      )}`;
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
      window.dispatchEvent(
        new CustomEvent("wishlist:changed", { detail: { id, added: next } })
      );
    } catch (err) {
      console.error("เปลี่ยนสถานะ wishlist ไม่สำเร็จ", err);
    }
  };

  return (
    <>
      <section className="py-25 bg-gray-50 min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                หมวด: {categoryName}
              </h1>
              <p className="text-gray-600">แสดงเฉพาะรายการในหมวดนี้</p>
            </div>

            <div className="flex gap-3 items-center">
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
              <Link
                to="/properties"
                className="text-sm text-blue-600 hover:text-blue-700 underline"
                title="ดูทั้งหมดทุกหมวด"
              >
                ดูทุกหมวด →
              </Link>
            </div>
          </div>

          {/* states */}
          {!categoryId && !loading && (
            <div className="p-4 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200">
              ไม่พบหมวดหมู่ “{slug}”
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 bg-white rounded-xl shadow animate-pulse"
                />
              ))}
            </div>
          )}
          {err && !loading && (
            <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
              {err}
            </div>
          )}

          {!loading && !err && categoryId && (
            <>
              {items.length === 0 ? (
                <div className="p-6 text-center text-gray-600 bg-white rounded-xl border">
                  หมวดนี้ยังไม่มีรายการ
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {items.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition"
                    >
                      <div className="relative h-40 w-full">
                        <Link to={`/properties/${p.id}`} aria-label={p.title}>
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        </Link>
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
                        <Link
                          to={`/properties/${p.id}`}
                          className="font-semibold text-gray-800 text-sm mt-1 line-clamp-2"
                        >
                          {p.title}
                        </Link>
                        <p className="text-gray-500 text-xs mt-1">
                          <i className="fas fa-map-marker-alt text-red-500 mr-1" />
                          {p.address}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* เปลี่ยนหน้า */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => updateParam({ page: page - 1 })}
                  className={`px-4 py-2 rounded-lg border ${
                    page <= 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-100"
                  }`}
                >
                  ก่อนหน้า
                </button>
                {Array.from({ length: totalPages })
                  .slice(0, 7)
                  .map((_, idx) => {
                    const p = idx + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => updateParam({ page: p })}
                        className={`px-4 py-2 rounded-lg border ${
                          p === page
                            ? "bg-gray-800 text-white"
                            : "hover:bg-gray-100"
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
                    page >= totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-100"
                  }`}
                >
                  ถัดไป
                </button>

                <select
                  className="ml-3 rounded-lg border px-3 py-2 text-sm"
                  value={pageSize}
                  onChange={(e) =>
                    updateParam({ pageSize: e.target.value, page: 1 })
                  }
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
