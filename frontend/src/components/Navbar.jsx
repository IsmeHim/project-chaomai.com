import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ExternalLink from "./NavbarLink/ExternalLink";
import { MapPinHouse, Search, House, Mail, HousePlus } from "lucide-react";
import { fetchWishlist } from "../lib/wishlist";

export default function Navbar({ isAuth, setAuth }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [wishCount, setWishCount] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const authed = !!localStorage.getItem("token");

  // refs: ปิดเมนูเมื่อคลิกนอกพื้นที่
  const userMenuWrapperRef = useRef(null);
  const userMenuButtonRef = useRef(null);

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
    setAuth?.(false);
    setWishCount(0); // รีเซ็ต badge
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
      navigate("/admin/dashboard");
      return;
    }
    navigate("/become-owner");
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

  const NavLink = ({ to, children }) => (
    <Link
      to={to}
      className={`group relative font-medium transition ${
        isActive(to)
          ? "text-blue-600"
          : "text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
      }`}
    >
      {children}
      <span
        className={`absolute left-0 -bottom-1 h-0.5 bg-blue-600 transition-all ${
          isActive(to) ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
    </Link>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      {/* Bar โปร่ง + blur + ขอบบางด้านล่าง */}
      <nav className="pt-[env(safe-area-inset-top)] bg-white/80 dark:bg-gray-900/70 backdrop-blur border-b border-gray-200/60 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            {/* Left: Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/Chaomai-Logo.svg"
                alt="chaomai logo"
                className="h-16 w-16 rounded-lg object-contain"
              />
              <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
                chaomai.com
              </span>
            </Link>

            {/* Center: Menu (desktop) */}
            <div className="hidden md:flex items-center gap-8">
              <NavLink to="/">หน้าแรก</NavLink>
              <ExternalLink href="/search">ค้นหา</ExternalLink>
              <ExternalLink href="#Featured">เช่า</ExternalLink>
              <ExternalLink href="#contact">เกี่ยวกับเรา</ExternalLink>
            </div>

            {/* Right: Actions (desktop) */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={handlePostClick}
                className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-sm"
              >
                ลงประกาศ
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
                  className="w-10 h-10 text-gray-700 dark:text-gray-300 hover:text-red-500 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                  aria-label="Wishlist"
                >
                  <i className="far fa-heart text-lg" />
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
                <button
                  ref={userMenuButtonRef}
                  onClick={() => setOpenUserMenu((v) => !v)}
                  className="w-10 h-10 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                  aria-haspopup="menu"
                  aria-expanded={openUserMenu}
                >
                  <i className="fas fa-bars text-xl" />
                </button>

                {openUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg py-2 z-50 text-sm overflow-hidden"
                    role="menu"
                  >
                    {authed ? (
                      <>
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold">
                            {String(user?.username).slice(0, 2)}
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

                        {user?.role === "user" && (
                          <Link
                            to="/become-owner"
                            className="block px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                          >
                            <i className="fa-solid fa-user-tie mr-2" />
                            สมัครเป็นผู้ลงประกาศ
                          </Link>
                        )}

                        {(user?.role === "admin" || user?.role === "super_admin") && (
                          <Link
                            to="/admin/dashboard"
                            className="block px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                          >
                            <i className="fa-solid fa-gauge-high mr-2" />
                            Admin dashboard
                          </Link>
                        )}

                        {user?.role === "owner" && (
                          <Link
                            to="/owner/dashboard"
                            className="block px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                          >
                            <i className="fa-solid fa-door-open mr-2" />
                            Owner dashboard
                          </Link>
                        )}

                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          ออกจากระบบ
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="block px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          เข้าสู่ระบบ/สมัครสมาชิก
                        </Link>
                        <Link
                          to="/about"
                          className="block px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                        >
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
              className="md:hidden w-10 h-10 text-gray-700 dark:text-gray-300 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              onClick={() => setOpenMobileMenu((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={openMobileMenu}
            >
              <i className="fas fa-bars text-lg" />
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
              <img src="/Chaomai-Logo.svg" alt="chaomai" className="h-7 w-7" />
              <span className="font-semibold text-gray-800 dark:text-gray-100">เมนู</span>
            </div>
            <button
              onClick={() => setOpenMobileMenu(false)}
              className="size-9 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
              aria-label="ปิดเมนู"
            >
              <i className="fa-solid fa-xmark text-lg" />
            </button>
          </div>

          {/* การ์ดผู้ใช้เล็ก ๆ เมื่อ login */}
          {authed && (
            <>
              <div className="px-4 pb-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold">
                    {String(JSON.parse(localStorage.getItem("user") || "{}")?.username).slice(0, 2)}
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
              <div className="h-px bg-gray-100 dark:bg-white/10" />
            </>
          )}

          {/* เมนูหลัก (มือถือ) */}
          <nav className="px-2 py-2">
            <a
              href="/"
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
                <i className="fa-solid fa-circle-check ml-auto text-blue-600 dark:text-blue-400" />
              )}
            </a>

            <a
              href="/search"
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
                <i className="fa-solid fa-circle-check ml-auto text-blue-600 dark:text-blue-400" />
              )}
            </a>

            <a
              href="#Featured"
              onClick={() => setOpenMobileMenu(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${
                isActive("/about")
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                  : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              <MapPinHouse />
              เช่า
              {isActive("/about") && (
                <i className="fa-solid fa-circle-check ml-auto text-blue-600 dark:text-blue-400" />
              )}
            </a>

            <a
              href="#contact"
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
                <i className="fa-solid fa-circle-check ml-auto text-blue-600 dark:text-blue-400" />
              )}
            </a>
          </nav>

          <div className="h-px bg-gray-100 dark:bg-white/10" />

          {/* ปุ่ม CTA */}
          <div className="px-4 py-3">
            <button
              onClick={() => {
                setOpenMobileMenu(false);
                handlePostClick();
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
            >
              <HousePlus />
              ลงประกาศ
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
              <i className="fa-regular fa-heart" />
              ถูกใจ
              {wishCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-[10px] leading-5 text-center font-semibold">
                  {wishCount > 99 ? "99+" : wishCount}
                </span>
              )}
            </button>

            {!isAuth ? (
              <Link
                to="/login"
                onClick={() => setOpenMobileMenu(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 py-2.5 text-gray-800 dark:text-gray-200"
              >
                <i className="fa-regular fa-user" />
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
                <i className="fa-solid fa-arrow-right-from-bracket" />
                ออกจากระบบ
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
