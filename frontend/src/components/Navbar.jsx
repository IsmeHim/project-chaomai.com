import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ExternalLink from "./NavbarLink/ExternalLink";
import { MapPinHouse, Search, House, Mail, HousePlus, User, UserCog, Heart, CircleCheck, X, Menu, LayoutDashboard, ArrowRightFromLine, LogIn, UserPlus, ChevronDown } from "lucide-react";
import { fetchWishlist } from "../lib/wishlist";
import { api } from "../lib/api"; // ← เพิ่มบรรทัดนี้


function toPublicUrl(u) {
  if (!u) return null;
  if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u)) return u;
  try {
    const base = (api?.defaults?.baseURL || "").replace(/\/+$/, "");
    const origin = base.replace(/\/api(?:\/)?$/, "");
    return `${origin}${u.startsWith("/") ? u : `/${u}`}`;
  } catch {
    return u;
  }
}

function dicebearFrom(username = "user") {
  return `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
}


export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [wishCount, setWishCount] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  // ด้านบน component
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const sync = () => setAuthed(!!localStorage.getItem('token'));
    window.addEventListener('auth:changed', sync);
    window.addEventListener('storage', sync); // เผื่อข้ามแท็บ
    return () => {
      window.removeEventListener('auth:changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);


  // refs: ปิดเมนูเมื่อคลิกนอกพื้นที่
  const userMenuWrapperRef = useRef(null);
  const userMenuButtonRef = useRef(null);

  const [avatarUrl, setAvatarUrl] = useState("");

  // ตั้งค่าเริ่มจาก localStorage ให้ไวก่อน
  useEffect(() => {
    const u = getStoredUser();
    const fromLocal = u?.profile ? toPublicUrl(u.profile) : null;
    setAvatarUrl(fromLocal || dicebearFrom(u?.username || "user"));
  }, []);

  // ถ้าล็อกอินและเป็น owner ให้ดึงรูปล่าสุดจาก API
  useEffect(() => {
    const u = getStoredUser();
    const token = localStorage.getItem("token");
    if (!token || u?.role !== "owner") return;

    (async () => {
      try {
        const { data: me } = await api.get("/owner/settings/me");
        // มี field profile อยู่ใน response
        // (เส้นทางนี้คืน profile มาจริง ๆ) :contentReference[oaicite:0]{index=0}
        const url = me?.profile ? toPublicUrl(me.profile) : null;
        setAvatarUrl(url || dicebearFrom(me?.username || "user"));
      } catch {
        // เงียบได้ ใช้ค่าจาก localStorage ต่อ
      }
    })();
  }, [authed]);

  // ถ้า logout รีเซ็ตภาพให้เป็นค่า default
  useEffect(() => {
    const onAuthChanged = (e) => {
      if (!e?.detail?.authed) setAvatarUrl(dicebearFrom("user"));
    };
    window.addEventListener("auth:changed", onAuthChanged);
    return () => window.removeEventListener("auth:changed", onAuthChanged);
  }, []);

  // โหลดจำนวน wishlist
  const reloadWishlistCount = async () => {
    if (!localStorage.getItem("token")) {
      setWishCount(0);
      return;
    }
    try {
      const { items } = await fetchWishlist();
      setWishCount(items.length || 0);
    } catch {
      // เงียบไว้ ถ้า error ไม่ต้องรบกวนผู้ใช้
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setOpenUserMenu(false);
    setOpenMobileMenu(false);
    setAuthed(false);                 // ← อัปเดต state ทันที กัน UI ค้าง
    setWishCount(0); // รีเซ็ต badge
    // แจ้งทุกคอมโพเนนต์ว่าออกจากระบบแล้ว + ให้เคลียร์ wishlist เดี๋ยวนี้
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: { authed: false }}));
    window.dispatchEvent(new Event('wishlist:clear'));
    navigate("/", { replace: true });
  };

  // ปิดเมนูเมื่อ resize
  useEffect(() => {
    const closeAll = () => {
      setOpenUserMenu(false);
      setOpenMobileMenu(false);
    };
    window.addEventListener("resize", closeAll);
    return () => window.removeEventListener("resize", closeAll);
  }, []);

  // ปิดเมนูเมื่อเปลี่ยนหน้า
  useEffect(() => {
    setOpenUserMenu(false);
    setOpenMobileMenu(false);
  }, [location.pathname]);

  // ปุ่ม ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenUserMenu(false);
        setOpenMobileMenu(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // คลิกนอกเมนูผู้ใช้
  useEffect(() => {
    const handleClickOutside = (e) => {
      const t = e.target;
      const inMenu = userMenuWrapperRef.current?.contains(t);
      const onButton = userMenuButtonRef.current?.contains(t);
      if (!inMenu && !onButton) setOpenUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside, { passive: true });
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const isActive = (path) => location.pathname === path;

  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const handlePostClick = () => {
    const token = localStorage.getItem("token");
    const u = getStoredUser();

    if (!token) {
      navigate("/login?next=/become-owner");
      return;
    }
    if (u?.role === "owner") {
      navigate("/owner/dashboard");
      return;
    }
    if (u?.role === "admin" || u?.role === "super_admin") {
      navigate("/admin");
      return;
    }
    navigate("/become-owner");
  };

  // ไปหน้าหลักตามบทบาท
  const goRoleHome = () => {
    const u = getStoredUser();
    setOpenMobileMenu(false);
    if (u?.role === "owner") return navigate("/owner/dashboard");
    if (u?.role === "admin" || u?.role === "super_admin") return navigate("/admin");
    return navigate("/become-owner");
  };

  // โหลด count ตอน mount + เมื่อ path หรือสถานะล็อกอินเปลี่ยน
  useEffect(() => {
    reloadWishlistCount();
  }, [location.pathname, authed]);

  // ฟัง event จาก HeartButton/WishlistPage เพื่ออัปเดต count ทันที
  useEffect(() => {
    const onChanged = () => reloadWishlistCount();
    window.addEventListener("wishlist:changed", onChanged);
    return () => window.removeEventListener("wishlist:changed", onChanged);
  }, []);

  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      {/* Bar โปร่ง + blur + ขอบบางด้านล่าง */}
      <nav className="pt-[env(safe-area-inset-top)] bg-white/80 backdrop-blur border-b border-gray-200/60 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            {/* Left: Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/Chaomai-Logo.svg"
                alt="chaomai logo"
                className="h-16 w-16 rounded-lg object-contain"
              />
              <span className="text-xl font-bold text-gray-800">
                chao-mai.com
              </span>
            </Link>

            {/* Center: Menu (desktop) */}
            <div className="hidden md:flex items-center gap-8">
              <ExternalLink href="/" exact>หน้าแรก</ExternalLink>
              <ExternalLink href="/search">ค้นหา</ExternalLink>
              <ExternalLink href="/properties">เช่า</ExternalLink>
              {/* <ExternalLink href="#contact">เกี่ยวกับเรา</ExternalLink> */}
            </div>

            {/* Right: Actions (desktop) */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={handlePostClick}
                className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-sm hover:shadow-xl transition"
              >
                ลงประกาศฟรี
              </button>

              {/* ปุ่มหัวใจ + badge */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (!localStorage.getItem("token")) {
                      navigate("/login?next=/wishlist");
                    } else {
                      navigate("/wishlist");
                    }
                  }}
                  className="w-10 h-10 text-gray-700 hover:text-red-500 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                  aria-label="Wishlist"
                >
                  <Heart className="inline text-lg" />
                </button>
                {wishCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-[10px] leading-5 text-center font-semibold"
                    title={`${wishCount} รายการที่ถูกใจ`}
                  >
                    {wishCount > 99 ? "99+" : wishCount}
                  </span>
                )}
              </div>

              {/* User dropdown */}
              <div className="relative" ref={userMenuWrapperRef}>
                {/* ปุ่มเปิดเมนู: แยกตาม authed */}
                {authed ? (
                  // ล็อกอินแล้ว = แสดงรูปโปรไฟล์
                  <button
                    ref={userMenuButtonRef}
                    onClick={() => setOpenUserMenu((v) => !v)}
                    className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-gray-200 hover:ring-blue-400 transition"
                    aria-haspopup="menu"
                    aria-expanded={openUserMenu}
                    title="เมนูผู้ใช้"
                  >
                    <img
                      src={avatarUrl || null}
                      alt={user?.username || "user"}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = dicebearFrom(user?.username || "user"); }}
                    />
                  </button>
                ) : (
                  // ยังไม่ล็อกอิน = แสดงปุ่มสามขีด
                  <button
                    ref={userMenuButtonRef}
                    onClick={() => setOpenUserMenu((v) => !v)}
                    className="w-10 h-10 rounded-full ring-1 ring-gray-200 hover:ring-blue-400 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition"
                    aria-haspopup="menu"
                    aria-expanded={openUserMenu}
                    aria-label="เมนูผู้ใช้"
                    title="เมนูผู้ใช้"
                  >
                    <Menu className="w-5 h-5 text-gray-700" />
                  </button>
                )}

                {/* เมนูดรอปดาวน์ (ใช้ชุดเดิมของคุณได้เลย) */}
                {openUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg py-2 z-50 text-sm overflow-hidden"
                    role="menu"
                  >
                    {authed ? (
                      <>
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-gray-200">
                            <img
                              src={avatarUrl || null}
                              alt={user?.username || "user"}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.src = dicebearFrom(user?.username || "user"); }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {user?.username}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user?.role}
                            </div>
                          </div>
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-white/10" />

                        <Link
                          to="/bookings"
                          className="block px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          <CircleCheck className="inline mr-2" />
                          รายการเช่าของฉัน
                        </Link>

                        {user?.role === "user" && (
                          
                          <Link
                            to="/become-owner"
                            className="block px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                          >
                            <UserCog className="inline mr-2" />
                            สมัครเป็นผู้ลงประกาศ
                          </Link>
                        )}

                        {(user?.role === "admin" || user?.role === "super_admin") && (
                          <Link
                            to="/admin/dashboard"
                            className="block px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                          >
                            <LayoutDashboard className="inline mr-2" />
                            Admin dashboard
                          </Link>
                        )}

                        {user?.role === "owner" && (
                          <Link
                            to="/owner/dashboard"
                            className="block px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                          >
                            <LayoutDashboard className="inline mr-2" />
                            Owner dashboard
                          </Link>
                        )}

                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <ArrowRightFromLine className="inline mr-2" />
                          ออกจากระบบ
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="block px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          <LogIn className="inline mr-2" />
                          เข้าสู่ระบบ
                        </Link>
                        <Link
                          to="/register"
                          className="block px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          <UserPlus className="inline mr-2" />
                          สมัครสมาชิก
                        </Link>
                        <Link
                          to="/about"
                          className="block px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          <Mail className="inline mr-2" />
                          เกี่ยวกับเรา
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden w-10 h-10 text-gray-700 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              onClick={() => setOpenMobileMenu((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={openMobileMenu}
            >
              <Menu className="inline text-lg" />
            </button>
          </div>
        </div>
      </nav>

      {/* ===== Mobile Menu + Overlay ===== */}
      {openMobileMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpenMobileMenu(false)}
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        className={`md:hidden fixed inset-x-0 z-[70] top-[calc(64px+env(safe-area-inset-top))] transition-all duration-200 ${
          openMobileMenu ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="mx-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden">
          {/* Header เมนูมือถือ */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/chaomai-logo1.png" alt="chaomai" className="rounded-lg h-10 w-10" />
              <span className="font-semibold text-gray-800 dark:text-gray-100">เมนู</span>
            </div>
            <button
              onClick={() => setOpenMobileMenu(false)}
              className="size-9 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
              aria-label="ปิดเมนู"
            >
              <X className="inline text-lg" />
            </button>
          </div>

          {/* การ์ดผู้ใช้เล็ก ๆ เมื่อ login */}
          {authed && (
            <>
              <div className="px-4 pb-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-gray-200">
                    <img
                      src={avatarUrl || null}
                      alt={JSON.parse(localStorage.getItem("user") || "{}")?.username || "user"}
                      className="w-full h-full object-cover"
                      onError={(e) => { 
                        const u = JSON.parse(localStorage.getItem("user") || "{}");
                        e.currentTarget.src = dicebearFrom(u?.username || "user");
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {JSON.parse(localStorage.getItem("user") || "{}")?.username}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {JSON.parse(localStorage.getItem("user") || "{}")?.role}
                    </div>
                  </div>
                </div>
              </div>

              {/* 👉 ปุ่มไปแดชบอร์ดตามบทบาท */}
              {/* 👉 ปุ่มไปแดชบอร์ด แสดงเฉพาะ owner/admin/super_admin */}
              {/* 👉 ปุ่มไปแดชบอร์ดตามบทบาท — แสดงเฉพาะ owner / admin / super_admin */}
              {(() => {
                const u = getStoredUser();
                const canSeeDashboard =
                  authed && (u?.role === "owner" || u?.role === "admin" || u?.role === "super_admin");
                if (!canSeeDashboard) return null;
                return (
                  <>
                    <div className="px-4 pb-3">
                      <button
                        onClick={goRoleHome}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium py-2.5"
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        ไปที่แดชบอร์ด
                      </button>
                    </div>
                    <div className="h-px bg-gray-100" />
                  </>
                );
              })()}


              <div className="h-px bg-gray-100 dark:bg-white/10" />
            </>
          )}


          {/* เมนูหลัก (มือถือ) */}
          <nav className="px-2 py-2">
            <Link
              to="/"
              onClick={() => setOpenMobileMenu(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${
                isActive("/")
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                  : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
              autoFocus
            >
              <House />
              หน้าแรก
              {isActive("/") && (
                <CircleCheck className="ml-auto text-blue-600 dark:text-blue-400" />
              )}
            </Link>

            <Link
              to="/Bookings"
              onClick={() => setOpenMobileMenu(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${
                isActive("/Bookings")
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                  : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
              autoFocus
            >
              <CircleCheck />
              รายการเช่าของฉัน
              {isActive("/Bookings") && (
                <CircleCheck className="ml-auto text-blue-600 dark:text-blue-400" />
              )}
            </Link>

            <Link
              to="/search"
              onClick={() => setOpenMobileMenu(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${
                isActive("/search")
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                  : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              <Search />
              ค้นหา
              {isActive("/search") && (
                <CircleCheck className="ml-auto text-blue-600 dark:text-blue-400" />
              )}
            </Link>

            <Link
              to="/properties"
              onClick={() => setOpenMobileMenu(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${
                isActive("/properties")
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                  : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              <MapPinHouse />
              เช่า
              {isActive("/properties") && (
                <CircleCheck className="ml-auto text-blue-600 dark:text-blue-400" />
              )}
            </Link>

            <Link
              to="#contact"
              onClick={() => setOpenMobileMenu(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${
                isActive("/contact")
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                  : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              <Mail />
              เกี่ยวกับเรา
              {isActive("/contact") && (
                <CircleCheck className="ml-auto text-blue-600 dark:text-blue-400" />
              )}
            </Link>
          </nav>

          <div className="h-px bg-gray-100 dark:bg-white/10" />

          {/* ปุ่ม CTA */}
          <div className="px-4 py-3">
            <button
              onClick={() => {
                setOpenMobileMenu(false);
                const u = getStoredUser();
                const canSeeDashboard =
                  authed && (u?.role === "owner" || u?.role === "admin" || u?.role === "super_admin");
                if (canSeeDashboard) {
                  goRoleHome();
                } else {
                  handlePostClick();
                }
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
            >
              <HousePlus />
              {(() => {
                const u = getStoredUser();
                const canSeeDashboard =
                  authed && (u?.role === "owner" || u?.role === "admin" || u?.role === "super_admin");
                return canSeeDashboard ? "ไปที่แดชบอร์ด" : "ลงประกาศฟรี";
              })()}
            </button>
          </div>


          <div className="h-px bg-gray-100 dark:bg-white/10" />

          {/* แถวลัดด้านล่าง: ถูกใจ + เข้าสู่ระบบ/ออกจากระบบ */}
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => {
                setOpenMobileMenu(false);
                if (!localStorage.getItem("token")) {
                  navigate("/login?next=/wishlist");
                } else {
                  navigate("/wishlist");
                }
              }}
              className="relative flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-900/20 py-2.5 text-rose-600 dark:text-gray-200"
              aria-label="รายการที่ถูกใจ"
            >
              <Heart className="inline text-red-500" />
              ถูกใจ
              {wishCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-[10px] leading-5 text-center font-semibold">
                  {wishCount > 99 ? "99+" : wishCount}
                </span>
              )}
            </button>

            {!authed ? (
              <Link
                to="/login"
                onClick={() => setOpenMobileMenu(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 py-2.5 text-gray-800 dark:text-gray-200"
              >
                <User className="inline" />
                เข้าสู่ระบบ
              </Link>
            ) : (
              <button
                onClick={() => {
                  setOpenMobileMenu(false);
                  handleLogout();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 py-2.5"
              >
                <ArrowRightFromLine className="inline" />
                ออกจากระบบ
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
