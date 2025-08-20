import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();

  // เปลี่ยนได้ตามใจ (แนะนำภาพ real estate/เมืองยามเย็น)
  const bgUrl =
    "https://images.unsplash.com/photo-1543402648-8ffee30f807a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"; // <— ใส่ภาพจริงที่ต้องการ

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
      className="relative text-white"
      style={{
        backgroundImage: `url(${bgUrl})`,
      }}
    >
      {/* พื้นหลังภาพจริง */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bgUrl})` }} />

      {/* Vignette + เทาโปร่งให้เนียนกับข้อความ */}
      <div className="absolute inset-0 bg-neutral-900/40 dark:bg-black/50" />
      <div className="absolute inset-0 [background:radial-gradient(60%_60%_at_50%_20%,rgba(255,255,255,.12)_0%,rgba(255,255,255,0)_60%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/30 to-black/50" />

      {/* แสงสีฟุ้งเบาๆ */}
      <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen">
        <div className="absolute -top-24 -left-24 w-[30rem] h-[30rem] rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute top-10 -right-16 w-[26rem] h-[26rem] rounded-full bg-purple-500/25 blur-[100px]" />
        <div className="absolute bottom-[-6rem] left-1/3 w-[22rem] h-[22rem] rounded-full bg-amber-400/20 blur-[90px]" />
      </div>

      {/* ลายเม็ดฟิล์มให้ภาพดูมีผิว (เบามาก) */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 opacity=%220.6%22 width=%224%22 height=%224%22><rect width=%221%22 height=%221%22 fill=%22%23fff%22/></svg>')",
        }}
      />

      {/* เนื้อหา */}
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

          {/* การ์ดค้นหาแบบ Glass + Soft Shadow */}
          <form
            onSubmit={onSearch}
            className="mt-8 md:mt-10 max-w-4xl mx-auto rounded-2xl backdrop-blur-xl bg-white/85 dark:bg-zinc-900/70 ring-1 ring-black/10 dark:ring-white/10 p-4 md:p-5 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.5)]"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
              {/* ประเภท */}
              <label className="relative md:col-span-3">
                <span className="sr-only">ประเภทที่พัก</span>
                <i className="fas fa-home pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.type}
                  onChange={setField("type")}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50/80 dark:bg-zinc-800/60 border border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">ประเภทที่พัก</option>
                  <option value="house">บ้านเช่า</option>
                  <option value="dorm">หอพัก</option>
                  <option value="condo">คอนโด</option>
                  <option value="warehouse">โกดัง</option>
                  <option value="studio">สตูดิโอ</option>
                </select>
              </label>

              {/* พื้นที่ */}
              <label className="relative md:col-span-4">
                <span className="sr-only">ตำบล/อำเภอ</span>
                <i className="fas fa-location-dot pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.area}
                  onChange={setField("area")}
                  placeholder="ตำบล/อำเภอ เช่น เมืองยะลา"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50/80 dark:bg-zinc-800/60 border border-gray-200/80 dark:border-white/10 placeholder:text-gray-400 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              {/* ราคา */}
              <label className="relative md:col-span-3">
                <span className="sr-only">ช่วงราคา</span>
                <i className="fas fa-sack-dollar pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.price}
                  onChange={setField("price")}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50/80 dark:bg-zinc-800/60 border border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">ช่วงราคา</option>
                  <option value="0-5000">ต่ำกว่า 5,000</option>
                  <option value="5000-10000">5,000 - 10,000</option>
                  <option value="10000-20000">10,000 - 20,000</option>
                  <option value="20000+">มากกว่า 20,000</option>
                </select>
              </label>

              {/* ปุ่มค้นหา */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full h-full min-h-12 md:min-h-0 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <i className="fas fa-search mr-2" />
                  ค้นหา
                </button>
              </div>
            </div>

            {/* ชิปคำค้นยอดนิยม */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
              {["หอพักใกล้ มรย.", "บ้านเดี่ยวในเมือง", "คอนโดมีสระว่ายน้ำ"].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setForm((s) => ({ ...s, area: chip }))}
                  className="px-3 py-1.5 rounded-full bg-gray-100/90 hover:bg-gray-200 text-gray-700 dark:bg-white/10 dark:hover:bg-white/15 dark:text-gray-200"
                >
                  {chip}
                </button>
              ))}
            </div>
          </form>

          {/* แถบความน่าเชื่อถือ */}
          <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/90">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-list-check" />
              รายการกว่า 5,000+
            </div>
            <div className="hidden md:block w-px h-4 bg-white/40" />
            <div className="flex items-center gap-2">
              <i className="fa-regular fa-clock" />
              อัปเดตทุกวัน
            </div>
            <div className="hidden md:block w-px h-4 bg-white/40" />
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-shield-halved" />
              รีวิวจากผู้ใช้งานจริง
            </div>
          </div>
        </div>
      </div>

      {/* ไอคอนลอยตกแต่ง */}
      <i className="fas fa-home text-white/30 text-6xl absolute top-16 left-6 animate-float" />
      <i
        className="fas fa-building text-white/25 text-5xl absolute bottom-16 right-8 animate-float"
        style={{ animationDelay: "-2.5s" }}
      />

      {/* ไล่จางเข้าพื้นหลัก (ขาว/ดำ) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white dark:to-zinc-900" />
    </section>
  );
}
