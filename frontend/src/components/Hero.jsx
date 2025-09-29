import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import CategoriesSection from "./CategoriesSection";
import { Home, Building2, Warehouse, Hotel, Search } from "lucide-react";

// ===== helpers: parse free-text search =====
function toNumber(s) {
  const t = String(s).trim().toLowerCase().replace(/[, ]+/g, "");
  const mK = t.match(/^(\d+)(k|พัน)$/i);
  if (mK) return Number(mK[1]) * 1000;
  return Number(t);
}

function parseQuery(input, typesList) {
  const raw = (input || "").toLowerCase().replace(/[,]+/g, " ").replace(/\s+/g, " ").trim();
  const out = { q: "", minPrice: undefined, maxPrice: undefined, bedrooms: undefined, bathrooms: undefined, type: "" };

  const typeMap = new Map();
  (typesList || []).forEach(t => {
    if (t?.name) typeMap.set(String(t.name).toLowerCase(), t.id);
    if (t?.slug) typeMap.set(String(t.slug).toLowerCase(), t.id);
  });

  const typeAlias = {
    "บ้าน": "house",
    "หอ": "dorm",
    "หอพัก": "dorm",
    "คอนโด": "condo",
    "ทาวน์โฮม": "townhome",
    "โกดัง": "warehouse",
    "อพาร์ตเมนต์": "apartment",
  };

  let rest = raw;

  // ช่วงราคา: 5-8k, 5000-8000
  let m = rest.match(/(\d+)\s*-\s*(\d+)\s*(k|พัน)?/i);
  if (m) {
    out.minPrice = toNumber(m[1] + (m[3] || ""));
    out.maxPrice = toNumber(m[2] + (m[3] || ""));
    rest = rest.replace(m[0], "");
  }
  // มากกว่า / + / >=
  m = rest.match(/(?:>=|มากกว่า|เกิน|ขึ้นไป|\+)\s*(\d+)\s*(k|พัน)?/);
  if (!m) m = rest.match(/(\d+)\s*(k|พัน)?\s*\+$/);
  if (m) {
    out.minPrice = toNumber(m[1] + (m[2] || ""));
    rest = rest.replace(m[0], "");
  }
  // ต่ำกว่า / <=
  m = rest.match(/(?:<=|ไม่เกิน|ต่ำกว่า|น้อยกว่า)\s*(\d+)\s*(k|พัน)?/);
  if (m) {
    out.maxPrice = toNumber(m[1] + (m[2] || ""));
    rest = rest.replace(m[0], "");
  }

  // ห้องนอน/น้ำ
  m = rest.match(/(\d+)\s*(นอน|ห้องนอน|bed(?:rooms?)?)/);
  if (m) {
    out.bedrooms = Number(m[1]);
    rest = rest.replace(m[0], "");
  }
  m = rest.match(/(\d+)\s*(น้ำ|ห้องน้ำ|bath(?:rooms?)?)/);
  if (m) {
    out.bathrooms = Number(m[1]);
    rest = rest.replace(m[0], "");
  }

  // ประเภทจาก alias → id
  for (const [k, v] of Object.entries(typeAlias)) {
    if (rest.includes(k) && !out.type) {
      const mapped = typeMap.get(v) || typeMap.get(k) || "";
      if (mapped) out.type = mapped;
      rest = rest.replace(k, "").trim();
      break;
    }
  }
  // ตรงกับชื่อ/slug
  if (!out.type) {
    for (const [nameOrSlug, id] of typeMap.entries()) {
      const re = new RegExp(`\\b${nameOrSlug}\\b`, "i");
      if (re.test(rest)) {
        out.type = id;
        rest = rest.replace(re, "").trim();
        break;
      }
    }
  }

  out.q = rest.trim();
  return out;
}

