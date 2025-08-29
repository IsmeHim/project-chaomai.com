// src/pages/PropertyDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import {
  ArrowLeft, MapPin, BedDouble, Bath, Ruler, Loader2, Share2,
  Copy, CheckCircle2, Wifi, Car, Bike, Image as ImageIcon, X, ExternalLink
} from "lucide-react";

export default function TestPropertyDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [copied, setCopied] = useState(false);

  // === helpers ===
  const apiBase = (api?.defaults?.baseURL || "").replace(/\/+$/, "");
  const apiOrigin = apiBase.replace(/\/api(?:\/)?$/, "");
  const toPublicUrl = (u) => {
    if (!u) return "/placeholder.svg";
    if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u)) return u;
    return `${apiOrigin}${u.startsWith("/") ? u : `/${u}`}`;
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

  // === load ===
  useEffect(() => {
    let ignore = false;
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/properties/${id}`, { signal: ac.signal }); // public endpoint
        if (!ignore) setItem(data);
      } catch (e) {
        if (ac.signal.aborted) return;
        console.error(e);
        setErr("ไม่พบประกาศหรือเกิดข้อผิดพลาด");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; ac.abort(); };
  }, [id]);

  const images = useMemo(() => {
    const arr = Array.isArray(item?.images) ? item.images : [];
    if (!arr.length) return [{ url: "/placeholder.svg", isCover: true }];
    const ordered = [...arr].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const cover = ordered.find((i) => i.isCover) || ordered[0];
    const rest = ordered.filter((i) => i !== cover);
    return [cover, ...rest];
  }, [item]);

  const coords = useMemo(() => {
    const c = item?.location?.coordinates; // [lng, lat]
    if (Array.isArray(c) && c.length >= 2) return { lat: c[1], lng: c[0] };
    return null;
  }, [item]);

  const amenities = item?.amenities || {};
  const features = amenities?.features || {};
  const utilities = Array.isArray(amenities?.utilitiesIncluded) ? amenities.utilitiesIncluded : [];

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = async () => {
    try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    } catch (e) {
        console.error("Copy via Clipboard API failed:", e);
        // ✅ Fallback เดิมๆ ให้เลือก + คัดลอก
        try {
        const el = document.createElement("textarea");
        el.value = shareUrl;
        el.style.position = "fixed";
        el.style.top = "-9999px";
        document.body.appendChild(el);
        el.focus();
        el.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(el);
        if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } else {
            alert("คัดลอกลิงก์ไม่สำเร็จ ลองคัดลอกเอง:\n" + shareUrl);
        }
        } catch (e2) {
        console.error("Fallback copy failed:", e2);
        alert("คัดลอกลิงก์ไม่สำเร็จ ลองคัดลอกด้วยตนเอง:\n" + shareUrl);
        }
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-10">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin" /> กำลังโหลด…
        </div>
      </div>
    );
  }

  if (err || !item) {
    return (
      <div className="max-w-3xl mx-auto px-4 lg:px-6 py-10 text-center">
        <p className="text-slate-700 dark:text-slate-200">⚠️ {err || "ไม่พบประกาศ"}</p>
        <button
          onClick={() => nav(-1)}
          className="mt-4 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> กลับ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Breadcrumb / Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-slate-600 dark:text-slate-300 hover:underline">หน้าแรก</Link>
          <span className="text-slate-400">/</span>
          <Link to="/browse" className="text-slate-600 dark:text-slate-300 hover:underline">ค้นหา</Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 dark:text-slate-100 line-clamp-1">{item.title || "-"}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm inline-flex items-center gap-2"
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "คัดลอกลิงก์แล้ว" : "คัดลอกลิงก์"}
          </button>
          <a
            href={item.googleMapUrl || (coords ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=16` : "#")}
            target="_blank" rel="noreferrer"
            className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm inline-flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" /> เปิดในแผนที่
          </a>
        </div>
      </div>

      {/* Title + Price */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          {item.title || "-"}
        </h1>
        <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          ฿{fmtPrice(item.price)} <span className="text-xs text-slate-500">/เดือน</span>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Gallery */}
        <section className="lg:col-span-2">
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-3">
            {/* Main image */}
            <div
              className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 h-72 md:h-[420px] flex items-center justify-center"
              onClick={() => setLightbox(true)}
            >
              {images?.[activeIdx]?.url ? (
                <img
                  src={toPublicUrl(images[activeIdx].url)}
                  alt={`img-${activeIdx}`}
                  className="w-full h-full object-cover cursor-zoom-in"
                />
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <ImageIcon className="h-5 w-5" /> ไม่มีรูปภาพ
                </div>
              )}
              {/* Prev/Next (desktop) */}
              <button
                onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i - 1 + images.length) % images.length); }}
                className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white items-center justify-center"
                aria-label="Prev"
              >‹</button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i + 1) % images.length); }}
                className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white items-center justify-center"
                aria-label="Next"
              >›</button>
              {/* Counter */}
              <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/60 text-white text-xs">
                {activeIdx + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {images.map((im, i) => (
                  <button
                    key={im.filename || i}
                    className={`relative rounded-lg overflow-hidden border ${i === activeIdx ? "border-blue-500 ring-2 ring-blue-400/40" : "border-black/10 dark:border-white/10"}`}
                    onClick={() => setActiveIdx(i)}
                  >
                    <img src={toPublicUrl(im.url)} alt={`thumb-${i}`} className="h-16 w-full object-cover" />
                    {im.isCover && (
                      <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-white">ปก</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: Summary */}
        <aside className="space-y-6">
          {/* Address / Basic specs */}
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-4">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{item.address || "—"}</div>
                <div className="text-xs text-slate-500 mt-0.5">อัปเดตล่าสุด {fmtDate(item.updatedAt || item.createdAt)}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <Spec icon={<BedDouble className="h-4 w-4" />} label={`${item.bedrooms ?? "-"} ห้องนอน`} />
              <Spec icon={<Bath className="h-4 w-4" />} label={`${item.bathrooms ?? "-"} ห้องน้ำ`} />
              <Spec icon={<Ruler className="h-4 w-4" />} label={`${item.area ?? "-"} ตร.ม.`} />
            </div>
          </div>

          {/* Amenities */}
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">สิ่งอำนวยความสะดวก</h3>

            <div className="mt-3 grid grid-cols-1 gap-3">
              {/* Wi-Fi */}
              <div className="flex items-center justify-between text-sm">
                <div className="inline-flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Wi-Fi</span>
                </div>
                <span className="text-slate-700 dark:text-slate-200">
                  {amenities.wifi === "free" ? "ฟรี (รวมค่าเช่า)" :
                   amenities.wifi === "paid" ? "มีแต่ต้องจ่ายเพิ่ม" : "ไม่มี"}
                </span>
              </div>

              {/* Parking */}
              <div className="flex items-center justify-between text-sm">
                <div className="inline-flex items-center gap-2">
                  {amenities.parking === "motorcycle"
                    ? <Bike className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    : <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  }
                  <span>ที่จอดรถ</span>
                </div>
                <span className="text-slate-700 dark:text-slate-200">
                  {amenities.parking === "none" ? "ไม่มี"
                    : amenities.parking === "motorcycle" ? "เฉพาะมอเตอร์ไซค์"
                    : "รถยนต์ & มอเตอร์ไซค์"}
                </span>
              </div>
            </div>

            {/* Included Utilities */}
            <div className="mt-4">
              <div className="text-sm font-medium">ค่าใช้จ่ายที่ “รวมแล้ว”</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {["water","electricity","wifi","common_fee"].map((k) => (
                  <Badge key={k} active={utilities.includes(k)} label={utilLabel(k)} />
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="mt-4">
              <div className="text-sm font-medium">คุณสมบัติห้อง</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  ["aircon","แอร์"],
                  ["kitchen","ครัว"],
                  ["tv","ทีวี"],
                  ["fridge","ตู้เย็น"],
                  ["washingMachine","เครื่องซักผ้า"],
                  ["furnished","มีเฟอร์นิเจอร์"],
                ].map(([key,label]) => (
                  <Badge key={key} active={!!features[key]} label={label} />
                ))}
              </div>
            </div>
          </div>

          {/* Owner */}
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">เจ้าของประกาศ</h3>
            <div className="mt-2 text-sm">
              <div className="text-slate-900 dark:text-slate-100">{item?.owner?.name || item?.owner?.username || "—"}</div>
              {/* ถ้ามีช่องทางติดต่อเพิ่มเติม ให้ใส่ตรงนี้ได้ */}
            </div>
          </div>
        </aside>
      </div>

      {/* Description */}
      <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-5">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">รายละเอียด</h3>
        <p className="mt-2 whitespace-pre-line text-slate-700 dark:text-slate-200 leading-relaxed">
          {item.description || "—"}
        </p>
      </section>

      {/* Map */}
      {coords && (
        <section className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden">
          <div className="h-64 md:h-96">
            <iframe
              title="ตำแหน่งบนแผนที่"
              className="w-full h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(coords.lat)},${encodeURIComponent(coords.lng)}&z=15&output=embed`}
            />
          </div>
          <div className="px-4 py-3 bg-white dark:bg-slate-900 flex items-center justify-between text-sm">
            <div className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <MapPin className="h-4 w-4" /> {item.address || "—"}
            </div>
            <a
              href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=16`}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              เปิด Google Maps <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[999] bg-black/90 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setLightbox(false)}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 text-white inline-flex items-center gap-2"
            >
              <X className="h-4 w-4" /> ปิด
            </button>
            <div className="text-white text-sm">{activeIdx + 1} / {images.length}</div>
          </div>
          <div className="flex-1 relative">
            <img
              src={toPublicUrl(images[activeIdx]?.url)}
              alt={`full-${activeIdx}`}
              className="absolute inset-0 m-auto max-h-[80vh] max-w-[92vw] object-contain"
            />
            <button
              onClick={() => setActiveIdx((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center"
            >‹</button>
            <button
              onClick={() => setActiveIdx((i) => (i + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center"
            >›</button>
          </div>
          {images.length > 1 && (
            <div className="px-4 py-3 overflow-x-auto">
              <div className="flex gap-2">
                {images.map((im, i) => (
                  <button
                    key={im.filename || i}
                    onClick={() => setActiveIdx(i)}
                    className={`h-16 aspect-video rounded-md overflow-hidden border ${i === activeIdx ? "border-blue-400" : "border-white/20"}`}
                  >
                    <img src={toPublicUrl(im.url)} alt={`thumblb-${i}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ===== Small UI bits ===== */
function Spec({ icon, label }) {
  return <div className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200">{icon}<span>{label}</span></div>;
}

function Badge({ active, label }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-xl border text-xs
      ${active
        ? "bg-emerald-600 text-white border-emerald-600"
        : "border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-300"}`}>
      {label}
    </span>
  );
}

function utilLabel(k) {
  switch (k) {
    case "water": return "ค่าน้ำ";
    case "electricity": return "ค่าไฟ";
    case "wifi": return "ค่าเน็ต (Wi-Fi)";
    case "common_fee": return "ค่าส่วนกลาง";
    default: return k;
  }
}
