import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import {
  Home,
  Building2,
  Warehouse,
  Hotel,
  MapPin,
  CircleDollarSign,
  ChevronDown,
  Search,
} from "lucide-react";

export default function Hero() {
  const navigate = useNavigate();

  const bgUrl =
    "https://images.unsplash.com/photo-1543402648-8ffee30f807a?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.1.0";

  const [form, setForm] = useState({ type: "", keyword: "", price: "" });
  const [types, setTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingTypes(true);
        const { data } = await api.get("/types");
        const list = (data || []).map((t) => ({
          id: t._id,
          name: t.name,
          slug: t.slug,
        }));
        if (alive) setTypes(list);
      } finally {
        if (alive) setLoadingTypes(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setField =
    (k) =>
    (e) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  const onSearch = (e) => {
    e.preventDefault();

    const priceStr = form.price;
    let minPrice, maxPrice;
    if (priceStr) {
      if (priceStr.includes("-")) {
        const [a, b] = priceStr.split("-").map((v) => parseInt(v, 10));
        minPrice = a;
        maxPrice = b;
      } else if (priceStr.endsWith("+")) {
        minPrice = parseInt(priceStr, 10);
      }
    }

    const params = new URLSearchParams();
    if (form.type) params.set("type", form.type);
    if (form.keyword) params.set("q", form.keyword.trim());
    if (minPrice != null) params.set("minPrice", String(minPrice));
    if (maxPrice != null) params.set("maxPrice", String(maxPrice));

    navigate(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section
      id="Hero"
      className="relative text-white mt-16 md:pt-24 pb-16 md:pb-24 overflow-hidden"
      style={{ backgroundImage: `url(${bgUrl})` }}
    >
      {/* BG */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
      {/* มือถือเข้มกว่าหน่อยเพื่อความอ่านง่าย */}
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
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-10 md:pt-16 pb-10 md:pb-20 min-h-[70vh] flex items-center">
        <div className="w-full text-center">
          {/* หัวเรื่อง: ลดขนาดบนมือถือ */}
          <h2 className="text-[28px] leading-[1.15] font-extrabold md:text-6xl md:leading-tight tracking-tight drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
            ค้นหาบ้านเช่าของคุณ{" "}
            <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
              ที่นี่
            </span>
          </h2>

          <p className="mt-3 md:mt-6 text-base md:text-2xl text-white/90 max-w-xl md:max-w-3xl mx-auto">
            แพลตฟอร์มค้นหาบ้านเช่า หอพัก และอสังหาริมทรัพย์เช่าที่ครบครันที่สุด
          </p>

          {/* Search Capsule */}
          {/* Search Capsule */}
          <form onSubmit={onSearch} className="mt-6 md:mt-10">
            <div className="mx-auto max-w-5xl">
              <div
                className="rounded-2xl md:rounded-3xl bg-white/25 dark:bg-zinc-800/35 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_12px_36px_-8px_rgba(0,0,0,.45)] px-3 py-3 md:px-4 md:py-5"
                style={{ WebkitBackdropFilter: "saturate(120%) blur(14px)" }}
              >
                {/* มือถือ = 1 คอลัมน์ / เดสก์ท็อป = บรรทัดเดียวไม่ห่อ */}
                <div className="grid grid-cols-1 gap-3 md:gap-4 md:flex md:flex-nowrap md:items-stretch md:[&>*]:min-w-0">
                  {/* Type (fixed width on desktop) */}
                  <div className="w-full md:w-[220px] md:flex-none">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 dark:text-gray-300">
                        <Home size={18} />
                      </span>
                      <select
                        value={form.type}
                        onChange={setField("type")}
                        className="w-full h-12 md:h-[52px] pl-10 pr-9 rounded-lg md:rounded-xl bg-white/70 dark:bg-zinc-900/40 border border-white/30 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      >
                        <option value="">
                          {loadingTypes ? "กำลังโหลดประเภท…" : "ประเภท"}
                        </option>
                        {types.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300">
                        <ChevronDown size={18} />
                      </span>
                    </div>
                  </div>

                  {/* Keyword (flex-grow) */}
                  <div className="w-full md:flex-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 dark:text-gray-300">
                        <MapPin size={18} />
                      </span>
                      <input
                        type="text"
                        value={form.keyword}
                        onChange={setField("keyword")}
                        placeholder="คำค้น (ตอนนี้ค้นจากชื่อประกาศ)"
                        inputMode="search"
                        className="w-full h-12 md:h-[52px] pl-10 pr-4 rounded-lg md:rounded-xl bg-white/70 dark:bg-zinc-900/40 border border-white/30 placeholder:text-gray-500 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Price (fixed width on desktop) */}
                  <div className="w-full md:w-[220px] md:flex-none">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 dark:text-gray-300">
                        <CircleDollarSign size={18} />
                      </span>
                      <select
                        value={form.price}
                        onChange={setField("price")}
                        className="w-full h-12 md:h-[52px] pl-10 pr-9 rounded-lg md:rounded-xl bg-white/70 dark:bg-zinc-900/40 border border-white/30 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      >
                        <option value="">ช่วงราคา</option>
                        <option value="0-5000">ต่ำกว่า 5,000</option>
                        <option value="5000-10000">5,000 - 10,000</option>
                        <option value="10000-20000">10,000 - 20,000</option>
                        <option value="20000+">มากกว่า 20,000</option>
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300">
                        <ChevronDown size={18} />
                      </span>
                    </div>
                  </div>

                  {/* Button (no shrink to keep one-line) */}
                  <div className="w-full md:w-auto md:flex-none">
                    <button
                      type="submit"
                      className="w-full md:w-auto px-5 md:px-6 h-12 md:h-[52px] rounded-lg md:rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2 text-white shrink-0"
                    >
                      <Search size={18} />
                      ค้นหา
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>


          {/* Trust bar: เว้นระยะ + ย่อฟอนต์บนมือถือ */}
          <div className="mt-5 md:mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] md:text-sm text-white/90">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              รายการกว่า 5,000+
            </div>
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

        /* ลด motion สำหรับผู้ใช้ที่ตั้งค่าไว้ */
        @media (prefers-reduced-motion: reduce) {
          .animate-float-slow, .animate-float-slower, .animate-orbit { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
