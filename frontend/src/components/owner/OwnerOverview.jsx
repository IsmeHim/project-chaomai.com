// src/pages/owner/OwnerOverview.jsx — live stats + recent activity from real API (Dark Mode ready)
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import {
  PlusCircle,
  ArrowRight,
  Home,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Edit3,
  CheckCircle,
  XCircle,
} from "lucide-react";

// ---- helper: time ago in TH ----
function timeAgoTH(input) {
  if (!input) return "-";
  const t = typeof input === "string" || typeof input === "number" ? new Date(input) : input;
  const ts = t?.getTime?.();
  if (!Number.isFinite(ts)) return "-";
  const diff = Date.now() - ts;
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return `${s} วินาทีที่แล้ว`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} วันที่แล้ว`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} เดือนที่แล้ว`;
  const y = Math.floor(mo / 12);
  return `${y} ปีที่แล้ว`;
}

export default function OwnerOverview() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = user?.name || user?.username || "เจ้าของประกาศ";

  // ===== data =====
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const { data } = await api.get("/owner/properties");
        const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        if (alive) setItems(list);
      } catch (e) {
        if (alive) setErr(e?.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false };
  }, []);

  // ===== stats =====
  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter(p => p.approvalStatus === "pending").length;
    const published = items.filter(p => (p?.status === "published") && !!p?.isActive && p?.approvalStatus === "approved").length;
    const seven = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentChanged = items.filter(p => new Date(p.updatedAt || p.createdAt).getTime() >= seven).length;
    return { total, pending, published, recentChanged };
  }, [items]);

  // ===== recent activity (derive from fields on Property) =====
  const activities = useMemo(() => {
    const acts = [];
    for (const p of items) {
      if (p.createdAt) acts.push({ type: "created", at: p.createdAt, title: p.title, id: p._id });
      if (p.updatedAt && p.updatedAt !== p.createdAt) acts.push({ type: "updated", at: p.updatedAt, title: p.title, id: p._id });
      if (p.approvalStatus === "approved") acts.push({ type:"approved", at: p.approvedAt || p.updatedAt || p.createdAt, title: p.title, id: p._id });
      if (p.approvalStatus === "rejected") acts.push({ type: "rejected", at: p.approvedAt || p.updatedAt || p.createdAt, title: p.title, id: p._id });
    }
    acts.sort((a, b) => (new Date(b.at).getTime() || 0) - (new Date(a.at).getTime() || 0));
    return acts.slice(0, 10);
  }, [items]);

  const statCards = [
    { label: "ประกาศทั้งหมด", value: stats.total, icon: Home, tone: "blue" },
    { label: "รออนุมัติ", value: stats.pending, icon: Clock, tone: "amber" },
    { label: "ที่เผยแพร่", value: stats.published, icon: CheckCircle2, tone: "emerald" },
    { label: "กิจกรรม 7 วัน", value: stats.recentChanged, icon: TrendingUp, tone: "indigo" },
  ];

  // ======== UI helpers (Dark/Light) ========
  const cardCls = "rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-5";
  const titleCls = "text-slate-900 dark:text-slate-100";
  const mutedCls = "text-slate-600 dark:text-slate-300";
  const linkGhost =
    "px-3 py-2 rounded-xl border text-gray-700 dark:text-slate-100 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm inline-flex items-center gap-2";

  const toneToClass = (tone) => ({
    blue:    "text-blue-600 bg-blue-600/10 dark:text-blue-300 dark:bg-blue-300/10",
    amber:   "text-amber-600 bg-amber-500/10 dark:text-amber-300 dark:bg-amber-300/10",
    emerald: "text-emerald-600 bg-emerald-600/10 dark:text-emerald-300 dark:bg-emerald-300/10",
    indigo:  "text-indigo-600 bg-indigo-600/10 dark:text-indigo-300 dark:bg-indigo-300/10",
  }[tone] || "text-slate-600 bg-slate-600/10 dark:text-slate-200 dark:bg-slate-200/10");

  const activityIcon = (type) => {
    switch (type) {
      case "created":  return { Icon: PlusCircle, cls: "text-slate-700 bg-slate-700/10 dark:text-slate-200 dark:bg-slate-200/10" };
      case "updated":  return { Icon: Edit3, cls: "text-sky-600 bg-sky-600/10 dark:text-sky-300 dark:bg-sky-300/10" };
      case "approved": return { Icon: CheckCircle, cls: "text-emerald-600 bg-emerald-600/10 dark:text-emerald-300 dark:bg-emerald-300/10" };
      case "rejected": return { Icon: XCircle, cls: "text-rose-600 bg-rose-600/10 dark:text-rose-300 dark:bg-rose-300/10" };
      default:         return { Icon: Home, cls: "text-slate-700 bg-slate-700/10 dark:text-slate-200 dark:bg-slate-200/10" };
    }
  };

  return (
    <>
      {/* Greeting + CTA */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${titleCls}`}>สวัสดี, {displayName}</h2>
          <p className={mutedCls}>ภาพรวมบัญชีและการดำเนินการแบบรวดเร็ว</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/owner/dashboard/properties/new"
            className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm inline-flex items-center gap-2"
          >
            <PlusCircle size={16} /> ลงประกาศใหม่
          </Link>
          <Link to="/owner/dashboard/properties" className={linkGhost}>
            ดูทั้งหมด <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <section className="mt-4 grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {(loading ? Array.from({ length: 4 }) : statCards).map((s, idx) => {
          if (loading) return (
            <div key={idx} className={`${cardCls} animate-pulse h-[98px]`}>
              <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          );
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${cardCls} flex items-start gap-4 hover:shadow-sm transition-shadow`}>
              <div className={`h-11 w-11 rounded-xl grid place-items-center ${toneToClass(s.tone)}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-3xl font-extrabold tracking-tight ${titleCls}`}>{s.value}</div>
                <div className={`${mutedCls} truncate`}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Quick links */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-lg font-semibold ${titleCls}`}>เมนูลัด</h3>
          <Link to="/owner/dashboard/properties/new" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
            เริ่มลงประกาศเลย <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { to: "/owner/dashboard/properties", title: "ประกาศของฉัน", desc: "ดู/แก้ไขประกาศบ้านเช่าของคุณ", icon: Building2 },
            { to: "/owner/dashboard/properties/new", title: "ลงประกาศใหม่", desc: "เพิ่มบ้าน/ห้องเช่าใหม่อย่างรวดเร็ว", icon: PlusCircle },
          ].map((q) => {
            const Icon = q.icon;
            return (
              <Link key={q.to} to={q.to} className={`${cardCls} group hover:shadow-sm transition-shadow`}>
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-slate-900/5 dark:bg-white/5 grid place-items-center text-slate-700 dark:text-slate-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-base font-semibold ${titleCls}`}>{q.title}</div>
                    <p className={`text-sm mt-1 line-clamp-2 ${mutedCls}`}>{q.desc}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  ไปที่เมนู
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent activity + Tips */}
      <section className="mt-6 grid xl:grid-cols-3 gap-4">
        {/* Recent activity */}
        <div className={`${cardCls}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${titleCls}`}>กิจกรรมล่าสุด</h3>
            {!loading && <span className={`text-xs ${mutedCls}`}>อัปเดตอัตโนมัติจากการสร้าง/แก้ไข/อนุมัติ</span>}
          </div>

          {loading ? (
            <ul className="divide-y divide-black/5 dark:divide-white/10">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="py-4 animate-pulse">
                  <div className="h-5 w-44 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded mt-2" />
                </li>
              ))}
            </ul>
          ) : err ? (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20">
              {err}
            </div>
          ) : activities.length === 0 ? (
            <div className={`text-sm ${mutedCls}`}>ยังไม่มีกิจกรรม</div>
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/10">
              {activities.map((a, idx) => {
                const { Icon, cls } = activityIcon(a.type);
                const label = a.type === "created"
                  ? "ลงประกาศใหม่"
                  : a.type === "updated"
                  ? "แก้ไขประกาศ"
                  : a.type === "approved"
                  ? "ประกาศได้รับอนุมัติ"
                  : a.type === "rejected"
                  ? "ประกาศถูกปฏิเสธ"
                  : "กิจกรรม";
                return (
                  <li key={idx} className="py-3 flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-lg grid place-items-center ${cls}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${titleCls}`}>
                        {label}: <Link to={`/properties/${a.id}`} target="blank" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">{a.title || "(ไม่มีชื่อ)"}</Link>
                      </p>
                      <p className={`text-xs mt-0.5 ${mutedCls}`}>{timeAgoTH(a.at)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Tips */}
        <div className={`${cardCls}`}>
          <h3 className={`font-semibold ${titleCls}`}>เคล็ดลับการลงประกาศ</h3>
          <ul className={`mt-3 space-y-3 text-sm list-disc list-inside ${mutedCls}`}>
            <li>รูปภาพคมชัด 6–10 รูปช่วยเพิ่มการเข้าชม</li>
            <li>ระบุราคา/ทำเล และจุดเด่นให้ชัดเจน</li>
            <li>อัปเดตสถานะเมื่อมีผู้เช่าแล้ว</li>
          </ul>
          <Link
            to="/owner/dashboard/properties/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
          >
            ลงประกาศแรกของคุณ
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
