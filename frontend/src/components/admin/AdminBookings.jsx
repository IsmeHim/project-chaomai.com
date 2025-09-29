// components/admin/AdminBookings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { Link } from "react-router-dom";
import { CalendarCheck, CheckCircle2, XCircle, Clock, BadgeCheck, Search } from "lucide-react";

const statusChips = [
  { key: "", label: "ทั้งหมด" },
  { key: "pending", label: "รออนุมัติ" },
  { key: "approved", label: "อนุมัติแล้ว" },
  { key: "paid", label: "ชำระแล้ว" },
  { key: "completed", label: "เสร็จสิ้น" },
  { key: "declined", label: "ปฏิเสธ" },
  { key: "cancelled", label: "ยกเลิก" },
];

const StatusTag = ({ status }) => {
  const base =
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset";
  if (status === "pending")
    return (
      <span className={`${base} bg-amber-500 text-amber-800 ring-amber-200 dark:bg-amber-900/15 dark:text-amber-700 dark:ring-amber-800/50`}>
        <Clock className="w-3.5 h-3.5" /> รออนุมัติ
      </span>
    );
  if (status === "approved")
    return (
      <span className={`${base} bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-900/15 dark:text-blue-300 dark:ring-blue-800/50`}>
        <BadgeCheck className="w-3.5 h-3.5" /> อนุมัติแล้ว
      </span>
    );
  if (status === "paid")
    return (
      <span className={`${base} bg-green-50 text-green-800 ring-green-200 dark:bg-green-900/15 dark:text-green-300 dark:ring-green-800/50`}>
        <CheckCircle2 className="w-3.5 h-3.5" /> ชำระแล้ว
      </span>
    );
  if (status === "completed")
    return (
      <span className={`${base} bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/15 dark:text-emerald-300 dark:ring-emerald-800/50`}>
        <CalendarCheck className="w-3.5 h-3.5" /> เสร็จสิ้น
      </span>
    );
  if (status === "declined")
    return (
      <span className={`${base} bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-900/15 dark:text-rose-300 dark:ring-rose-800/50`}>
        <XCircle className="w-3.5 h-3.5" /> ปฏิเสธ
      </span>
    );
  if (status === "cancelled")
    return (
      <span className={`${base} bg-red-500 text-gray-900 ring-gray-200 dark:bg-gray-800/40 dark:text-gray-700 dark:ring-white/10`}>
        <XCircle className="w-3.5 h-3.5" /> ยกเลิก
      </span>
    );
  return <span className={`${base} bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:ring-white/10`}>{status}</span>;
};

function fmtTHB(n) {
  return Number(n || 0).toLocaleString("th-TH");
}
function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString("th-TH");
  } catch {
    return d || "-";
  }
}

