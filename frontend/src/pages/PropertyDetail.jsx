// src/pages/PropertyDetail.jsx
import React, { useMemo, useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import Footer from '../components/Footer';
// --- เพิ่มบนสุดของไฟล์ ---
import { notify } from "../lib/notify"; // ถ้ามี

import { Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import {
  Home, BedDouble, Bath, Ruler, MapPin,
  Wifi as WifiIcon, Car, Snowflake, Tv, CookingPot, Armchair,
  Refrigerator, WashingMachine, Sparkles, Star, BadgeCheck,
  UserCircle2, Phone, Loader2, Flag,
} from "lucide-react";

export default function PropertyDetail() {
  const { id } = useParams();

  // state for report modal
  const [openReport, setOpenReport] = useState(false);

  // ===== states =====
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [related, setRelated] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const MAX_RELATED = 4; // จำนวนประกาศที่เกี่ยวข้องสูงสุด

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

  useEffect(() => {
    let ignore = false;
    const ac = new AbortController();
    (async () => {
      if (!data?._id) return;
      try {
        setRelatedLoading(true);
        const { data: resp } = await api.get(`/properties/${data._id}/related`, {
          params: { limit: MAX_RELATED },
          signal: ac.signal
        });
        if (!ignore) setRelated((resp?.items || []).slice(0, MAX_RELATED));
      } catch (e) {
        if (e?.code !== 'ERR_CANCELED') console.error('load related error', e);
        if (!ignore) setRelated([]);
      } finally {
        if (!ignore) setRelatedLoading(false);
      }
    })();
    return () => { ignore = true; ac.abort(); };
  }, [data?._id]);

  // const relatedSearchLink = useMemo(() => {
  //   const qs = new URLSearchParams();
  //   if (data?.category?.slug) qs.set('category', data.category.slug);
  //   if (data?.type?.slug) qs.set('type', data.type.slug);
  //   if (data?.province) qs.set('province', data.province);
  //   if (data?.district) qs.set('district', data.district);
  //   const q = qs.toString();
  //   return q ? `/search?${q}` : '/search';
  // }, [data]);

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

  const checkDock = useCallback(() => {
    if (!sentinelRef.current) return;
    const rect = sentinelRef.current.getBoundingClientRect();
    const isLg = window.matchMedia("(min-width: 1024px)").matches;
    const shouldDock = rect.top <= (TOP_OFFSET + 8);
    setDock(isLg && shouldDock);
    measure();
  }, [measure, TOP_OFFSET]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const mq = window.matchMedia("(min-width: 1024px)");
    if (!mq.matches) { setDock(false); return; }

    const obs = new IntersectionObserver(
      ([ent]) => {
        setDock(!ent.isIntersecting);
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

    const raf = requestAnimationFrame(checkDock);
    const t = setTimeout(checkDock, 250);

    const onMQ = (e) => {
      if (!e.matches) setDock(false);
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

  const onMainImageLoad = useCallback(() => measure(), [measure]);
  // useEffect(() => { measure(); }, [dock, measure]);
  useLayoutEffect(() => { measure(); }, [dock, measure]);

  // ===== gallery controls =====
  const next = useCallback(() => setCurrent((i) => (i + 1) % allImages.length), [allImages.length]);
  const prev = useCallback(() => setCurrent((i) => (i - 1 + allImages.length) % allImages.length), [allImages.length]);

  // ===== render =====
  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" /> กำลังโหลด…
        </div>
      </div>
    );
  }
  if (err || !data) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="rounded-xl border border-black/10 bg-white px-6 py-5">
          <p className="text-slate-700">⚠️ {err || "ไม่พบประกาศ"}</p>
          <div className="mt-3 text-right">
            <Link to="/" className="text-sm text-blue-600 hover:underline">กลับหน้าแรก</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 py-4 text-sm text-gray-500">
        <Link to="/" className="hover:text-gray-700">หน้าแรก</Link>
        <span className="mx-2">/</span>
        <Link to="/search" className="hover:text-gray-700">ค้นหา</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">รายละเอียด</span>
      </nav>

      {/* header */}
      <div className="max-w-7xl mx-auto px-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {data.approvalStatus === "approved" && (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full text-xs font-semibold">
                  <BadgeCheck size={14} /> อนุมัติแล้ว
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full text-xs font-semibold">
                <Home size={14} /> {prettyType} · {prettyCategory}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
              {data.title}
            </h1>
            <p className="mt-1 flex items-center text-gray-600">
              <MapPin size={18} className="mr-1" /> {locationText}
            </p>
          </div>

          {/* rating placeholder */}
          {/* <div className="hidden md:flex items-center gap-1 text-yellow-500">
            {Array.from({ length: 5 }).map((_, i) => (<Star key={i} size={18} className="opacity-60" />))}
            <span className="ml-2 text-sm text-gray-700">—</span>
          </div> */}
          {/* ปุ่มรายงาน */}
          <button
            onClick={() => setOpenReport(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-sm"
            title="รายงานประกาศนี้"
          >
            <Flag size={16} /> รายงาน
          </button>
        </div>
      </div>

      {/* grid */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-12 gap-8">
        {/* left */}
        <div className="col-span-12 lg:col-span-8">
          {/* gallery */}
          <div className="mb-6">
            <div className="relative w-full overflow-hidden rounded-2xl shadow-sm group">
              <div className="aspect-[16/10] md:aspect-[16/9] bg-slate-200/50">
                <img
                  src={allImages[current]}
                  alt={`photo-${current}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onLoad={onMainImageLoad}
                  onClick={() => setOpen(true)}
                />
              </div>

              <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white shadow p-2 hidden md:inline-flex" aria-label="Prev">‹</button>
              <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white shadow p-2 hidden md:inline-flex" aria-label="Next">›</button>

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
                      current === idx ? "ring-2 ring-gray-900" : "border-black/10"
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
                <h2 className="text-xl font-bold text-gray-900 mb-3">รายละเอียด</h2>
                <p className="text-gray-700 leading-relaxed">{data.description}</p>
              </Card>
            )}

            {!!amenityList.length && (
              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-4">สิ่งอำนวยความสะดวก</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenityList.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-700">
                      <a.icon size={18} className="shrink-0" />
                      <span>{a.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ✅ กล่องเช่า: แสดงเฉพาะมือถือ/แท็บเล็ตเล็ก (ย้ายขึ้นมาหลังสิ่งอำนวยความสะดวก) */}
            <div className="lg:hidden">
              <BookingBox property={data} />
            </div>

            {/* Owner (full section) */}
            <Card>
              <div className="flex items-start gap-4">
                <img
                  src={
                    data?.owner?.profile
                      ? toPublicUrl(data.owner.profile)
                      : `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(
                          data?.owner?.username || data?.owner?.name || "owner"
                        )}`
                  }
                  alt={data?.owner?.name || "Owner"}
                  className="w-16 h-16 rounded-full border object-cover"
                />

                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {data?.owner?.name || data?.owner?.username || "เจ้าของประกาศ"}
                    </h3>
                    {data?.owner?.verified && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-xs font-semibold">
                        <BadgeCheck size={14} /> ยืนยันแล้ว
                      </span>
                    )}
                  </div>

                  {/* meta */}
                  <div className="mt-1 text-sm text-gray-600 space-y-1">
                    {data?.owner?.company && <div>บริษัท/ร้าน: {data.owner.company}</div>}
                    {data?.owner?.address && <div>ที่อยู่: {data.owner.address}</div>}
                    {data?.owner?.about && (
                      <div className="leading-relaxed">
                        <span className="font-medium text-gray-700">เกี่ยวกับ:</span>{" "}
                        {data.owner.about}
                      </div>
                    )}
                  </div>

                  {/* chips contact */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      to={`/owners/${data?.owner?.username || data?.owner?._id}`}
                      className="px-3 py-2 rounded-xl border border-black/10 hover:bg-black/5 text-gray-800 text-sm"
                    >
                      ดูหน้าโปรไฟล์
                    </Link>

                    {/* {data?.owner?.phone && (
                      <a
                        href={`tel:${data.owner.phone}`}
                        className="px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-black text-sm"
                      >
                        โทร {data.owner.phone}
                      </a>
                    )}

                    {data?.owner?.lineId && (
                      <a
                        href={toLineUrl(data.owner.lineId)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl border border-black/10 hover:bg-black/5 text-sm"
                        title={`Line: ${data.owner.lineId}`}
                      >
                        LINE: {data.owner.lineId}
                      </a>
                    )}

                    {data?.owner?.facebookUrl && (
                      <a
                        href={data.owner.facebookUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl border border-black/10 hover:bg-black/5 text-sm"
                      >
                        Facebook
                      </a>
                    )} */}
                  </div>

                  {/* small stats */}
                  <div className="mt-3 text-xs text-gray-500">
                    รวมประกาศทั้งหมด: {Number.isFinite(+data?.owner?.listings) ? data.owner.listings : 0} รายการ
                  </div>
                </div>
              </div>
            </Card>


            {mapEmbed && mapEmbed.startsWith('https://www.google.com/maps?q=') && (
              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-3">ที่ตั้ง</h2>
                <p className="text-gray-700 mb-3 flex items-center">
                  <MapPin size={18} className="mr-1" /> {locationText}
                </p>
                <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-200">
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

            {/* Related listings */}
            {!relatedLoading && related.length > 0 && (
              <Card>
                <div className="mb-3">
                  {/* บรรทัดแรก: หัวข้อ */}
                  <div className="flex items-center justify-between flex-wrap sm:flex-nowrap">
                    <h2 className="text-xl font-bold text-gray-900">
                      บ้านอื่นๆ ที่คุณอาจสนใจ
                    </h2>

                    {/* Desktop/Tablet: จำนวน + ปุ่ม */}
                    <div className="hidden sm:flex items-center gap-3 min-w-0">
                      <span className="text-sm text-gray-600">{related.length} รายการ</span>
                      <Link
                        to="/properties"
                        className="text-sm px-3 py-1.5 rounded-lg border border-black/10 hover:bg-black/5 whitespace-nowrap"
                      >
                        ดูทั้งหมด
                      </Link>
                    </div>
                  </div>

                  {/* Mobile: จำนวน (ซ้าย) + ปุ่ม (ขวา) */}
                  <div className="flex items-center justify-between sm:hidden mt-2">
                    <span className="text-sm text-gray-600">{related.length} รายการ</span>
                    <Link
                      to="/properties"
                      className="text-sm px-3 py-1.5 rounded-lg border border-black/10 hover:bg-black/5 whitespace-nowrap"
                    >
                      ดูทั้งหมด
                    </Link>
                  </div>
                </div>

                {/* Mobile: horizontal snap carousel */}
                <div className="lg:hidden -mx-4 px-4">
                  <div
                    className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar"
                    aria-label="รายการที่แนะนำ"
                  >
                    {related.slice(0, MAX_RELATED).map((p) => (
                      <div
                        key={p._id}
                        className="snap-start shrink-0 w-[85%] first:ml-0 last:mr-0"
                      >
                        {/* กำหนดสัดส่วนรูปให้สวยบนมือถือ */}
                        <div className="rounded-xl border border-black/10 overflow-hidden bg-white">
                          <div className="relative">
                            {/* ถ้าใน RelatedCard ใส่รูปเองอยู่แล้ว ใช้คอมโพเนนต์เดิมได้
                                แต่ถ้าอยากควบคุม aspect บนมือถือ แนะนำวางรูปไว้ตรงนี้แทน */}
                            <RelatedCard p={p} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop / Tablet: grid สองคอลัมน์ */}
                <div className="hidden lg:grid grid-cols-2 gap-4">
                  {related.slice(0, MAX_RELATED).map((p) => (
                    <RelatedCard key={p._id} p={p} />
                  ))}
                </div>
              </Card>

            )}

          </div>
        </div>

        {/* right (fixed owner only) */}
        <div className="col-span-12 lg:col-span-4" ref={rightColRef}>
          <div ref={sentinelRef} className="h-px" />
          {dock && fixedBox.height > 0 && <div style={{ height: fixedBox.height }} />}

          {/* ปกติ */}
          <div ref={panelRef} className={`${dock ? "hidden" : ""} hidden lg:block`}>
            {/* <SidebarContent
              owner={data.owner}
              contactPhone={data.contactPhone}
            /> */}
            <BookingBox property={data} />

          </div>

          {/* fixed */}
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
                {/* <SidebarContent
                  owner={data.owner}
                  contactPhone={data.contactPhone}
                /> */}
                <BookingBox property={data} />

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
      {openReport && (
        <ReportModal
          property={data}
          onClose={() => setOpenReport(false)}
        />
      )}
      <Footer />
    </div>
  );
}

/* ===== sub-components ===== */

function RelatedCard({ p }) {
  const cover = useMemo(() => {
    const im = Array.isArray(p.images) ? (p.images.find(i => i.isCover) || p.images[0]) : null;
    return im ? toPublicUrl(im.url) : '/placeholder.svg';
  }, [p]);

  const typeName = p?.type?.name || '-';
  const catName  = p?.category?.name || '-';

  const fmt = (n) => Number.isFinite(+n) ? Number(n).toLocaleString('th-TH', { maximumFractionDigits: 0 }) : '-';

  return (
    <Link
      to={`/properties/${p._id}`}
      className="group rounded-2xl overflow-hidden border border-black/10 bg-white shadow-sm hover:shadow transition"
    >
      <div className="aspect-[16/10] bg-slate-200/50 overflow-hidden">
        <img src={cover} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy"/>
      </div>
      <div className="p-4">
        <div className="text-xs inline-flex items-center gap-1 text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full font-semibold">
          <Home size={12}/> {typeName} · {catName}
        </div>
        <h3 className="mt-2 line-clamp-2 font-semibold text-gray-900">{p.title}</h3>
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1"><BedDouble size={14}/> {p.bedrooms ?? '-'} นอน</span>
          <span className="inline-flex items-center gap-1"><Bath size={14}/> {p.bathrooms ?? '-'} น้ำ</span>
          <span className="inline-flex items-center gap-1"><Ruler size={14}/> {p.area ?? '-'} ตร.ม.</span>
        </div>
        {p.price != null && (
          <div className="mt-2 text-sm font-extrabold text-gray-900 ">
            ฿{fmt(p.price)} <span className="text-xs font-medium text-gray-500">/เดือน</span>
          </div>
        )}
      </div>
    </Link>
  );
}


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

// function toLineUrl(id = "") {
//   const clean = String(id || "").trim();
//   if (!clean) return "";
//   // โปรไฟล์แบบ @xxxxx ใช้ลิงก์นี้ได้ (ส่วนใหญ่)
//   return `https://line.me/R/ti/p/~${encodeURIComponent(clean.replace(/^@/, ""))}`;
// }


// utils ขำ ๆ สำหรับคำนวณราคา (ต่อวันจากราคา/เดือน)
function calcTotalTHB(pricePerMonth, start, end) {
  const s = new Date(start), e = new Date(end);
  const ms = Math.max(e - s, 0);
  const days = Math.max(1, Math.ceil(ms / (24*60*60*1000)));
  const perDay = Number(pricePerMonth || 0) / 30;
  return Math.round(perDay * days);
}

function fmtTHB(n=0) { return Number(n||0).toLocaleString('th-TH'); }

function BookingBox({ property }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [openEnded, setOpenEnded] = useState(false); // ✅ ใหม่
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u?.phone || '';
    } catch { return ''; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');

  const today = new Date().toISOString().slice(0,10);
  const endMin = start || today;
  const isRangeValid = openEnded ? !!start : (start && end && new Date(end) >= new Date(start));

  const total = (!openEnded && isRangeValid) ? calcTotalTHB(property?.price, start, end) : 0;

  const create = async () => {
    try {
      setErr('');
      if (!isRangeValid) {
        setErr(openEnded ? 'โปรดเลือก “วันที่เริ่ม”' : 'โปรดเลือกช่วงวันที่ให้ถูกต้อง');
        return;
      }
      if (!phone || !/^\+?\d{9,15}$/.test(String(phone).replace(/\s|-/g,''))) {
        setErr('โปรดกรอกเบอร์โทรที่ถูกต้อง');
        return;
      }
      setOk(false);
      setSubmitting(true);

      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

       await api.post('/bookings', {
        propertyId: property._id,
        startDate: start,
        endDate: openEnded ? null : end, // ✅ ส่ง null ได้
        openEnded,                       // ✅ ส่งธงไปด้วย (เผื่อ backend ใช้)
        note,
        phone
      });
      setOk(true);
      // อยาก redirect ไปหน้า "การเช่าของฉัน" ก็ทำได้
      // window.location.href = '/owner/dashboard/bookings?tab=renter';
    } catch (e) {
      setErr(e?.response?.data?.message || 'จองไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-500">ราคา</div>
          <div className="text-2xl font-extrabold text-gray-900">
            ฿{fmtTHB(property?.price)} <span className="text-sm font-medium text-gray-500">/เดือน</span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-600">วันที่เริ่ม</label>
          <input type="date" className="w-full h-10 rounded-xl border border-black/10 px-3"
                 min={today} value={start} onChange={(e)=>setStart(e.target.value)} />

        </div>
        <div>
          <label className="text-xs text-gray-600">วันที่สิ้นสุด</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="w-full h-10 rounded-xl border border-black/10 px-3 disabled:bg-gray-100 disabled:text-gray-400"
                min={endMin}
                value={end}
                onChange={(e)=>setEnd(e.target.value)}
                disabled={openEnded}
              />
            </div>
            <label className="mt-1 flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={openEnded}
                onChange={(e)=> setOpenEnded(e.target.checked)}
              />
              ไม่กำหนดวันสิ้นสุด (ต่อเนื่องจนกว่าจะยกเลิก)
            </label>
        </div>
      </div>
      <div className="mt-2">
        <label className="text-xs text-gray-600">เบอร์โทรสำหรับติดต่อ</label>
        <input
          type="tel"
          inputMode="tel"
          className="w-full h-10 rounded-xl border border-black/10 px-3"
          placeholder="เช่น 0812345678"
          value={phone}
          onChange={(e)=> setPhone(e.target.value)}
        />
      </div>

      <div className="mt-2">
        <label className="text-xs text-gray-600">หมายเหตุ (ไม่บังคับ)</label>
        <textarea className="w-full rounded-xl border border-black/10 px-3 py-2 h-16 text-slate-900 placeholder-slate-400"
                  placeholder="ระบุข้อมูลเพิ่มเติม เช่น เวลาเข้าพักโดยประมาณ"
                  value={note} onChange={(e)=>setNote(e.target.value)} />
      </div>

        <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm">
          {openEnded ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">ค่าใช้จ่ายโดยประมาณ</span>
                <span className="font-bold text-gray-900">฿{fmtTHB(property?.price || 0)} / เดือน</span>
              </div>
              <div className="text-[12px] text-gray-500 mt-1">
                * ไม่กำหนดวันสิ้นสุด ระบบจะคิดรายเดือนจนกว่าจะยกเลิก/สิ้นสุดโดยเจ้าของ
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">ราคารวมโดยประมาณ</span>
                <span className="font-bold text-gray-900">฿{fmtTHB(total || 0)}</span>
              </div>
              <div className="text-[12px] text-gray-500 mt-1">
                * คิดตามจำนวนวัน (ราคา/เดือน ÷ 30) — เจ้าของอาจยืนยันราคาอีกครั้ง
              </div>
            </>
          )}
        </div>

      {!isRangeValid && (start || end) && (
        <div className="mt-2 text-xs text-rose-600">โปรดเลือกวันที่สิ้นสุดให้ไม่น้อยกว่าวันที่เริ่ม</div>
      )}

      {err && <div className="mt-3 text-sm text-rose-600">{err}</div>}
      {ok && (
        <div className="mt-3 text-sm text-emerald-700 inline-flex items-center gap-2">
          <CheckCircle2 size={16}/> ส่งคำขอเช่าแล้ว! ไปที่ “การเช่า” เพื่อดูสถานะ
        </div>
      )}

      <button
        disabled={(!isRangeValid) || submitting}
        onClick={create}
        className="mt-4 w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarIcon className="h-4 w-4" />}
        {submitting ? 'กำลังส่งคำขอ…' : 'ขอเช่า'}
      </button>

      <div className="mt-3 text-center">
        <Link
          to={`/owners/${property?.owner?.username || property?.owner?._id}`}
          className="text-sm text-gray-700 underline underline-offset-2"
        >
          ดูหน้าโปรไฟล์เจ้าของ
        </Link>
      </div>
    </div>
  );
}

// function SidebarContent({ owner, contactPhone,}) {
//   const avatar = owner?.profile ? toPublicUrl(owner.profile)
//     : `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(owner?.username || owner?.name || "owner")}`;

//   return (
//     <div className="hidden md:block space-y-4 bg-transparent p-0">
//       <div className="rounded-2xl border border-black/10 shadow-sm bg-white p-5">
//         <div className="flex items-start gap-4">
//           <img
//             src={avatar}
//             alt={owner?.name || "Owner"}
//             className="w-14 h-14 rounded-full border object-cover"
//           />
//           <div className="flex-1">
//             <div className="flex items-center gap-2">
//               <h3 className="text-base font-semibold text-gray-900">
//                 {owner?.name || owner?.username || "เจ้าของประกาศ"}
//               </h3>
//               {owner?.verified && (
//                 <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px] font-semibold">
//                   <BadgeCheck size={12} /> ยืนยันแล้ว
//                 </span>
//               )}
//             </div>

//             {/* mini meta */}
//             <div className="mt-1 text-xs text-gray-600 space-y-0.5">
//               {owner?.company && <div>บริษัท/ร้าน: {owner.company}</div>}
//               {owner?.address && <div className="line-clamp-2">ที่อยู่: {owner.address}</div>}
//             </div>

//             {/* actions */}
//             <div className="mt-3 grid grid-cols-2 gap-2">
//               <Link
//                 to={`/owners/${ owner?._id || owner?.username}`}
//                 className="px-3 py-2 rounded-xl border border-black/10 hover:bg-black/5 text-gray-700 text-sm text-center"
//               >
//                 ดูหน้าโปรไฟล์
//               </Link>

//               {(owner?.phone || contactPhone) && (
//                 <a
//                   href={`tel:${owner?.phone || contactPhone}`}
//                   className="px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-black flex items-center justify-center gap-2 text-sm"
//                 >
//                   <Phone size={16} /> โทรหา
//                 </a>
//               )}
//             </div>

//             {/* quick links */}
//             <div className="mt-2 flex flex-wrap gap-2">
//               {owner?.lineId && (
//                 <a
//                   href={toLineUrl(owner.lineId)}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="px-2.5 py-1.5 rounded-lg border border-black/10 text-[12px] hover:bg-black/5"
//                   title={`Line: ${owner.lineId}`}
//                 >
//                   LINE: {owner.lineId}
//                 </a>
//               )}
//               {owner?.facebookUrl && (
//                 <a
//                   href={owner.facebookUrl}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="px-2.5 py-1.5 rounded-lg border border-black/10 text-[12px] hover:bg-black/5"
//                 >
//                   Facebook
//                 </a>
//               )}
//             </div>

//             <div className="mt-2 text-[11px] text-gray-500">
//               รวมประกาศ: {Number.isFinite(+owner?.listings) ? owner.listings : 0}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// eslint-disable-next-line no-unused-vars
function Fact({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white border border-black/10 p-4 flex items-center gap-3 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <section className="rounded-2xl bg-white border border-black/10 p-5 shadow-sm">
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

      <div className="w-full overflow-x-auto bg-black/60 py-3">
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

function ReportModal({ property, onClose }) {
  const [reason, setReason] = useState("scam");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = `/login?next=${encodeURIComponent(location.pathname)}`;
        return;
      }
      await api.post(
        "/reports",
        { propertyId: property?._id, reason, detail, pageUrl: window.location.href },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      notify?.ok?.("ส่งรายงานแล้ว ขอบคุณที่ช่วยแจ้ง!");
      onClose();
    } catch (e) {
      notify?.err?.(e?.response?.data?.message || "ส่งรายงานไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold">รายงานประกาศ</h3>
        <p className="text-sm text-gray-600 mt-1">
          ถ้าพบประกาศเข้าข่ายหลอกลวง/ข้อมูลไม่จริง กรุณาแจ้งเหตุผลด้านล่าง
        </p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm text-gray-700">เหตุผล</span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full h-10 rounded-xl border border-black/10 px-3"
            >
              <option value="scam">หลอกลวง/ฉ้อโกง</option>
              <option value="incorrect">ข้อมูลไม่ถูกต้อง</option>
              <option value="duplicate">ประกาศซ้ำซ้อน/สแปม</option>
              <option value="offensive">ไม่เหมาะสม/รบกวน</option>
              <option value="other">อื่น ๆ</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-gray-700">รายละเอียดเพิ่มเติม (ถ้ามี)</span>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={4}
              placeholder="เล่ารายละเอียดเพิ่มเติม / หลักฐาน / เบาะแส"
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 placeholder:text-gray-500"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl border border-black/10 hover:bg-black/5"
          >
            ยกเลิก
          </button>
          <button
            disabled={submitting}
            onClick={submit}
            className="px-3 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 inline-flex items-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag size={16} />}
            ส่งรายงาน
          </button>
        </div>
      </div>
    </div>
  );
}
