import React from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle, ArrowRight, Home, CalendarCheck, MessageSquare, Building2,
  CheckCircle2, Clock, TrendingUp
} from "lucide-react";

export default function OwnerOverview() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = user?.name || user?.username || "เจ้าของประกาศ";

  // ตัวอย่างสถิติ (ต่อ API ทีหลังได้เลย)
  const stats = [
    { label: "ประกาศทั้งหมด", value: 0, icon: Home },
    { label: "รออนุมัติ", value: 0, icon: Clock },
    { label: "ที่เผยแพร่", value: 0, icon: CheckCircle2 },
    { label: "ยอดเข้าชม 7 วัน", value: 0, icon: TrendingUp },
  ];

  return (
    <>
      {/* Greeting + CTA */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            สวัสดี, {displayName}
          </h2>
        <p className="text-slate-600 dark:text-slate-400">ภาพรวมบัญชีและการดำเนินการแบบรวดเร็ว</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/owner/dashboard/properties/new"
            className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm inline-flex items-center gap-2"
          >
            <PlusCircle size={16} /> ลงประกาศใหม่
          </Link>
          <Link
            to="/owner/dashboard/properties"
            className="px-3 py-2 rounded-xl border text-gray-500 dark:text-white border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm inline-flex items-center gap-2"
          >
            ดูทั้งหมด <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-5 flex items-start gap-4 hover:shadow-sm transition-shadow"
            >
              <div className="h-11 w-11 rounded-xl bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 grid place-items-center">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{s.value}</div>
                <div className="text-slate-600 dark:text-slate-300 truncate">{s.label}</div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Quick links */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">เมนูลัด</h3>
          <Link to="/owner/dashboard/properties/new" className="text-blue-600 hover:underline inline-flex items-center gap-1">
            เริ่มลงประกาศเลย <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { to: "/owner/dashboard/properties", title: "ประกาศของฉัน", desc: "ดู/แก้ไขประกาศบ้านเช่าของคุณ", icon: Building2 },
            { to: "/owner/dashboard/properties/new", title: "ลงประกาศใหม่", desc: "เพิ่มบ้าน/ห้องเช่าใหม่อย่างรวดเร็ว", icon: PlusCircle },
            { to: "/owner/dashboard/bookings", title: "การจอง", desc: "ตรวจสอบคำขอ/ตารางนัดดูห้อง", icon: CalendarCheck },
            { to: "/owner/dashboard/messages", title: "ข้อความ", desc: "คุยกับผู้สนใจเช่าของคุณ", icon: MessageSquare },
          ].map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.to}
                to={q.to}
                className="group rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-slate-900/5 dark:bg-white/10 grid place-items-center text-slate-700 dark:text-slate-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {q.title}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                      {q.desc}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-blue-600">
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
        <div className="xl:col-span-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">กิจกรรมล่าสุด</h3>
            <span className="text-xs text-slate-500">(ตัวอย่าง/รอเชื่อม API)</span>
          </div>
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {[1, 2, 3].map((i) => (
              <li key={i} className="py-3 flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 grid place-items-center">
                  <Home className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    ยังไม่มีข้อมูลกิจกรรม แสดงตัวอย่างรายการ #{i}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">เมื่อสักครู่</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-5">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">เคล็ดลับการลงประกาศ</h3>
          <ul className="mt-3 space-y-3 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
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
