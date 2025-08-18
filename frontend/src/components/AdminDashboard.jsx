import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CategoriesManager from "./admin/CategoriesManager";
import OwnersManager from "./admin/OwnersManager";

export default function AdminDashboard({ onLogout }) {
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    []
  );

  // refs สำหรับตรวจจับคลิกนอกพื้นที่
  const sidebarRef = useRef(null);
  const profileRef = useRef(null);
  // UI states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  // ปิดเมื่อคลิกนอกพื้นที่ (ทั้ง sidebar มือถือ และเมนูโปรไฟล์)
  useEffect(() => {
    function onClickOutside(e) {
      // ปิด sidebar เฉพาะจอเล็ก
      if (sidebarOpen && window.innerWidth < 1024) {
        if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
          setSidebarOpen(false);
        }
      }
      // ปิดเมนูโปรไฟล์
      if (profileOpen) {
        if (profileRef.current && !profileRef.current.contains(e.target)) {
          setProfileOpen(false);
        }
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
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      // (ออปชัน) ถ้า backend มี endpoint /logout ก็เรียกได้
      // await axios.post('http://localhost:5000/api/auth/logout');
    } finally {
      // ลบข้อมูล auth ฝั่ง client
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // (ออปชัน) ถ้าเซ็ต axios Authorization ไว้ตอนล็อกอิน ให้เคลียร์ด้วย
      // delete axios.defaults.headers.common.Authorization;

      // ปิดเมนูที่เปิดทิ้งไว้
      setProfileOpen(false);
      setSidebarOpen(false);

      // เด้งไปหน้า Login (replace กันย้อนกลับ)
      onLogout?.();
      navigate("/", { replace: true });
    }
  }, [navigate, onLogout]);
  
  const [activeKey, setActiveKey] = useState("dashboard");

  // Dark mode: read from localStorage, default system prefers-color-scheme
  const getInitialDark = () => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
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

  useEffect(() => {
    function onStorage(e) {
      if (e.key === "theme") {
        setIsDark(e.newValue === "dark");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const closeOnResize = () => setSidebarOpen(false);
    window.addEventListener("resize", closeOnResize);
    return () => window.removeEventListener("resize", closeOnResize);
  }, []);

  // Mock data (replace with API later)
  const navItems = [
    { key: "dashboard", label: "แดชบอร์ด", icon: "fa-solid fa-chart-line" },
    { key: "listings", label: "จัดการบ้านเช่า", icon: "fa-solid fa-house" },
    {
      key: "approvals",
      label: "คำขอรออนุมัติ",
      icon: "fa-regular fa-square-check",
    },
    { key: "categories", label: "ประเภท/หมวดหมู่", icon: "fa-solid fa-list" },
    { key: "owners", label: "เจ้าของ (Owners)", icon: "fa-solid fa-user-tie" },
    { key: "users", label: "ผู้ใช้งาน", icon: "fa-solid fa-users" },
    { key: "payments", label: "การชำระเงิน", icon: "fa-solid fa-sack-dollar" },
    { key: "reports", label: "รายงาน/สถิติ", icon: "fa-solid fa-chart-column" },
    { key: "settings", label: "ตั้งค่า", icon: "fa-solid fa-gear" },
  ];

  const stats = [
    {
      key: "total",
      label: "ทั้งหมด",
      value: 1284,
      icon: "fa-solid fa-building",
      change: "+8.4%",
    },
    {
      key: "pending",
      label: "รออนุมัติ",
      value: 37,
      icon: "fa-regular fa-clock",
      change: "-2 รายการ",
    },
    {
      key: "owners",
      label: "เจ้าของ",
      value: 214,
      icon: "fa-solid fa-user-tie",
      change: "+3",
    },
    {
      key: "users",
      label: "ผู้ใช้งาน",
      value: 5820,
      icon: "fa-solid fa-users",
      change: "+120",
    },
    {
      key: "revenue",
      label: "รายได้เดือนนี้",
      value: "฿42,500",
      icon: "fa-solid fa-sack-dollar",
      change: "+12%",
    },
  ];

  const pendingItems = [
    {
      id: 1,
      title: "บ้านเดี่ยว 2 ชั้น - สะเตง",
      owner: "owner_a",
      submittedAt: "2025-08-10",
    },
    {
      id: 2,
      title: "หอพักหญิง ใกล้ มรย.",
      owner: "owner_b",
      submittedAt: "2025-08-11",
    },
    {
      id: 3,
      title: "คอนโด City Center",
      owner: "owner_c",
      submittedAt: "2025-08-12",
    },
  ];

  const recentUsers = [
    { id: 1, name: "Suda", username: "suda01", role: "user" },
    { id: 2, name: "Arif", username: "arif_owner", role: "owner" },
    { id: 3, name: "Bee", username: "bee_admin", role: "admin" },
  ];

  const Card = ({ title, value, icon, change }) => (
    <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </div>
          <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
            {change}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
          <i className={`${icon} text-blue-600 dark:text-blue-400`}></i>
        </div>
      </div>
    </div>
  );

  const TopBar = () => (
    <header className="sticky top-0 z-30 bg-white/70 dark:bg-gray-900/70 backdrop-blur border-b border-gray-200 dark:border-white/10">
      <div className="h-16 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <button
            className="lg:hidden w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            <i className="fa-solid fa-bars"></i>
          </button>
          <h1 className="font-semibold text-gray-800 dark:text-gray-100">
            แผงควบคุมผู้ดูแลระบบ
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
            <i className="fa-solid fa-magnifying-glass text-gray-400 mr-2"></i>
            <input
              className="bg-transparent outline-none text-sm w-56 placeholder:text-gray-400 dark:text-gray-100"
              placeholder="ค้นหา..."
            />
          </div>

          {/* Dark toggle */}
          <button
            onClick={() => setIsDark((d) => !d)}
            className="w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
            aria-label="Toggle dark mode"
          >
            <i className={`fa-solid ${isDark ? "fa-sun" : "fa-moon"}`}></i>
          </button>

          {/* Notifications */}
          <button className="w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
            <i className="fa-regular fa-bell"></i>
          </button>

          {/* Profile */}
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
              <i className="fa-solid fa-chevron-down text-xs text-gray-400"></i>
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

  const Sidebar = () => (
    <aside
      ref={sidebarRef}
      className={`fixed lg:sticky top-0 z-50 lg:z-30 h-screen lg:h-[calc(100vh)] w-72 shrink-0 transition-transform duration-300 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/10 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* Brand */}
      <div className="h-16 px-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
            {/* <i className="fa-solid fa-house"></i> */}
            <img
              src="/Chaomai-Logo.svg"
              alt="Logo"
              className="w-16 h-16 object-cover"
            />
          <span className="font-bold text-gray-800 dark:text-gray-100">
            chaomai Admin
          </span>
        </div>
        <button
          className="lg:hidden w-9 h-9 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <nav className="px-3 py-3 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
        {navItems.map((item) => {
          const active = activeKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveKey(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
              }`}
            >
              <i
                className={`${item.icon} ${
                  active ? "text-white" : "text-blue-600 dark:text-blue-400"
                }`}
              ></i>
              <span>{item.label}</span>
              {item.key === "approvals" && (
                <span
                  className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    active
                      ? "bg-white/20"
                      : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  }`}
                >
                  37
                </span>
              )}
            </button>
          );
        })}
        <div className="pt-3 mt-3 border-t border-gray-200 dark:border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="lg:grid lg:grid-cols-[18rem_1fr]">
        <Sidebar />

        {/* Overlay เฉพาะตอนเปิด sidebar บนมือถือ: คลิกเพื่อปิด */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/40"
            />
          )}

        <div className="min-h-screen flex flex-col">
          <TopBar />

          {/* Main content */}
          {/* === REPLACE <main>...</main> ทั้งบล็อกด้วยโค้ดนี้ === */}
          <main className="px-4 lg:px-6 py-6 space-y-6">
            {activeKey === "categories" ? (
              <CategoriesManager />
            ) : activeKey === "owners" ? (
                <OwnersManager />
              ) :  (
              <>
                {/* Greeting */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                      สวัสดี, {user?.username || "Admin"}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      ภาพรวมระบบและการจัดการล่าสุด
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-sm text-gray-700 dark:text-gray-100">
                      <i className="fa-regular fa-circle-question mr-2"></i>
                      คู่มือผู้ดูแล
                    </button>
                    <button className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm">
                      <i className="fa-solid fa-plus mr-2"></i>ลงประกาศใหม่
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <section className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
                  {stats.map((s) => (
                    <Card
                      key={s.key}
                      title={s.label}
                      value={s.value}
                      icon={s.icon}
                      change={s.change}
                    />
                  ))}
                </section>

                {/* Analytics mini-panels (CSS-based) */}
                <section className="grid lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        ทราฟฟิคผู้เข้าชม
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        7 วันล่าสุด
                      </span>
                    </div>
                    {/* simple bar sparkline */}
                    <div className="flex items-end gap-2 h-24">
                      {[30, 55, 42, 65, 80, 62, 90].map((h, i) => (
                        <div
                          key={i}
                          className="w-6 bg-blue-600/20 dark:bg-blue-400/20 rounded-t"
                        >
                          <div
                            style={{ height: `${h}%` }}
                            className="w-full bg-blue-600 dark:bg-blue-400 rounded-t"
                          ></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        การติดต่อจากผู้สนใจ
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        สัปดาห์นี้
                      </span>
                    </div>
                    <div className="space-y-3">
                      {["โทรศัพท์", "แชต", "อีเมล"].map((ch, i) => (
                        <div key={ch} className="flex items-center gap-3">
                          <div className="w-20 text-sm text-gray-600 dark:text-gray-400">
                            {ch}
                          </div>
                          <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${
                                i === 0
                                  ? "bg-emerald-500"
                                  : i === 1
                                  ? "bg-blue-500"
                                  : "bg-purple-500"
                              }`}
                              style={{ width: `${[72, 54, 28][i]}%` }}
                            ></div>
                          </div>
                          <div className="w-10 text-right text-sm text-gray-600 dark:text-gray-400">
                            {[72, 54, 28][i]}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        อัตราการอนุมัติ
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        เดือนนี้
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "ผ่าน", val: 82, color: "bg-emerald-500" },
                        { label: "ไม่ผ่าน", val: 18, color: "bg-rose-500" },
                      ].map((x) => (
                        <div
                          key={x.label}
                          className="p-3 rounded-xl bg-gray-50 dark:bg-white/5"
                        >
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {x.label}
                          </div>
                          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                            {x.val}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Tables */}
                <section className="grid lg:grid-cols-3 gap-4">
                  {/* Pending approvals */}
                  <div className="lg:col-span-2 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        คำขอประกาศรออนุมัติ
                      </h3>
                      <button className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                        ดูทั้งหมด
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/10">
                            <th className="py-2 pr-4">รายการ</th>
                            <th className="py-2 pr-4">เจ้าของ</th>
                            <th className="py-2 pr-4">วันที่ส่ง</th>
                            <th className="py-2 pr-0 text-right">การจัดการ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingItems.map((p) => (
                            <tr
                              key={p.id}
                              className="border-b last:border-0 border-gray-100 dark:border-white/5"
                            >
                              <td className="py-2 pr-4 text-gray-800 dark:text-gray-100">
                                {p.title}
                              </td>
                              <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">
                                {p.owner}
                              </td>
                              <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">
                                {p.submittedAt}
                              </td>
                              <td className="py-2 pr-0">
                                <div className="flex items-center gap-2 justify-end">
                                  <button className="px-2.5 py-1.5 rounded-lg text-xs bg-emerald-600 text-white hover:bg-emerald-700">
                                    <i className="fa-solid fa-check mr-1"></i>
                                    อนุมัติ
                                  </button>
                                  <button className="px-2.5 py-1.5 rounded-lg text-xs bg-rose-600 text-white hover:bg-rose-700">
                                    <i className="fa-solid fa-xmark mr-1"></i>
                                    ไม่ผ่าน
                                  </button>
                                  <button className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                                    <i className="fa-regular fa-eye mr-1"></i>ดู
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Latest users */}
                  <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        ผู้ใช้งานล่าสุด
                      </h3>
                      <button className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                        จัดการ
                      </button>
                    </div>
                    <ul className="divide-y divide-gray-100 dark:divide-white/5">
                      {recentUsers.map((u) => (
                        <li key={u.id} className="py-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-xs font-semibold">
                            {u.name.substring(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {u.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              @{u.username}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200">
                            {u.role}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
