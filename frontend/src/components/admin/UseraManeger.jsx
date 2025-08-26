// ./components/admin/UsersManager.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../../lib/api";

// debounce helper
function useDebouncedValue(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function UsersManager() {
  // list state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // paging
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // filters
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");          // all | user | owner | admin
  const [status, setStatus] = useState("all");      // all | active | suspended
  const [verified, setVerified] = useState("all");  // all | verified | unverified
  const [sort, setSort] = useState("-createdAt");   // ex: -createdAt, username, email

  // to show loading on row actions
  const [busy, setBusy] = useState(new Set());
  const setRowBusy = (id, on = true) =>
    setBusy((s) => {
      const n = new Set(s);
      on ? n.add(id) : n.delete(id);
      return n;
    });

  const debouncedQ = useDebouncedValue(q, 400);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        pageSize,
        sort,
      };
      if (debouncedQ) params.q = debouncedQ;
      if (role !== "all") params.role = role;
      if (status !== "all") params.status = status;
      if (verified !== "all") params.verified = verified === "verified";

      const { data } = await api.get("/users", { params });

      // ยอมรับได้ทั้งแบบ array ตรง ๆ หรือแบบมี {items,total}
      const list = Array.isArray(data) ? data : data?.items || [];
      setItems(list);
      setTotal(
        Array.isArray(data) ? data.length : Number(data?.total || list.length)
      );
    } catch (e) {
      console.error(e);
      setError("โหลดผู้ใช้งานไม่สำเร็จ");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, role, status, verified, sort, debouncedQ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  // ===== actions =====
  const toggleStatus = async (u) => {
    const id = String(u._id || u.id);
    const next = u.status === "active" ? "suspended" : "active";
    if (!confirm(`ยืนยันเปลี่ยนสถานะเป็น "${next}" ?`)) return;
    setRowBusy(id, true);
    try {
      await api.patch(`/users/${id}`, { status: next });
      setItems((arr) =>
        arr.map((x) => (String(x._id || x.id) === id ? { ...x, status: next } : x))
      );
    } catch (e) {
      alert("เปลี่ยนสถานะไม่สำเร็จ");
      console.error(e);
    } finally {
      setRowBusy(id, false);
    }
  };

  const toggleVerified = async (u) => {
    const id = String(u._id || u.id);
    const next = !u.verified;
    setRowBusy(id, true);
    try {
      await api.patch(`/users/${id}`, { verified: next });
      setItems((arr) =>
        arr.map((x) => (String(x._id || x.id) === id ? { ...x, verified: next } : x))
      );
    } catch (e) {
      alert("ปรับสถานะยืนยันตัวตนไม่สำเร็จ");
      console.error(e);
    } finally {
      setRowBusy(id, false);
    }
  };

  const changeRole = async (u, nextRole) => {
    const id = String(u._id || u.id);
    if (u.role === nextRole) return;
    if (!confirm(`เปลี่ยนบทบาทของ ${u.username} เป็น "${nextRole}" ?`)) return;
    setRowBusy(id, true);
    try {
      await api.patch(`/users/${id}`, { role: nextRole });
      setItems((arr) =>
        arr.map((x) => (String(x._id || x.id) === id ? { ...x, role: nextRole } : x))
      );
    } catch (e) {
      alert("เปลี่ยนบทบาทไม่สำเร็จ");
      console.error(e);
    } finally {
      setRowBusy(id, false);
    }
  };

  const removeUser = async (u) => {
    const id = String(u._id || u.id);
    if (!confirm(`ลบผู้ใช้ ${u.username || u.email}?`)) return;
    setRowBusy(id, true);
    try {
      await api.delete(`/users/${id}`);
      setItems((arr) => arr.filter((x) => String(x._id || x.id) !== id));
    } catch (e) {
      alert("ลบผู้ใช้ไม่สำเร็จ");
      console.error(e);
    } finally {
      setRowBusy(id, false);
    }
  };

  const fmtDate = (s) => {
    try {
      return new Date(s).toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            ผู้ใช้งาน
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            ค้นหา กรอง ปรับบทบาท และจัดการสถานะผู้ใช้งาน
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="inline-flex items-center px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
            <i className="fa-solid fa-magnifying-glass text-gray-400 mr-2" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="ค้นหาชื่อ/อีเมล/ยูสเซอร์เนม..."
              className="bg-transparent outline-none text-sm w-64 placeholder:text-gray-400 dark:text-gray-100"
            />
          </div>

          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">บทบาททั้งหมด</option>
            <option value="user">user</option>
            <option value="owner">owner</option>
            <option value="admin">admin</option>
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
          </select>

          <select
            value={verified}
            onChange={(e) => {
              setVerified(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">ยืนยันทั้งหมด</option>
            <option value="verified">ยืนยันแล้ว</option>
            <option value="unverified">ยังไม่ยืนยัน</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="-createdAt">ใหม่ล่าสุด</option>
            <option value="createdAt">เก่าสุด</option>
            <option value="username">Username A→Z</option>
            <option value="-username">Username Z→A</option>
            <option value="email">Email A→Z</option>
            <option value="-email">Email Z→A</option>
          </select>

          <button
            onClick={fetchUsers}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-sm"
          >
            <i className="fa-solid fa-rotate mr-2" /> รีเฟรช
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
        {loading ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            กำลังโหลด…
          </div>
        ) : error ? (
          <div className="py-8 text-center text-rose-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            ไม่พบผู้ใช้งาน
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/10">
                  <th className="py-2 pr-4">ผู้ใช้</th>
                  <th className="py-2 pr-4">อีเมล</th>
                  <th className="py-2 pr-4">บทบาท</th>
                  <th className="py-2 pr-4">สถานะ</th>
                  <th className="py-2 pr-4">ยืนยัน</th>
                  <th className="py-2 pr-4">สมัครเมื่อ</th>
                  <th className="py-2 pr-0 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => {
                  const id = String(u._id || u.id);
                  const rowBusy = busy.has(id);
                  return (
                    <tr
                      key={id}
                      className="border-b last:border-0 border-gray-100 dark:border-white/5"
                    >
                      <td className="py-2 pr-4 text-gray-800 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold inline-flex items-center justify-center">
                            {(u.name || u.username || "U").slice(0, 2)}
                          </div>
                          <div className="truncate">
                            <div className="font-medium">
                              {u.username || u.name || "—"}
                            </div>
                            {u.name && (
                              <div className="text-xs text-gray-500">
                                {u.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                        {u.email || "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <select
                          disabled={rowBusy}
                          value={u.role}
                          onChange={(e) => changeRole(u, e.target.value)}
                          className="text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800"
                        >
                          <option value="user">user</option>
                          <option value="owner">owner</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            u.status === "active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300"
                          }`}
                        >
                          {u.status || "active"}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <button
                          disabled={rowBusy}
                          onClick={() => toggleVerified(u)}
                          className={`px-2 py-1 rounded-lg text-xs border ${
                            u.verified
                              ? "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                              : "border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300"
                          } hover:bg-gray-50 dark:hover:bg-white/5`}
                        >
                          {u.verified ? (
                            <>
                              <i className="fa-solid fa-badge-check mr-1" /> ยืนยันแล้ว
                            </>
                          ) : (
                            <>
                              <i className="fa-regular fa-circle-xmark mr-1" /> ยังไม่ยืนยัน
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-300">
                        {fmtDate(u.createdAt)}
                      </td>
                      <td className="py-2 pr-0">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            disabled={rowBusy}
                            onClick={() => toggleStatus(u)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs ${
                              u.status === "active"
                                ? "bg-amber-500 hover:bg-amber-600 text-white"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            } disabled:opacity-60`}
                          >
                            {u.status === "active" ? (
                              <>
                                <i className="fa-solid fa-ban mr-1" />
                                ระงับ
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-rotate-left mr-1" />
                                เปิดใช้งาน
                              </>
                            )}
                          </button>
                          <button
                            disabled={rowBusy}
                            onClick={() => removeUser(u)}
                            className="px-2.5 py-1.5 rounded-lg text-xs bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                          >
                            <i className="fa-solid fa-trash mr-1" /> ลบ
                          </button>
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

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          รวม {total} รายการ • หน้า {page} / {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-sm"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/หน้า
              </option>
            ))}
          </select>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
          >
            <i className="fa-solid fa-chevron-left" />
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
          >
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
      </div>
    </section>
  );
}
