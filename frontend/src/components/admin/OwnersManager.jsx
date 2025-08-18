// src/components/admin/OwnersManager.jsx
import React, { useMemo, useState } from "react";

export default function OwnersManager() {
  // ====== MOCK DATA (ต่อ API ทีหลังได้เลย) ======
  const [owners, setOwners] = useState([
    {
      id: "own_001",
      name: "Arif Y.",
      username: "arif_owner",
      email: "arif@example.com",
      phone: "089-111-2222",
      listings: 12,
      joinedAt: "2024-11-12",
      status: "active", // active | suspended
      verified: true,
    },
    {
      id: "own_002",
      name: "Suda K.",
      username: "suda_home",
      email: "suda@example.com",
      phone: "089-333-4444",
      listings: 7,
      joinedAt: "2024-12-02",
      status: "active",
      verified: false,
    },
    {
      id: "own_003",
      name: "Bee Admin",
      username: "bee_space",
      email: "bee@example.com",
      phone: "086-555-6666",
      listings: 0,
      joinedAt: "2025-01-15",
      status: "suspended",
      verified: false,
    },
    {
      id: "own_004",
      name: "Wasan P.",
      username: "wz_property",
      email: "wasan@example.com",
      phone: "089-777-8888",
      listings: 3,
      joinedAt: "2025-02-10",
      status: "active",
      verified: true,
    },
    {
      id: "own_005",
      name: "Somsri R.",
      username: "sr.villa",
      email: "somsri@example.com",
      phone: "081-999-0000",
      listings: 18,
      joinedAt: "2025-03-01",
      status: "active",
      verified: true,
    },
    {
      id: "own_006",
      name: "Nate T.",
      username: "nate_living",
      email: "nate@example.com",
      phone: "080-234-1234",
      listings: 5,
      joinedAt: "2025-03-22",
      status: "active",
      verified: false,
    },
    {
      id: "own_007",
      name: "Korn H.",
      username: "korn_house",
      email: "korn@example.com",
      phone: "087-222-1111",
      listings: 9,
      joinedAt: "2025-04-10",
      status: "active",
      verified: true,
    },
    {
      id: "own_008",
      name: "May P.",
      username: "mayhome",
      email: "may@example.com",
      phone: "085-654-3210",
      listings: 1,
      joinedAt: "2025-05-05",
      status: "suspended",
      verified: false,
    },
    {
      id: "own_009",
      name: "Ton K.",
      username: "ton_rent",
      email: "ton@example.com",
      phone: "082-345-6789",
      listings: 2,
      joinedAt: "2025-06-15",
      status: "active",
      verified: false,
    },
    {
      id: "own_010",
      name: "Kaeo L.",
      username: "kaeo_place",
      email: "kaeo@example.com",
      phone: "083-765-4321",
      listings: 14,
      joinedAt: "2025-07-20",
      status: "active",
      verified: true,
    },
  ]);

  // ====== UI STATES ======
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all"); // all | active | suspended
  const [verify, setVerify] = useState("all"); // all | verified | unverified
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set()); // ids
  const PAGE_SIZE = 8;

  // ====== DERIVED / FILTER ======
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return owners.filter((o) => {
      const matchesQ =
        !q ||
        o.name.toLowerCase().includes(q) ||
        o.username.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q);

      const matchesStatus =
        status === "all" ? true : o.status === status;

      const matchesVerify =
        verify === "all"
          ? true
          : verify === "verified"
          ? o.verified
          : !o.verified;

      return matchesQ && matchesStatus && matchesVerify;
    });
  }, [owners, query, status, verify]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ====== HANDLERS ======
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const ns = new Set(prev);
      if (ns.has(id)) ns.delete(id);
      else ns.add(id);
      return ns;
    });
  };

  const toggleSelectAll = () => {
    const ids = pageData.map((o) => o.id);
    const allSelected = ids.every((id) => selected.has(id));
    if (allSelected) {
      // remove those ids
      setSelected((prev) => {
        const ns = new Set(prev);
        ids.forEach((id) => ns.delete(id));
        return ns;
      });
    } else {
      // add all
      setSelected((prev) => {
        const ns = new Set(prev);
        ids.forEach((id) => ns.add(id));
        return ns;
      });
    }
  };

  const clearSelection = () => setSelected(new Set());

  const bulkSuspend = () => {
    if (selected.size === 0) return;
    setOwners((list) =>
      list.map((o) =>
        selected.has(o.id) ? { ...o, status: "suspended" } : o
      )
    );
    clearSelection();
  };

  const bulkActivate = () => {
    if (selected.size === 0) return;
    setOwners((list) =>
      list.map((o) =>
        selected.has(o.id) ? { ...o, status: "active" } : o
      )
    );
    clearSelection();
  };

  const bulkDelete = () => {
    if (selected.size === 0) return;
    if (!window.confirm("ยืนยันลบเจ้าของที่เลือก?")) return;
    setOwners((list) => list.filter((o) => !selected.has(o.id)));
    clearSelection();
  };

  const toggleStatus = (id) => {
    setOwners((list) =>
      list.map((o) =>
        o.id === id ? { ...o, status: o.status === "active" ? "suspended" : "active" } : o
      )
    );
  };

  const toggleVerified = (id) => {
    setOwners((list) =>
      list.map((o) =>
        o.id === id ? { ...o, verified: !o.verified } : o
      )
    );
  };

  // reset page เมื่อกรอง/ค้นหา
  React.useEffect(() => {
    setPage(1);
  }, [query, status, verify]);

  // ====== UI ======
  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            เจ้าของ (Owners)
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            จัดการข้อมูลเจ้าของทั้งหมดในระบบ
          </p>
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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

        {/* Bulk actions (เมื่อเลือกอย่างน้อย 1) */}
        {selected.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              เลือก {selected.size} รายการ
            </span>
            <button
              onClick={bulkActivate}
              className="px-3 py-1.5 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700"
            >
              เปิดใช้งาน
            </button>
            <button
              onClick={bulkSuspend}
              className="px-3 py-1.5 rounded-lg text-sm bg-amber-500 text-white hover:bg-amber-600"
            >
              ระงับ
            </button>
            <button
              onClick={bulkDelete}
              className="px-3 py-1.5 rounded-lg text-sm bg-rose-600 text-white hover:bg-rose-700"
            >
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
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/5">
                <th className="py-2 pl-4 pr-3">
                  <input
                    type="checkbox"
                    onChange={toggleSelectAll}
                    checked={
                      pageData.length > 0 &&
                      pageData.every((o) => selected.has(o.id))
                    }
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
              {pageData.length === 0 ? (
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
                          {o.name.slice(0,2)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {o.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            @{o.username} •{" "}
                            <span className={o.status === "active" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                              {o.status === "active" ? "ใช้งานอยู่" : "ระงับ"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{o.email}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{o.phone}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{o.listings}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-200">{o.joinedAt}</td>
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
                          onClick={() => {
                            if (!window.confirm(`ลบ ${o.name}?`)) return;
                            setOwners((list) => list.filter((x) => x.id !== o.id));
                          }}
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
            ทั้งหมด {filtered.length} รายการ • หน้า {page} / {totalPages}
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
