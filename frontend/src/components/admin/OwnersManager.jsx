import React, { useEffect, useState } from "react";
import { api } from "../../lib/api"; // ปรับ path ตามโปรเจกต์

export default function OwnersManager() {
  // ====== DATA FROM API ======
  const [owners, setOwners] = useState([]);   // รายการใน "หน้านี้" จาก backend (แบ่งหน้ามาแล้ว)
  const [total, setTotal] = useState(0);      // จำนวนทั้งหมดเพื่อคำนวณเลขหน้า
  const PAGE_SIZE = 8;

  // ====== UI STATES ======
  const [rawQuery, setRawQuery] = useState(""); // ใช้สำหรับ debounce
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");     // all | active | suspended
  const [verify, setVerify] = useState("all");     // all | verified | unverified
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set()); // ids
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ====== DEBOUNCE ค้นหา ======
  useEffect(() => {
    const t = setTimeout(() => setQuery(rawQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [rawQuery]);

  // ====== FETCH OWNERS ======
  useEffect(() => {
    const ctrl = new AbortController();

    async function fetchOwners() {
      setLoading(true);
      setError("");
      try {
        const params = {
          role: "owner",
          q: query || undefined,
          status,
          verify,
          page,
          pageSize: PAGE_SIZE,
        };
        const { data } = await api.get("/users", { params, signal: ctrl.signal });
        // คาดหวังรูปแบบ: { data: [...], total, page, pageSize, totalPages }
        setOwners(data?.data || []);
        setTotal(data?.total ?? 0);
        setSelected(new Set()); // เคลียร์การเลือกเมื่อโหลดใหม่
      } catch (e) {
        // อย่าขึ้น error ถ้าเป็นการยกเลิกคำขอเอง
        if (
          e?.name === "CanceledError" ||
          e?.code === "ERR_CANCELED" ||
          e?.message === "canceled"
        ) {
          return;
        }
        console.error("โหลด owners ไม่สำเร็จ:", e);
        setError(e?.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }

    fetchOwners();
    return () => ctrl.abort();
  }, [query, status, verify, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageData = owners; // backend แบ่งหน้าให้แล้ว

  // reset page เมื่อกรอง/ค้นหา (แบบมีเงื่อนไข)
  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [query, status, verify, page]);

  // ====== HANDLERS (เลือกหลาย, bulk แก้เฉพาะ state ฝั่งหน้า) ======
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const ns = new Set(prev);
      ns.has(id) ? ns.delete(id) : ns.add(id);
      return ns;
    });
  };

  const toggleSelectAll = () => {
    const ids = pageData.map((o) => o.id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const ns = new Set(prev);
      if (allSelected) ids.forEach((id) => ns.delete(id));
      else ids.forEach((id) => ns.add(id));
      return ns;
    });
  };

  const clearSelection = () => setSelected(new Set());

  // (ถ้าต้องการทำ bulk จริง ๆ แนะนำทำ endpoint /users/bulk)
  const bulkSuspend = () => {
    if (selected.size === 0) return;
    setOwners((list) => list.map((o) => (selected.has(o.id) ? { ...o, status: "suspended" } : o)));
    clearSelection();
  };
  const bulkActivate = () => {
    if (selected.size === 0) return;
    setOwners((list) => list.map((o) => (selected.has(o.id) ? { ...o, status: "active" } : o)));
    clearSelection();
  };
  const bulkDelete = () => {
    if (selected.size === 0) return;
    if (!window.confirm("ยืนยันลบเจ้าของที่เลือก?")) return;
    // เดโมลบเฉพาะฝั่งหน้า (แนะนำทำ bulk API จริงในภายหลัง)
    setOwners((list) => list.filter((o) => !selected.has(o.id)));
    clearSelection();
  };

  // ====== CALL API ACTIONS ======
  const toggleStatus = async (id) => {
    try {
      const user = owners.find((o) => o.id === id);
      if (!user) return;
      const next = user.status === "active" ? "suspended" : "active";
      await api.patch(`/users/${id}/status`, { status: next });
      setOwners((list) => list.map((o) => (o.id === id ? { ...o, status: next } : o)));
    } catch (e) {
      alert("เปลี่ยนสถานะไม่สำเร็จ");
      console.error(e);
    }
  };

  const toggleVerified = async (id) => {
    try {
      const { data } = await api.patch(`/users/${id}/verify`);
      const next = typeof data?.verified === "boolean" ? data.verified : undefined;
      setOwners((list) =>
        list.map((o) => (o.id === id ? { ...o, verified: typeof next === "boolean" ? next : !o.verified } : o))
      );
    } catch (e) {
      alert("สลับยืนยันไม่สำเร็จ");
      console.error(e);
    }
  };

  const deleteOne = async (id, name) => {
    if (!window.confirm(`ลบ ${name}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      setOwners((list) => list.filter((o) => o.id !== id));
      if (owners.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (e) {
      alert("ลบไม่สำเร็จ");
      console.error(e);
    }
  };

  // ====== UI ======
  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">เจ้าของ (Owners)</h2>
          <p className="text-gray-600 dark:text-gray-400">จัดการข้อมูลเจ้าของทั้งหมดในระบบ</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-sm text-gray-700 dark:text-gray-100">
            <i className="fa-regular fa-circle-question mr-2" />
            วิธีใช้งาน
          </button>
          <button className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm">
            <i className="fa-solid fa-user-plus mr-2" />
            เพิ่มเจ้าของ
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 p-3 md:p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              placeholder="ค้นหาชื่อ / username / อีเมล / เบอร์โทร"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">สถานะ: ทั้งหมด</option>
            <option value="active">ใช้งานอยู่</option>
            <option value="suspended">ระงับ</option>
          </select>

          <select
            value={verify}
            onChange={(e) => setVerify(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ยืนยันตัวตน: ทั้งหมด</option>
            <option value="verified">ยืนยันแล้ว</option>
            <option value="unverified">ยังไม่ยืนยัน</option>
          </select>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">เลือก {selected.size} รายการ</span>
            <button onClick={bulkActivate} className="px-3 py-1.5 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700">
              เปิดใช้งาน
            </button>
            <button onClick={bulkSuspend} className="px-3 py-1.5 rounded-lg text-sm bg-amber-500 text-white hover:bg-amber-600">
              ระงับ
            </button>
            <button onClick={bulkDelete} className="px-3 py-1.5 rounded-lg text-sm bg-rose-600 text-white hover:bg-rose-700">
              ลบ
            </button>
            <button
              onClick={clearSelection}
              className="ml-auto px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200"
            >
              เคลียร์การเลือก
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          {loading && <div className="p-3 text-sm text-gray-500">กำลังโหลด...</div>}
          {error && <div className="p-3 text-sm text-red-600">{error}</div>}

          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/5">
                <th className="py-2 pl-4 pr-3">
                  <input
                    type="checkbox"
                    onChange={toggleSelectAll}
                    checked={pageData.length > 0 && pageData.every((o) => selected.has(o.id))}
                    className="size-4 rounded border-gray-300 dark:border-white/10 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-2 px-3">เจ้าของ</th>
                <th className="py-2 px-3">อีเมล</th>
                <th className="py-2 px-3">เบอร์</th>
                <th className="py-2 px-3">ประกาศ</th>
                <th className="py-2 px-3">เข้าร่วม</th>
                <th className="py-2 px-3">ยืนยัน</th>
                <th className="py-2 pl-3 pr-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {!loading && pageData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-500 dark:text-gray-400">
                    ไม่พบข้อมูลเจ้าของตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                pageData.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 border-gray-100 dark:border-white/5">
                    <td className="py-2 pl-4 pr-3 align-middle">
                      <input
                        type="checkbox"
                        checked={selected.has(o.id)}
                        onChange={() => toggleSelect(o.id)}
                        className="size-4 rounded border-gray-300 dark:border-white/10 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-xs font-semibold">
                          {(o.name || "").slice(0, 2) || "Ow"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {o.name || o.username}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            @{o.username} •{" "}
                            <span
                              className={
                                o.status === "active"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                              }
                            >
                              {o.status === "active" ? "ใช้งานอยู่" : "ระงับ"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{o.email}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{o.phone || "-"}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{o.listings ?? 0}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{o.joinedAt || "-"}</td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => toggleVerified(o.id)}
                        className={`px-2 py-1 rounded text-xs ${
                          o.verified
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200"
                        }`}
                      >
                        {o.verified ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"}
                      </button>
                    </td>
                    <td className="py-2 pl-3 pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                          <i className="fa-regular fa-eye mr-1" />
                          ดู
                        </button>
                        <button
                          onClick={() => toggleStatus(o.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs ${
                            o.status === "active"
                              ? "bg-amber-500 hover:bg-amber-600 text-white"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {o.status === "active" ? (
                            <>
                              <i className="fa-solid fa-ban mr-1" />
                              ระงับ
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-rotate-left mr-1" />
                              คืนสถานะ
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => deleteOne(o.id, o.name || o.username)}
                          className="px-2.5 py-1.5 rounded-lg text-xs bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          <i className="fa-solid fa-trash mr-1" />
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
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
