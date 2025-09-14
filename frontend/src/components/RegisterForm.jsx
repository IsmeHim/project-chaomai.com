
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../lib/api";

export default function RegisterForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    phone: "", // เพิ่มฟิลด์เบอร์โทรศัพท์
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(""); // ใช้แสดงข้อความสำเร็จแบบสั้น ๆ
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    const { username, email, password, confirm } = formData;

    // ตรวจความถูกต้องเบื้องต้น
    if (!username.trim() || !email.trim() || !password) {
      setError("กรอกข้อมูลให้ครบถ้วน");
      return;
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (password !== confirm) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      const payload = { username, email, password };
      if (formData.phone?.trim()) {
        payload.phone = formData.phone.trim();
      }
      await api.post("/auth/register", payload);

      setOk("สมัครสมาชิกสำเร็จ! กำลังพาไปหน้าเข้าสู่ระบบ...");
      setTimeout(() => navigate("/login"), 700);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
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

      {/* Left info panel (เรียบ, ไม่มีเอฟเฟกต์) */}
      <div className="hidden lg:block">
        <div className="h-full flex items-center justify-center p-12">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <img src="/Chaomai-Logo.svg" alt="Logo" className="h-40 w-40" />
              {/* <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                chaomai.com
              </h1> */}
            </div>

            <h2 className="text-4xl font-extrabold leading-tight text-gray-900 dark:text-gray-100">
              สร้างบัญชีของคุณ ✨
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">
              สมัครเพื่อเริ่มต้นลงประกาศ คุยกับผู้สนใจ
              และติดตามสถิติของคุณได้ในที่เดียว
            </p>

            <ul className="mt-8 space-y-3 text-gray-700 dark:text-gray-200">
              <li className="flex items-center gap-3">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <i className="fa-solid fa-wand-magic-sparkles text-blue-600 dark:text-blue-400" />
                </span>
                สมัครง่าย ไม่กี่ขั้นตอน
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <i className="fa-solid fa-shield-halved text-emerald-600 dark:text-emerald-400" />
                </span>
                ปลอดภัยและเป็นส่วนตัว
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <i className="fa-solid fa-bell text-purple-600 dark:text-purple-400" />
                </span>
                แจ้งเตือนโอกาสดี ๆ แบบเรียลไทม์
              </li>
            </ul>

            <div className="mt-10 h-px bg-gray-200 dark:bg-white/10" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              มีบัญชีอยู่แล้ว?{" "}
              <a href="/login" className="text-blue-600 hover:underline">
                เข้าสู่ระบบ
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right form card */}
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
              สมัครสมาชิก
            </h2>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              ฟรี ไม่มีค่าธรรมเนียม
            </p>

            {/* error / success */}
            {error && (
              <div className="mt-4 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-3 py-2 text-sm">
                <i className="fa-solid fa-circle-exclamation mr-2" />
                {error}
              </div>
            )}
            {ok && (
              <div className="mt-4 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-2 text-sm">
                <i className="fa-solid fa-circle-check mr-2" />
                {ok}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Username */}
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  ชื่อผู้ใช้
                </span>
                <div className="mt-1 relative">
                  <i className="fa-regular fa-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={onChange}
                    required
                    placeholder="เช่น supreecha"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </label>

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
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  รหัสผ่าน
                </span>
                <div className="mt-1 relative">
                  <i className="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={onChange}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    <i className={`fa-regular ${showPw ? "fa-eye-slash" : "fa-eye"}`} />
                  </button>
                </div>
              </label>

              {/* Confirm Password */}
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  ยืนยันรหัสผ่าน
                </span>
                <div className="mt-1 relative">
                  <i className="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    name="confirm"
                    value={formData.confirm}
                    onChange={onChange}
                    required
                    placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showConfirmPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    <i className={`fa-regular ${showConfirmPw ? "fa-eye-slash" : "fa-eye"}`} />
                  </button>
                </div>
              </label>

              {/* Phone (optional) */}
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  เบอร์โทร (ไม่บังคับ)
                </span>
                <div className="mt-1 relative">
                  <i className="fa-solid fa-phone absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={onChange}
                    placeholder="เช่น 0812345678"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </label>

              {/* Terms + Submit */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  required
                  className="mt-1 size-4 rounded border-gray-300 dark:border-white/10 text-blue-600 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  ฉันยอมรับ{" "}
                  <a href="/terms" className="text-blue-600 hover:underline">
                    ข้อกำหนดการใช้บริการ
                  </a>{" "}
                  และ{" "}
                  <a href="/privacy" className="text-blue-600 hover:underline">
                    นโยบายความเป็นส่วนตัว
                  </a>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="size-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    กำลังสมัครสมาชิก...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-user-plus" />
                    สมัครสมาชิก
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

              {/* Social (ตัวอย่างปุ่ม) */}
              {/* <button
                type="button"
                className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt=""
                  className="h-5 w-5"
                />
                สมัครด้วย Google
              </button> */}
            </form>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              มีบัญชีอยู่แล้ว?{" "}
              <a href="/login" className="text-blue-600 hover:underline font-medium">
                เข้าสู่ระบบ
              </a>
            </p>
          </div>

          {/* กลับหน้าแรก */}
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
