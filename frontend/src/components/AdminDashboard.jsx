import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import CategoriesManager from "./admin/CategoriesManager";
import OwnersManager from "./admin/OwnersManager";


export default function AdminDashboard({ onLogout }) {

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    []
  );

  // refs
  const sidebarRef = useRef(null);
  const profileRef = useRef(null);

  // UI states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  // ====== Approvals state ======
  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState("");
  const [pendingBusy, setPendingBusy] = useState(new Set()); // ids ที่กำลัง approve/reject

  // ฟิลเตอร์สถานะ: 'pending' | 'approved' | 'rejected' | 'all'
  const [approvalTab, setApprovalTab] = useState("pending");

  const setBusy = (id, on = true) => {
    setPendingBusy((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const fetchApprovals = useCallback(
    async (status = approvalTab) => {
      setPendingLoading(true);
      setPendingError("");
      try {
        const params = {};
        if (status !== "all") params.approvalStatus = status;
        // แอดมินดูได้ทั้งหมด (หรือใช้ /admin/... ถ้าแยกแล้ว)
        const { data } = await api.get("/owner/properties", { params });
        setPending(Array.isArray(data) ? data : data?.items || []);
      } catch (e) {
        console.error(e);
        setPendingError("โหลดรายการไม่สำเร็จ");
        setPending([]);
      } finally {
        setPendingLoading(false);
      }
    },
    [approvalTab]
  );

  // ลบ import Swal ออกไปเลย

  const approve = useCallback(async (id) => {
    if (!id) return;

    const ok = window.confirm("คุณแน่ใจหรือไม่ที่จะอนุมัติประกาศนี้?");
    if (!ok) return;

    setBusy(id, true);
    try {
      await api.patch(`/properties/${id}`, { approvalStatus: "approved" });
      setPending((prev) => prev.filter((it) => String(it._id) !== String(id)));

      window.alert("✅ อนุมัติเรียบร้อยแล้ว");
    } catch (e) {
      console.error(e);
      window.alert("❌ อนุมัติไม่สำเร็จ");
    } finally {
      setBusy(id, false);
    }
  }, []);


  const reject = useCallback(async (id) => {
    if (!id) return;

    const reason = window.prompt("เหตุผลที่ไม่ผ่าน:", "ข้อมูลไม่ครบถ้วน");
    if (reason === null) return; // กดยกเลิก

    setBusy(id, true);
    try {
      await api.patch(`/properties/${id}`, {
        approvalStatus: "rejected",
        approvalReason: reason || "",
      });
      setPending((prev) => prev.filter((it) => String(it._id) !== String(id)));

      window.alert("🚫 ตั้งสถานะไม่ผ่านเรียบร้อยแล้ว");
    } catch (e) {
      console.error(e);
      window.alert("❌ ไม่สามารถตั้งสถานะไม่ผ่านได้");
    } finally {
      setBusy(id, false);
    }
  }, []);



  useEffect(() => {
    fetchApprovals(approvalTab);
  }, [approvalTab, fetchApprovals]);

  // ปิด UI เมื่อคลิกนอก/กด esc
  useEffect(() => {
    function onClickOutside(e) {
      if (sidebarOpen && window.innerWidth < 1024) {
        if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
          setSidebarOpen(false);
        }
      }
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

  const handleLogout = useCallback(async () => {
    try {
      // await api.post('/auth/logout');
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setProfileOpen(false);
      setSidebarOpen(false);
      onLogout?.();
      navigate("/", { replace: true });
    }
  }, [navigate, onLogout]);

  // อ่านค่า tab จาก URL ครั้งแรก
  const initialTab = searchParams.get("tab") || "dashboard";
  const [activeKey, setActiveKey] = useState(initialTab);

  // ถ้า URL มีการเปลี่ยน tab จากการกด back/forward ให้ sync state
  useEffect(() => {
    const urlTab = searchParams.get("tab") || "dashboard";
    if (urlTab !== activeKey) setActiveKey(urlTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // ทุกครั้งที่เปลี่ยนแท็บ อัปเดต URL ด้วย
  useEffect(() => {
    const current = searchParams.get("tab");
    if (current !== activeKey) {
      setSearchParams({ tab: activeKey }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  // Dark mode
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
      if (e.key === "theme") setIsDark(e.newValue === "dark");
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    const closeOnResize = () => setSidebarOpen(false);
    window.addEventListener("resize", closeOnResize);
    return () => window.removeEventListener("resize", closeOnResize);
  }, []);

  // Nav items
  const navItems = [
    { key: "dashboard", label: "แดชบอร์ด", icon: "fa-solid fa-chart-line" },
    { key: "listings", label: "จัดการบ้านเช่า", icon: "fa-solid fa-house" },
    { key: "approvals", label: "คำขอรออนุมัติ", icon: "fa-regular fa-square-check" },
    { key: "categories", label: "ประเภท/หมวดหมู่", icon: "fa-solid fa-list" },
    { key: "owners", label: "เจ้าของ (Owners)", icon: "fa-solid fa-user-tie" },
    { key: "users", label: "ผู้ใช้งาน", icon: "fa-solid fa-users" },
    { key: "payments", label: "การชำระเงิน", icon: "fa-solid fa-sack-dollar" },
    { key: "reports", label: "รายงาน/สถิติ", icon: "fa-solid fa-chart-column" },
    { key: "settings", label: "ตั้งค่า", icon: "fa-solid fa-gear" },
  ];

  // Dynamic stats (ผูกจำนวนตามแท็บปัจจุบัน)
  const stats = useMemo(
    () => [
      { key: "total", label: "ทั้งหมด", value: 1284, icon: "fa-solid fa-building", change: "+8.4%" },
      {
        key: "pending",
        label: "รออนุมัติ",
        value: approvalTab === "pending" ? pending.length : "—",
        icon: "fa-regular fa-clock",
        change:
          approvalTab === "pending" ? (pending.length ? `+${pending.length} รายการใหม่` : "0") : "",
      },
      { key: "owners", label: "เจ้าของ", value: 214, icon: "fa-solid fa-user-tie", change: "+3" },
      { key: "users", label: "ผู้ใช้งาน", value: 5820, icon: "fa-solid fa-users", change: "+120" },
      { key: "revenue", label: "รายได้เดือนนี้", value: "฿42,500", icon: "fa-solid fa-sack-dollar", change: "+12%" },
    ],
    [pending.length, approvalTab]
  );

  const Card = ({ title, value, icon, change }) => (
    <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
          {change && <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{change}</div>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
          <i className={`${icon} text-blue-600 dark:text-blue-400`}></i>
        </div>
      </div>
    </div>
  );

  const niceDate = (s) => {
    try {
      const d = new Date(s);
      return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return s || "—";
    }
  };

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
          <h1 className="font-semibold text-gray-800 dark:text-gray-100">แผงควบคุมผู้ดูแลระบบ</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
            <i className="fa-solid fa-magnifying-glass text-gray-400 mr-2"></i>
            <input
              className="bg-transparent outline-none text-sm w-56 placeholder:text-gray-400 dark:text-gray-100"
              placeholder="ค้นหา..."
            />
          </div>

          <button
            onClick={() => setIsDark((d) => !d)}
            className="w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
            aria-label="Toggle dark mode"
          >
            <i className={`fa-solid ${isDark ? "fa-sun" : "fa-moon"}`}></i>
          </button>

          <button className="w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
            <i className="fa-regular fa-bell"></i>
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
      <div className="h-16 px-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/Chaomai-Logo.svg" alt="Logo" className="w-16 h-16 object-cover" />
          <span className="font-bold text-gray-800 dark:text-gray-100">chaomai Admin</span>
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
                  onClick={() => {
                    setActiveKey(item.key);
                    navigate(`/admin/dashboard?tab=${item.key}`);
                  }}
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
                  {pending.length}
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

  // ===== Approvals table (ทั้งหน้า approvals และแดชบอร์ด) =====
  const ApprovalsTable = ({ items = [], compact = false }) => (
    <div
      className={`${
        compact ? "lg:col-span-2" : ""
      } p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">คำขอประกาศ</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{items.length} รายการ</span>
          <button
            onClick={() => fetchApprovals(approvalTab)}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
          >
            <i className="fa-solid fa-rotate mr-1"></i> รีเฟรช
          </button>
        </div>
      </div>

      {pendingLoading ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">กำลังโหลด…</div>
      ) : pendingError ? (
        <div className="py-8 text-center text-rose-600">{pendingError}</div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">ไม่พบรายการ</div>
      ) : (
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
              {items.map((p) => {
                const id = String(p._id || p.id);
                const busy = pendingBusy.has(id);
                const status = p.approvalStatus || "approved";
                const pillCls =
                  status === "approved"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                    : status === "rejected"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300";

                return (
                  <tr key={id} className="border-b last:border-0 border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-4 text-gray-800 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{p.title || "—"}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${pillCls}`}>
                          {status === "approved"
                            ? "อนุมัติแล้ว"
                            : status === "rejected"
                            ? "ไม่ผ่าน"
                            : "รออนุมัติ"}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">
                      {p.owner?.username || p.owner?.name || p.ownerName || "—"}
                    </td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">
                      {niceDate(p.createdAt || p.submittedAt)}
                    </td>
                    <td className="py-2 pr-0">
                      <div className="flex items-center gap-2 justify-end">
                        {status === "pending" && (
                          <>
                            <button
                              disabled={busy}
                              onClick={() => approve(id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                              title="อนุมัติ"
                            >
                              <i className="fa-solid fa-check mr-1"></i> อนุมัติ
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => reject(id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                              title="ไม่ผ่าน"
                            >
                              <i className="fa-solid fa-xmark mr-1"></i> ไม่ผ่าน
                            </button>
                          </>
                        )}
                        <a
                          href={`/properties/${id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                          title="ดูหน้าโพสต์"
                        >
                          <i className="fa-regular fa-eye mr-1"></i> ดู
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="lg:grid lg:grid-cols-[18rem_1fr]">
        <Sidebar />
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="lg:hidden fixed inset-0 z-40 bg-black/40" />
        )}

        <div className="min-h-screen flex flex-col">
          <TopBar />

          <main className="px-4 lg:px-6 py-6 space-y-6">
            {activeKey === "categories" ? (
              <CategoriesManager />
            ) : activeKey === "owners" ? (
              <OwnersManager />
            ) : activeKey === "approvals" ? (
              // ===== หน้า Approvals เต็มรูปแบบ =====
              <section className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                      คำขอรออนุมัติ
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      รายการประกาศที่เจ้าของส่งเข้ามา รอตรวจสอบ
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      { key: "pending", label: "รออนุมัติ" },
                      { key: "approved", label: "อนุมัติแล้ว" },
                      { key: "rejected", label: "ไม่ผ่าน" },
                      { key: "all", label: "ทั้งหมด" },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setApprovalTab(t.key)}
                        className={`px-3 py-1.5 rounded-lg text-sm border ${
                          approvalTab === t.key
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                    <button
                      onClick={() => fetchApprovals(approvalTab)}
                      className="ml-1 px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <i className="fa-solid fa-rotate mr-2"></i> รีเฟรช
                    </button>
                  </div>
                </div>

                <ApprovalsTable items={pending} />
              </section>
            ) : (
              // ===== Dashboard =====
              <>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                      สวัสดี, {user?.username || "Admin"}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">ภาพรวมระบบและการจัดการล่าสุด</p>
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
                    <Card key={s.key} title={s.label} value={s.value} icon={s.icon} change={s.change} />
                  ))}
                </section>

                {/* Mini-panels */}
                <section className="grid lg:grid-cols-3 gap-4">
                  {/* Traffic */}
                  <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">ทราฟฟิคผู้เข้าชม</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">7 วันล่าสุด</span>
                    </div>
                    <div className="flex items-end gap-2 h-24">
                      {[30, 55, 42, 65, 80, 62, 90].map((h, i) => (
                        <div key={i} className="w-6 bg-blue-600/20 dark:bg-blue-400/20 rounded-t">
                          <div style={{ height: `${h}%` }} className="w-full bg-blue-600 dark:bg-blue-400 rounded-t"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">การติดต่อจากผู้สนใจ</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">สัปดาห์นี้</span>
                    </div>
                    <div className="space-y-3">
                      {["โทรศัพท์", "แชต", "อีเมล"].map((ch, i) => (
                        <div key={ch} className="flex items-center gap-3">
                          <div className="w-20 text-sm text-gray-600 dark:text-gray-400">{ch}</div>
                          <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${
                                i === 0 ? "bg-emerald-500" : i === 1 ? "bg-blue-500" : "bg-purple-500"
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

                  {/* Approval rate */}
                  <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">อัตราการอนุมัติ</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">เดือนนี้</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "ผ่าน", val: 82, color: "bg-emerald-500" },
                        { label: "ไม่ผ่าน", val: 18, color: "bg-rose-500" },
                      ].map((x) => (
                        <div key={x.label} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                          <div className="text-sm text-gray-500 dark:text-gray-400">{x.label}</div>
                          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{x.val}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Approvals on dashboard (compact) */}
                <section className="grid lg:grid-cols-3 gap-4">
                  <ApprovalsTable items={pending} compact />
                  {/* Latest users (เดิม) */}
                  <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">ผู้ใช้งานล่าสุด</h3>
                      <button className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                        จัดการ
                      </button>
                    </div>
                    <ul className="divide-y divide-gray-100 dark:divide-white/5">
                      {[
                        { id: 1, name: "Suda", username: "suda01", role: "user" },
                        { id: 2, name: "Arif", username: "arif_owner", role: "owner" },
                        { id: 3, name: "Bee", username: "bee_admin", role: "admin" },
                      ].map((u) => (
                        <li key={u.id} className="py-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-xs font-semibold">
                            {u.name.substring(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{u.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">@{u.username}</div>
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
