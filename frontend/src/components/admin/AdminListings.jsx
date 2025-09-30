// components/admin/AdminListings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { notify } from "../../lib/notify";
import { Eye, CircleOff, Trash2, Check  } from 'lucide-react';

export default function AdminListings() {
  // ====== data & ui states ======
  const [items, setItems] = useState([]);       // จาก /owner/properties
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // filters (client-side)
  const [rawQ, setRawQ] = useState("");
  const [q, setQ] = useState("");
  const [approval, setApproval] = useState("all"); // all | pending | approved | rejected

  // table
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setQ(rawQ.trim()), 350);
    return () => clearTimeout(t);
  }, [rawQ]);

  // ====== fetch real data ======
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setError("");
      try {
        // ใช้ endpoint รวมสำหรับเจ้าของ/แอดมิน
        // admin จะได้เห็นทั้งหมด; ถ้ากรองอนุมัติ ให้ส่ง approvalStatus ไปที่ backend ตรง ๆ
        const params = {};
        if (approval !== "all") params.approvalStatus = approval;

        const { data } = await api.get("/owner/properties", { params, signal: ctrl.signal });
        // คาดหวัง list ของ Property (populate owner แล้วตามโค้ด backend)
        setItems(Array.isArray(data) ? data : []);
        setPage(1); // reset หน้าเมื่อเปลี่ยน filter
      } catch (e) {
        if (e?.code === "ERR_CANCELED") return;
        setError(e?.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [approval]);

  // ====== client-side filter + sort ======
  const filtered = useMemo(() => {
    let list = items;
    if (q) {
      const rx = new RegExp(q.replace(/\s+/g, ".*"), "i");
      list = list.filter((p) =>
        rx.test(p?.title || "") ||
        rx.test(p?.address || "") ||
        rx.test(p?.owner?.username || "") ||
        rx.test(p?.owner?.name || "")
      );
    }
    // เรียงล่าสุดก่อน
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [items, q]);

  // ====== pagination (client-side) ======
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // ====== actions ======
  const [busy, setBusy] = useState(new Set()); // ids กำลังทำงาน

  const setBusyOn = (id) => setBusy((s) => new Set([...s, String(id)]));
  const setBusyOff = (id) =>
    setBusy((s) => {
      const ns = new Set(s);
      ns.delete(String(id));
      return ns;
    });

  const toggleActive = async (id) => {
    const target = items.find(p => String(p._id) === String(id));
    if (!target) return;
    const next = !target.isActive;
    setBusyOn(id); //กันการคลิกซ้ำ
    // optimistic
    setItems(list => list.map(p => String(p._id) === String(id) ? { ...p, isActive: next } : p));
    try {
       const { data: updated } = await api.patch(`/properties/${id}`, { isActive: next });
       // ใช้ค่าจริงจากเซิร์ฟเวอร์ (กัน side effects)
       setItems(list => list.map(p => String(p._id) === String(id) ? updated : p));
       notify.ok(`✅ เปลี่ยนสถานะ ${next ? "Active" : "Inactive"} เรียบร้อยแล้ว`);
    } catch (e) {
      // rollback
      setItems(list => list.map(p => String(p._id) === String(id) ? { ...p, isActive: !next } : p));
      notify.err("อัปเดต Active/Inactive ไม่สำเร็จ");
      console.error(e);
      // (ทางเลือก) ลองดึงค่าจริงกลับมา sync
      // try { const { data } = await api.get(`/owner/properties/${id}`); setItems(list => list.map(p => String(p._id)===String(id)? data : p)); } catch {}
    } finally {
      setBusyOff(id);
    }
  };

  const togglePublish = async (id) => {
    const target = items.find(p => String(p._id) === String(id));
    if (!target) return;
    const next = target.status === "published" ? "draft" : "published";
    // optimistic
    setItems(list => list.map(p => String(p._id) === String(id) ? { ...p, status: next } : p));
    setBusyOn(id);
    try {
      const { data: updated } = await api.patch(`/properties/${id}`, { status: next });
      // ใช้ค่าจริงจากเซิร์ฟเวอร์
      setItems(list => list.map(p => String(p._id) === String(id) ? updated : p));
      notify.ok(`✅ เปลี่ยนสถานะ ${next} เรียบร้อยแล้ว`);
    } catch (e) {
      // rollback
      setItems(list => list.map(p => String(p._id) === String(id) ? {
        ...p,
        status: next === "published" ? "draft" : "published"
      } : p));
      notify.err("อัปเดตสถานะ Publish/Draft ไม่สำเร็จ");
      console.error(e);
    } finally {
      setBusyOff(id);
    }
  };

  const deleteOne = async (id, title) => {
    if (!window.confirm(`ลบประกาศ:\n${title}\n\nยืนยันลบ?`)) return;
    try {
      setBusyOn(id);
      await api.delete(`/properties/${id}`);
      setItems((list) => list.filter((p) => String(p._id) !== String(id)));
      notify.ok("ลบเรียบร้อยแล้ว");
    } catch (e) {
      notify.err("ลบไม่สำเร็จ");
      console.error(e);
    } finally {
      setBusyOff(id);
    }
  };

  // ====== helpers ======
 // ใช้ URL ของรูปที่แบ็กเอนด์ส่ง (เช่น "/uploads/properties/....") ให้เป็นลิงก์เต็ม
 function toPublicUrl(u) {
   if (!u) return "/placeholder.svg";
   // ถ้าเป็น URL เต็มอยู่แล้วหรือ data: ให้ใช้ได้เลย
   if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u)) return u;
   try {
     const base = (api?.defaults?.baseURL || "").replace(/\/+$/, "");
     const origin = base.replace(/\/api(?:\/)?$/, ""); // ตัด /api ออก → เหลือ origin ของเซิร์ฟเวอร์ไฟล์
     return `${origin}${u.startsWith("/") ? u : `/${u}`}`;
   } catch {
     return u;
   }
 }

 // เลือกรูปปก ถ้าไม่มี isCover ให้รูปแรก ถ้าไม่มีรูปเลยคืน placeholder
 function coverUrl(images = []) {
   const cover = images?.find?.(im => im?.isCover) || images?.[0];
   return toPublicUrl(cover?.url || "/placeholder.svg");
 }
