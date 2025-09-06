// components/admin/DashboardHome.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

/** -------------------- CONFIG: ลองหลาย endpoint ก่อน แล้วค่อย fallback -------------------- */
const USERS_ENDPOINTS  = ["/users"];   // ลองตามลำดับนี้
const OWNERS_ENDPOINTS = ["/owners"];              // ลองตามลำดับนี้
const PROPS_ENDPOINT   = "/owner/properties"; // ใช้คำนวณอัตราอนุมัติ + อนุมาน owners/users ได้

/** -------------------- UI: การ์ดสรุป -------------------- */
function StatCard({ title, value, icon, change }) {
  return (
    <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
          {change && <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{change}</div>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
          <i className={`${icon} text-blue-600 dark:text-blue-400`} />
        </div>
      </div>
    </div>
  );
}

/** -------------------- UI: ตารางคำขอ (เฉพาะ pending) -------------------- */
function ApprovalsCompact({ items = [], onRefresh, pendingBusy = new Set(), onApprove, onReject }) {
  const niceDate = (s) => {
    try {
      const d = new Date(s);
      return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return s || "—";
    }
  };

  return (
    <div className="lg:col-span-2 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">คำขอประกาศ</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{items.length} รายการ</span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <i className="fa-solid fa-rotate mr-1" /> รีเฟรช
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
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
                const status = p.approvalStatus || "pending";
                const busy = pendingBusy.has(id);
                const pillCls =
                  status === "approved"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                    : status === "rejected"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300";

                return (
                  <tr key={id || `${p.title}-${niceDate(p.createdAt)}`} className="border-b last:border-0 border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-4 text-gray-800 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{p.title || "—"}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${pillCls}`}>
                          {status === "approved" ? "อนุมัติแล้ว" : status === "rejected" ? "ไม่ผ่าน" : "รออนุมัติ"}
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
                        {status === "pending" && (
                          <>
                            <button
                              disabled={busy}
                              onClick={() => onApprove?.(id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                              title="อนุมัติ"
                            >
                              <i className="fa-solid fa-check mr-1" /> อนุมัติ
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => onReject?.(id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                              title="ไม่ผ่าน"
                            >
                              <i className="fa-solid fa-xmark mr-1" /> ไม่ผ่าน
                            </button>
                          </>
                        )}
                        <a
                          href={`/properties/${id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                          title="ดูหน้าโพสต์"
                        >
                          <i className="fa-regular fa-eye mr-1" /> ดู
                        </a>
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
  );
}

/** -------------------- MAIN: Dashboard -------------------- */
export default function DashboardHome() {
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);

  // data states
  const [pendingItems, setPendingItems] = useState([]); // สำหรับตาราง — pending เท่านั้น
  const [allProps, setAllProps] = useState([]);         // สำหรับคำนวณอัตราอนุมัติ + อนุมาน owners/users
  const [users, setUsers] = useState([]);               // ผู้ใช้งานล่าสุด + count
  const [owners, setOwners] = useState([]);             // นับจำนวนเจ้าของ

  const [pendingBusy, setPendingBusy] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  /** utility: ลองยิงหลาย endpoint จนกว่าจะได้ 2xx หรือหมดทางเลือก */
  const tryMany = useCallback(async (endpoints, params = {}) => {
    let lastErr;
    for (const ep of endpoints) {
      try {
        const { data } = await api.get(ep, { params });
        // รองรับทรงข้อมูลได้หลายแบบ
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.items)) return data.items;
        if (Array.isArray(data?.owners)) return data.owners;
        if (Array.isArray(data?.users)) return data.users;
        if (Array.isArray(data?.data)) return data.data;
        return []; // ไม่ใช่ array ก็ให้ว่าง
      } catch (e) {
        lastErr = e;
      }
    }
    if (lastErr) throw lastErr;
    return [];
  }, []);


  /** fetchers */
  const fetchPending = useCallback(async () => {
    const { data } = await api.get(PROPS_ENDPOINT, { params: { approvalStatus: "pending" } });
    return Array.isArray(data) ? data : data?.items || [];
  }, []);

  const fetchAllProps = useCallback(async () => {
    const { data } = await api.get(PROPS_ENDPOINT);
    return Array.isArray(data) ? data : data?.items || [];
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      return await tryMany(USERS_ENDPOINTS);
    } catch {
      // fallback สุดท้าย: อนุมานจาก owners ใน properties
      const props = await fetchAllProps();
      const fromOwners = Array.from(
        new Map(
          props
            .map((p) => p.owner)
            .filter(Boolean)
            .map((o) => [String(o._id || o.id || o.username || o.email), o])
        ).values()
      );
      return fromOwners;
    }
  }, [tryMany, fetchAllProps]);

  const fetchOwners = useCallback(async () => {
    try {
      return await tryMany(OWNERS_ENDPOINTS);
    } catch {
      // fallback สุดท้าย: อนุมานจาก owners ใน properties
      const props = await fetchAllProps();
      const unique = Array.from(
        new Map(
          props
            .map((p) => p.owner)
            .filter(Boolean)
            .map((o) => [String(o._id || o.id || o.username || o.email), o])
        ).values()
      );
      return unique;
    }
  }, [tryMany, fetchAllProps]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const [p, a, us, ow] = await Promise.all([
        fetchPending(),
        fetchAllProps(),
        fetchUsers(),
        fetchOwners(),
      ]);
      setPendingItems(p);
      setAllProps(a);
      setUsers(us);
      setOwners(ow);
    } catch (e) {
      console.error(e);
      setErr("โหลดข้อมูลไม่สำเร็จ");
      setPendingItems([]);
      setAllProps([]);
      setUsers([]);
      setOwners([]);
    } finally {
      setLoading(false);
    }
  }, [fetchPending, fetchAllProps, fetchUsers, fetchOwners]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /** actions */
  const setBusy = (id, on = true) => {
    setPendingBusy((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const approve = useCallback(async (id) => {
    if (!id) return;
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะอนุมัติประกาศนี้?")) return;
    setBusy(id, true);
    try {
      await api.patch(`/properties/${id}`, { approvalStatus: "approved" });
      setPendingItems((prev) => prev.filter((it) => String(it._id) !== String(id)));
      setAllProps((prev) => prev.map((it) => (String(it._id) === String(id) ? { ...it, approvalStatus: "approved" } : it)));
      window.alert("✅ อนุมัติเรียบร้อยแล้ว");
    } catch (e) {
      console.error(e);
      window.alert("❌ อนุมัติไม่สำเร็จ");
    } finally {
      setBusy(id, false);
    }
  }, []);

  const reject = useCallback(async (id) => {
    if (!id) return;
    const reason = window.prompt("เหตุผลที่ไม่ผ่าน:", "ข้อมูลไม่ครบถ้วน");
    if (reason === null) return;
    setBusy(id, true);
    try {
      await api.patch(`/properties/${id}`, { approvalStatus: "rejected", approvalReason: reason || "" });
      setPendingItems((prev) => prev.filter((it) => String(it._id) !== String(id)));
      setAllProps((prev) => prev.map((it) => (String(it._id) === String(id) ? { ...it, approvalStatus: "rejected" } : it)));
      window.alert("🚫 ตั้งสถานะไม่ผ่านเรียบร้อยแล้ว");
    } catch (e) {
      console.error(e);
      window.alert("❌ ไม่สามารถตั้งสถานะไม่ผ่านได้");
    } finally {
      setBusy(id, false);
    }
  }, []);

  /** compute stats from real data */
  const { total, pendingCount, monthApprovedPct, monthRejectedPct } = useMemo(() => {
    const all = allProps || [];
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
    let t = all.length, p = 0;
    let monthTotal = 0, monthApproved = 0, monthRejected = 0;

    for (const it of all) {
      const st = it.approvalStatus || "pending";
      if (st === "pending") p++;

      const created = it.createdAt || it.submittedAt;
      if (created) {
        const d = new Date(created);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (key === ym) {
          monthTotal++;
          if (st === "approved") monthApproved++;
          else if (st === "rejected") monthRejected++;
        }
      }
    }

    const ap = monthTotal ? Math.round((monthApproved / monthTotal) * 100) : 0;
    const rp = monthTotal ? Math.round((monthRejected / monthTotal) * 100) : 0;

    return { total: t, pendingCount: p, monthApprovedPct: ap, monthRejectedPct: rp };
  }, [allProps]);

  /** สร้าง “ผู้ใช้งานล่าสุด” จาก users จริง; ถ้าไม่มีใช้ owners จาก properties */
  const latestUsers = useMemo(() => {
    const arr = (Array.isArray(users) && users.length ? users : owners) || [];
    const sortable = arr.map((u) => ({
      ...u,
      _sort: new Date(u.updatedAt || u.createdAt || 0).getTime(),
    }));
    sortable.sort((a, b) => b._sort - a._sort);
    return sortable.slice(0, 6);
  }, [users, owners]);

  /** cards (ของจริงเท่าที่มี, อื่นๆ mock) */
  const stats = [
    { key: "total",    label: "ทั้งหมด",       value: loading ? "…" : total,         icon: "fa-solid fa-building",   change: "" },
    { key: "pending",  label: "รออนุมัติ",     value: loading ? "…" : pendingCount,  icon: "fa-regular fa-clock",     change: !loading && pendingCount ? `+${pendingCount} รายการใหม่` : "" },
    { key: "owners",   label: "เจ้าของ",       value: loading ? "…" : owners.length, icon: "fa-solid fa-user-tie",    change: "" },
    { key: "users",    label: "ผู้ใช้งาน",     value: loading ? "…" : latestUsers.length ? users.length || owners.length : 0, icon: "fa-solid fa-users", change: "" },
    { key: "revenue",  label: "รายได้เดือนนี้", value: "฿42,500",                     icon: "fa-solid fa-sack-dollar", change: "+12%" },
  ];

  return (
    <section className="space-y-6">
      {/* หัวข้อทักทาย */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            สวัสดี, {user?.username || "Admin"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">ภาพรวมระบบและการจัดการล่าสุด</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-sm text-gray-700 dark:text-gray-100">
            <i className="fa-regular fa-circle-question mr-2" />
            คู่มือผู้ดูแล
          </button>
          <button className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm">
            <i className="fa-solid fa-plus mr-2" />
            ลงประกาศใหม่
          </button>
        </div>
      </div>

      {/* การ์ดสถิติ */}
      <section className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {stats.map((s) => (
          <StatCard key={s.key} title={s.label} value={s.value} icon={s.icon} change={s.change} />
        ))}
      </section>

      {/* มินิพาเนล: ทราฟฟิก (mock) + อัตราการอนุมัติ (จริง) */}
      <section className="grid lg:grid-cols-3 gap-4">
        {/* Traffic mock */}
        <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">ทราฟฟิคผู้เข้าชม</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">7 วันล่าสุด</span>
          </div>
          <div className="flex items-end gap-2 h-24">
            {[30, 55, 42, 65, 80, 62, 90].map((h, i) => (
              <div key={i} className="w-6 bg-blue-600/20 dark:bg-blue-400/20 rounded-t">
                <div style={{ height: `${h}%` }} className="w-full bg-blue-600 dark:bg-blue-400 rounded-t" />
              </div>
            ))}
          </div>
        </div>

        {/* อัตราการอนุมัติ (จริง) */}
        <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">อัตราการอนุมัติ</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">เดือนนี้</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "ผ่าน", val: loading ? "…" : `${monthApprovedPct}%` },
              { label: "ไม่ผ่าน", val: loading ? "…" : `${monthRejectedPct}%` },
            ].map((x) => (
              <div key={x.label} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                <div className="text-sm text-gray-500 dark:text-gray-400">{x.label}</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{x.val}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            อ้างอิงจากจำนวนคำขอที่ส่งเข้ามาในเดือนปัจจุบัน
          </div>
        </div>

        {/* ช่องว่างสำหรับ grid ให้ ApprovalsCompact กิน 2 คอลัมน์ถัดไป */}
      </section>

      {/* Approvals (pending อย่างเดียว) + ผู้ใช้งานล่าสุด (จริงถ้ามี) */}
      <section className="grid lg:grid-cols-3 gap-4">
        {err ? (
          <div className="lg:col-span-2 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-rose-600">
            {err}
          </div>
        ) : loading ? (
          <div className="lg:col-span-2 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-gray-500">
            กำลังโหลด…
          </div>
        ) : (
          <ApprovalsCompact
            items={pendingItems}
            onRefresh={fetchAll}
            pendingBusy={pendingBusy}
            onApprove={approve}
            onReject={reject}
          />
        )}

        {/* ผู้ใช้งานล่าสุด */}
        <div className="p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">ผู้ใช้งานล่าสุด</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {loading ? "…" : `${users.length || owners.length || 0} ผู้ใช้ทั้งหมด`}
            </span>
          </div>
          {loading ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">กำลังโหลด…</div>
          ) : latestUsers.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">ไม่พบผู้ใช้</div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-white/5">
              {latestUsers.map((u) => (
                <li key={u._id || u.id || u.username || u.email} className="py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-xs font-semibold">
                    {(u.name || u.username || u.email || "?").substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {u.name || u.username || u.email || "—"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      @{u.username || u.email || (u._id || u.id)}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200">
                    {u.role || "user"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </section>
  );
}
