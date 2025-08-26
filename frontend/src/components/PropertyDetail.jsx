import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Home,
  BedDouble,
  Bath,
  Ruler,
  MapPin,
  ShieldCheck,
  Wifi,
  Car,
  Snowflake,
  Tv,
  CookingPot,
  Armchair,
  Sparkles,
  Star,
  BadgeCheck,
  UserCircle2,
  Phone,
} from "lucide-react";

export default function PropertyDetail() {
  const { slug } = useParams();

  // ===== Mock data (replace with API result later) =====
  const data = useMemo(
    () => ({
      id: "p-1001",
      slug,
      title: "บ้านเดี่ยว 2 ชั้น สไตล์มินิมอล ใกล้ มรย.",
      location: "อ.เมืองยะลา, ยะลา",
      price: 8500,
      type: "บ้านเดี่ยว",
      bedrooms: 3,
      bathrooms: 2,
      area: 168,
      isVerified: true,
      rating: 4.7,
      reviewsCount: 32,
      cover:
        "https://images.unsplash.com/photo-1755510603500-e32c82143ef1?q=80&w=1600&auto=format&fit=crop",
      images: [
        // demo 10 images
        "https://plus.unsplash.com/premium_photo-1755742204313-c49cf4a8971c?q=80&w=1600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1755374976691-bee0aaba4be3?q=80&w=1600&auto=format&fit=crop",
        "https://plus.unsplash.com/premium_photo-1755612016361-ac40fcd724e3?q=80&w=1600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1754753674476-6eda28010f02?q=80&w=1600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1755720233919-3382ed081bc3?q=80&w=1600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600585154154-1e6f0c720f99?q=80&w=1600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1613977257593-6554e3f10b0c?q=80&w=1600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1597047084897-51e81819a499?q=80&w=1600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1600&auto=format&fit=crop",
      ],
      description:
        "ที่พักสไตล์มินิมอล โทนอบอุ่น เฟอร์นิเจอร์ครบ แยกส่วนครัวและซักล้าง มีที่จอดรถ 2 คัน เดินทางสะดวกไป มรย. เพียง 5 นาที",
      amenities: [
        { icon: Wifi, label: "Wi‑Fi" },
        { icon: Car, label: "ที่จอดรถ" },
        { icon: Snowflake, label: "แอร์" },
        { icon: Tv, label: "ทีวี" },
        { icon: CookingPot, label: "ครัว" },
        { icon: Armchair, label: "เฟอร์ฯ ครบ" },
        { icon: Sparkles, label: "ทำความสะอาดง่าย" },
        { icon: ShieldCheck, label: "ปลอดภัย" },
      ],
      owner: {
        name: "คุณสมชาย",
        phone: "08x-xxx-xxxx",
        avatar: "https://api.dicebear.com/8.x/avataaars/svg?seed=chaomai-owner",
        hostSince: "2023",
        responseRate: 98,
      },
      googleMapUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3914.037!2d101.281!3d6.539!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z!5e0!3m2!1sth!2sth!4v1690000000000",
    }),
    [slug]
  );

  // ===== gallery states & helpers =====
  const allImages = useMemo(() => [data.cover, ...data.images], [data]);
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);

  const openLightboxAt = useCallback((idx) => {
    setCurrent(idx);
    setOpen(true);
  }, []);

  const next = useCallback(
    () => setCurrent((i) => (i + 1) % allImages.length),
    [allImages.length]
  );
  const prev = useCallback(
    () => setCurrent((i) => (i - 1 + allImages.length) % allImages.length),
    [allImages.length]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, prev]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== Breadcrumbs ===== */}
      <nav className="max-w-7xl mx-auto px-4 py-4 text-sm text-gray-500">
        <Link to="/" className="hover:text-gray-700">หน้าแรก</Link>
        <span className="mx-2">/</span>
        <Link to="/search" className="hover:text-gray-700">ค้นหา</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">รายละเอียด</span>
      </nav>

      {/* ===== Title & meta ===== */}
      <div className="max-w-7xl mx-auto px-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {data.isVerified && (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full text-xs font-semibold">
                  <BadgeCheck size={14} /> ยืนยันแล้ว
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full text-xs font-semibold">
                <Home size={14} /> {data.type}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
              {data.title}
            </h1>
            <p className="mt-1 flex items-center text-gray-600">
              <MapPin size={18} className="mr-1" /> {data.location}
            </p>
          </div>

          {/* Rating */}
          <div className="hidden md:flex items-center gap-1 text-yellow-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={18} fill={i < Math.round(data.rating) ? "currentColor" : "transparent"} />
            ))}
            <span className="ml-2 text-sm text-gray-700">
              {data.rating} · {data.reviewsCount} รีวิว
            </span>
          </div>
        </div>
      </div>

      {/* ===== Gallery ===== */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-12 gap-3">
          {/* Main image */}
          <div className="col-span-12 md:col-span-8">
            <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl shadow-sm group">
              <img
                src={allImages[current]}
                alt={`photo-${current}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Prev/Next controls */}
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white shadow p-2 hidden md:inline-flex"
                aria-label="Prev"
              >
                ‹
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white shadow p-2 hidden md:inline-flex"
                aria-label="Next"
              >
                ›
              </button>

              {/* Open lightbox */}
              <button
                onClick={() => setOpen(true)}
                className="absolute right-3 bottom-3 rounded-xl bg-black/70 text-white text-xs px-3 py-1.5 hover:bg-black/80"
              >
                ดูรูปทั้งหมด ({allImages.length})
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="col-span-12 md:col-span-4 grid grid-cols-2 gap-3">
            {allImages.slice(0, 4).map((src, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`relative w-full aspect-[4/3] overflow-hidden rounded-2xl border ${
                  current === idx ? "ring-2 ring-gray-900" : ""
                }`}
              >
                <img
                  src={src}
                  alt={`thumb-${idx}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}

            {/* +N more */}
            {allImages.length > 5 && (
              <button
                onClick={() => openLightboxAt(4)}
                className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl border"
              >
                <img
                  src={allImages[4]}
                  alt="more"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-sm font-semibold">
                  +{allImages.length - 4} รูป
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== Main content ===== */}
      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-12 gap-8">
        {/* Left column */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Facts row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Fact icon={BedDouble} label="ห้องนอน" value={`${data.bedrooms} ห้อง`} />
            <Fact icon={Bath} label="ห้องน้ำ" value={`${data.bathrooms} ห้อง`} />
            <Fact icon={Ruler} label="พื้นที่ใช้สอย" value={`${data.area} ตร.ม.`} />
            <Fact icon={Home} label="ประเภท" value={data.type} />
          </div>

          {/* Description */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-3">รายละเอียด</h2>
            <p className="text-gray-700 leading-relaxed">{data.description}</p>
          </Card>

          {/* Amenities */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">สิ่งอำนวยความสะดวก</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.amenities.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-700">
                  <a.icon size={18} className="shrink-0" />
                  <span>{a.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Owner */}
          <Card>
            <div className="flex items-start gap-4">
              <img
                src={data.owner.avatar}
                alt={data.owner.name}
                className="w-14 h-14 rounded-full border"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <UserCircle2 size={18} /> {data.owner.name}
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  โฮสต์ตั้งแต่ปี {data.owner.hostSince} · ตอบกลับ {data.owner.responseRate}%
                </p>
                <div className="mt-3 flex gap-2">
                  <button className="px-4 py-2 rounded-xl border hover:bg-gray-50 text-gray-700">
                    ส่งข้อความ
                  </button>
                  <a
                    href={`tel:${data.owner.phone}`}
                    className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-black flex items-center gap-2"
                  >
                    <Phone size={16} /> โทรหาเจ้าของ
                  </a>
                </div>
              </div>
            </div>
          </Card>

          {/* Map */}
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-3">ที่ตั้ง</h2>
            <p className="text-gray-700 mb-3 flex items-center"><MapPin size={18} className="mr-1" /> {data.location}</p>
            <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-200">
              <iframe
                src={data.googleMapUrl}
                title="map"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Card>

          {/* Similar listings */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">ประกาศใกล้เคียง</h2>
              <Link to="/search" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                ดูทั้งหมด
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <Link
                  key={i}
                  to={`/property/demo-${i + 1}`}
                  className="group rounded-xl overflow-hidden border hover:shadow transition-all"
                >
                  <div className="relative w-full aspect-[16/10]">
                    <img
                      src={`https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1600&auto=format&fit=crop`}
                      alt="similar"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <div className="text-indigo-600 font-semibold">฿7,500 <span className="text-gray-500 text-xs">/เดือน</span></div>
                    <div className="text-sm font-medium text-gray-900">หอพักใหม่เอี่ยม ใกล้ตลาด</div>
                    <div className="text-xs text-gray-600 mt-0.5">อ.เมืองยะลา, ยะลา</div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column — sticky booking card */}
        <div className="col-span-12 lg:col-span-4">
          <div className="lg:sticky lg:top-6">
            <div className="rounded-2xl border shadow-sm bg-white overflow-hidden">
              <div className="p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-gray-900">
                      ฿{data.price.toLocaleString()} <span className="text-sm font-medium text-gray-500">/เดือน</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">รวมค่าส่วนกลางแล้ว</div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={16} fill="currentColor" />
                    <span className="text-sm text-gray-700">{data.rating} · {data.reviewsCount} รีวิว</span>
                  </div>
                </div>

                {/* Fake form — replace with your booking/contact flow */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <input className="col-span-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-gray-900/10" placeholder="ย้ายเข้า" />
                  <input className="col-span-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-gray-900/10" placeholder="ระยะเวลา" />
                  <input className="col-span-2 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-gray-900/10" placeholder="ข้อความถึงเจ้าของ (ไม่บังคับ)" />
                </div>

                <button className="mt-4 w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black">
                  ขอจอง / นัดดูห้อง
                </button>

                <p className="text-[11px] text-gray-500 mt-2">
                  การกดปุ่มนี้ยังไม่ใช่การชำระเงิน ระบบจะส่งรายละเอียดให้เจ้าของติดต่อกลับ
                </p>
              </div>

              <div className="px-5 py-3 bg-gray-50 text-xs text-gray-600 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" /> ความปลอดภัย: มีการตรวจสอบผู้โพสต์
              </div>
            </div>

            {/* Mini highlights */}
            <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <li className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2"><Wifi size={16}/> อินเทอร์เน็ตเร็ว</li>
              <li className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2"><Car size={16}/> จอดรถ 2 คัน</li>
              <li className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2"><Snowflake size={16}/> แอร์ทุกห้อง</li>
              <li className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2"><Tv size={16}/> สมาร์ททีวี</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Lightbox */}
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

      {/* Footer spacer */}
      <div className="h-12" />
    </div>
  );
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white border p-4 flex items-center gap-3 shadow-sm">
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
    <section className="rounded-2xl bg-white border p-5 shadow-sm">
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

      {/* thumbnail strip */}
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
