// components/admin/AdminLayout.jsx
import { Bell, Building2, CheckSquare, ChevronDown, Home, LayoutDashboard, List, LogOut, Menu, Moon, Search, Settings, Sun, UserCog, Users, X } from "lucide-react";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  // ===== theme =====
  const getInitialDark = () => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  };
  const [isDark, setIsDark] = useState(getInitialDark);
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) { root.classList.add("dark"); localStorage.setItem("theme", "dark"); }
    else { root.classList.remove("dark"); localStorage.setItem("theme", "light"); }
  }, [isDark]);

  // ===== close handlers =====
  useEffect(() => {
    function onClickOutside(e) {
      if (sidebarOpen && window.innerWidth < 1024) {
        if (sidebarRef.current && !sidebarRef.current.contains(e.target)) setSidebarOpen(false);
      }
      if (profileOpen) {
        if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      }
    }
    function onKeydown(e) {
      if (e.key === "Escape") {
        if (window.innerWidth < 1024) setSidebarOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeydown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeydown);
    };
  }, [sidebarOpen, profileOpen]);

    // ปิดสกรอล body ตอนเปิด sidebar บนมือถือ (กันฉากหลังเลื่อน)
  useEffect(() => {
    // (เดิมไม่มี)
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setProfileOpen(false);
    setSidebarOpen(false);
    navigate("/", { replace: true });
  };

  const NAV = [
    { to: "/admin", label: "แดชบอร์ด", icon: LayoutDashboard, end: true },
    { to: "/", label: "หน้าแรก", icon: Home },
    { to: "/admin/listings", label: "จัดการบ้านเช่า", icon: Building2 },
    { to: "/admin/approvals", label: "คำขอรออนุมัติ", icon: CheckSquare },
    { to: "/admin/categories", label: "ประเภท/หมวดหมู่", icon: List },
    { to: "/admin/owners", label: "เจ้าของ (Owners)", icon: UserCog },
    { to: "/admin/users", label: "ผู้ใช้งาน", icon: Users },
    // 2 รายการนี้ยังไม่มีหน้าจริง
    // { key: "/admin/payments", label: "การชำระเงิน", icon: "fa-solid fa-sack-dollar" },
    // { key: "/admin/reports", label: "รายงาน/สถิติ", icon: "fa-solid fa-chart-column" },
    { to: "/admin/settings", label: "ตั้งค่า", icon: Settings },
  ];

  // ===== TopBar (วางฝั่งขวาให้เหมือน AdminDashboard) =====
  const TopBar = () => (
    <header className="sticky top-0 z-30 bg-white/70 dark:bg-gray-900/70 backdrop-blur border-b border-gray-200 dark:border-white/10">
      <div className="h-16 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <button
            className="lg:hidden w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            <Menu className="inline w-5 h-5"></Menu>
          </button>
          <h1 className="font-semibold text-gray-800 dark:text-gray-100">แผงควบคุมผู้ดูแลระบบ</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
            <Search className="inline w-5 h-5 text-gray-400 mr-2"></Search>
            <input
              className="bg-transparent outline-none text-sm w-56 placeholder:text-gray-400 dark:text-gray-100"
              placeholder="ค้นหา..."
            />
          </div>

          <button
            onClick={() => setIsDark((d) => !d)}
            className="w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
            aria-label="Toggle dark mode"
            title="ธีม"
          >
            {isDark ? (
              <Sun className="inline w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="inline w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          <button className="w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
            <Bell className="inline w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
              <span className="hidden md:inline text-sm text-gray-700 dark:text-gray-100">
                {user?.username || "admin"}
              </span>
              <ChevronDown className="inline w-5 h-5 text-xs text-gray-400"></ChevronDown>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg py-2 z-50">
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-100">
                  โปรไฟล์
                </button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-100">
                  ตั้งค่า
                </button>
                <div className="my-2 border-t border-gray-200 dark:border-white/10" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  // ===== Sidebar (เหมือน AdminDashboard: top-0 เต็มสูง) =====
  const Sidebar = () => (
    <aside
      ref={sidebarRef}
      className={`fixed lg:sticky top-0 z-50 lg:z-30
        h-screen lg:h-[calc(100vh)]
        w-72 shrink-0 transition-transform duration-300
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/10
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      aria-label="Admin sidebar"
    >
      <div className="h-16 px-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
              <img
                src="/chaomai-logo1.png"
                alt="chaomai logo"
                className="h-12 w-12 rounded-lg object-contain"
              />
          <span className="font-bold text-gray-800 dark:text-gray-100">chaomai Admin</span>
        </div>
        <button
          className="lg:hidden w-9 h-9 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X className="inline text-black dark:text-white"></X>
        </button>
      </div>

      {/* เหลือพื้นที่เลื่อน = viewport - 64px (Topbar ของ sidebar เอง) */}
      <nav className="px-3 py-3 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
              }`
            }
          >
            <Icon
              className={`w-5 h-5 mr-1 ${
                /* ให้ไอคอน inactive เหมือน text ปกติ, active เป็นสีขาว */
                ({ isActive }) => (isActive ? "text-white" : "text-gray-700 dark:text-blue-400")
              }`}
            />
            <span>{item.label}</span>
          </NavLink>
          )
        })}

        <div className="pt-3 mt-3 border-t border-gray-200 dark:border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="text-black dark:text-white" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </nav>
    </aside>
  );

  return (
    // {/* พื้นหลังให้โทนเดียวกับ AdminDashboard */}
    //{/* ล็อกความสูงเท่าหน้าจอ และปิดสกรอลระดับเพจ → ให้สกรอลเฉพาะเนื้อหา */
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* โครงสร้าง grid เหมือน AdminDashboard */}
      <div className="lg:grid lg:grid-cols-[18rem_1fr] h-screen">
        <Sidebar />

        {/* Overlay มือถือ */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 z-40 bg-black/40"
            aria-hidden="true"
          />
        )}

        {/* ฝั่งขวา: Topbar + เนื้อหา */}{/* ฝั่งขวา: Topbar + เนื้อหา (สูงเท่าหน้าจอ และอนุญาตให้ลูกสกรอลได้) */}
        <div className="h-screen min-h-0 flex flex-col">
          <TopBar />
          {/* ให้สกรอลเฉพาะตรงนี้ */}
           <main className="flex-1 min-h-0 overflow-y-auto px-4 lg:px-6 py-6 space-y-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
