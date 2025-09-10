// src/pages/PropertyDetail.jsx
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import {
  Home, BedDouble, Bath, Ruler, MapPin, ShieldCheck,
  Wifi as WifiIcon, Car, Snowflake, Tv, CookingPot, Armchair,
  Refrigerator, WashingMachine, Sparkles, Star, BadgeCheck,
  UserCircle2, Phone, Loader2,
} from "lucide-react";

export default function PropertyDetail() {
  const { id } = useParams();

  // ===== states =====
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ===== load property =====
  useEffect(() => {
    let ignore = false;
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data: doc } = await api.get(`/properties/${id}`, { signal: ac.signal });
        if (ignore) return;
        setData(doc || null);
      } catch (e) {
        if (e?.code === "ERR_CANCELED") return;
        console.error("load property error", e);
        setErr(e?.response?.data?.message || "ไม่พบประกาศนี้");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; ac.abort(); };
  }, [id]);

  // ===== derived =====
  const gallery = useMemo(() => {
    if (!data?.images?.length) return ["/placeholder.svg"];
    const sorted = [...data.images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const coverIdx = sorted.findIndex((im) => im.isCover);
    if (coverIdx > 0) {
      const [cov] = sorted.splice(coverIdx, 1);
      sorted.unshift(cov);
    }
    return sorted.map((im) => toPublicUrl(im.url));
  }, [data]);

  const allImages = gallery;
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);

  const prettyType = data?.type?.name || "-";
  const prettyCategory = data?.category?.name || "-";
  const locationText = data?.address || "—";

  const fmtPrice = (n) => {
    if (n == null || n === "") return "-";
    const num = Number(n);
    if (!Number.isFinite(num)) return "-";
    return num.toLocaleString("th-TH", { maximumFractionDigits: 0 });
  };

  const mapEmbed = useMemo(() => {
    const lat = data?.location?.coordinates?.[1];
    const lng = data?.location?.coordinates?.[0];
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return `https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lng)}&z=15&output=embed`;
    }
    if (data?.googleMapUrl) return data.googleMapUrl;
    return "";
  }, [data]);

  // amenities
  const amenityList = useMemo(() => {
    const a = data?.amenities || {};
    const list = [];

    if (a.wifi && a.wifi !== "none") {
      list.push({ icon: WifiIcon, label: a.wifi === "free" ? "Wi-Fi ฟรี" : "Wi-Fi (มีค่าใช้จ่าย)" });
    }
    if (a.parking && a.parking !== "none") {
      list.push({ icon: Car, label: a.parking === "motorcycle" ? "จอดมอไซได้" : "จอดรถยนต์และมอไซได้" });
    }
    if (Array.isArray(a.utilitiesIncluded)) {
      const map = { water: "รวมค่าน้ำ", electricity: "รวมค่าไฟ", wifi: "รวมค่าอินเทอร์เน็ต", common_fee: "รวมค่าส่วนกลาง" };
      a.utilitiesIncluded.forEach((k) => map[k] && list.push({ icon: Sparkles, label: map[k] }));
    }
    const f = a.features || {};
    if (f.aircon) list.push({ icon: Snowflake, label: "แอร์" });
    if (f.kitchen) list.push({ icon: CookingPot, label: "ครัว" });
    if (f.tv) list.push({ icon: Tv, label: "ทีวี" });
    if (f.fridge) list.push({ icon: Refrigerator, label: "ตู้เย็น" });
    if (f.washingMachine) list.push({ icon: WashingMachine, label: "เครื่องซักผ้า" });
    if (f.furnished) list.push({ icon: Armchair, label: "เฟอร์นิเจอร์ครบ" });
    return list;
  }, [data]);

  // ===== fixed-on-scroll (right) =====
  const rightColRef = useRef(null);   // คอลัมน์ขวา (กรอบจริง)
  const panelRef = useRef(null);      // เนื้อหากล่อง sidebar (สำหรับวัดความสูง)
  const sentinelRef = useRef(null);   // เส้นตรวจตำแหน่ง
  const [dock, setDock] = useState(false);
  const [fixedBox, setFixedBox] = useState({ left: 0, width: 0, height: 0 });
  const TOP_OFFSET = 96; // ความสูง navbar ของคุณ (ปรับได้)

  const measure = useCallback(() => {
    if (!rightColRef.current || !panelRef.current) return;
    const colRect = rightColRef.current.getBoundingClientRect();
    const panelRect = panelRef.current.getBoundingClientRect();
    setFixedBox({
      left: Math.round(colRect.left),
      width: Math.round(colRect.width),
      height: Math.round(panelRect.height || 0),
    });
  }, []);

  // ✅ เช็กว่าควร dock ตั้งแต่วินาทีแรก (แก้เคส refresh แล้ว IO ยังไม่ยิง)
  const checkDock = useCallback(() => {
    if (!sentinelRef.current) return;
    const rect = sentinelRef.current.getBoundingClientRect();
    const isLg = window.matchMedia("(min-width: 1024px)").matches;
    const shouldDock = rect.top <= (TOP_OFFSET + 8); // ให้สอดคล้อง rootMargin
    setDock(isLg && shouldDock);
    measure();
  }, [measure, TOP_OFFSET]);

  // Observer + listeners
  useEffect(() => {
    if (!sentinelRef.current) return;

    const mq = window.matchMedia("(min-width: 1024px)");
    if (!mq.matches) { setDock(false); return; }

    const obs = new IntersectionObserver(
      ([ent]) => {
        setDock(!ent.isIntersecting); // true = ลอย (fixed)
        measure();
      },
      { root: null, rootMargin: `-${TOP_OFFSET + 8}px 0px 0px 0px`, threshold: 0 }
    );
    obs.observe(sentinelRef.current);

    const ro = new ResizeObserver(() => measure());
    if (rightColRef.current) ro.observe(rightColRef.current);

    const onResize = () => checkDock();
    const onScroll = () => checkDock();
    const onLoad = () => checkDock();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("load", onLoad);

    // เช็กทันทีหลัง mount + เผื่อแพลบหนึ่ง
    const raf = requestAnimationFrame(checkDock);
    const t = setTimeout(checkDock, 250);

    // ฟัง media query เปลี่ยน (เช่น ย่อ/ขยายหน้าต่าง)
    const onMQ = (e) => {
      if (!e.matches) setDock(false); // ออกจากโหมด fixed ถ้าต่ำกว่า lg
      checkDock();
    };
    mq.addEventListener?.("change", onMQ);

    return () => {
      obs.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("load", onLoad);
      mq.removeEventListener?.("change", onMQ);
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [measure, checkDock, TOP_OFFSET]);

  // รูปโหลดแล้ววัดอีกที กันกระโดด
  const onMainImageLoad = useCallback(() => measure(), [measure]);

  // re-measure เมื่อ dock เปลี่ยน (กันขนาดเพี้ยนตอนสลับ)
  useEffect(() => { measure(); }, [dock, measure]);

  // ===== gallery controls =====
  const next = useCallback(() => setCurrent((i) => (i + 1) % allImages.length), [allImages.length]);
  const prev = useCallback(() => setCurrent((i) => (i - 1 + allImages.length) % allImages.length), [allImages.length]);

  // ===== render =====
  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin" /> กำลังโหลด…
        </div>
      </div>
    );
  }
  if (err || !data) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 px-6 py-5">
          <p className="text-slate-700 dark:text-slate-200">⚠️ {err || "ไม่พบประกาศ"}</p>
          <div className="mt-3 text-right">
            <Link to="/" className="text-sm text-blue-600 hover:underline">กลับหน้าแรก</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-16">
      {/* breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 py-4 text-sm text-gray-500 dark:text-slate-400">
        <Link to="/" className="hover:text-gray-700 dark:hover:text-slate-200">หน้าแรก</Link>
        <span className="mx-2">/</span>
        <Link to="/search" className="hover:text-gray-700 dark:hover:text-slate-200">ค้นหา</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 dark:text-slate-200">รายละเอียด</span>
      </nav>

      {/* header */}
      <div className="max-w-7xl mx-auto px-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {data.approvalStatus === "approved" && (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-1 rounded-full text-xs font-semibold">
                  <BadgeCheck size={14} /> อนุมัติแล้ว
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-1 rounded-full text-xs font-semibold">
                <Home size={14} /> {prettyType} · {prettyCategory}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-slate-100 leading-tight">
              {data.title}
            </h1>
            <p className="mt-1 flex items-center text-gray-600 dark:text-slate-300">
              <MapPin size={18} className="mr-1" /> {locationText}
            </p>
          </div>

          {/* rating placeholder */}
          <div className="hidden md:flex items-center gap-1 text-yellow-500">
            {Array.from({ length: 5 }).map((_, i) => (<Star key={i} size={18} className="opacity-60" />))}
            <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">—</span>
          </div>
        </div>
      </div>

      {/* grid */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-12 gap-8">
        {/* left */}
        <div className="col-span-12 lg:col-span-8">
          {/* gallery */}
          <div className="mb-6">
            <div className="relative w-full overflow-hidden rounded-2xl shadow-sm group">
              <div className="aspect-[16/10] md:aspect-[16/9] bg-slate-200/50 dark:bg-slate-800/50">
                <img
                  src={allImages[current]}
                  alt={`photo-${current}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onLoad={onMainImageLoad}
                  onClick={() => setOpen(true)}
                />
              </div>

              <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 shadow p-2 hidden md:inline-flex" aria-label="Prev">‹</button>
              <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 shadow p-2 hidden md:inline-flex" aria-label="Next">›</button>

              <button onClick={() => setOpen(true)} className="absolute right-3 bottom-3 rounded-xl bg-black/70 text-white text-xs px-3 py-1.5 hover:bg-black/80">
                ดูรูปทั้งหมด ({allImages.length})
              </button>
            </div>

            <div className="mt-3">
              <div className="flex gap-2 overflow-x-auto lg:grid lg:grid-cols-8 lg:overflow-visible">
                {allImages.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrent(idx)}
                    className={`relative shrink-0 lg:shrink w-28 h-20 lg:w-auto lg:h-auto lg:aspect-[4/3] overflow-hidden rounded-xl border ${
                      current === idx ? "ring-2 ring-gray-900 dark:ring-slate-200" : "border-black/10 dark:border-white/10"
                    }`}
                    aria-label={`ภาพที่ ${idx + 1}`}
                  >
                    <img
                      src={src}
                      alt={`thumb-${idx}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onLoad={idx === 0 ? onMainImageLoad : undefined}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* details */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Fact icon={BedDouble} label="ห้องนอน" value={`${data.bedrooms ?? "-"} ห้อง`} />
              <Fact icon={Bath} label="ห้องน้ำ" value={`${data.bathrooms ?? "-"} ห้อง`} />
              <Fact icon={Ruler} label="พื้นที่ใช้สอย" value={`${data.area ?? "-"} ตร.ม.`} />
              <Fact icon={Home} label="ประเภท" value={prettyType} />
            </div>

            {data.description && (
              <Card>
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-3">รายละเอียด</h2>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed">{data.description}</p>
              </Card>
            )}

            {!!amenityList.length && (
              <Card>
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">สิ่งอำนวยความสะดวก</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenityList.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                      <a.icon size={18} className="shrink-0" />
                      <span>{a.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Owner (full section) */}
            <Card>
              <div className="flex items-start gap-4">
                <img
                  src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(
                    data?.owner?.username || data?.owner?.name || "owner"
                  )}`}
                  alt={data?.owner?.name || "Owner"}
                  className="w-14 h-14 rounded-full border"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <UserCircle2 size={18} /> {data?.owner?.name || data?.owner?.username || "เจ้าของประกาศ"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">
                    เจ้าของประกาศที่ได้รับการยืนยันจากระบบ
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-slate-200">
                      ส่งข้อความ
                    </button>
                    {data?.contactPhone && (
                      <a
                        href={`tel:${data.contactPhone}`}
                        className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-black flex items-center gap-2"
                      >
                        <Phone size={16} /> โทรหาเจ้าของ
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {mapEmbed && (
              <Card>
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-3">ที่ตั้ง</h2>
                <p className="text-gray-700 dark:text-slate-300 mb-3 flex items-center">
                  <MapPin size={18} className="mr-1" /> {locationText}
                </p>
                <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-200 dark:bg-slate-800">
                  <iframe
                    src={mapEmbed}
                    title="map"
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* right (fixed booking + owner) */}
        <div className="col-span-12 lg:col-span-4" ref={rightColRef}>
          {/* sentinel ใช้สังเกต scroll */}
          <div ref={sentinelRef} className="h-px" />

          {/* กัน layout กระโดดเมื่อเปลี่ยนเป็น fixed */}
          {dock && fixedBox.height > 0 && <div style={{ height: fixedBox.height }} />}

          {/* แบบปกติ (ไม่ fixed) */}
          <div ref={panelRef} className={dock ? "hidden" : "block"}>
            <SidebarContent
              price={fmtPrice(data.price)}
              owner={data.owner}
              contactPhone={data.contactPhone}
            />
          </div>

          {/* แบบ fixed */}
          {dock && fixedBox.width > 0 && (
            <div
              className="hidden lg:block"
              style={{
                position: "fixed",
                top: `calc(${TOP_OFFSET}px + env(safe-area-inset-top, 0px))`,
                left: fixedBox.left,
                width: fixedBox.width,
                zIndex: 40,
              }}
            >
              <div
                className="rounded-2xl shadow-lg ring-1 ring-black/5 overflow-hidden"
                style={{
                  maxHeight: `calc(100vh - ${TOP_OFFSET + 16}px)`,
                  overflow: "auto",
                }}
              >
                <SidebarContent
                  price={fmtPrice(data.price)}
                  owner={data.owner}
                  contactPhone={data.contactPhone}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* lightbox */}
      {open && (
        <Lightbox
          images={allImages}
          index={current}
          onClose={() => setOpen(false)}
          onPrev={prev}
          onNext={next}
          setIndex={setCurrent}
        />
      )}

      <div className="h-12" />
    </div>
  );
}

/* ===== sub-components ===== */

function toPublicUrl(u) {
  if (!u) return "/placeholder.svg";
  if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u)) return u;
  try {
    const base = (api?.defaults?.baseURL || "").replace(/\/+$/, "");
    const origin = base.replace(/\/api(?:\/)?$/, "");
    return `${origin}${u.startsWith("/") ? u : `/${u}`}`;
  } catch {
    return u;
  }
}

function SidebarContent({ price, owner, contactPhone }) {
  return (
    <div className="space-y-4 bg-transparent p-0">
      {/* booking */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">
                ฿{price} <span className="text-sm font-medium text-gray-500 dark:text-slate-400">/เดือน</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                ราคาอาจไม่รวมค่าน้ำ/ไฟ (ขึ้นกับรายละเอียด)
              </div>
            </div>
            <div className="flex items-center gap-1 text-yellow-500 opacity-70">
              <Star size={16} /> <span className="text-sm text-gray-700 dark:text-slate-300">—</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <label className="col-span-1 text-xs text-gray-600 dark:text-slate-300">
              ย้ายเข้า
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                placeholder="เช่น 1 ต.ค."
              />
            </label>
            <label className="col-span-1 text-xs text-gray-600 dark:text-slate-300">
              ระยะเวลา
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                placeholder="เช่น 12 เดือน"
              />
            </label>
            <label className="col-span-2 text-xs text-gray-600 dark:text-slate-300">
              ข้อความถึงเจ้าของ (ไม่บังคับ)
              <textarea
                rows={3}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
                placeholder="ระบุเวลาที่สะดวกนัดดูห้อง ฯลฯ"
              />
            </label>
          </div>

          <button className="mt-4 w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg_BLACK">
            ขอจอง / นัดดูห้อง
          </button>

          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-2">
            การกดปุ่มนี้ยังไม่ใช่การชำระเงิน ระบบจะส่งรายละเอียดให้เจ้าของติดต่อกลับ
          </p>
        </div>

        <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800 text-xs text-gray-600 dark:text-slate-300 flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-600" /> ความปลอดภัย: มีการตรวจสอบผู้โพสต์
        </div>
      </div>

      {/* owner (ใต้กล่องจอง และจะ fixed ไปด้วยเมื่อ sidebar ลอย) */}
      <div className="rounded-2xl border border-black/10 dark:border-white/10 shadow-sm bg-white dark:bg-slate-900 p-5">
        <div className="flex items-start gap-4">
          <img
            src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(
              owner?.username || owner?.name || "owner"
            )}`}
            alt={owner?.name || "Owner"}
            className="w-14 h-14 rounded-full border"
          />
        <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <UserCircle2 size={18} /> {owner?.name || owner?.username || "เจ้าของประกาศ"}
            </h3>
            <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
              เจ้าของประกาศที่ได้รับการยืนยันจากระบบ
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="px-3 py-2 rounded-xl border border-black/10 dark:border_WHITE/10 hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-slate-200 text-sm">
                ส่งข้อความ
              </button>
              {contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className="px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-black flex items-center justify-center gap-2 text-sm"
                >
                  <Phone size={16} /> โทรหา
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function Fact({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 p-4 flex items-center gap-3 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xs text-gray-500 dark:text-slate-400">{label}</div>
        <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{value}</div>
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 p-5 shadow-sm">
      {children}
    </section>
  );
}

function Lightbox({ images, index, onClose, onPrev, onNext, setIndex }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/90 hover:text-white text-sm bg-white/10 px-3 py-1.5 rounded-lg"
      >
        ปิด
      </button>

      <div className="flex-1 flex items-center justify-center px-4">
        <button onClick={onPrev} className="text-white/80 hover:text-white text-4xl px-3">‹</button>
        <img
          src={images[index]}
          alt={`lightbox-${index}`}
          className="max-h-[78vh] max-w-[90vw] object-contain rounded-lg shadow"
        />
        <button onClick={onNext} className="text-white/80 hover:text-white text-4xl px-3">›</button>
      </div>

      <div className="w-full overflow-x-auto bg_BLACK/60 py-3">
        <div className="mx-auto max-w-6xl flex gap-2 px-4">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md border ${
                i === index ? "ring-2 ring-white" : "border-white/20"
              }`}
            >
              <img src={src} alt={`t-${i}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
