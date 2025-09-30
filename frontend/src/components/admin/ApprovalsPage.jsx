// components/admin/ApprovalsPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { notify } from "../../lib/notify";
import { Check, Eye, RefreshCcw, X } from "lucide-react";
import { Link } from "react-router-dom";

// small util
const niceDate = (s) => {
  try {
    const d = new Date(s);
    return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return s || "—";
  }
};

export default function ApprovalsPage() {
  // 'pending' | 'approved' | 'rejected' | 'all'
  const [status, setStatus] = useState("pending");

  // data/UI states
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(new Set()); // ids ที่กำลัง approve/reject

  const setRowBusy = useCallback((id, on = true) => {
    setBusy((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  // fetch approvals — โครงเดียวกับ AdminDashboard
  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (status !== "all") params.approvalStatus = status;
      const { data } = await api.get("/owner/properties", { params });
      setItems(Array.isArray(data) ? data : data?.items || []);
    } catch (e) {
      console.error(e);
      setError("โหลดรายการไม่สำเร็จ");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // actions — ใช้แพตเทิร์นเดียวกับ AdminDashboard (confirm/prompt + patch + ตัดแถวออก)
  const approve = useCallback(async (id) => {
    if (!id) return;
    const ok = window.confirm("คุณแน่ใจหรือไม่ที่จะอนุมัติประกาศนี้?");
    if (!ok) return;
    setRowBusy(id, true);
    try {
      await api.patch(`/properties/${id}`, { approvalStatus: "approved" });
      setItems((prev) => prev.filter((it) => String(it._id || it.id) !== String(id)));
      notify.ok("✅ อนุมัติเรียบร้อยแล้ว");
    } catch (e) {
      console.error(e);
      notify.err("❌ อนุมัติไม่สำเร็จ");
    } finally {
      setRowBusy(id, false);
    }
  }, [setRowBusy]);

  const reject = useCallback(async (id) => {
    if (!id) return;
    const reason = window.prompt("เหตุผลที่ไม่ผ่าน:", "ข้อมูลไม่ครบถ้วน");
    if (reason === null) return; // cancel
    setRowBusy(id, true);
    try {
      await api.patch(`/properties/${id}`, { approvalStatus: "rejected", approvalReason: reason || "" });
      setItems((prev) => prev.filter((it) => String(it._id || it.id) !== String(id)));
      notify.ok("🚫 ตั้งสถานะไม่ผ่านเรียบร้อยแล้ว");
    } catch (e) {
      console.error(e);
      notify.err("❌ ไม่สามารถตั้งสถานะไม่ผ่านได้");
    } finally {
      setRowBusy(id, false);
    }
  }, [setRowBusy]);

  // UI helpers
  const tabs = useMemo(
    () => ([
      { key: "pending",  label: "รออนุมัติ" },
      { key: "approved", label: "อนุมัติแล้ว" },
      { key: "rejected", label: "ไม่ผ่าน" },
      { key: "all",      label: "ทั้งหมด" },
    ]),
    []
  );

  return (
    <section className="space-y-4">
      {/* page header + filter + refresh */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            คำขอประกาศ
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            อนุมัติ/ไม่อนุมัติประกาศที่ผู้ใช้ส่งเข้ามา
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter tabs (look & feel ใกล้กับในแดชบอร์ด) */}
          <div className="flex rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            {tabs.map((t) => {
              const active = status === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setStatus(t.key)}
                  className={`px-3 py-2 text-sm transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                  } ${t.key !== tabs[0].key ? "border-l border-gray-200 dark:border-white/10" : ""}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchApprovals}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-sm"
          >
            <RefreshCcw className="inline w-4 h-4 mr-2" /> รีเฟรช
          </button>
        </div>
      </div>

      {/* table (same tone/styling as AdminDashboard ApprovalsTable) */}
      <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
        {loading ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">กำลังโหลด…</div>
        ) : error ? (
          <div className="py-8 text-center text-rose-600">{error}</div>
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
                  const id = String(p._id || p.id || "");
                  const st = p.approvalStatus || "pending";
                  const isBusy = busy.has(id);
                  const pillCls =
                    st === "approved"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                      : st === "rejected"
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300";

                  return (
                    <tr key={id || `${p.title}-${p.createdAt || p.submittedAt || ""}`} className="border-b last:border-0 border-gray-100 dark:border-white/5">
                      <td className="py-2 pr-4 text-gray-800 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{p.title || "—"}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${pillCls}`}>
                            {st === "approved" ? "อนุมัติแล้ว" : st === "rejected" ? "ไม่ผ่าน" : "รออนุมัติ"}
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
                          {st === "pending" && (
                            <>
                              <button
                                disabled={isBusy}
                                onClick={() => approve(id)}
                                className="px-2.5 py-1.5 rounded-lg text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                                title="อนุมัติ"
                              >
                                <Check className="inline w-4 h-4 mr-1" /> อนุมัติ
                              </button>
                              <button
                                disabled={isBusy}
                                onClick={() => reject(id)}
                                className="px-2.5 py-1.5 rounded-lg text-xs bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                                title="ไม่ผ่าน"
                              >
                                <X className="inline w-4 h-4 mr-1" /> ไม่ผ่าน
                              </button>
                            </>
                          )}
                          <Link
                            href={`/properties/${id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 text-black dark:text-white rounded-lg text-xs border border-gray-200 dark:border-white hover:bg-gray-50 dark:hover:bg-white/5"
                            title="ดูหน้าโพสต์"
                          >
                            <Eye className="inline w-4 h-4 text-black dark:text-white mr-1" /> ดู
                          </Link>
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
    </section>
  );
}
