// src/pages/UserBookings.jsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { CalendarCheck, CheckCircle2, XCircle, Clock, BadgeCheck, Phone } from "lucide-react";

// === ชิปสถานะที่ให้ user กรองได้ ===
const statusChips = [
  { key: "", label: "ทั้งหมด" },
  { key: "pending", label: "รออนุมัติ" },
  { key: "approved", label: "อนุมัติแล้ว" },
  { key: "paid", label: "ชำระแล้ว" },
  { key: "completed", label: "เสร็จสิ้น" },
  { key: "declined", label: "ปฏิเสธ" },
  { key: "cancelled", label: "ยกเลิก" },
];

function fmtTHB(n) { return Number(n || 0).toLocaleString("th-TH"); }
function fmtDate(d) { try { return new Date(d).toLocaleDateString("th-TH"); } catch { return d || "-"; } }
// function sum(a, b) { return Number(a || 0) + Number(b || 0); }

export default function UserBookings() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const active = searchParams.get("status") || "";
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const { data } = await api.get("/bookings", {
        params: { role: "renter", status: active || undefined },
      });
      setItems(data?.items || []);
    } catch (e) {
      if (e?.response?.status === 401) {
        setErr("โปรดเข้าสู่ระบบอีกครั้ง");
      } else {
        setErr(e?.response?.data?.message || "โหลดรายการไม่สำเร็จ");
      }
    } finally {
      setLoading(false);
    }
  }

  const onFilter = (k) => {
    const next = new URLSearchParams(searchParams);
    if (!k) next.delete("status");
    else next.set("status", k);
    setSearchParams(next, { replace: true });
  };

  // ปุ่มยกเลิก: user ยกเลิกได้เมื่อ pending/approved
  const canCancel = (st) => ["pending", "approved"].includes(st);

  async function cancelBooking(b) {
    if (!canCancel(b.status)) return;
    if (!confirm("ยืนยันยกเลิกรายการนี้?")) return;
    try {
      setLoading(true);
      await api.patch(`/bookings/${b._id}/status`, { action: "cancel" });
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "ยกเลิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  // สร้าง badge ตามสถานะ
  const StatusTag = ({ status }) => {
    const base = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium";
    if (status === "pending")    return <span className={`${base} bg-amber-50 text-amber-700`}><Clock className="w-3.5 h-3.5" />รออนุมัติ</span>;
    if (status === "approved")   return <span className={`${base} bg-blue-50 text-blue-700`}><BadgeCheck className="w-3.5 h-3.5" />อนุมัติแล้ว</span>;
    if (status === "paid")       return <span className={`${base} bg-green-50 text-green-700`}><CheckCircle2 className="w-3.5 h-3.5" />ชำระแล้ว</span>;
    if (status === "completed")  return <span className={`${base} bg-emerald-50 text-emerald-700`}><CalendarCheck className="w-3.5 h-3.5" />เสร็จสิ้น</span>;
    if (status === "declined")   return <span className={`${base} bg-rose-50 text-rose-700`}><XCircle className="w-3.5 h-3.5" />ปฏิเสธ</span>;
    if (status === "cancelled")  return <span className={`${base} bg-gray-100 text-gray-600`}><XCircle className="w-3.5 h-3.5" />ยกเลิก</span>;
    return <span className={`${base} bg-gray-100 text-gray-600`}>{status}</span>;
  };

  // ====== UI ======
  return (
    <div className="max-w-6xl mx-auto pt-20 px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">รายการเช่าของฉัน</h1>
      <p className="text-slate-600 mb-6">ดูสถานะคำขอเช่าและประวัติการเช่าทั้งหมดของคุณ</p>

      {/* ฟิลเตอร์สถานะ */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusChips.map((c) => (
          <button
            key={c.key}
            onClick={() => onFilter(c.key)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              active === c.key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {err && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2">
          {err}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl overflow-hidden border border-black/10 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3">ทรัพย์</th>
                <th className="text-left px-4 py-3">เจ้าของ</th>
                <th className="text-left px-4 py-3">ช่วงวันที่</th>
                <th className="text-right px-4 py-3">ยอดรวม (฿)</th>
                <th className="text-center px-4 py-3">สถานะ</th>
                <th className="text-right px-4 py-3">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">กำลังโหลด...</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">ยังไม่มีรายการเช่า</td></tr>
              )}
              {!loading && items.map((b) => (
                <tr key={b._id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <Link to={`/properties/${b?.property?._id || ""}`} className="font-medium text-slate-800 hover:underline">
                      {b?.property?.title || "-"}
                    </Link>
                    <div className="text-xs text-slate-500">ประเภท: {b?.property?.type || "-"}</div>
                  </td>
                  <td className="px-4 py-3">
                    {b?.owner?.name || b?.owner?.username || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {b.openEnded
                      ? `${fmtDate(b.startDate)} — ไม่กำหนดสิ้นสุด`
                      : `${fmtDate(b.startDate)} — ${fmtDate(b.endDate)}`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.totalAmount ? fmtTHB(b.totalAmount) : (b.pricePerMonth ? `${fmtTHB(b.pricePerMonth)}/เดือน` : "-")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusTag status={b.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canCancel(b.status) ? (
                      <button
                        onClick={() => cancelBooking(b)}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                        title="ยกเลิกรายการ"
                      >
                        ยกเลิก
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading && (
          <div className="rounded-2xl border border-black/10 bg-white p-4 text-center text-slate-500">กำลังโหลด...</div>
        )}
        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-black/10 bg-white p-4 text-center text-slate-500">ยังไม่มีรายการเช่า</div>
        )}
        {!loading && items.map((b) => (
          <div key={b._id} className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link to={`/properties/${b?.property?._id || ""}`} className="font-semibold text-slate-900">
                  {b?.property?.title || "-"}
                </Link>
                <div className="text-xs text-slate-500">ประเภท: {b?.property?.type || "-"}</div>
              </div>
              <StatusTag status={b.status} />
            </div>

            <div className="mt-2 text-sm text-slate-700">
              เจ้าของ: {b?.owner?.name || b?.owner?.username || "-"}
            </div>
            <div className="text-sm text-slate-700">
              ช่วงวันที่:{" "}
              {b.openEnded
                ? `${fmtDate(b.startDate)} — ไม่กำหนดสิ้นสุด`
                : `${fmtDate(b.startDate)} — ${fmtDate(b.endDate)}`}
            </div>
            <div className="text-sm text-slate-700">
              ยอดรวม: {b.totalAmount ? fmtTHB(b.totalAmount) : (b.pricePerMonth ? `${fmtTHB(b.pricePerMonth)}/เดือน` : "-")}
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
              {canCancel(b.status) ? (
                <button
                  onClick={() => cancelBooking(b)}
                  className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm"
                >
                  ยกเลิก
                </button>
              ) : null}
              <Link
                to={`/properties/${b?.property?._id || ""}`}
                className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm"
              >
                ดูทรัพย์
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