export default function AdminBookings() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    load();
  }, [status]);

  async function load() {
    try {
      setLoading(true);
      setErr("");
      const { data } = await api.get("/bookings", {
        params: { role: "admin", status: status || undefined },
      });
      setItems(data?.items || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "โหลดรายการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  // helper
  const canDeleteAdmin = (s) => ['cancelled','completed','declined'].includes(s);

  const [pendingId, setPendingId] = useState(null);

  async function deleteBooking(id){
    if(!confirm('ลบรายการนี้ถาวร?')) return;
    try{
      setPendingId(id);
      await api.delete(`/bookings/${id}`);
      await load();
    }catch(e){
      alert(e?.response?.data?.message || 'ลบไม่สำเร็จ');
    } finally {
      setPendingId(null);
    }
  }


  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase().trim();
    return items.filter((b) => {
      const prop = b?.property?.title || "";
      const owner = b?.owner?.name || b?.owner?.username || "";
      const renter = b?.renter?.name || b?.renter?.username || "";
      return [prop, owner, renter].some((t) => (t || "").toLowerCase().includes(s));
    });
  }, [items, q]);

  return (
    <div className="space-y-5">
      {/* Header + subtle gradient background */}
      <div className="rounded-2xl p-5 bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-900/40 dark:to-transparent border border-black/5 dark:border-white/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100">
              การเช่าทั้งระบบ
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300/80">
              ดูภาพรวมว่าใครเช่าทรัพย์อะไร จากใคร พร้อมข้อมูลติดต่อ
            </p>
          </div>

          {/* Search box */}
          <div className="flex items-center gap-2">
            <label className="flex items-center px-3 h-10 rounded-xl bg-white/90 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                className="bg-transparent outline-none text-sm w-56 placeholder:text-slate-400 dark:text-slate-100"
                placeholder="ค้นหาทรัพย์/เจ้าของ/ผู้เช่า"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* Status chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {statusChips.map((c) => (
            <button
              key={c.key}
              onClick={() => setStatus(c.key)}
              className={`px-3 py-1.5 rounded-full text-sm transition ring-1 ring-inset
                ${status === c.key
                  ? "bg-blue-600 text-white ring-blue-600 shadow-sm"
                  : "bg-white/90 text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900/70 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-slate-800/70"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {err && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
          {err}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/95 dark:bg-slate-900/70 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60">
              <tr className="text-slate-700 dark:text-slate-200">
                <th className="text-left px-4 py-3">วันที่</th>
                <th className="text-left px-4 py-3">ทรัพย์</th>
                <th className="text-left px-4 py-3">ผู้เช่า (เบอร์)</th>
                <th className="text-left px-4 py-3">เจ้าของ (เบอร์)</th>
                <th className="text-left px-4 py-3">ช่วงวันที่</th>
                <th className="text-right px-4 py-3">ยอดรวม</th>
                <th className="text-center px-4 py-3">สถานะ</th>
                <th className="text-center px-4 py-3">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    กำลังโหลด...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{fmtDate(b.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/properties/${b?.property?._id || ""}`}
                        className="font-medium text-slate-900 dark:text-white hover:underline"
                      >
                        {b?.property?.title || "-"}
                      </Link>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        ประเภท: {b?.property?.type || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {b?.renter?.name || b?.renter?.username || "-"}
                      <div className="text-xs">
                        <a
                          href={`tel:${b?.renterPhone || b?.renter?.phone || ""}`}
                          className="text-blue-700 dark:text-blue-400 hover:underline"
                        >
                          {b?.renterPhone || b?.renter?.phone || "—"}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {b?.owner?.name || b?.owner?.username || "-"}
                      <div className="text-xs">
                        <a
                          href={`tel:${b?.owner?.phone || ""}`}
                          className="text-blue-700 dark:text-blue-400 hover:underline"
                        >
                          {b?.owner?.phone || "—"}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {b.openEnded
                        ? `${fmtDate(b.startDate)} — ไม่กำหนดสิ้นสุด`
                        : `${fmtDate(b.startDate)} — ${fmtDate(b.endDate)}`}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100">
                      {b.totalAmount ? fmtTHB(b.totalAmount) : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusTag status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {canDeleteAdmin(b.status) && (
                        <button
                          disabled={pendingId === b._id}
                          className="ml-2 px-2.5 py-1.5 rounded-lg text-xs border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={()=>deleteBooking(b._id)}
                        >
                          {pendingId === b._id ? 'กำลังลบ…' : 'ลบ'}
                        </button>
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
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-slate-900/70 p-4 text-center text-slate-500 dark:text-slate-400 backdrop-blur">
            กำลังโหลด...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-slate-900/70 p-4 text-center text-slate-500 dark:text-slate-400 backdrop-blur">
            ไม่พบข้อมูล
          </div>
        )}
        {!loading &&
          filtered.map((b) => (
            <div
              key={b._id}
              className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-slate-900/70 p-4 backdrop-blur shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{fmtDate(b.createdAt)}</div>
                  <Link
                    to={`/properties/${b?.property?._id || ""}`}
                    className="font-semibold text-slate-900 dark:text-white"
                  >
                    {b?.property?.title || "-"}
                  </Link>
                  <div className="text-xs text-slate-500 dark:text-slate-400">ประเภท: {b?.property?.type || "-"}</div>
                </div>
                <StatusTag status={b.status} />
              </div>

              <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                ผู้เช่า: {b?.renter?.name || b?.renter?.username || "-"}
              </div>
              <div className="text-sm">
                โทรผู้เช่า:{" "}
                <a
                  href={`tel:${b?.renterPhone || b?.renter?.phone || ""}`}
                  className="text-blue-700 dark:text-blue-400 hover:underline"
                >
                  {b?.renterPhone || b?.renter?.phone || "—"}
                </a>
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-200">
                เจ้าของ: {b?.owner?.name || b?.owner?.username || "-"}
              </div>
              <div className="text-sm">
                โทรเจ้าของ:{" "}
                <a href={`tel:${b?.owner?.phone || ""}`} className="text-blue-700 dark:text-blue-400 hover:underline">
                  {b?.owner?.phone || "—"}
                </a>
              </div>
              <div className="text-sm text-slate-700 dark:text-slate-200">
                ช่วงวันที่:{" "}
                {b.openEnded
                  ? `${fmtDate(b.startDate)} — ไม่กำหนดสิ้นสุด`
                  : `${fmtDate(b.startDate)} — ${fmtDate(b.endDate)}`}
              </div>
              <div className="text-sm text-slate-900 dark:text-slate-100">
                ยอดรวม: {b.totalAmount ? fmtTHB(b.totalAmount) : "-"}
              </div>
                {canDeleteAdmin(b.status) && (
                  <div className="mt-3">
                    <button
                      disabled={pendingId === b._id}
                      className="ml-2 px-2.5 py-1.5 rounded-lg text-xs border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={()=>deleteBooking(b._id)}
                    >
                      {pendingId === b._id ? 'กำลังลบ…' : 'ลบ'}
                    </button>
                  </div>
                )}
            </div>
          ))}
      </div>
    </div>
  );
}
