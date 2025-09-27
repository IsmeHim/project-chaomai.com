// src/pages/owner/OwnerBookings.jsx
import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarCheck, CheckCircle2, XCircle, Clock, BadgeCheck, Moon, Sun } from "lucide-react";

const statusChips = [
  { key: "", label: "ทั้งหมด" },
  { key: "pending", label: "รออนุมัติ" },
  { key: "approved", label: "อนุมัติแล้ว" },
  { key: "declined", label: "ปฏิเสธ" },
  { key: "cancelled", label: "ยกเลิก" },
  { key: "paid", label: "ชำระแล้ว" },
  { key: "completed", label: "เสร็จสิ้น" },
];

function fmt(n){ return Number(n||0).toLocaleString('th-TH'); }
function d(s){ try { return new Date(s).toLocaleDateString('th-TH'); } catch { return s; } }

export default function OwnerBookings(){
  const [params, setParams] = useSearchParams();
  const active = params.get('status') || '';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const { data } = await api.get('/bookings', { params: { role: 'owner', status: active || undefined }});
      setItems(data?.items || []);
    } catch (e) {
      if (e?.response?.status === 401) {
        setErr('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
        // ตัวเลือก: navigate('/login');
        return;
      }
      setErr(e?.response?.data?.message || 'โหลดรายการไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };
  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [active]);

  const doAction = async (id, action) => {
    try {
      await api.patch(`/bookings/${id}/status`, { action });
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || 'อัปเดตไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2">
          <CalendarCheck size={18}/> การเช่า (ของฉัน)
        </h1>
        <div className="flex gap-2">
          {statusChips.map(c => (
            <button
              key={c.key}
              onClick={()=> setParams(p=>{ const np=new URLSearchParams(p); if(c.key) np.set('status', c.key); else np.delete('status'); return np; })}
              className={`px-3 py-1.5 rounded-full text-sm border transition
                ${active===c.key ? 'bg-blue-600 text-white border-blue-600' : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* list */}
      {loading ? (
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 bg-white dark:bg-slate-900">
          กำลังโหลด…
        </div>
      ) : err ? (
        <div className="rounded-2xl border border-rose-200 p-6 bg-rose-50 text-rose-700">{err}</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-10 text-center bg-white dark:bg-slate-900 text-slate-600">
          ยังไม่มีรายการ
        </div>
      ) : (
        <>
          {/* Desktop: Table */}
          <div className="hidden md:block rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="text-left px-4 py-3">ทรัพย์</th>
                    <th className="text-left px-4 py-3">ผู้เช่า</th>
                    <th className="text-left px-4 py-3">เบอร์ผู้เช่า</th>
                    <th className="text-left px-4 py-3">ช่วงวันที่</th>
                    <th className="text-right px-4 py-3">ยอดรวม (฿)</th>
                    <th className="text-center px-4 py-3">สถานะ</th>
                    <th className="text-right px-4 py-3">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(b=>(
                    <tr key={b._id} className="border-t border-black/5 dark:border-white/10">
                      <td className="px-4 py-3">
                        <Link to={`/properties/${b.property?._id}`} className="font-semibold text-blue-700 dark:text-blue-400 hover:underline">
                          {b.property?.title || '-'}
                        </Link>
                        <div className="text-xs text-slate-500">{b.property?.address || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-black dark:text-white">
                        {b.renter?.name || b.renter?.username || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <a href={`tel:${b.renterPhone || b.renter?.phone || ''}`} className="text-blue-700 dark:text-blue-400 hover:underline">
                          {b.renterPhone || b.renter?.phone || '—'}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-black dark:text-white">
                        {d(b.startDate)} – {b.openEnded ? 'ไม่มีกำหนด' : d(b.endDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-black dark:text-white">฿{fmt(b.totalAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge s={b.status}/>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Actions s={b.status} on={(act)=>doAction(b._id, act)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {items.map(b=>(
              <div key={b._id} className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 p-4">
                <div className="flex items-start justify-between">
                  <div className="font-semibold">
                    <Link to={`/properties/${b.property?._id}`} className="text-blue-700 dark:text-blue-400 hover:underline">
                      {b.property?.title || '-'}
                    </Link>
                    <div className="text-xs text-slate-500">{b.property?.address || ''}</div>
                  </div>
                  <StatusBadge s={b.status}/>
                </div>
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                  ผู้เช่า: {b.renter?.name || b.renter?.username || '-'}
                </div>
                <div className="text-sm text-black dark:text-white">
                  โทร: <a href={`tel:${b.renterPhone || b.renter?.phone || ''}`} className="text-blue-700 dark:text-blue-400 hover:underline">
                    {b.renterPhone || b.renter?.phone || '—'}
                  </a>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  วันที่: {d(b.startDate)} – {b.openEnded ? 'ไม่มีกำหนด' : d(b.endDate)}
                </div>
                <div className="mt-2 text-right font-bold text-black dark:text-white">฿{fmt(b.totalAmount)}</div>
                <div className="mt-3">
                  <Actions s={b.status} on={(act)=>doAction(b._id, act)} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatusBadge({ s }){
  const map = {
    pending:   { text: 'รออนุมัติ', cls: 'bg-amber-100 text-amber-700' },
    approved:  { text: 'อนุมัติแล้ว', cls: 'bg-emerald-100 text-emerald-700' },
    declined:  { text: 'ปฏิเสธ', cls: 'bg-rose-100 text-rose-700' },
    cancelled: { text: 'ยกเลิก', cls: 'bg-slate-100 text-slate-700' },
    paid:      { text: 'ชำระแล้ว', cls: 'bg-blue-100 text-blue-700' },
    completed: { text: 'เสร็จสิ้น', cls: 'bg-indigo-100 text-indigo-700' },
  };
  const cfg = map[s] || { text: s, cls: 'bg-slate-100 text-slate-700' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.text}</span>;
}

function Actions({ s, on }){
  // ปุ่มตามสถานะ (เจ้าของ)
  return (
    <div className="flex items-center justify-end gap-2">
      {s === 'pending' && (
        <>
          <button onClick={()=>on('approve')} className="px-3 py-1.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1">
            <CheckCircle2 size={14}/> อนุมัติ
          </button>
          <button onClick={()=>on('decline')} className="px-3 py-1.5 rounded-lg text-xs bg-rose-600 hover:bg-rose-700 text-white inline-flex items-center gap-1">
            <XCircle size={14}/> ปฏิเสธ
          </button>
        </>
      )}
      {['approved','paid'].includes(s) && (
        <button onClick={()=>on('cancel')} className="px-3 py-1.5 rounded-lg text-xs border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5">
          ยกเลิก
        </button>
      )}
      {s === 'approved' && (
        <button onClick={()=>on('complete')} className="px-3 py-1.5 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
          ปิดงาน/เสร็จสิ้น
        </button>
      )}
    </div>
  );
}
