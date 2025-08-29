import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const [form, setForm] = useState({ type: "", area: "", price: "" });

  const onSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(form).filter(([, v]) => v))
    ).toString();
    navigate(`/search${params ? `?${params}` : ""}`);
  };

  const setField = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  return (
    <section
      id="Hero"
      className="relative text-white mt-16 md:pt-24 pb-24 overflow-hidden"
      style={{ backgroundImage: `url(${bgUrl})` }}
    >
      {/* ====== Background: image + overlays (คงไว้และอัปเกรดเอฟเฟกต์) ====== */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />

      {/* Vignette หลัก */}
      <div className="absolute inset-0 bg-neutral-900/40 dark:bg-black/50" />

      {/* แสงนุ่มด้านบน + ไล่ลงล่างให้ตัวหนังสืออ่านง่าย */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/60" />

      {/* Beam แสงเฉียง (เพิ่มมิติ) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-20 w-[55rem] h-[55rem] rotate-12 bg-gradient-to-br from-blue-500/10 via-fuchsia-400/10 to-amber-300/10 blur-3xl" />
        <div className="absolute top-24 -right-24 w-[48rem] h-[48rem] -rotate-12 bg-gradient-to-br from-purple-500/10 via-sky-400/10 to-rose-300/10 blur-3xl" />
      </div>

      {/* ฟิล์มเกรนเบามาก */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 opacity=%220.6%22 width=%224%22 height=%224%22><rect width=%221%22 height=%221%22 fill=%22%23fff%22/></svg>')",
        }}
      />

      {/* ====== Animated Lucide Icons (ตกแต่งพื้นหลัง) ====== */}
      <div className="absolute inset-0 pointer-events-none">
        {/* ชั้นไอคอนด้านซ้าย */}
        <div className="absolute left-6 top-16 opacity-40">
          <div className="animate-float-slow">
            <Home size={72} />
          </div>
        </div>

        {/* ชั้นไอคอนด้านขวาล่าง */}
        <div className="absolute right-8 bottom-16 opacity-35">
          <div className="animate-float-slower" style={{ animationDelay: "0.6s" }}>
            <Building2 size={60} />
          </div>
        </div>

        {/* ไอคอนวงโคจรเบา ๆ กลางจอ */}
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

        {/* ชั้น particle เล็ก ๆ ลอยช้า ๆ */}
        <div className="absolute inset-0">
          <span className="absolute left-[20%] top-[20%] w-1 h-1 rounded-full bg-white/50 animate-drift" />
          <span className="absolute left-[35%] top-[35%] w-1 h-1 rounded-full bg-white/50 animate-drift [animation-delay:.4s]" />
          <span className="absolute left-[60%] top-[30%] w-1 h-1 rounded-full bg-white/50 animate-drift [animation-delay:.8s]" />
          <span className="absolute left-[75%] top-[50%] w-1 h-1 rounded-full bg-white/50 animate-drift [animation-delay:1.2s]" />
        </div>
      </div>

      {/* ====== Content ====== */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-28 min-h-[70vh] flex items-center">
        <div className="w-full text-center">
          <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tight drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
            ค้นหาบ้านเช่าของคุณ{" "}
            <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
              ที่นี่
            </span>
          </h2>

          <p className="mt-4 md:mt-6 text-lg md:text-2xl text-white/90 max-w-3xl mx-auto">
            แพลตฟอร์มค้นหาบ้านเช่า หอพัก และอสังหาริมทรัพย์เช่าที่ครบครันที่สุด
          </p>

          {/* ====== Search Capsule (glass – คงดีไซน์ที่คุณชอบ) ====== */}
          <form onSubmit={onSearch} className="mt-8 md:mt-12">
            <div className="mx-auto max-w-5xl">
              <div
                className="
                  rounded-3xl
                  bg-white/30 dark:bg-zinc-800/40
                  backdrop-blur-2xl
                  border border-white/20 dark:border-white/10
                  shadow-[0_20px_60px_-10px_rgba(0,0,0,.5)]
                  px-4 py-5
                "
              >
                <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-4">
                  {/* Type */}
                  <div className="flex-1">
                    <div className="relative h-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 dark:text-gray-300">
                        <Home size={18} />
                      </span>
                      <select
                        value={form.type}
                        onChange={setField("type")}
                        className="w-full h-full pl-9 pr-9 py-3 rounded-xl bg-white/60 dark:bg-zinc-900/40 border border-white/20 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">ประเภท</option>
                        <option value="house">บ้านเช่า</option>
                        <option value="dorm">หอพัก</option>
                        <option value="condo">คอนโด</option>
                        <option value="warehouse">โกดัง</option>
                        <option value="studio">สตูดิโอ</option>
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300">
                        <ChevronDown size={18} />
                      </span>
                    </div>
                  </div>

                  {/* Area */}
                  <div className="flex-[1.2]">
                    <div className="relative h-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 dark:text-gray-300">
                        <MapPin size={18} />
                      </span>
                      <input
                        type="text"
                        value={form.area}
                        onChange={setField("area")}
                        placeholder="ตำบล/อำเภอ เช่น เมืองยะลา"
                        className="w-full h-full pl-9 pr-4 py-3 rounded-xl bg-white/60 dark:bg-zinc-900/40 border border-white/20 placeholder:text-gray-500 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex-1">
                    <div className="relative h-full">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 dark:text-gray-300">
                        <CircleDollarSign size={18} />
                      </span>
                      <select
                        value={form.price}
                        onChange={setField("price")}
                        className="w-full h-full pl-9 pr-9 py-3 rounded-xl bg-white/60 dark:bg-zinc-900/40 border border-white/20 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                  {/* Button */}
                  <div className="md:w-auto flex items-center">
                    <button
                      type="submit"
                      className="w-full md:w-auto px-6 h-full min-h-[52px] rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2 text-white"
                    >
                      <Search size={18} />
                      ค้นหา
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Trust bar */}
          <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/90">
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

      {/* ====== Custom animations ====== */}
      <style>{`
        @keyframes float-slow {
          0% { transform: translateY(0) }
          50% { transform: translateY(-10px) }
          100% { transform: translateY(0) }
        }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }

        @keyframes float-slower {
          0% { transform: translateY(0) }
          50% { transform: translateY(12px) }
          100% { transform: translateY(0) }
        }
        .animate-float-slower { animation: float-slower 8s ease-in-out infinite; }

        @keyframes orbit {
          0% { transform: rotate(0deg) }
          100% { transform: rotate(360deg) }
        }
        .animate-orbit { animation: orbit 22s linear infinite; transform-origin: 50% 50%; }

        @keyframes drift {
          0% { transform: translateY(0) translateX(0); opacity: .6 }
          50% { transform: translateY(-12px) translateX(6px); opacity: .9 }
          100% { transform: translateY(0) translateX(0); opacity: .6 }
        }
        .animate-drift { animation: drift 7s ease-in-out infinite; }
      `}</style>
    </section>
  );
}
