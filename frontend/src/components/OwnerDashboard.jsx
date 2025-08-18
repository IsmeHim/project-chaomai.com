import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home, PlusCircle, CalendarCheck, MessageSquare, ArrowRight, TrendingUp,
  CheckCircle2, Clock, Building2, Menu, X, Bell, Moon, Sun, Settings, LogOut
} from "lucide-react";

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const displayName = user?.username || "เจ้าของประกาศ";

  // ===== UI State =====
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const sidebarRef = useRef(null);
  const profileRef = useRef(null);

  // Dark mode (อ่านค่าจาก localStorage ถ้าไม่มี ใช้ค่า prefers-color-scheme)
  const getInitialDark = () => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
  };
  const [isDark, setIsDark] = useState(getInitialDark);
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // ปิดเมนูเมื่อคลิกนอกพื้นที่ / กด Esc
  useEffect(() => {
    const onClickOutside = (e) => {
      if (sidebarOpen && window.innerWidth < 1024) {
        if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
          setSidebarOpen(false);
        }
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    const onKeydown = (e) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeydown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeydown);
    };
  }, [sidebarOpen, profileOpen]);

  // ปิด Sidebar เมื่อเปลี่ยนขนาดหน้าจอ
  useEffect(() => {
    const onResize = () => setSidebarOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setProfileOpen(false);
    setSidebarOpen(false);
    navigate("/", { replace: true });
  }, [navigate]);

  // ===== Nav & Content =====
  const [activeKey, setActiveKey] = useState("overview");
  const navItems = [
    { key: "overview", label: "ภาพรวม", icon: Home },
    { key: "mylistings", label: "ประกาศของฉัน", icon: Building2, badge: 0 },
    { key: "new", label: "ลงประกาศใหม่", icon: PlusCircle },
    { key: "bookings", label: "การจอง", icon: CalendarCheck, badge: 0 },
    { key: "messages", label: "ข้อความ", icon: MessageSquare, badge: 0 },
    { key: "settings", label: "ตั้งค่า", icon: Settings },
  ];

  // ตัวอย่างสถิติ (ต่อ API ทีหลังได้เลย)
  const stats = [
    { label: "ประกาศทั้งหมด", value: 0, icon: Home },
    { label: "รออนุมัติ", value: 0, icon: Clock },
    { label: "ที่เผยแพร่", value: 0, icon: CheckCircle2 },
    { label: "ยอดเข้าชม 7 วัน", value: 0, icon: TrendingUp },
  ];

  // ===== Components =====
  const TopBar = () => (
    <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b border-black/5 dark:border-white/10">
      <div className="h-16 px-4 lg:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-2">
            <img src="/Chaomai-Logo.svg" alt="Logo" className="h-8 w-8" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">chaomai Owner</span>
          </div>
        </div>

        <div className="hidden md:flex items-center px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800">
          <svg width="16" height="16" viewBox="0 0 24 24" className="text-slate-400 mr-2"><path fill="currentColor" d="m21 20.29l-3.4-3.39A7.9 7.9 0 0 0 19 13a8 8 0 1 0-8 8a7.9 7.9 0 0 0 3.9-.94L18.29 23zM5 13a6 6 0 1 1 6 6a6 6 0 0 1-6-6"/></svg>
          <input className="bg-transparent outline-none text-sm w-64 placeholder:text-slate-400 dark:text-slate-100" placeholder="ค้นหาประกาศของฉัน..." />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDark((d) => !d)}
            className="w-10 h-10 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center"
            aria-label="Toggle dark mode"
            title="ธีม"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="w-10 h-10 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center" title="แจ้งเตือน">
            <Bell size={18} />
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="h-10 pl-1 pr-3 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500" />
              <span className="hidden md:inline text-sm text-slate-800 dark:text-slate-100">
                {displayName}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" className="text-slate-400"><path fill="currentColor" d="M7 10l5 5l5-5z"/></svg>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-xl shadow-lg py-2 z-50">
                <Link to="/owner/settings" className="block px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-100">
                  โปรไฟล์ & ตั้งค่า
                </Link>
                <div className="my-2 border-t border-black/10 dark:border-white/10" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-500/10"
                >
                  <span className="inline-flex items-center gap-2">
                    <LogOut size={16} /> ออกจากระบบ
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  const Sidebar = () => (
    <aside
      ref={sidebarRef}
      className={`fixed lg:sticky top-0 z-50 lg:z-30 h-screen w-72 shrink-0 transition-transform duration-300 bg-white dark:bg-slate-900 border-r border-black/5 dark:border-white/10
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div className="h-16 px-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/Chaomai-Logo.svg" alt="Logo" className="w-10 h-10" />
          <span className="font-bold text-slate-900 dark:text-slate-100">Owner Center</span>
        </div>
        <button
          className="lg:hidden w-9 h-9 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="px-3 py-3 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setActiveKey(item.key);
                if (window.innerWidth < 1024) setSidebarOpen(false);
                if (item.key === "mylistings") navigate("/owner/properties");
                if (item.key === "new") navigate("/owner/properties/new");
                if (item.key === "bookings") navigate("/owner/bookings");
                if (item.key === "messages") navigate("/owner/messages");
                if (item.key === "settings") navigate("/owner/settings");
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition
                ${active ? "bg-blue-600 text-white" : "text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5"}`}
            >
              <Icon size={16} className={`${active ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {typeof item.badge === "number" && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-3 mt-3 border-t border-black/5 dark:border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-rose-600 hover:bg-rose-500/10"
          >
            <LogOut size={16} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </nav>
    </aside>
  );

  // ===== Main Panels (Overview เท่านั้นเป็นตัวอย่าง — รายการอื่นนำไปต่อยอดได้) =====
  const OverviewPanel = () => (
    <>
      {/* Greeting + CTA */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            สวัสดี, {displayName}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">ภาพรวมบัญชีและการดำเนินการแบบรวดเร็ว</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/owner/properties/new"
            className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm inline-flex items-center gap-2"
          >
            <PlusCircle size={16} /> ลงประกาศใหม่
          </Link>
          <Link
            to="/owner/properties"
            className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm inline-flex items-center gap-2"
          >
            ดูทั้งหมด <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-5 flex items-start gap-4 hover:shadow-sm transition-shadow"
            >
              <div className="h-11 w-11 rounded-xl bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 grid place-items-center">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{s.value}</div>
                <div className="text-slate-600 dark:text-slate-300 truncate">{s.label}</div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Quick links */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">เมนูลัด</h3>
          <Link to="/owner/properties/new" className="text-blue-600 hover:underline inline-flex items-center gap-1">
            เริ่มลงประกาศเลย <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { to: "/owner/properties", title: "ประกาศของฉัน", desc: "ดู/แก้ไขประกาศบ้านเช่าของคุณ", icon: Building2 },
            { to: "/owner/properties/new", title: "ลงประกาศใหม่", desc: "เพิ่มบ้าน/ห้องเช่าใหม่อย่างรวดเร็ว", icon: PlusCircle },
            { to: "/owner/bookings", title: "การจอง", desc: "ตรวจสอบคำขอ/ตารางนัดดูห้อง", icon: CalendarCheck },
            { to: "/owner/messages", title: "ข้อความ", desc: "คุยกับผู้สนใจเช่าของคุณ", icon: MessageSquare },
          ].map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.to}
                to={q.to}
                className="group rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-slate-900/5 dark:bg-white/10 grid place-items-center text-slate-700 dark:text-slate-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {q.title}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                      {q.desc}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-blue-600">
                  ไปที่เมนู
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent activity + Tips */}
      <section className="mt-6 grid xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">กิจกรรมล่าสุด</h3>
            <span className="text-xs text-slate-500">(ตัวอย่าง/รอเชื่อม API)</span>
          </div>
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {[1, 2, 3].map((i) => (
              <li key={i} className="py-3 flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 grid place-items-center">
                  <Home className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    ยังไม่มีข้อมูลกิจกรรม แสดงตัวอย่างรายการ #{i}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">เมื่อสักครู่</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">เคล็ดลับการลงประกาศ</h3>
          <ul className="mt-3 space-y-3 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
            <li>รูปภาพคมชัด 6–10 รูปช่วยเพิ่มการเข้าชม</li>
            <li>ระบุราคา/ทำเล และจุดเด่นให้ชัดเจน</li>
            <li>อัปเดตสถานะเมื่อมีผู้เช่าแล้ว</li>
          </ul>
          <Link
            to="/owner/properties/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
          >
            ลงประกาศแรกของคุณ
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );

  // เนื้อหาแต่ละแท็บ (ในที่นี้เดโมเฉพาะ Overview ให้สวยก่อน)
  const Content = () => {
    if (activeKey === "overview") return <OverviewPanel />;
    // คุณสามารถแตกเป็น component แยกไฟล์ตามเมนูได้เลย
    return (
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-6">
        <div className="text-slate-700 dark:text-slate-200">หน้านี้กำลังพัฒนา…</div>
      </div>
    );
  };

  return (
    <div className="min-h-[100svh] bg-gradient-to-b from-blue-50/60 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <div className="lg:grid lg:grid-cols-[18rem_1fr]">
        <Sidebar />

        {/* Overlay ตอนเปิด sidebar บนมือถือ */}
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="lg:hidden fixed inset-0 z-40 bg-black/40" />
        )}

        <div className="min-h-screen flex flex-col">
          <TopBar />

          <main className="px-4 lg:px-6 py-6 space-y-6">
            <Content />
          </main>
        </div>
      </div>
    </div>
  );
}
