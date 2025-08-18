import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function BecomeOwner({ setAuth }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleBecomeOwner = async () => {
    setLoading(true);
    setMsg("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        "http://localhost:5000/api/auth/become-owner",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // อัปเดต token + user ใน localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // กระตุ้น state ให้ Navbar/Route รับ role ใหม่
      setAuth?.(true);

      setMsg("อัปเกรดสำเร็จ กำลังพาไปหน้า Owner Dashboard...");
      // ไปหน้า owner
      navigate("/owner/dashboard", { replace: true });
    } catch (err) {
      setMsg(
        err?.response?.data?.message || "อัปเกรดไม่สำเร็จ โปรดลองอีกครั้ง"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800/80 p-6 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex items-center gap-3 mb-4">
          <img src="/Chaomai-Logo.svg" alt="Logo" className="h-8 w-8" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            สมัครเป็นผู้ลงประกาศ
          </h1>
        </div>

        <p className="text-gray-600 dark:text-gray-300">
          เมื่อคุณอัปเกรดเป็น <b>owner</b> คุณจะสามารถลงประกาศบ้าน/หอพัก/คอนโด
          จัดการรายการ และดูสถิติได้
        </p>

        {msg && (
          <div className="mt-4 text-sm rounded-lg px-3 py-2 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            {msg}
          </div>
        )}

        <button
          onClick={handleBecomeOwner}
          disabled={loading}
          className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 disabled:opacity-70"
        >
          {loading ? (
            <>
              <span className="size-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              กำลังอัปเกรด...
            </>
          ) : (
            <>
              <i className="fa-solid fa-arrow-up-right-from-square" />
              อัปเกรดเป็นผู้ลงประกาศ
            </>
          )}
        </button>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          เปลี่ยนใจทีหลังสามารถติดต่อทีมงานเพื่อขอเปลี่ยนแปลงได้
        </p>

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
  );
}
