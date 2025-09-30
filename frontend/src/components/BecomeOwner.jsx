// src/pages/BecomeOwner.jsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

function normalizePhone(v = "") {
  // เก็บเป็นตัวเลขล้วน (ปลอดภัย/ง่ายสุด) เช่น "081-234-5678" -> "0812345678"
  return String(v).replace(/\D/g, "");
}

export default function BecomeOwner({ setAuth }) {
  const navigate = useNavigate();

  // พยายาม prefill จาก localStorage.user ถ้ามี
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);

  const [form, setForm] = useState({
    phone: user?.phone || "",        // ถ้า login เรายัด phone ใส่ user ไว้ จะ prefill ตรงนี้ได้เลย
    name: user?.name,                 // ชื่อที่จะแสดงในประกาศ/โปรไฟล์เจ้าของ
    company: user?.company,                     // ชื่อร้าน/แบรนด์ (ถ้ามี)
    lineId: user?.lineId,                       // LINE ID
    facebookUrl: user?.facebookUrl,         // Facebook URL
    address: user?.address,                   // ที่อยู่สำหรับติดต่อ/ออกใบเสร็จ (ถ้ามี)
    about: user?.about,                       // แนะนำตัวสั้น ๆ
    accept: false,                   // ยอมรับเงื่อนไข
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // ถ้าอยาก prefill จาก backend จริง ๆ (กรณี user object ไม่มี phone)
  // คุณสามารถมี API /auth/me แล้วมาโหลดใส่ state ที่นี่
  // useEffect(() => { (async () => { const { data } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setForm(s => ({ ...s, phone: data?.phone || s.phone })); })(); }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");

    const phone = normalizePhone(form.phone);
    if (!phone) {
      setErr("กรุณากรอกเบอร์โทร");
      return;
    }
    if (!form.accept) {
      setErr("กรุณายอมรับเงื่อนไขก่อนอัปเกรด");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        phone,
        name: form.name?.trim() || null,
        company: form.company?.trim() || null,
        lineId: form.lineId?.trim() || null,
        facebookUrl: form.facebookUrl?.trim() || null,
        address: form.address?.trim() || null,
        about: form.about?.trim() || null,
      };

      const { data } = await api.post("/auth/become-owner", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // อัปเดต token + user ใน localStorage ให้สะท้อน role/phone ล่าสุด
      if (data?.token) localStorage.setItem("token", data.token);
      if (data?.user)  localStorage.setItem("user", JSON.stringify(data.user));

      // กระตุ้น state ให้ Navbar/Route รับ role ใหม่
      setAuth?.(true);

      setMsg("อัปเกรดสำเร็จ กำลังพาไปหน้า Owner Dashboard...");
      navigate("/owner/dashboard", { replace: true });
    } catch (error) {
      // จับ 409 เฉพาะเจาะจง
      if (error?.response?.status === 409) {
        setErr(error?.response?.data?.message || "เบอร์นี้มีผู้ใช้อยู่แล้ว");
      } else {
        setErr(error?.response?.data?.message || "อัปเกรดไม่สำเร็จ โปรดลองอีกครั้ง");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-25">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-800/80 p-6 md:p-8 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <img src="/Chaomai-Logo.svg" alt="Logo" className="h-9 w-9" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">สมัครเป็นผู้ลงประกาศ</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              เติมข้อมูลสำคัญต่อไปนี้เพื่อยืนยันตัวตนและช่องทางติดต่อก่อนอัปเกรด
            </p>
          </div>
        </div>

        {/* Tips */}
        <ul className="grid sm:grid-cols-3 gap-3 mb-6">
          <li className="rounded-xl px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm">
            <i className="fa-solid fa-shield-halved mr-1" /> ปลอดภัยและตรวจสอบได้
          </li>
          <li className="rounded-xl px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm">
            <i className="fa-solid fa-bolt mr-1" /> อนุมัติไว ใช้เวลาไม่นาน
          </li>
          <li className="rounded-xl px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-sm">
            <i className="fa-solid fa-chart-line mr-1" /> เริ่มลงประกาศและดูสถิติ
          </li>
        </ul>

        {/* Alerts */}
        {!!err && (
          <div className="mb-4 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-3 py-2 text-sm">
            <i className="fa-solid fa-circle-exclamation mr-2" /> {err}
          </div>
        )}
        {!!msg && (
          <div className="mb-4 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-2 text-sm">
            <i className="fa-solid fa-circle-check mr-2" /> {msg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Phone (required) */}
          <label className="block">
            <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
              เบอร์โทรศัพท์ (จำเป็น)
            </span>
            <div className="mt-1 relative">
              <i className="fa-solid fa-phone absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="เช่น 0812345678"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              เราแนะนำให้ใช้เบอร์ที่ติดต่อได้จริง เพื่อความน่าเชื่อถือกับผู้เช่า
            </p>
          </label>

          {/* Display Name */}
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                ชื่อที่ใช้แสดง (Display name)
              </span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="เช่น คุณเอ เจ้าของบ้าน"
                className="mt-1 w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            {/* Company / Brand */}
            <label className="block">
              <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                ชื่อร้าน/แบรนด์ (ถ้ามี)
              </span>
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={onChange}
                placeholder="เช่น Chaomai Property"
                className="mt-1 w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          {/* Contacts */}
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                LINE ID
              </span>
              <input
                type="text"
                name="lineId"
                value={form.lineId}
                onChange={onChange}
                placeholder="เช่น @yourlineid"
                className="mt-1 w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                Facebook URL
              </span>
              <input
                type="url"
                name="facebookUrl"
                value={form.facebookUrl}
                onChange={onChange}
                placeholder="https://facebook.com/yourpage"
                className="mt-1 w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          {/* Address */}
          <label className="block">
            <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
              ที่อยู่สำหรับติดต่อ/ออกใบเสร็จ (ถ้ามี)
            </span>
            <textarea
              name="address"
              value={form.address}
              onChange={onChange}
              rows={3}
              placeholder="บ้านเลขที่/ซอย/ถนน, ตำบล/อำเภอ, จังหวัด, รหัสไปรษณีย์"
              className="mt-1 w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          {/* About */}
          <label className="block">
            <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
              แนะนำตัวสั้น ๆ (จะแสดงในหน้ารายการของคุณ)
            </span>
            <textarea
              name="about"
              value={form.about}
              onChange={onChange}
              rows={3}
              placeholder="สวัสดีครับ/ค่ะ ฉันเป็นเจ้าของบ้าน/หอพัก ยินดีให้ข้อมูลเพิ่มเติมค่ะ"
              className="mt-1 w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          {/* Accept */}
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="accept"
              checked={form.accept}
              onChange={onChange}
              className="mt-1 size-4 rounded border-gray-300 dark:border-white/10 text-blue-600 focus:ring-blue-500"
              required
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              ฉันยืนยันว่าเป็นเจ้าของหรือมีสิทธิ์ลงประกาศ และยอมรับ{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">ข้อกำหนดการใช้บริการ</Link>{" "}
              และ{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">นโยบายความเป็นส่วนตัว</Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 disabled:opacity-70"
          >
            {loading ? (
              <>
                <span className="size-4 border-2 border-white/60 border-top-transparent rounded-full animate-spin" />
                กำลังอัปเกรด...
              </>
            ) : (
              <>
                <i className="fa-solid fa-arrow-up-right-from-square" />
                อัปเกรดเป็นผู้ลงประกาศ
              </>
            )}
          </button>

          <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            เปลี่ยนใจทีหลังสามารถติดต่อทีมงานเพื่อขอเปลี่ยนแปลงได้
          </p>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:underline">
            <i className="fa-solid fa-arrow-left" />
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    </div>
  );
}
