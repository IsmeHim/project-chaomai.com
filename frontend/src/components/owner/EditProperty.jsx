// components/owner/EditProperty.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../../lib/api";
import {
  ArrowLeft, Loader2, Image as ImageIcon, Trash2, Star, MapPin, PlusCircle,
} from "lucide-react";

export default function EditProperty() {
  const { id } = useParams();
  const nav = useNavigate();
  const fileInputRef = useRef(null);

  // ====== Form ======
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
    status: "draft",
    isActive: true,
  });

  const [cats, setCats] = useState([]);
  const [types, setTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ====== Images state ======
  // รูปเดิมที่อยู่ในฐานข้อมูล
  const [oldImages, setOldImages] = useState([]); // [{filename,url,isCover,sortOrder}, ...]
  // ชื่อไฟล์รูปเดิมที่ถูก “ลบ”
  const [removedOld, setRemovedOld] = useState(new Set());
  // รูปใหม่ที่เพิ่งเลือกจากเครื่อง
  const [newImages, setNewImages] = useState([]); // Array<File>
  const [newPreview, setNewPreview] = useState([]); // URLs
  // เก็บ cover ปัจจุบันแบบ “ระบุได้ทั้งรูปเดิม/รูปใหม่”
  const [cover, setCover] = useState({ kind: "old", key: "" }); // {kind:'old'|'new', key: filename|index}

  const MAX_IMAGES = 10;
  const MAX_TITLE = 100;
  const MAX_DESC = 1000;

  // ===== Helpers =====
  const apiBase = (api?.defaults?.baseURL || "").replace(/\/+$/, "");
  const apiOrigin = apiBase.replace(/\/api(?:\/)?$/, "");
  const toPublicUrl = (u) => {
    if (!u) return "/placeholder.svg";
    if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u)) return u;
    return `${apiOrigin}${u.startsWith("/") ? u : `/${u}`}`;
  };

  const isImageOk = (file) =>
    /^image\/(png|jpe?g|webp|gif)$/i.test(file.type) && file.size <= 5 * 1024 * 1024;

  const toPreviewUrls = (files) => files.map((f) => URL.createObjectURL(f));

  const parseLatLngFromGoogleUrl = (url) => {
    if (!url) return null;
    if (/maps\.app\.goo\.gl/i.test(url)) return null;
    const s = decodeURIComponent(String(url).trim()).replace(/\u2212/g, "-");
    let m = s.match(/!3d(-?\d+(?:\.\d+)?)[^!]*!4d(-?\d+(?:\.\d+)?)/i);
    if (m) return { lat: +m[1], lng: +m[2] };
    m = s.match(/!2d(-?\d+(?:\.\d+)?)[^!]*!3d(-?\d+(?:\.\d+)?)/i);
    if (m) return { lat: +m[2], lng: +m[1] };
    m = s.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
    if (m) return { lat: +m[1], lng: +m[2] };
    m = s.match(/[?&](?:q|ll)=(?:loc:)?(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
    if (m) return { lat: +m[1], lng: +m[2] };
    m = s.match(/[?&]query=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
    if (m) return { lat: +m[1], lng: +m[2] };
    m = s.match(/\/dir\/[^/]*\/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)(?:[/?]|$)/i);
    if (m) return { lat: +m[1], lng: +m[2] };
    m = s.match(/[?&](?:daddr|destination|origin)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
    if (m) return { lat: +m[1], lng: +m[2] };
    return null;
  };

  // ===== Load initial =====
  useEffect(() => {
    let ignore = false;
    const ac = new AbortController();
    (async () => {
      try {
        // categories
        const cs = await api.get("/categories", { signal: ac.signal });
        if (!ignore) setCats(cs.data || []);

        // property
        const { data: p } = await api.get(`/owner/properties/${id}`, { signal: ac.signal });

        if (!ignore && p) {
          setForm({
            title: p.title || "",
            description: p.description || "",
            price: p.price ?? "",
            bedrooms: p.bedrooms ?? "",
            bathrooms: p.bathrooms ?? "",
            area: p.area ?? "",
            address: p.address || "",
            googleMapUrl: p.googleMapUrl || "",
            lat: p?.location?.coordinates?.[1]?.toString?.() || "", // [lng,lat]
            lng: p?.location?.coordinates?.[0]?.toString?.() || "",
            category: p?.category?._id || p?.category || "",
            type: p?.type?._id || p?.type || "",
            status: p.status || "draft",
            isActive: !!p.isActive,
          });

          const imgs = Array.isArray(p.images) ? p.images : [];
          setOldImages(imgs);

          const currentCover = imgs.find((it) => it.isCover) || imgs[0];
          setCover(currentCover ? { kind: "old", key: currentCover.filename } : { kind: "old", key: "" });
        }
      } catch (e) {
        // console.error(e);
        // ❗ ถูกยกเลิกเพราะ StrictMode/ออกจากหน้า: ไม่ต้องทำอะไร
        if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError' || e?.message === 'canceled') {
        return;
        }
        console.error('load error', e?.code, e?.message, e?.config?.baseURL, e?.config?.url);
        alert("โหลดข้อมูลไม่สำเร็จ");
        nav("/forbidden", { replace: true });
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; ac.abort(); };
  }, [id]);

  // โหลด types ตาม category
  useEffect(() => {
    let ignore = false;
    const ac = new AbortController();
    (async () => {
      if (!form.category) { setTypes([]); setForm((f) => ({ ...f, type: "" })); return; }
      try {
        const { data } = await api.get("/types", { params: { category: form.category }, signal: ac.signal });
        if (!ignore) setTypes(data || []);
      } catch (e) {
        // if (ac.signal.aborted) return;
        // มองข้ามกรณีถูกยกเลิก
        if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError' || e?.message === 'canceled') return;
        console.error("โหลดประเภทไม่สำเร็จ:", e);
        setTypes([]);
      }
    })();
    return () => { ignore = true; ac.abort(); };
  }, [form.category]);

  // cleanup new previews on unmount or change
  useEffect(() => () => newPreview.forEach((u) => URL.revokeObjectURL(u)), [newPreview]);

  // ===== Handlers =====
  const addNewFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    const ok = incoming.filter(isImageOk);
    if (ok.length < incoming.length) alert("ไฟล์บางส่วนไม่ผ่าน (ชนิดหรือขนาดเกิน 5MB) ระบบข้ามให้แล้ว");

    // จำกัดรวมรูปเดิมที่ยังไม่ถูกลบ + รูปใหม่ ไม่เกิน MAX_IMAGES
    const remainOld = oldImages.filter((it) => !removedOld.has(it.filename)).length;
    const allow = Math.max(0, MAX_IMAGES - remainOld - newImages.length);
    const next = [...newImages, ...ok.slice(0, allow)];

    // replace previews
    newPreview.forEach((u) => URL.revokeObjectURL(u));
    setNewImages(next);
    setNewPreview(toPreviewUrls(next));

    // ถ้ายังไม่มี cover ใหม้และไม่มี cover เดิม ให้ตั้งรูปใหม่รูปแรกเป็น cover
    if (!cover.key && next.length > 0) {
      setCover({ kind: "new", key: 0 }); // index 0 ของ newImages
    }
  };


//   const onFiles = (e) => addNewFiles(e.target.files); ถ้าจะใช้อันนี้ก็ได้เหมือนกันแต่ต้องแก้ที่ input ด้วย

  const removeOldImage = (filename) => {
    setRemovedOld((s) => new Set(s).add(filename));

    // ถ้ารูปที่ถูกลบเป็นรูปปก → ย้ายปกไปภาพอื่น (ลองหา old ตัวอื่นก่อน, ไม่ก็ new)
    if (cover.kind === "old" && cover.key === filename) {
      const stillOld = oldImages.filter((it) => !removedOld.has(it.filename) && it.filename !== filename);
      if (stillOld.length) setCover({ kind: "old", key: stillOld[0].filename });
      else if (newImages.length) setCover({ kind: "new", key: 0 });
      else setCover({ kind: "old", key: "" });
    }
  };

  const removeNewImage = (index) => {
    const next = newImages.filter((_, i) => i !== index);
    URL.revokeObjectURL(newPreview[index]);
    const nextPrev = newPreview.filter((_, i) => i !== index);
    setNewImages(next);
    setNewPreview(nextPrev);

    // ถ้ารูปปกเป็น new แล้วโดนลบ
    if (cover.kind === "new" && cover.key === index) {
      if (next.length) setCover({ kind: "new", key: 0 });
      else {
        const stillOld = oldImages.filter((it) => !removedOld.has(it.filename));
        setCover(stillOld.length ? { kind: "old", key: stillOld[0].filename } : { kind: "old", key: "" });
      }
    }
  };

  const makeCoverOld = (filename) => setCover({ kind: "old", key: filename });
  const makeCoverNew = (index) => setCover({ kind: "new", key: index });

  const fillLatLngFromUrl = async () => {
    if (form.lat && form.lng) return;
    try {
      if (/maps\.app\.goo\.gl/i.test(form.googleMapUrl)) {
        const res = await api.get("/utils/expand-gmaps", { params: { url: form.googleMapUrl } });
        if (res.data?.lat && res.data?.lng) {
          setForm((f) => ({ ...f, lat: String(res.data.lat), lng: String(res.data.lng) }));
          return;
        }
      }
      const p = parseLatLngFromGoogleUrl(form.googleMapUrl);
      if (p) setForm((f) => ({ ...f, lat: String(p.lat), lng: String(p.lng) }));
      else alert("ไม่พบพิกัดในลิงก์นี้ กรุณากรอก lat/lng เอง");
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการดึงพิกัด");
    }
  };

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
    if (saving) return;
    if (!validate()) return;

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) fd.append(k, v);
      });

      // ส่งรายชื่อไฟล์ที่ลบ (รูปเดิม)
      if (removedOld.size > 0) {
        fd.append("removeImages", JSON.stringify(Array.from(removedOld)));
      }

      // แนบรูปใหม่
      newImages.forEach((f) => fd.append("images", f));

      // ส่ง “คำสั่งตั้งรูปปก”
      // - ถ้าเป็นรูปเดิม → ส่ง coverFilename = <filename>
      // - ถ้าเป็นรูปใหม่ → ส่ง coverNewIndex = <index ใน batch ที่อัปโหลดครั้งนี้>
      if (cover.kind === "old" && cover.key) {
        fd.append("coverFilename", cover.key);
      } else if (cover.kind === "new" && typeof cover.key === "number" && newImages.length) {
        // index ใน batch ใหม่
        const safe = Math.max(0, Math.min(cover.key, newImages.length - 1));
        fd.append("coverNewIndex", String(safe));
      }

      await api.patch(`/properties/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      alert("บันทึกสำเร็จ");
      nav("/owner/dashboard/properties", { replace: true });
    } catch (e) {
      console.error(e);
      alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  // คำนวณรูปเดิมที่ยังไม่ถูกลบ (ไว้แสดงผล)
  const visibleOldImages = useMemo(
    () => oldImages.filter((it) => !removedOld.has(it.filename)),
    [oldImages, removedOld]
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8">
        <div className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin" /> กำลังโหลด…
        </div>
      </div>
    );
  }

  const inputBase =
    "w-full rounded-xl p-2 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40";

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/owner/dashboard/properties" className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:underline">
          <ArrowLeft className="h-4 w-4" /> กลับรายการ
        </Link>
        <button
          onClick={submit}
          disabled={saving}
          className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm inline-flex items-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
          {saving ? "กำลังบันทึก…" : "บันทึกการแก้ไข"}
        </button>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* การ์ด: ข้อมูลหลัก */}
        <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">ข้อมูลหลัก</h2>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="mb-1 text-sm">
                  ชื่อประกาศ <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-500">{form.title.length}/{MAX_TITLE}</span>
              </div>
              <input
                className={inputBase}
                maxLength={MAX_TITLE}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm">หมวดหมู่ <span className="text-rose-500">*</span></label>
                <select
                  className={inputBase}
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value, type: "" })}
                >
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm">ประเภท</label>
                <select
                  className={inputBase}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="">-- ไม่ระบุ --</option>
                  {types.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="mb-1 text-sm">รายละเอียด</label>
                <span className="text-xs text-slate-500">{form.description.length}/{MAX_DESC}</span>
              </div>
              <textarea
                className={`${inputBase} h-32`}
                maxLength={MAX_DESC}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Num label="ราคา (บาท/เดือน)" value={form.price} onChange={(v) => setForm({ ...form, price: v })} suffix="บาท/เดือน" />
              <Num label="ห้องนอน" value={form.bedrooms} onChange={(v) => setForm({ ...form, bedrooms: v })} />
              <Num label="ห้องน้ำ" value={form.bathrooms} onChange={(v) => setForm({ ...form, bathrooms: v })} />
              <Num label="พื้นที่ (ตร.ม.)" value={form.area} onChange={(v) => setForm({ ...form, area: v })} suffix="ตร.ม." step="0.1" />
            </div>

            <div>
              <label className="block mb-1 text-sm">ที่อยู่</label>
              <input className={inputBase} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            {/* Map */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block mb-1 text-sm">ลิงก์ Google Map</label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                  <input
                    className={inputBase}
                    placeholder="เช่น https://maps.google.com/..."
                    value={form.googleMapUrl}
                    onChange={(e) => setForm({ ...form, googleMapUrl: e.target.value, lat: "", lng: "" })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 mt-1">
                    ว่าง lat/lng ไว้แล้วกดปุ่ม ระบบจะพยายามดึงพิกัดจากลิงก์ให้
                  </p>
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
                  <input className={inputBase} value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Lng</label>
                  <input className={inputBase} value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
                </div>
                {errors.latlng && <p className="col-span-2 text-xs text-rose-500">{errors.latlng}</p>}
              </div>
            </div>

            {form.lat && form.lng && (
              <div className="mt-2 rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                <iframe
                  title="ตำแหน่งบนแผนที่"
                  className="w-full h-56"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(form.lat)},${encodeURIComponent(form.lng)}&z=15&output=embed`}
                />
              </div>
            )}
          </div>
        </section>

        {/* การ์ด: รูปภาพ */}
        <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">รูปภาพ</h2>
            <span className="text-xs text-slate-500">
              {(visibleOldImages.length + newImages.length)}/{MAX_IMAGES} รูป
            </span>
          </div>

          {/* รูปเดิม */}
          {!!visibleOldImages.length && (
            <>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">รูปเดิม</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                {visibleOldImages.map((img) => (
                  <div key={img.filename} className="relative group">
                    <img
                      src={toPublicUrl(img.url)}
                      alt={img.filename}
                      className="w-full h-28 object-cover rounded-xl border border-black/10 dark:border-white/10"
                    />

                    {/* ลบรูปเดิม */}
                    <button
                      type="button"
                      onClick={() => removeOldImage(img.filename)}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition"
                      title="ลบรูปนี้"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {/* ตั้งเป็นรูปปก */}
                    <button
                      type="button"
                      onClick={() => makeCoverOld(img.filename)}
                      className={`absolute bottom-1 left-1 px-2 py-1 rounded-md text-[11px] inline-flex items-center gap-1 transition ${
                        cover.kind === "old" && cover.key === img.filename
                          ? "bg-amber-600 text-white"
                          : "bg-black/60 text-white opacity-0 group-hover:opacity-100"
                      }`}
                      title="ตั้งเป็นรูปปก"
                    >
                      <Star className="h-3.5 w-3.5" />
                      {cover.kind === "old" && cover.key === img.filename ? "รูปปก" : "ตั้งปก"}
                    </button>

                    {cover.kind === "old" && cover.key === img.filename && (
                      <span className="absolute top-1 left-1 px-2 py-0.5 rounded-md text-[11px] bg-amber-500 text-white shadow">
                        รูปปก
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* อัปโหลดรูปใหม่ */}
          <div
            className="flex flex-col items-center justify-center w-full h-36 rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addNewFiles(e.dataTransfer.files); }}
          >
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => addNewFiles(e.target.files)} />
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <ImageIcon className="h-4 w-4" />
              <span className="text-sm">ลากรูปใหม่มาวาง หรือคลิกเพื่อเลือกไฟล์</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">รองรับ JPG, PNG, WEBP, GIF (≤ 5MB/ไฟล์)</div>
          </div>

          {!!newPreview.length && (
            <>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-4 mb-2">รูปใหม่</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {newPreview.map((src, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={src}
                      alt={`new-${i}`}
                      className="w-full h-28 object-cover rounded-xl border border-black/10 dark:border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition"
                      title="ลบรูปนี้"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => makeCoverNew(i)}
                      className={`absolute bottom-1 left-1 px-2 py-1 rounded-md text-[11px] inline-flex items-center gap-1 transition ${
                        cover.kind === "new" && cover.key === i
                          ? "bg-amber-600 text-white"
                          : "bg-black/60 text-white opacity-0 group-hover:opacity-100"
                      }`}
                      title="ตั้งเป็นรูปปก"
                    >
                      <Star className="h-3.5 w-3.5" />
                      {cover.kind === "new" && cover.key === i ? "รูปปก" : "ตั้งปก"}
                    </button>
                    {cover.kind === "new" && cover.key === i && (
                      <span className="absolute top-1 left-1 px-2 py-0.5 rounded-md text-[11px] bg-amber-500 text-white shadow">
                        รูปปก
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ปุ่มบันทึกล่าง */}
        <div className="flex items-center justify-end gap-2">
          <Link to="/owner/properties" className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm">
            ยกเลิก
          </Link>
          <button type="submit" disabled={saving} className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm inline-flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            {saving ? "กำลังบันทึก…" : "บันทึกการแก้ไข"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Num({ label, value, onChange, step = "1", suffix }) {
  const inputBase =
    "w-full rounded-xl p-2 bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40";
  return (
    <div>
      <label className="block mb-1 text-sm">{label}</label>
      <div className="relative">
        <input
          type="number"
          inputMode={step === "1" ? "numeric" : "decimal"}
          step={step}
          min="0"
          className={`${inputBase} ${suffix ? "pr-14" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">{suffix}</span>
        )}
      </div>
    </div>
  );
}