//   const coverUrl = (imgs = []) => imgs?.find?.((i) => i.isCover)?.url || imgs?.[0]?.url || "/placeholder.svg";

  const badgeByApproval = (s) =>
    s === "approved"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
      : s === "pending"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
      : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300";

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">จัดการบ้านเช่า</h2>
          <p className="text-gray-600 dark:text-gray-400">ดู/ค้นหา/กรอง/จัดการประกาศทั้งหมดในระบบ</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/properties"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-sm text-gray-700 dark:text-gray-100"
          >
            <Eye className="inline w-4 h-4 mr-2 text-black dark:text-blue-500" />
            ดูหน้าเว็บ
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 p-3 md:p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={rawQ}
              onChange={(e) => setRawQ(e.target.value)}
              placeholder="ค้นหาชื่อประกาศ / ที่อยู่ / เจ้าของ"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={approval}
            onChange={(e) => setApproval(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">อนุมัติ: ทั้งหมด</option>
            <option value="pending">รออนุมัติ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ปฏิเสธ</option>
          </select>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
              className="flex-1 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10 ต่อหน้า</option>
              <option value={20}>20 ต่อหน้า</option>
              <option value={50}>50 ต่อหน้า</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          {loading && <div className="p-3 text-sm text-gray-500">กำลังโหลด…</div>}
          {error && <div className="p-3 text-sm text-red-600">{error}</div>}

          <table className="min-w-[860px] w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/5">
                <th className="py-2 pl-4 pr-3">ประกาศ</th>
                <th className="py-2 px-3">ราคา</th>
                <th className="py-2 px-3">เจ้าของ</th>
                <th className="py-2 px-3">สถานะ</th>
                <th className="py-2 px-3">อนุมัติ</th>
                <th className="py-2 px-3">อัปเดต</th>
                <th className="py-2 pl-3 pr-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {!loading && pageData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500 dark:text-gray-400">
                    ไม่พบประกาศตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                pageData.map((p) => (
                  <tr key={p._id} className="border-b last:border-0 border-gray-100 dark:border-white/5">
                    <td className="py-2 pl-4 pr-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={coverUrl(p.images)}
                          alt={p.title}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-white/10"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/properties/${p._id}`}
                            className="font-medium text-gray-900 dark:text-gray-100 hover:underline truncate block"
                            title={p.title}
                            target="_blank"
                          >
                            {p.title}
                          </Link>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {p.address || "-"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2 px-3 text-gray-800 dark:text-gray-100 whitespace-nowrap">
                      ฿{Number(p.price || 0).toLocaleString("th-TH")} /เดือน
                    </td>

                    <td className="py-2 px-3 text-gray-800 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-semibold">
                          {(p?.owner?.username || "Ow").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate">{p?.owner?.name || p?.owner?.username || "-"}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            @{p?.owner?.username || "-"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          p.status === "published"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                            : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"
                        }`}
                      >
                        {p.status || "draft"}
                      </span>
                      <span
                        className={`ml-2 px-2 py-1 rounded text-xs ${
                          p.isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"
                        }`}
                      >
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs ${badgeByApproval(p.approvalStatus)}`}>
                        {p.approvalStatus || "pending"}
                      </span>
                    </td>

                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      {new Date(p.updatedAt || p.createdAt).toLocaleString("th-TH")}
                    </td>

                    <td className="py-2 pl-3 pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/properties/${p._id}`}
                          target="_blank"
                          className="px-2.5 py-1.5 dark:text-white rounded-lg text-xs border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                          title="ดูหน้าเว็บ"
                        >
                          {/* <i className="fa-regular fa-eye mr-2 text-black dark:text-blue-500" /> */}
                          <Eye className="inline w-4 h-4 mr-2 text-black dark:text-blue-500" />
                          ดู
                        </Link>

                        <button
                          onClick={() => togglePublish(p._id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs ${
                            p.status === "published"
                              ? "bg-amber-500 hover:bg-amber-600 text-white"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                          title={p.status === "published" ? "เปลี่ยนเป็น Draft" : "เผยแพร่"}
                        >
                          {p.status === "published" ? (
                            <>
                              <CircleOff className="inline w-4 h-4 mr-1 text-black" />
                              Draft
                            </>
                          ) : (
                            <>
                              {/* <i className="fa-solid fa-check mr-1" /> */}
                              <Check className="inline w-4 h-4 mr-1 text-black dark:text-white" />
                              Publish
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => toggleActive(p._id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs ${
                            p.isActive
                              ? "bg-amber-500 hover:bg-amber-600 text-white"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                          title={p.isActive ? "ปิดการแสดงผล" : "เปิดการแสดงผล"}
                        >
                          {p.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          disabled={busy.has(String(p._id))}
                          onClick={() => deleteOne(p._id, p.title)}
                          className="px-2.5 py-1.5 rounded-lg text-xs bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-60"
                          title="ลบ"
                        >
                          <Trash2 className="inline w-4 h-4 mr-2 text-white" />
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-white/10">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            ทั้งหมด {total} รายการ • หน้า {page} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
