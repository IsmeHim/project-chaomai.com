import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();

  // (ออปชัน) ผูกค่าฟอร์มไว้ ถ้าอยากส่งเป็น query ไปหน้า /search
  const [form, setForm] = useState({
    type: "",
    area: "",
    price: "",
  });

  const onSearch = (e) => {
    e.preventDefault();
    // ตัวอย่าง: ส่ง query string ไปหน้าค้นหา
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(form).filter(([, v]) => v))
    ).toString();
    navigate(`/search${params ? `?${params}` : ""}`);
  };

  const setField = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  return (
    <section id="Hero" className="relative overflow-hidden text-white hero-gradient">
      {/* overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/30 dark:from-black/60 dark:via-black/40 dark:to-black/40" />
      {/* แสงสีแบบระย้า (นุ่มๆ) */}
      <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen">
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-blue-500/40 blur-3xl" />
        <div className="absolute -top-16 -right-20 w-[26rem] h-[26rem] rounded-full bg-purple-500/40 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-28 min-h-[68vh] flex items-center">
        <div className="w-full text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight drop-shadow-sm">
            ค้นหาบ้านเช่าของคุณ{" "}
            <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
              ที่นี่
            </span>
          </h2>

          <p className="mt-4 md:mt-6 text-lg md:text-2xl text-white/90 max-w-3xl mx-auto">
            แพลตฟอร์มค้นหาบ้านเช่า หอพัก และอสังหาริมทรัพย์เช่าที่ครบครันที่สุด
          </p>

          {/* กลาสการ์ด: search box */}
          <form
            onSubmit={onSearch}
            className="mt-8 md:mt-10 max-w-4xl mx-auto rounded-2xl backdrop-blur-xl bg-white/80 dark:bg-gray-900/70 ring-1 ring-black/5 dark:ring-white/10 p-4 md:p-5 search-shadow"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
              {/* ประเภท */}
              <label className="relative md:col-span-3">
                <span className="sr-only">ประเภทที่พัก</span>
                <i className="fas fa-home pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.type}
                  onChange={setField("type")}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-white/10 placeholder:text-gray-400 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              {/* ราคา */}
              <label className="relative md:col-span-3">
                <span className="sr-only">ช่วงราคา</span>
                <i className="fas fa-sack-dollar pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={form.price}
                  onChange={setField("price")}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full h-full min-h-12 md:min-h-0 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <i className="fas fa-search mr-2" />
                  ค้นหา
                </button>
              </div>
            </div>

            {/* ชิปคำค้นยอดนิยม */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
              {["หอพักใกล้ มรย.", "บ้านเดี่ยวในเมือง", "คอนโดมีสระว่ายน้ำ"].map(
                (chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setForm((s) => ({ ...s, area: chip }))}
                    className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-white/10 dark:hover:bg-white/15 dark:text-gray-200"
                  >
                    {chip}
                  </button>
                )
              )}
            </div>
          </form>

          {/* แถบเชื่อมั่นเล็กๆ */}
          <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/90">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-list-check" />
              รายการกว่า 5,000+
            </div>
            <div className="hidden md:block w-px h-4 bg-white/30" />
            <div className="flex items-center gap-2">
              <i className="fa-regular fa-clock" />
              อัปเดตทุกวัน
            </div>
            <div className="hidden md:block w-px h-4 bg-white/30" />
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

      {/* ไล่จางลงพื้นขาว/ดำด้านล่างให้เนียน */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white dark:to-gray-900" />
    </section>
  );
}
