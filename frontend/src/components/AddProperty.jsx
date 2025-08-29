import React, { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PlusCircle,
  Trash2,
  MapPin,
  Image as ImageIcon,
  Loader2,
  Star,
  Info,
} from "lucide-react";

export default function AddProperty() {
  const nav = useNavigate();
  const fileInputRef = useRef(null);

  // ===== Data =====
  const [cats, setCats] = useState([]);
  const [types, setTypes] = useState([]);

  // ===== Images =====
  const [images, setImages] = useState([]); // Array<File>
  const [preview, setPreview] = useState([]); // Array<string(ObjectURL)>
  const [coverIndex, setCoverIndex] = useState(-1);
  const [dragOver, setDragOver] = useState(false);

  // ===== Form =====
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    address: "",
    googleMapUrl: "",
    lat: "",
    lng: "",
    category: "",
    type: "",
    // 👇 เพิ่ม amenities ก้อนเดียว จัดระเบียบและขยายง่าย
    amenities: {
      wifi: "none", // none | free | paid
      parking: "none", // none | motorcycle | car_and_motorcycle
      utilitiesIncluded: [], // ['water','electricity','wifi','common_fee']
      features: {
        aircon: false,
        kitchen: false,
        tv: false,
        fridge: false,
        washingMachine: false,
        furnished: false,
      },
    },
  });

  // ===== Consts & helpers =====
  const MAX_IMAGES = 10;
  const MAX_TITLE = 100;
  const MAX_DESC = 1000;

  const inputBase =
    "w-full rounded-xl p-2 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  function parseLatLngFromGoogleUrl(url) {
    if (!url) return null;
    if (/maps\.app\.goo\.gl/i.test(url)) return null;

    const s = decodeURIComponent(String(url).trim()).replace(/\u2212/g, "-");

    // 🔥 เอา !3d...!4d... มาก่อนเสมอ → พิกัดจริงของสถานที่
    let m = s.match(/!3d(-?\d+(?:\.\d+)?)[^!]*!4d(-?\d+(?:\.\d+)?)/i);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

    // ✅ fallback: !2d...!3d...
    m = s.match(/!2d(-?\d+(?:\.\d+)?)[^!]*!3d(-?\d+(?:\.\d+)?)/i);
    if (m) return { lat: parseFloat(m[2]), lng: parseFloat(m[1]) };

    // ✅ fallback: @lat,lng
    m = s.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

    // …พวก query, dir, daddr คงเดิม
    m = s.match(/[?&](?:q|ll)=(?:loc:)?(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

    m = s.match(/[?&]query=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

    m = s.match(/\/dir\/[^/]*\/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)(?:[/?]|$)/i);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

    m = s.match(/[?&](?:daddr|destination|origin)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

    return null;
  }

  // ===== Amenities helpers =====
  const setWifi = (val) =>
    setForm((f) => ({ ...f, amenities: { ...f.amenities, wifi: val } }));

  const setParking = (val) =>
    setForm((f) => ({ ...f, amenities: { ...f.amenities, parking: val } }));

  const toggleUtility = (key) => {
    setForm((f) => {
      const list = new Set(f.amenities.utilitiesIncluded);
      if (list.has(key)) list.delete(key);
      else list.add(key);
      return {
        ...f,
        amenities: { ...f.amenities, utilitiesIncluded: Array.from(list) },
      };
    });
  };

  const toggleFeature = (key) => {
    setForm((f) => ({
      ...f,
      amenities: {
        ...f.amenities,
        features: { ...f.amenities.features, [key]: !f.amenities.features[key] },
      },
    }));
  };

  const isImageOk = (file) => {
    const okType = /^image\/(png|jpe?g|webp|gif)$/i.test(file.type);
    const okSize = file.size <= 5 * 1024 * 1024; // 5MB
    return okType && okSize;
  };

  const toPreviewUrls = (files) => files.map((f) => URL.createObjectURL(f));

  // ===== Load categories =====
  useEffect(() => {
    (async () => {
      try {
        const cs = await api.get("/categories");
        setCats(cs.data || []);
      } catch (e) {
        console.error("โหลดหมวดหมู่ไม่สำเร็จ:", e);
      }
    })();
  }, []);

  // ===== Load types when category changes =====
  useEffect(() => {
    if (!form.category) {
      setTypes([]);
      setForm((f) => ({ ...f, type: "" }));
      return;
    }
    (async () => {
      try {
        const t = await api.get("/types", { params: { category: form.category } });
        setTypes(t.data || []);
      } catch (e) {
        console.error("โหลดประเภทไม่สำเร็จ:", e);
      }
    })();
  }, [form.category]);

  // ===== Manage object URLs cleanup =====
  useEffect(() => {
    // cleanup old previews on change
    return () => {
      preview.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [preview]);

  useEffect(() => {
    // cleanup on unmount
    return () => {
      preview.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  // ===== Image handlers =====
  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    const filtered = incoming.filter(isImageOk);
    if (filtered.length < incoming.length) {
      alert("ไฟล์บางส่วนไม่ใช่รูป หรือมีขนาดเกิน 5MB ระบบจึงข้ามไฟล์เหล่านั้น");
    }
    const next = [...images, ...filtered].slice(0, MAX_IMAGES);
    // revoke old previews before replacing
    preview.forEach((u) => URL.revokeObjectURL(u));
    setImages(next);
    setPreview(toPreviewUrls(next));
    // set default cover if not set
    setCoverIndex((prev) => (prev === -1 && next.length > 0 ? 0 : prev));
  };

  const onFiles = (e) => addFiles(e.target.files);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const removeImage = (idx) => {
    const ni = images.filter((_, i) => i !== idx);
    // revoke removed preview
    URL.revokeObjectURL(preview[idx]);
    const np = preview.filter((_, i) => i !== idx);
    setImages(ni);
    setPreview(np);

    setCoverIndex((prev) => {
      if (prev === -1) return -1;
      if (idx === prev) return ni.length ? 0 : -1; // ถ้าลบรูปปก → ตั้งรูปแรกเป็นปกถ้ายังมีรูป
      if (idx < prev) return prev - 1; // index ปกขยับซ้าย
      return prev;
    });
  };

  const makeCover = (idx) => setCoverIndex(idx);

  // ===== Map helpers =====
  const fillLatLngFromUrl = async () => {
    if (form.lat && form.lng) return;

    try {
      if (/maps\.app\.goo\.gl/i.test(form.googleMapUrl)) {
        // เรียก backend เพื่อขยายลิงก์
        const res = await api.get("/utils/expand-gmaps", {
          params: { url: form.googleMapUrl },
        });
        if (res.data?.lat && res.data?.lng) {
          setForm((f) => ({ ...f, lat: String(res.data.lat), lng: String(res.data.lng) }));
          return;
        }
      }

      // ใช้ parser ปกติ
      const p = parseLatLngFromGoogleUrl(form.googleMapUrl);
      if (p) setForm((f) => ({ ...f, lat: String(p.lat), lng: String(p.lng) }));
      else alert("ไม่พบพิกัดในลิงก์นี้ กรุณากรอก lat/lng เอง");
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการดึงพิกัด");
    }
  };

  // ===== Validate & Submit =====
  const validate = () => {
    const err = {};
    if (!form.title.trim()) err.title = "กรุณากรอกชื่อประกาศ";
    if (!form.category) err.category = "กรุณาเลือกหมวดหมู่";
    if (form.price && Number(form.price) < 0) err.price = "ราคาต้องมากกว่าหรือเท่ากับ 0";
    if ((form.lat && !form.lng) || (!form.lat && form.lng)) {
      err.latlng = "กรุณากรอก lat/lng ให้ครบทั้งคู่ หรือปล่อยว่างทั้งสองช่อง";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();

      // ใส่คีย์ทั่วไป (ยกเว้น amenities)
      Object.entries(form).forEach(([k, v]) => {
        if (k === "amenities") return; // ข้ามไว้ จะ append เป็น JSON ข้างล่าง
        if (v !== "" && v !== null && v !== undefined) fd.append(k, v);
      });

      // แนบ amenities เป็น JSON string (ให้ตรงกับ backend)
      fd.append("amenities", JSON.stringify(form.amenities));

      // แนบรูปภาพ
      images.forEach((f) => fd.append("images", f));

      // ส่ง index ของรูปปก (ถ้ามีรูปแต่ยังไม่ตั้ง ให้ใช้ 0)
      const safeCover = images.length ? (coverIndex >= 0 ? coverIndex : 0) : -1;
      fd.append("coverIndex", String(safeCover));

      await api.post("/properties", fd, { headers: { "Content-Type": "multipart/form-data" } });
      nav("/owner/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      alert("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  // ===== UI =====
  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm">
            <Link
              to="/owner"
              className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> กลับหน้า Owner
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            ลงประกาศใหม่
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            กรอกข้อมูลทรัพย์ อัปโหลดรูป (สูงสุด {MAX_IMAGES} รูป) และพิกัดเพื่อให้ค้นหาเจอง่ายขึ้น
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/owner/dashboard/properties"
            className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm"
          >
            ดูประกาศของฉัน
          </Link>
          <button
            onClick={submit}
            disabled={submitting}
            className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            {submitting ? "กำลังบันทึก…" : "บันทึกประกาศ"}
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* การ์ด: ข้อมูลหลัก */}
        <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">ข้อมูลหลัก</h2>

          <div className="space-y-4">
            {/* ชื่อประกาศ */}
            <div>
              <div className="flex items-center justify-between">
                <label className="mb-1 text-sm">
                  ชื่อประกาศ <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-500">{form.title.length}/{MAX_TITLE}</span>
              </div>
              <input
                className={inputBase}
                placeholder="เช่น บ้านเดี่ยว 2 ชั้น ใกล้มหาวิทยาลัย มีที่จอดรถ"
                maxLength={MAX_TITLE}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
            </div>

            {/* หมวดหมู่/ประเภท */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm">
                  หมวดหมู่ <span className="text-rose-500">*</span>
                </label>
                <select
                  className={inputBase}
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value, type: "" })}
                >
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  {cats.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block mb-1 text-sm">ประเภท</label>
                <select
                  className={inputBase}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="">-- ไม่ระบุ --</option>
                  {types.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* รายละเอียด */}
            <div>
              <div className="flex items-center justify-between">
                <label className="mb-1 text-sm">รายละเอียด</label>
                <span className="text-xs text-slate-500">
                  {form.description.length}/{MAX_DESC}
                </span>
              </div>
              <textarea
                className={`${inputBase} h-32`}
                placeholder="อธิบายจุดเด่น เฟอร์นิเจอร์ ส่วนกลาง การเดินทาง เงื่อนไขการเช่า ฯลฯ"
                maxLength={MAX_DESC}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                <Info className="h-3.5 w-3.5" />
                เขียนรายละเอียดชัด ๆ ช่วยให้ประกาศถูกค้นหาเจอง่ายขึ้น
              </div>
            </div>

            {/* ตัวเลข */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block mb-1 text-sm">ราคา (บาท/เดือน)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    className={`${inputBase} pr-14`}
                    placeholder="เช่น 12000"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    บาท/เดือน
                  </span>
                </div>
                {errors.price && <p className="text-xs text-rose-500 mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="block mb-1 text-sm">ห้องนอน</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  className={inputBase}
                  placeholder="เช่น 2"
                  value={form.bedrooms}
                  onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">ห้องน้ำ</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  className={inputBase}
                  placeholder="เช่น 2"
                  value={form.bathrooms}
                  onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">พื้นที่ (ตร.ม.)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    className={`${inputBase} pr-12`}
                    placeholder="เช่น 90"
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    ตร.ม.
                  </span>
                </div>
              </div>
            </div>

            {/* ที่อยู่ */}
            <div>
              <label className="block mb-1 text-sm">ที่อยู่</label>
              <input
                className={inputBase}
                placeholder="เช่น 99/9 ซ.สุขสันต์ ถ.บางนา เขตบางนา กทม. 10260"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            {/* แผนที่ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block mb-1 text-sm">ลิงก์ Google Map</label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                  <input
                    className={inputBase}
                    placeholder="เช่น https://maps.google.com/... (คัดลอกจากปุ่ม Share)"
                    value={form.googleMapUrl}
                    onChange={(e) =>
                      setForm({ ...form, googleMapUrl: e.target.value, lat: "", lng: "" })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-6">
                    <p className="text-xs text-slate-500 mt-1">
                      ถ้าคุณใช้ลิ้งเต็มจากเว็บไซต์แล้วไม่กรอก lat/lng ระบบจะพยายามดึงพิกัดจากลิงก์นี้ให้อัตโนมัติ
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      ถ้าใช้ลิ้งสั้นจากแอป Google Maps แนะนำให้กรอก lat/lng เอง หรือใช้ปุ่มด้านขวาเพื่อดึงพิกัด
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fillLatLngFromUrl}
                    className="text-xs px-2 py-1 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    ดึงพิกัดจากลิงก์
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm">Lat</label>
                  <input
                    className={inputBase}
                    placeholder="เช่น 13.7563"
                    value={form.lat}
                    onChange={(e) => setForm({ ...form, lat: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Lng</label>
                  <input
                    className={inputBase}
                    placeholder="เช่น 100.5018"
                    value={form.lng}
                    onChange={(e) => setForm({ ...form, lng: e.target.value })}
                  />
                </div>
                {errors.latlng && (
                  <p className="col-span-2 text-xs text-rose-500">{errors.latlng}</p>
                )}
              </div>
            </div>

            {form.lat && form.lng ? (
              <div className="mt-2 rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                <iframe
                  title="ตำแหน่งบนแผนที่"
                  className="w-full h-56"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(
                    form.lat
                  )},${encodeURIComponent(form.lng)}&z=15&output=embed`}
                />
              </div>
            ) : null}
          </div>
        </section>

        {/* การ์ด: สิ่งอำนวยความสะดวก */}
        <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            สิ่งอำนวยความสะดวก
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wi-Fi */}
            <div>
              <label className="block mb-1 text-sm">Wi-Fi</label>
              <select
                className={inputBase}
                value={form.amenities.wifi}
                onChange={(e) => setWifi(e.target.value)}
              >
                <option value="none">ไม่มี</option>
                <option value="free">ฟรี (รวมค่าเช่า)</option>
                <option value="paid">มี แต่จ่ายเพิ่ม</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">เลือกให้ชัดเจน เพื่อลดการถามตอบ</p>
            </div>

            {/* ที่จอดรถ */}
            <div>
              <label className="block mb-1 text-sm">ที่จอดรถ</label>
              <select
                className={inputBase}
                value={form.amenities.parking}
                onChange={(e) => setParking(e.target.value)}
              >
                <option value="none">ไม่มี</option>
                <option value="motorcycle">มอเตอร์ไซค์</option>
                <option value="car_and_motorcycle">รถยนต์ &amp; มอเตอร์ไซค์</option>
              </select>
            </div>
          </div>

          {/* ค่าที่รวมแล้ว */}
          <div className="mt-4">
            <label className="block mb-1 text-sm">รวมค่าใช้จ่ายแล้ว (เลือกได้หลายข้อ)</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "water", label: "ค่าน้ำ" },
                { key: "electricity", label: "ค่าไฟ" },
                { key: "wifi", label: "ค่าเน็ต (Wi-Fi)" },
                { key: "common_fee", label: "ค่าส่วนกลาง" },
              ].map((u) => (
                <button
                  type="button"
                  key={u.key}
                  onClick={() => toggleUtility(u.key)}
                  className={`px-3 py-1 rounded-xl border text-sm
                    ${
                      form.amenities.utilitiesIncluded.includes(u.key)
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* ฟีเจอร์ของห้อง */}
          <div className="mt-4">
            <label className="block mb-1 text-sm">คุณสมบัติ</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { key: "aircon", label: "แอร์" },
                { key: "kitchen", label: "ครัว" },
                { key: "tv", label: "ทีวี" },
                { key: "fridge", label: "ตู้เย็น" },
                { key: "washingMachine", label: "เครื่องซักผ้า" },
                { key: "furnished", label: "มีเฟอร์นิเจอร์" },
              ].map((f) => (
                <button
                  type="button"
                  key={f.key}
                  onClick={() => toggleFeature(f.key)}
                  className={`px-3 py-2 rounded-xl border text-sm flex items-center gap-2
                    ${
                      form.amenities.features[f.key]
                        ? "bg-amber-500 text-white border-amber-500"
                        : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                >
                  <Star className="h-4 w-4" />
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* การ์ด: รูปภาพ */}
        <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">รูปภาพ</h2>
            <span className="text-xs text-slate-500">
              {images.length}/{MAX_IMAGES} รูป
            </span>
          </div>

          <div className="space-y-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`flex flex-col items-center justify-center w-full h-36 rounded-2xl border border-dashed ${
                dragOver
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                  : "border-black/10 dark:border-white/10 bg-white dark:bg-slate-900"
              } cursor-pointer transition`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onFiles}
              />
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm">ลากรูปมาวาง หรือคลิกเพื่อเลือกไฟล์</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">รองรับ JPG, PNG, WEBP, GIF (≤ 5MB/ไฟล์)</div>
            </div>

            {!!preview.length && (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {preview.map((src, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={src}
                      alt={`รูปที่ ${i + 1}`}
                      className="w-full h-28 object-cover rounded-xl border border-black/10 dark:border-white/10"
                    />

                    {/* ลบรูป */}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition"
                      title="ลบรูปนี้"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {/* ตั้งเป็นรูปปก */}
                    <button
                      type="button"
                      onClick={() => makeCover(i)}
                      className={`absolute bottom-1 left-1 px-2 py-1 rounded-md text-[11px] inline-flex items-center gap-1 transition ${
                        i === coverIndex
                          ? "bg-amber-600 text-white"
                          : "bg-black/60 text-white opacity-0 group-hover:opacity-100"
                      }`}
                      title="ตั้งเป็นรูปปก"
                    >
                      <Star className="h-3.5 w-3.5" />
                      {i === coverIndex ? "รูปปก" : "ตั้งปก"}
                    </button>

                    {/* Badge มุมซ้ายบนเมื่อเป็นปก */}
                    {i === coverIndex && (
                      <span className="absolute top-1 left-1 px-2 py-0.5 rounded-md text-[11px] bg-amber-500 text-white shadow">
                        รูปปก
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ปุ่มบันทึกล่าง */}
        <div className="flex items-center justify-end gap-2">
          <Link
            to="/owner"
            className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            {submitting ? "กำลังบันทึก…" : "บันทึกประกาศ"}
          </button>
        </div>
      </form>
    </div>
  );
}
