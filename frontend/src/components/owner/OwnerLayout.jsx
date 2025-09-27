import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home, PlusCircle, CalendarCheck, MessageSquare, ArrowRight, TrendingUp,
  CheckCircle2, Clock, Building2, Menu, X, Bell, Moon, Sun, Settings, LogOut,
  LayoutDashboard
} from "lucide-react";
import { toPublicUrl } from "../../lib/url"; // ปรับ path ให้ตรงโปรเจกต์คุณ

export default function OwnerLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  //const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const [userState, setUserState] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  });
  const displayName = userState?.username || "เจ้าของประกาศ";

  // โค้ดที่เพิ่ม: sync กับ localStorage แบบ real-time
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "user") {
        try {
          setUserState(JSON.parse(e.newValue || "{}"));
        } catch (err) {
          console.warn("ไม่สามารถอ่านข้อมูล user จาก localStorage", err);
        }
      }
    };
    const onUserUpdated = () => {
      try {
        setUserState(JSON.parse(localStorage.getItem("user") || "{}"));
      } catch (err) {
        console.error("parse localStorage user error:", err);
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("user-updated", onUserUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("user-updated", onUserUpdated);
    };
  }, []);


    // โค้ดที่เพิ่ม: คำนวณ avatar URL + fallback กรณีรูปพัง
  const [avatarBroken, setAvatarBroken] = useState(false);
  const avatarUrl = (!avatarBroken && userState?.profile) ? toPublicUrl(userState.profile) : null;

  // ===== UI State =====
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const sidebarRef = useRef(null);
  const profileRef = useRef(null);

  // Dark mode
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


  // ปิดสกรอล body ตอนเปิด sidebar บนมือถือ
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  // ปิด Sidebar เมื่อรีไซส์
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

  // ===== Nav =====
  const navItems = [
    { to: "/owner/dashboard", label: "ภาพรวม", icon: LayoutDashboard, exact: true },
    { to: "/", label: "หน้าแรก", icon: Home, exact: true },
    { to: "/owner/dashboard/properties", label: "ประกาศของฉัน", icon: Building2 },
    { to: "/owner/dashboard/properties/new", label: "ลงประกาศใหม่", icon: PlusCircle },
    { to: "/owner/dashboard/bookings", label: "การจอง", icon: CalendarCheck },
    { to: "/owner/dashboard/messages", label: "ข้อความ", icon: MessageSquare },
    { to: "/owner/dashboard/settings", label: "ตั้งค่า", icon: Settings },
  ];
  // แทนที่ฟังก์ชันเดิม
  const isActive = (to, exact = false) => {
    const p = location.pathname;
    if (exact) return p === to;

    // เคสพิเศษ: ไม่ให้ /owner/properties/new ไป active "ประกาศของฉัน"
    if (to === "/owner/dashboard/properties") {
      if (p === to) return true;
      if (p.startsWith(to + "/")) {
        const seg = p.slice((to + "/").length).split("/")[0]; // segment ถัดไป
        return seg && seg !== "new"; // ถ้าเป็น new ให้ false
      }
      return false;
    }

    // ค่าเริ่มต้น
    return p === to || p.startsWith(to + "/");
  };

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
            <img
                src="/chaomai-logo1.png"
                alt="chaomai logo"
                className="h-10 w-10 rounded-lg object-contain"
              />
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
            className="w-10 h-10 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 grid place-items-center"
            aria-label="Toggle dark mode"
            title="ธีม"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="w-10 h-10 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 grid place-items-center" title="แจ้งเตือน">
            <Bell size={18} />
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="h-10 pl-1 pr-3 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-black/10 dark:ring-white/10 bg-gradient-to-br from-blue-500 to-indigo-500">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-full h-full object-cover"
                    onError={() => setAvatarBroken(true)}
                  />
                ) : null /* ถ้าไม่มีรูป จะเห็นเป็นพื้นหลัง gradient เดิม */}
              </div>
              <span className="hidden md:inline text-sm text-slate-800 dark:text-slate-100">
                {displayName}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" className="text-slate-400"><path fill="currentColor" d="M7 10l5 5l5-5z"/></svg>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-xl shadow-lg py-2 z-50">
                <Link to="/owner/dashboard/settings" className="block px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-100">
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
          <a href="/">
              <img
                src="/chaomai-logo1.png"
                alt="chaomai logo"
                className="h-10 w-10 rounded-lg object-contain"
              />
          </a>
          <span className="font-bold text-slate-900 dark:text-slate-100">Owner Center</span>
        </div>
        <button
          className="lg:hidden w-9 h-9 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X size={16} className="inline" />
        </button>
      </div>

      <nav className="px-3 py-3 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition
                ${active ? "bg-blue-600 text-white" : "text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5"}`}
            >
              <Icon size={16} className={`${active ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
              <span className="flex-1 text-left">{item.label}</span>
            </Link>
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

  return (
  //{/* ล็อกความสูงเท่าหน้าจอ และปิดสกรอลระดับเพจ */}
  <div className="h-screen overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
    {/* กริดสูงเท่าหน้าจอ เพื่อให้ฝั่งขวาจัดเลย์เอาต์แบบคอลัมน์ได้ */}
    <div className="lg:grid lg:grid-cols-[18rem_1fr] h-screen">
        <Sidebar />

        {/* Overlay ตอนเปิด sidebar บนมือถือ */}
        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="lg:hidden fixed inset-0 z-40 bg-black/40" />}

        {/* ฝั่งขวา: Topbar + เนื้อหา (สูงเท่าหน้าจอ, ให้ลูกย่อ/สกรอลได้) */}
        <div className="h-screen min-h-0 flex flex-col">
          <TopBar />
          {/* ให้สกรอลเฉพาะตรงนี้ */}
          <main className="flex-1 min-h-0 overflow-y-auto px-4 lg:px-6 py-6 space-y-6">
            {/* 👇 ตรงนี้คือเนื้อหาเพจลูก */}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
