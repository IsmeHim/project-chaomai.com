import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { notify } from "../../lib/notify";
import { Eye, Check, ShieldBan, Trash2, Undo2 } from "lucide-react";

export default function AdminReports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("open"); // open|resolved|all
  const [reason, setReason] = useState("all");
  // เพิ่ม state ตัวนับสำหรับบังคับ reload
  const [rev, setRev] = useState(0);
  const refresh = () => setRev(v => v + 1);

  // ใส่สถานะ pendingId กันกดซ้ำ และใส่ disabled ชั่วคราว
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const params = { status, reason, q };
        const { data } = await api.get("/reports", { params, signal: ctrl.signal });
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e?.code !== "ERR_CANCELED") notify?.err?.("โหลดรายงานไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
    // ⭐ เพิ่ม rev เข้า deps เพื่อให้ refresh() ทำงาน
  }, [status, reason, q, rev]);


  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const params = { status, reason, q };
        const { data } = await api.get("/reports", { params, signal: ctrl.signal });
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e?.code !== "ERR_CANCELED") notify?.err?.("โหลดรายงานไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [status, reason, q]);

  const toPublicUrl = (u) => {
    if (!u) return "/placeholder.svg";
    if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u)) return u;
    try {
      const base = (api?.defaults?.baseURL || "").replace(/\/+$/, "");
      const origin = base.replace(/\/api(?:\/)?$/, "");
      return `${origin}${u.startsWith("/") ? u : `/${u}`}`;
    } catch { return u; }
  };

  const cover = (p) => {
    const im = Array.isArray(p?.images) ? (p.images.find(x => x.isCover) || p.images[0]) : null;
    return toPublicUrl(im?.url);
  };

  const markResolved = async (id) => {
    try {
      await api.patch(`/reports/${id}`, { status: "resolved" });
      setItems(list => list.map(x => x._id === id ? { ...x, status: "resolved" } : x));
      notify?.ok?.("ปิดรายงานแล้ว");
      refresh();              // ✅ รีเฟรชจริงจากเซิร์ฟเวอร์
    } catch { notify?.err?.("อัปเดตไม่สำเร็จ"); }
  };

  const blockProperty = async (id) => {
    if (!confirm("บล็อกประกาศนี้ (Inactive) และปิดรายงาน?")) return;
    try {
      setPendingId(id);
      await api.post(`/reports/${id}/block-property`);
      notify?.ok?.("บล็อกประกาศแล้ว");
      refresh();              // ✅ รีเฟรชจริงจากเซิร์ฟเวอร์
      // รีโหลด
      // setStatus(s => s); // กระตุ้น useEffect
    } catch { 
      notify?.err?.("บล็อกไม่สำเร็จ"); 
    } finally {
      setPendingId(null);
    }
  };

  const unblockProperty = async (id) => {
    if (!confirm("เลิกบล็อกประกาศนี้ และปิดรายงาน?")) return;
    try {
      await api.post(`/reports/${id}/unblock-property`);
      notify?.ok?.("เลิกบล็อกแล้ว");
      refresh();              // ✅ รีเฟรชจริงจากเซิร์ฟเวอร์
      // รีโหลดรายการปัจจุบัน
      // setStatus(s => s);
    } catch {
      notify?.err?.("เลิกบล็อกไม่สำเร็จ");
    }
  };

  const deleteProperty = async (id) => {
    if (!confirm("ลบประกาศออกจากระบบ และปิดรายงาน?")) return;
    try {
      await api.delete(`/reports/${id}/delete-property`);
      notify?.ok?.("ลบประกาศแล้ว");
      refresh();              // ✅ รีเฟรชจริงจากเซิร์ฟเวอร์
      // setItems(list => list.filter(x => x._id !== id));
    } catch { notify?.err?.("ลบไม่สำเร็จ"); }
  };

  const deleteReport = async (id) => {
    if (!confirm("ลบรายงานนี้ออกจากระบบ?")) return;
    try {
      await api.delete(`/reports/${id}`);
      setItems(list => list.filter(x => x._id !== id));
      notify?.ok?.("ลบรายงานแล้ว");
      refresh();              // ✅ รีเฟรชจริงจากเซิร์ฟเวอร์
    } catch {
      notify?.err?.("ลบรายงานไม่สำเร็จ");
    }
  };

  const renderActions = (r) => {
    const isOpen = r.status === "open";
    const isBlocked = r?.propertyId?.isActive === false;

    return (
      <div className="flex items-center justify-end gap-2">
        <Link
          to={`/properties/${r?.propertyId?._id}`}
          target="_blank"
          className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 hover:bg-gray-50"
          title="ดูหน้าเว็บ"
        >
          <Eye className="inline w-4 h-4 mr-2" />
          ดู
        </Link>

        {/* ปิดรายงาน: แสดงได้ทุกแท็บ ถ้ายัง open */}
        {isOpen && (
          <button
            onClick={() => markResolved(r._id)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            title="ปิดรายงาน"
          >
            <Check className="inline w-4 h-4 mr-1" />
            ปิดรายงาน
          </button>
        )}

        {/* บล็อก/เลิกบล็อก: แสดงได้ทุกแท็บ ปรับตามสถานะประกาศ */}
        {!isBlocked ? (
          // <button
          //   onClick={() => blockProperty(r._id)}
          //   className="px-2.5 py-1.5 rounded-lg text-xs bg-amber-600 hover:bg-amber-700 text-white"
          //   title="บล็อกประกาศ"
          // >
          //   <ShieldBan className="inline w-4 h-4 mr-1" />
          //   บล็อก
          // </button>
          <button
            disabled={pendingId === r._id}
            className={`px-2.5 py-1.5 rounded-lg text-xs bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={() => blockProperty(r._id)}
          >
            <ShieldBan className="inline w-4 h-4 mr-1" />
            {pendingId === r._id ? "กำลังบล็อก..." : "บล็อก"}
          </button>
        ) : (
          <button
            onClick={() => unblockProperty(r._id)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-sky-600 hover:bg-sky-700 text-white"
            title="เลิกบล็อกประกาศ"
          >
            <Undo2 className="inline w-4 h-4 mr-1" />
            เลิกบล็อก
          </button>
        )}

        {/* ลบประกาศ: แสดงได้ทุกแท็บ */}
        <button
          onClick={() => deleteProperty(r._id)}
          className="px-2.5 py-1.5 rounded-lg text-xs bg-rose-600 hover:bg-rose-700 text-white"
          title="ลบประกาศ (และลบรายงานที่เกี่ยวข้องทั้งหมด)"
        >
          <Trash2 className="inline w-4 h-4 mr-1" />
          ลบประกาศ
        </button>

        {/* ลบรายงาน: แสดงได้ทุกแท็บ */}
        <button
          onClick={() => deleteReport(r._id)}
          className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 hover:bg-gray-50"
          title="ลบรายงานนี้ (ไม่ยุ่งประกาศ)"
        >
          ลบรายงาน
        </button>
      </div>
    );
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">รายงานจากผู้ใช้</h2>
        <p className="text-gray-600">ตรวจสอบ/จัดการประกาศที่ถูกแจ้ง</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-3 md:p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา: หัวข้อ/ที่อยู่/ผู้รายงาน"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200"
          >
            <option value="open">สถานะ: เปิด</option>
            <option value="resolved">สถานะ: ปิดแล้ว</option>
            <option value="all">สถานะ: ทั้งหมด</option>
          </select>
          <select value={reason} onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200"
          >
            <option value="all">เหตุผล: ทั้งหมด</option>
            <option value="scam">หลอกลวง</option>
            <option value="incorrect">ข้อมูลผิด</option>
            <option value="duplicate">ซ้ำ/สแปม</option>
            <option value="offensive">ไม่เหมาะสม</option>
            <option value="other">อื่น ๆ</option>
          </select>
          <div className="text-sm text-gray-500 flex items-center">
            ทั้งหมด {items.length} รายการ
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {loading && <div className="p-3 text-sm text-gray-500">กำลังโหลด…</div>}
        {!loading && items.length === 0 && (
          <div className="p-6 text-center text-gray-500">ไม่มีรายการ</div>
        )}

        {!!items.length && (
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50/60">
                  <th className="py-2 pl-4 pr-3">ประกาศ</th>
                  <th className="py-2 px-3">เหตุผล</th>
                  <th className="py-2 px-3">ผู้รายงาน</th>
                  <th className="py-2 px-3">เวลา</th>
                  <th className="py-2 pl-3 pr-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r._id} className="border-b last:border-0 border-gray-100">
                    <td className="py-2 pl-4 pr-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={cover(r.propertyId)}
                          alt={r?.propertyId?.title}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/properties/${r?.propertyId?._id}`}
                            target="_blank"
                            className="font-medium text-gray-900 hover:underline truncate block"
                            title={r?.propertyId?.title}
                          >
                            {r?.propertyId?.title || "-"}
                          </Link>
                          <div className="text-xs text-gray-500 truncate">
                            {r?.propertyId?.address || "-"}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                            {r.detail || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-1 rounded text-xs bg-rose-100 text-rose-700">
                        {r.reason}
                      </span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${r.status === "open" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      @{r?.reporterId?.username || "-"}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString("th-TH")}
                    </td>
                    <td className="py-2 pl-3 pr-4">
                      {/* พวกปุ่ม */}
                      {renderActions(r)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
