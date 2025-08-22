import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import {
  PlusCircle, Search, Filter, Eye, Pencil, Trash2, MoreVertical,
  Home, BedDouble, Bath, Ruler, CheckCircle2, Clock, ToggleLeft, ToggleRight,
  Sparkles, Loader2, FolderOpen, XCircle
} from "lucide-react";

export default function OwnerProperties() {
  // ===== State =====
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState(new Set());
  const [error, setError] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");          // draft|published
  const [active, setActive] = useState("all");          // active|inactive
  const [category, setCategory] = useState("");
  const [approval, setApproval] = useState("all");      // pending|approved|rejected
  const [sort, setSort] = useState("newest");
  const [cats, setCats] = useState([]);

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // selection
  const [selected, setSelected] = useState(new Set());

  // ===== Effects =====
  useEffect(() => {
    (async () => {
      setLoading(true); setError("");
      try {
        const res = await api.get("/owner/properties");
        setItems(res.data || []);
      } catch (e) {
        console.error(e); setError("โหลดรายการไม่สำเร็จ");
      } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    let ignore = false;
    const ac = new AbortController();
    (async () => {
      try {
        const { data } = await api.get("/categories", { signal: ac.signal });
        if (!ignore) setCats(data || []);
      } catch (err) {
        if (ac.signal.aborted) return;
        console.error("โหลดหมวดหมู่ไม่สำเร็จ:", err);
        setError(err?.response?.data?.message || "โหลดหมวดหมู่ไม่สำเร็จ");
        setCats([]);
      }
    })();
    return () => { ignore = true; ac.abort(); };
  }, []);

  // ===== Helpers =====
  const apiBase = (api?.defaults?.baseURL || "").replace(/\/+$/, "");
  const apiOrigin = apiBase.replace(/\/api(?:\/)?$/, "");
  const toPublicUrl = (u) => {
    if (!u) return "/placeholder.svg";
    if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u)) return u;
    return `${apiOrigin}${u.startsWith("/") ? u : `/${u}`}`;
  };
  const coverUrl = (p) => {
    if (!p?.images?.length) return "/placeholder.svg";
    const cover = p.images.find((it) => it.isCover) || p.images[0];
    return toPublicUrl(cover.url);
  };
  const fmtPrice = (n) => {
    if (n == null || n === "") return "-";
    const num = Number(n);
    if (!Number.isFinite(num)) return "-";
    return num.toLocaleString("th-TH", { maximumFractionDigits: 0 });
  };
  const fmtDate = (d) => {
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
    } catch { return ""; }
  };

  // ===== Filter/Sort (client) =====
  const filtered = useMemo(() => {
    let arr = [...items];

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      arr = arr.filter((it) =>
        [it.title, it.address, it.description].filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(needle))
      );
    }
    if (status !== "all") arr = arr.filter((it) => it.status === status);
    if (active !== "all") arr = arr.filter((it) => (active === "active" ? it.isActive : !it.isActive));
    if (category) arr = arr.filter((it) => String(it.category) === String(category) || String(it.category?._id) === String(category));
    if (approval !== "all") arr = arr.filter((it) => (it.approvalStatus || 'approved') === approval);

    switch (sort) {
      case "price_asc":   arr.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case "price_desc":  arr.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case "title":       arr.sort((a, b) => String(a.title).localeCompare(String(b.title), "th")); break;
      default:            arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return arr;
  }, [items, q, status, active, category, approval, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allSelected = selected.size > 0 && selected.size === filtered.length;

  useEffect(() => { setPage(1); }, [q, status, active, category, approval, sort]);

  // ===== Selection =====
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((it) => String(it._id))));
  };

  // ===== Actions =====
  const markBusy = (id, on = true) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const patchItem = async (id, payload) => {
    markBusy(id, true);
    try {
      const { data } = await api.patch(`/properties/${id}`, payload);
      setItems((prev) => prev.map((it) => (String(it._id) === String(id) ? data : it)));
    } catch (e) {
      console.error(e);
      alert("อัปเดตไม่สำเร็จ");
    } finally {
      markBusy(id, false);
    }
  };

  const removeItem = async (id) => {
    if (!confirm("ยืนยันการลบประกาศนี้? ไฟล์รูปที่เกี่ยวข้องจะถูกลบด้วย")) return;
    markBusy(id, true);
    try {
      await api.delete(`/properties/${id}`);
      setItems((prev) => prev.filter((it) => String(it._id) !== String(id)));
      setSelected((s) => { const n = new Set(s); n.delete(String(id)); return n; });
    } catch (e) {
      console.error(e);
      alert("ลบไม่สำเร็จ");
    } finally {
      markBusy(id, false);
    }
  };

  const bulkPatch = async (payload) => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    if (!confirm(`ยืนยันดำเนินการกับ ${ids.length} รายการ?`)) return;
    for (const id of ids) await patchItem(id, payload);
    setSelected(new Set());
  };
  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`ยืนยันลบ ${selected.size} รายการ?`)) return;
    for (const id of Array.from(selected)) await removeItem(id);
    setSelected(new Set());
  };

  // ===== UI =====
  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            ประกาศของฉัน
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            จัดการประกาศบ้านเช่า ค้นหา กรอง และดำเนินการเป็นชุดได้
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/owner/properties/new"
            className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm inline-flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" /> ลงประกาศใหม่
          </Link>
        </div>
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-3">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาจากชื่อ/ที่อยู่/รายละเอียด"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 text-sm">
            <option value="all">สถานะทั้งหมด</option>
            <option value="published">เผยแพร่</option>
            <option value="draft">ร่าง</option>
          </select>
          <select value={active} onChange={(e) => setActive(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 text-sm">
            <option value="all">การใช้งานทั้งหมด</option>
            <option value="active">เปิดใช้งาน</option>
            <option value="inactive">ปิดใช้งาน</option>
          </select>
          <select value={approval} onChange={(e) => setApproval(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 text-sm">
            <option value="all">การอนุมัติ (ทั้งหมด)</option>
            <option value="pending">รออนุมัติ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ถูกปฏิเสธ</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 text-sm">
            <option value="">ทุกหมวดหมู่</option>
            {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>

          <div className="md:col-span-5 flex gap-2 mt-2">
            <select value={sort} onChange={(e) => setSort(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 text-sm">
              <option value="newest">ใหม่ล่าสุด</option>
              <option value="price_asc">ราคาต่ำ→สูง</option>
              <option value="price_desc">ราคาสูง→ต่ำ</option>
              <option value="title">เรียงตามชื่อ</option>
            </select>
            {selected.size > 0 && (
              <div className="ml-auto rounded-xl border border-blue-200/40 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/20 px-3 py-2 flex items-center gap-2 text-sm">
                <Filter className="h-4 w-4 text-blue-600" />
                เลือก {selected.size} รายการ
                <span className="mx-2 text-slate-400">|</span>
                <button className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                        onClick={() => bulkPatch({ status: "published" })}>เผยแพร่</button>
                <button className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                        onClick={() => bulkPatch({ status: "draft" })}>ตั้งเป็นร่าง</button>
                <button className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                        onClick={() => bulkPatch({ isActive: true })}>เปิดใช้งาน</button>
                <button className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                        onClick={() => bulkPatch({ isActive: false })}>ปิดใช้งาน</button>
                <span className="mx-2 text-slate-400">|</span>
                <button className="px-2 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700" onClick={bulkDelete}>ลบรายการ</button>
                <button className="text-xs text-slate-500 hover:underline" onClick={() => setSelected(new Set())}>เลิกเลือก</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      {loading ? (
        <GridSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-8 text-center">
          <p className="text-slate-700 dark:text-slate-200">⚠️ {error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-10 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">ยังไม่มีประกาศที่ตรงเงื่อนไข</h3>
          <p className="text-slate-500 mt-1">ลองล้างตัวกรอง หรือสร้างประกาศใหม่</p>
          <Link to="/owner/dashboard/properties/new"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
            <PlusCircle className="h-4 w-4" /> ลงประกาศใหม่
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">แสดง {pageItems.length} จาก {filtered.length} รายการ</div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-blue-600" checked={allSelected} onChange={toggleSelectAll} />
              เลือกทั้งหมด
            </label>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageItems.map((p) => {
              const id = String(p._id);
              const checked = selected.has(id);
              const busy = busyIds.has(id);
              const aStatus = p.approvalStatus || 'approved';

              return (
                // ✨ เอา overflow-hidden ออกจากการ์ด เพื่อไม่ตัด dropdown
                <div
                  key={id}
                  className="group relative rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 hover:shadow-sm transition-shadow"
                >
                  {/* select */}
                  <div className="absolute top-2 left-2 z-10">
                    <input type="checkbox" className="accent-blue-600 scale-110" checked={checked} onChange={() => toggleSelect(id)} />
                  </div>

                  {/* cover: ย้าย overflow-hidden มาไว้เฉพาะกรอบรูป */}
                  <div className="relative rounded-t-2xl overflow-hidden">
                    <img src={coverUrl(p)} alt={p.title} className="h-40 w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-2 flex gap-2 flex-wrap">
                      <Pill
                        color={p.status === "published" ? "emerald" : "amber"}
                        icon={p.status === "published" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        label={p.status === "published" ? "เผยแพร่" : "ร่าง"}
                      />
                      <Pill
                        color={p.isActive ? "blue" : "slate"}
                        icon={p.isActive ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                        label={p.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      />
                      {aStatus === 'approved' && (
                        <Pill color="emerald" icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="อนุมัติแล้ว" />
                      )}
                      {aStatus === 'pending' && (
                        <Pill color="amber" icon={<Clock className="h-3.5 w-3.5" />} label="รออนุมัติ" />
                      )}
                      {aStatus === 'rejected' && (
                        <Pill color="rose" icon={<XCircle className="h-3.5 w-3.5" />} label="ถูกปฏิเสธ" />
                      )}
                    </div>
                  </div>

                  {/* content */}
                  <div className="p-4">
                    <div className="flex items-start gap-2">
                      <Home className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1" title={p.title}>
                        {p.title || "-"}
                      </h3>
                    </div>

                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-1" title={p.address}>
                      {p.address || "—"}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <Spec icon={<BedDouble className="h-3.5 w-3.5" />} label={`${p.bedrooms ?? "-"} นอน`} />
                      <Spec icon={<Bath className="h-3.5 w-3.5" />} label={`${p.bathrooms ?? "-"} น้ำ`} />
                      <Spec icon={<Ruler className="h-3.5 w-3.5" />} label={`${p.area ?? "-"} ตร.ม.`} />
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                        ฿{fmtPrice(p.price)} <span className="text-xs text-slate-500">/เดือน</span>
                      </div>
                      <div className="text-xs text-slate-500">สร้าง {fmtDate(p.createdAt)}</div>
                    </div>

                    {aStatus === 'rejected' && p.approvalReason && (
                      <div className="mt-3 text-xs rounded-lg border border-rose-200/50 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-2 py-1">
                        เหตุผลที่ถูกปฏิเสธ: {p.approvalReason}
                      </div>
                    )}

                    {/* actions */}
                    <div className="mt-3 flex items-center gap-2">
                      <Link to={`/properties/${id}`} target="_blank"
                        className="px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm inline-flex items-center gap-1.5">
                        <Eye className="h-4 w-4" /> ดู
                      </Link>
                      <Link to={`/owner/properties/${id}/edit`}
                        className="px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm inline-flex items-center gap-1.5">
                        <Pencil className="h-4 w-4" /> แก้ไข
                      </Link>
                      <button
                        disabled={busy}
                        onClick={() => patchItem(id, { isActive: !p.isActive })}
                        className="px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm inline-flex items-center gap-1.5 disabled:opacity-60"
                        title={p.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (p.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />)}
                        {p.isActive ? "ปิด" : "เปิด"}
                      </button>

                      {/* ▼ Dropdown ใช้ details แต่ย้ายเมนูออกนอกคลิป + z สูง + เปิดขึ้น/ลงได้สวยขึ้น */}
                      <div className="ml-auto relative z-50">
                        <details className="group">
                          <summary className="list-none px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm inline-flex items-center gap-1.5 cursor-pointer select-none">
                            <MoreVertical className="h-4 w-4" /> เพิ่มเติม
                          </summary>

                          {/* เมนู: default ดรอปลง (top-full), ถ้าอยากให้ดรอปขึ้น เปลี่ยนเป็น bottom-full mb-2 */}
                          <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl p-1
                                          origin-top-right scale-95 opacity-0 pointer-events-none
                                          group-open:scale-100 group-open:opacity-100 group-open:pointer-events-auto
                                          transition">
                            <button
                              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-black/5 dark:hover:bg-white/5 inline-flex items-center gap-2"
                              onClick={() => patchItem(id, { status: p.status === "published" ? "draft" : "published" })}
                            >
                              <Sparkles className="h-4 w-4" />
                              {p.status === "published" ? "ตั้งเป็นร่าง" : "เผยแพร่"}
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-black/5 dark:hover:bg-white/5 text-rose-600 inline-flex items-center gap-2"
                              onClick={() => removeItem(id)}
                            >
                              <Trash2 className="h-4 w-4" /> ลบประกาศ
                            </button>
                          </div>
                        </details>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm disabled:opacity-50"
                      onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>ก่อนหน้า</button>
              <div className="text-sm text-slate-600 dark:text-slate-300">หน้า {page} / {totalPages}</div>
              <button className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm disabled:opacity-50"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>ถัดไป</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ===== Small UI bits ===== */
function Pill({ color = "slate", icon, label }) {
  const map = {
    slate:  "bg-slate-900/70 text-white",
    blue:   "bg-blue-600/80 text-white",
    emerald:"bg-emerald-600/80 text-white",
    amber:  "bg-amber-500/90 text-white",
    rose:   "bg-rose-600/85 text-white",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] ${map[color] || map.slate}`}>
      {icon} {label}
    </span>
  );
}

function Spec({ icon, label }) {
  return <div className="inline-flex items-center gap-1.5">{icon}<span>{label}</span></div>;
}

function GridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 overflow-hidden animate-pulse">
          <div className="h-40 w-full bg-slate-200/60 dark:bg-slate-700/60" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-2/3 bg-slate-200/60 dark:bg-slate-700/60 rounded" />
            <div className="h-3 w-1/2 bg-slate-200/60 dark:bg-slate-700/60 rounded" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-3 bg-slate-200/60 dark:bg-slate-700/60 rounded" />
              <div className="h-3 bg-slate-200/60 dark:bg-slate-700/60 rounded" />
              <div className="h-3 bg-slate-200/60 dark:bg-slate-700/60 rounded" />
            </div>
            <div className="h-5 w-24 bg-slate-200/60 dark:bg-slate-700/60 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
