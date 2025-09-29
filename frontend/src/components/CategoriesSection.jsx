// src/components/CategoriesSection.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function CategoriesSection({ categories = [], loading = false }) {
  const skeletons = Array.from({ length: 10 });

  const fmtCount = (n) => {
    const v = Number.isFinite(n) ? n : 0;
    if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
    return `${v}`;
  };

  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            ประเภททั้งหมด
          </h3>
          <p className="text-gray-600 text-sm sm:text-base mt-1">
            เลือกประเภทที่ตรงกับความต้องการของคุณ
          </p>
        </div>

        {/* Grid: คอลัมน์กึ่งคงที่ จัดกลางอัตโนมัติ + แตะง่ายบนมือถือ */}
        <div className="grid gap-6 sm:gap-8 justify-center [grid-template-columns:repeat(auto-fit,minmax(120px,140px))] sm:[grid-template-columns:repeat(auto-fit,minmax(140px,160px))]">
          {loading ? (
            skeletons.map((_, i) => (
              <div key={i} className="text-center select-none">
                <div className="w-[120px] sm:w-[140px] aspect-square rounded-xl bg-gray-200 animate-pulse mx-auto" />
                <div className="h-3 w-24 bg-gray-200 rounded mt-3 mx-auto animate-pulse" />
                <div className="h-2 w-14 bg-gray-200 rounded mt-2 mx-auto animate-pulse" />
              </div>
            ))
          ) : categories.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                <span className="text-gray-500 text-xl">🏠</span>
              </div>
              <p className="text-gray-700 font-medium">ไม่พบประเภทอสังหา</p>
              <p className="text-gray-500 text-sm mt-1">
                กรุณาลองใหม่ภายหลังหรือรีเฟรชหน้า
              </p>
            </div>
          ) : (
            categories.map((c) => {
              const key = c.id || c._id || c.slug;
              const name = c.name || "-";
              const slug = encodeURIComponent(c.slug || c.id || "");
              const img = c.icon || "/images/default.jpg";
              const count = c.count ?? 0;

              return (
                <Link
                  key={key}
                  to={`/categories/${slug}`}
                  className="group block text-center focus:outline-none"
                  aria-label={`ประเภท ${name} (${count} รายการ)`}
                >
                  {/* Card */}
                  <div className="relative mx-auto w-[120px] sm:w-[140px] aspect-square rounded-xl overflow-hidden shadow-sm bg-gray-100 ring-1 ring-gray-200 transition duration-200 group-hover:translate-y-[-2px] group-hover:shadow-xl group-hover:ring-blue-300 focus-visible:translate-y-[-2px] focus-visible:ring-2 focus-visible:ring-blue-500">
                    <img
                      src={img}
                      alt={name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/images/default.jpg";
                      }}
                      loading="lazy"
                    />

                    {/* count pill */}
                    <span className="absolute top-2 right-2 rounded-full bg-white/90 backdrop-blur px-2 py-0.5 text-[11px] font-semibold text-gray-700 ring-1 ring-gray-200">
                      {fmtCount(count)}
                    </span>

                    {/* overlay on hover (เดสก์ท็อป) */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                  </div>

                  {/* Label */}
                  <h4 className="mt-2 text-gray-900 font-medium text-sm truncate">
                    {name}
                  </h4>
                  <p className="text-gray-500 text-xs">{count} รายการ</p>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