export default function Hero() {
  const navigate = useNavigate();

  const bgUrl =
    "https://images.unsplash.com/photo-1543402648-8ffee30f807a?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.1.0";

  const [form, setForm] = useState({ keyword: "" });
  const [types, setTypes] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/types");
        const list = (data || []).map((t) => ({
          id: t._id,
          name: t.name,
          slug: t.slug,
        }));
        if (alive) setTypes(list);
      } catch {
        // เงียบไว้ก็พอ หาก /types ล่ม parseQuery จะยังทำงานได้ (type จะว่าง)
      }
    })();
    return () => { alive = false; };
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const { q, minPrice, maxPrice, bedrooms, bathrooms, type } = parseQuery(form.keyword, types);

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    if (minPrice != null) params.set("minPrice", String(minPrice));
    if (maxPrice != null) params.set("maxPrice", String(maxPrice));
    if (bedrooms != null) params.set("bedrooms", String(bedrooms));
    if (bathrooms != null) params.set("bathrooms", String(bathrooms));

    navigate(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section
      id="Hero"
      className="relative text-white mt-16 pt-10 pb-1 md:pt-5 md:pb-1 overflow-hidden"
    >
      {/* BG */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      <div className="absolute inset-0 bg-black/55 md:bg-neutral-900/40 dark:md:bg-black/50" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70 md:from-black/20 md:via-black/35 md:to-black/60" />

      {/* บรรยากาศ (ซ่อนบนมือถือ) */}
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="absolute -top-32 -left-20 w-[55rem] h-[55rem] rotate-12 bg-gradient-to-br from-blue-500/10 via-fuchsia-400/10 to-amber-300/10 blur-3xl" />
        <div className="absolute top-24 -right-24 w-[48rem] h-[48rem] -rotate-12 bg-gradient-to-br from-purple-500/10 via-sky-400/10 to-rose-300/10 blur-3xl" />
      </div>

      {/* Icons ลอย (ซ่อนบนมือถือ) */}
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        <div className="absolute left-6 top-16 opacity-40">
          <div className="animate-float-slow">
            <Home size={72} />
          </div>
        </div>
        <div className="absolute right-8 bottom-16 opacity-35">
          <div className="animate-float-slower" style={{ animationDelay: "0.6s" }}>
            <Building2 size={60} />
          </div>
        </div>
        <div className="absolute left-[10%] md:left-[18%] top-[28%] opacity-30">
          <div className="relative w-32 h-32 animate-orbit">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
              <Warehouse size={24} />
            </div>
            <div className="absolute top-1/2 -left-2 -translate-y-1/2">
              <Hotel size={20} />
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
              <Home size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-5 md:pt-5 flex items-center">
        <div className="w-full text-center">
          <h2 className="text-[28px] leading-[1.15] font-extrabold md:text-6xl md:leading-tight tracking-tight drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
            ค้นหาอสังหาของคุณ{" "}
            <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
              ที่นี่
            </span>
          </h2>

          {/* <p className="mt-3 md:mt-6 text-base md:text-2xl text-white/90 max-w-xl md:max-w-3xl mx-auto">
            แพลตฟอร์มค้นหาบ้านเช่า หอพัก และอสังหาริมทรัพย์เช่าที่ครบครันที่สุด
          </p> */}

          {/* Search Capsule */}
          <form onSubmit={onSearch} className="mt-6 md:mt-6">
            <div className="mx-auto max-w-5xl">
              <div
                className="rounded-2xl md:rounded-3xl bg-zinc-800/35 backdrop-blur-xl border border-white/10 shadow-[0_12px_36px_-8px_rgba(0,0,0,.45)] px-3 py-3 md:px-4 md:py-5"
                style={{ WebkitBackdropFilter: "saturate(120%) blur(14px)" }}
              >
                <div className="flex flex-col md:flex-row md:items-stretch gap-3 md:gap-4">
                  <div className="relative flex-1 min-w-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
                      <Search size={18} />
                    </span>
                    <input
                      type="text"
                      value={form.keyword}
                      onChange={(e)=> setForm(s=>({ ...s, keyword: e.target.value }))}
                      placeholder="พิมพ์ค้นหาได้เลย เช่น: คอนโด ใกล้ มอ 5-8k 2นอน 1น้ำ"
                      inputMode="search"
                      className="w-full h-12 md:h-[52px] pl-10 pr-4 rounded-lg md:rounded-xl bg-zinc-900/40 border border-white/30 placeholder:text-gray-400 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="md:hidden mt-1 text-[12px] text-white/70">
                      รูปแบบราคา: 5-8k, 8000+, ต่ำกว่า 5000
                    </div>
                  </div>

                  <div className="md:w-auto md:flex-none">
                    <button
                      type="submit"
                      className="w-full md:w-auto px-5 md:px-6 h-12 md:h-[52px] rounded-lg md:rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2 text-white shrink-0"
                    >
                      <Search size={18} />
                      ค้นหา
                    </button>
                  </div>
                </div>

                <div className="hidden md:flex mt-3 text-sm text-white/80 gap-4">
                  <span className="opacity-80">ตัวอย่าง:</span>
                  <span className="opacity-80">บ้าน ใกล้ มอ 5000-8000 2นอน</span>
                  <span className="opacity-80">คอนโด เซ็นทรัล 8000+</span>
                  <span className="opacity-80">โกดัง ยะลา ต่ำกว่า 20000</span>
                </div>
              </div>
            </div>
          </form>

          <div className="mt-5 md:mt-8 pb-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] md:text-sm text-white/90">
            {/* <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              รายการกว่า 5,000+
            </div> */}
            <div className="hidden md:block w-px h-4 bg-white/40" />
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-sky-400" />
              อัปเดตทุกวัน
            </div>
            <div className="hidden md:block w-px h-4 bg-white/40" />
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-300" />
              รีวิวจากผู้ใช้งานจริง
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float-slow { 0%{transform:translateY(0)}50%{transform:translateY(-10px)}100%{transform:translateY(0)} }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        @keyframes float-slower { 0%{transform:translateY(0)}50%{transform:translateY(12px)}100%{transform:translateY(0)} }
        .animate-float-slower { animation: float-slower 8s ease-in-out infinite; }
        @keyframes orbit { 0%{transform:rotate(0)}100%{transform:rotate(360deg)} }
        .animate-orbit { animation: orbit 22s linear infinite; transform-origin: 50% 50%; }

        @media (prefers-reduced-motion: reduce) {
          .animate-float-slow, .animate-float-slower, .animate-orbit { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
