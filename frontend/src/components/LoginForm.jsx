import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function LoginForm({ setAuth }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData
      );
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setAuth?.(true);

      if (data.user.role === "admin") navigate("/admin/dashboard");
      else if (data.user.role === "owner") navigate("/owner/dashboard");
      else navigate("/");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "เข้าสู่ระบบไม่สำเร็จ โปรดตรวจสอบอีเมล/รหัสผ่านอีกครั้ง"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] overflow-hidden grid lg:grid-cols-2 bg-gray-50 dark:bg-gray-900">
      {/* Top brand bar (มือถือเท่านั้น) */}
      <div className="lg:hidden sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <img src="/Chaomai-Logo.svg" alt="Logo" className="h-7 w-7" />
          <span className="font-semibold text-gray-800 dark:text-gray-100">
            chaomai.com
          </span>
        </div>
      </div>

      {/* Left info panel (ไม่มีพื้นหลังเอฟเฟกต์แล้ว) */}
      <div className="hidden lg:block">
        <div className="h-full flex items-center justify-center p-12">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <img src="/Chaomai-Logo.svg" alt="Logo" className="h-40 w-40" />
              {/* <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                ยินดีต้อนรับกลับมา 👋
              </h1> */}
            </div>

            <h2 className="text-4xl font-extrabold leading-tight text-gray-900 dark:text-gray-100">
              ยินดีต้อนรับกลับ 👋
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              เข้าสู่ระบบเพื่อจัดการประกาศ พูดคุยกับผู้สนใจ
              และติดตามสถิติของคุณในที่เดียว
            </p>

            {/* จุดขายเล็ก ๆ (ไอคอนสีสุภาพ) */}
            <ul className="mt-8 space-y-3 text-gray-700 dark:text-gray-200">
              <li className="flex items-center gap-3">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <i className="fa-solid fa-bolt text-blue-600 dark:text-blue-400" />
                </span>
                โหลดเร็ว ใช้งานง่าย
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <i className="fa-solid fa-shield-halved text-emerald-600 dark:text-emerald-400" />
                </span>
                ปลอดภัยและเป็นส่วนตัว
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <i className="fa-solid fa-chart-line text-purple-600 dark:text-purple-400" />
                </span>
                สถิติละเอียด อัปเดตเรียลไทม์
              </li>
            </ul>

            {/* แถบเล็ก ๆ ล่างสุดให้ดูจบงาน */}
            <div className="mt-10 h-px bg-gray-200 dark:bg-white/10" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              มีปัญหาในการเข้าสู่ระบบ? ติดต่อ{" "}
              <a href="/contact" className="text-blue-600 hover:underline">
                ทีมซัพพอร์ต
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right form (การ์ดสวย ๆ) */}
      <div className="flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white/90 dark:bg-gray-800/80 backdrop-blur shadow-xl ring-1 ring-black/5 dark:ring-white/10 p-6 md:p-8">
            {/* brand (มือถือ/แท็บเล็ต) */}
            <div className="lg:hidden mb-6 flex items-center gap-3">
              <img src="/Chaomai-Logo.svg" alt="Logo" className="h-8 w-8" />
              <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                chaomai.com
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              เข้าสู่ระบบ
            </h2>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              ยินดีที่ได้พบกันอีกครั้ง
            </p>

            {/* error */}
            {error && (
              <div className="mt-4 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-3 py-2 text-sm">
                <i className="fa-solid fa-circle-exclamation mr-2" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Email */}
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  อีเมล
                </span>
                <div className="mt-1 relative">
                  <i className="fa-regular fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={onChange}
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </label>

              {/* Password */}
              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    รหัสผ่าน
                  </span>
                  <a
                    href="/forgot"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ลืมรหัสผ่าน?
                  </a>
                </div>
                <div className="mt-1 relative">
                  <i className="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={onChange}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    <i
                      className={`fa-regular ${
                        showPw ? "fa-eye-slash" : "fa-eye"
                      }`}
                    />
                  </button>
                </div>
              </label>

              {/* Remember + submit */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-gray-300 dark:border-white/10 text-blue-600 focus:ring-blue-500"
                    defaultChecked
                  />
                  จำฉันไว้ในระบบ
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="size-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-right-to-bracket" />
                    เข้าสู่ระบบ
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  หรือ
                </span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
              </div>

              {/* Social (ตัวอย่างปุ่มเฉย ๆ) */}
              <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt=""
                  className="h-5 w-5"
                />
                เข้าสู่ระบบด้วย Google
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              ยังไม่มีบัญชี?{" "}
              <a
                href="/register"
                className="text-blue-600 hover:underline font-medium"
              >
                สมัครสมาชิก
              </a>
            </p>
          </div>

          {/* ลิงก์กลับหน้าแรก */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:underline"
            >
              <i className="fa-solid fa-arrow-left" />
              กลับหน้าแรก
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
