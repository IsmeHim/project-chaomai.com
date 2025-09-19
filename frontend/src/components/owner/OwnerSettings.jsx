// components/owner/OwnerSettings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { toPublicUrl } from "../../lib/url";
import { notify } from "../../lib/notify";
import {
  Save, UploadCloud, Image as ImageIcon, Lock, Bell, User, Link as LinkIcon,
  ShieldCheck, Wallet, Mail, Phone, Trash2
} from "lucide-react";

export default function OwnerSettings() {
  // ===== Tabs =====
  const TABS = [
    { key: "profile", label: "โปรไฟล์", icon: User },
    { key: "contact", label: "ติดต่อ/โซเชียล", icon: LinkIcon },
    { key: "security", label: "ความปลอดภัย", icon: ShieldCheck },
    { key: "notifications", label: "การแจ้งเตือน", icon: Bell },
    { key: "payout", label: "การรับเงิน", icon: Wallet },
  ];
  const [tab, setTab] = useState("profile");

  // ===== Owner (โหลดจาก API + sync localStorage) =====
  const userLS = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const [username, setUsername] = useState(userLS?.username || "");
  const [email, setEmail] = useState(userLS?.email || "");
  const [name, setName] = useState(userLS?.name || "");
  const [phone, setPhone] = useState(userLS?.phone || "");
  const [profilePath, setProfilePath] = useState(userLS?.profile || null);
  const [about, setAbout] = useState(userLS?.about || "");
  const [facebookUrl, setFacebookUrl] = useState(userLS?.facebookUrl || "");
  const [lineId, setLineId] = useState(userLS?.lineId || "");
  const [address, setAddress] = useState(userLS?.address || "");
  const [company, setCompany] = useState(userLS?.company || "");
  const [saving, setSaving] = useState(false);

  // avatar preview
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarBroken, setAvatarBroken] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // ดึงข้อมูลปัจจุบันของ owner
        const { data } = await api.get("/owner/settings/me");
        setUsername(data.username || "");
        setEmail(data.email || "");
        setName(data.name || "");
        setPhone(data.phone || "");
        setProfilePath(data.profile || null);
        setAbout(data.about || "");
        setFacebookUrl(data.facebookUrl || "");
        setLineId(data.lineId || "");
        setAddress(data.address || "");
        setCompany(data.company || "");
        // sync LS บางส่วน
        localStorage.setItem("user", JSON.stringify({ ...(userLS || {}), ...data }));
      } catch (e) {
        console.error("Load owner settings error", e);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!avatarFile) { setAvatarPreview(""); return; }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  // ===== Handlers =====
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch("/owner/settings/profile", {
        username, email, name, phone, about, facebookUrl, lineId, address, company,
      });
      // sync state จาก server
      setUsername(data.username || "");
      setEmail(data.email || "");
      setName(data.name || "");
      setPhone(data.phone || "");
      setAbout(data.about || "");
      setFacebookUrl(data.facebookUrl || "");
      setLineId(data.lineId || "");
      setAddress(data.address || "");
      setCompany(data.company || "");
      // sync LS
      localStorage.setItem("user", JSON.stringify({ ...(userLS || {}), ...data }));
      window.dispatchEvent(new Event("user-updated"));
      notify.ok("บันทึกโปรไฟล์เรียบร้อย");
    } catch (e) {
      console.error(e);
      notify.err(e?.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return notify.info("กรุณาเลือกรูปก่อน");
    try {
      const form = new FormData();
      form.append("avatar", avatarFile);
      const { data } = await api.post("/owner/settings/profile/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfilePath(data.profile || null);
      setAvatarFile(null);
      setAvatarPreview("");
      setAvatarBroken(false);
      // sync LS
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...u, profile: data.profile || null }));
      window.dispatchEvent(new Event("user-updated"));
      notify.ok("อัปเดตรูปโปรไฟล์แล้ว");
    } catch (e) {
      console.error(e);
      notify.err(e?.response?.data?.message || "อัปโหลดรูปไม่สำเร็จ");
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm("ลบรูปโปรไฟล์ตอนนี้?")) return;
    try {
      await api.delete("/owner/settings/profile/avatar");
      setProfilePath(null);
      setAvatarFile(null);
      setAvatarPreview("");
      setAvatarBroken(false);
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...u, profile: null }));
      window.dispatchEvent(new Event("user-updated"));
      notify.ok("ลบรูปโปรไฟล์แล้ว");
    } catch (e) {
      console.error(e);
      notify.err(e?.response?.data?.message || "ลบรูปไม่สำเร็จ");
    }
  };

  // Security
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) return notify.warn("กรอกข้อมูลให้ครบ");
    if (newPw.length < 6) return notify.warn("รหัสผ่านใหม่ควรยาวอย่างน้อย 6 ตัวอักษร");
    if (newPw !== confirmPw) return notify.warn("รหัสผ่านใหม่ไม่ตรงกัน");
    try {
      await api.patch("/owner/settings/password", { currentPw, newPw });
      notify.ok("เปลี่ยนรหัสผ่านสำเร็จ");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (e) {
      notify.err(e?.response?.data?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    }
  };

  // Notifications (client-only demo)
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifProperty, setNotifProperty] = useState(true);
  const [notifApprovals, setNotifApprovals] = useState(true);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">ตั้งค่า (Owner)</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ปรับแต่งโปรไฟล์ การติดต่อ ความปลอดภัย และการแจ้งเตือนของคุณ
          </p>
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10
                     bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "กำลังบันทึก..." : "บันทึกทั้งหมด"}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm border
              ${tab === key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {tab === "profile" && (
        <section className="grid lg:grid-cols-[22rem_1fr] gap-6">
          <Card title="รูปโปรไฟล์" desc="แสดงในมุมขวาบนและหน้าสาธารณะของคุณ">
            <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Avatar Preview + Hover Overlay */}
                <div className="relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden ring-1 ring-gray-200 dark:ring-white/10 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/0 shadow-sm grid place-items-center">
                    {avatarPreview ? (
                    <img src={avatarPreview} className="object-cover w-full h-full" alt="preview" />
                    ) : profilePath && !avatarBroken ? (
                    <img
                        src={toPublicUrl(profilePath)}
                        alt="avatar"
                        className="object-cover w-full h-full"
                        onError={() => setAvatarBroken(true)}
                    />
                    ) : (
                    <ImageIcon className="w-10 h-10 text-gray-400" />
                    )}
                </div>

                {/* Hover mask to hint change */}
                <label
                    className="absolute inset-0 cursor-pointer rounded-2xl bg-black/0 hover:bg-black/30 transition grid place-items-center"
                    title="เปลี่ยนรูป"
                >
                    <div className="opacity-0 hover:opacity-100 transition text-white text-xs px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm inline-flex items-center gap-2">
                    <UploadCloud className="w-4 h-4" />
                    เปลี่ยนรูป
                    </div>
                    <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    />
                </label>

                {/* Small badge when selected new file */}
                {!!avatarPreview && (
                    <span className="absolute -top-2 -right-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white shadow">
                    ใหม่
                    </span>
                )}
                </div>

                {/* Actions & Dropzone */}
                <div className="flex-1 w-full">
                {/* Drag & drop area */}
                <label
                    htmlFor="avatar-input"
                    className="group block w-full rounded-xl border border-dashed border-gray-300 dark:border-white/15 p-3 sm:p-4 cursor-pointer hover:border-blue-400/60 hover:bg-blue-50/50 dark:hover:bg-white/5 transition"
                >
                    <div className="flex items-center gap-3">
                    <div className="shrink-0 rounded-lg p-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10">
                        <UploadCloud className="w-5 h-5 text-gray-600 dark:text-gray-200" />
                    </div>
                    <div className="text-sm">
                        <div className="font-medium text-gray-800 dark:text-gray-100">
                        ลากไฟล์มาวาง หรือคลิกเพื่อเลือก
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                        รองรับ JPG/PNG (แนะนำ ≤ 5MB). ระบบจะแสดงตัวอย่างก่อนอัปโหลด
                        </div>
                    </div>
                    </div>
                    <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    />
                </label>

                {/* Filename hint */}
                {avatarFile && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                    ไฟล์ที่เลือก: <span className="font-medium">{avatarFile.name}</span>
                    </div>
                )}

                {/* Buttons */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                    onClick={handleUploadAvatar}
                    className="btn-primary disabled:opacity-60"
                    disabled={!avatarFile}
                    title={!avatarFile ? "เลือกรูปก่อนจึงอัปโหลด" : "อัปโหลดรูปโปรไฟล์"}
                    >
                    <UploadCloud className="w-4 h-4" />
                    อัปโหลด
                    </button>

                    {!!avatarPreview && (
                    <button
                        onClick={() => { setAvatarFile(null); setAvatarPreview(""); }}
                        className="btn-outline"
                        title="ยกเลิกไฟล์ที่เลือก"
                    >
                        ยกเลิกการเลือก
                    </button>
                    )}

                    {profilePath && (
                    <button
                        onClick={handleDeleteAvatar}
                        className="btn-outline text-rose-600 border-rose-200 dark:border-rose-900/40"
                        title="ลบรูปโปรไฟล์ปัจจุบัน"
                    >
                        <Trash2 className="w-4 h-4" />
                        ลบรูป
                    </button>
                    )}
                </div>
                </div>
            </div>
         </Card>


          <Card title="ข้อมูลโปรไฟล์" desc="ชื่อ อีเมล เบอร์ และคำอธิบายสั้น ๆ">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="ชื่อ - นามสกุล">
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น สมหญิง ใจดี" />
              </Field>
              <Field label="ชื่อผู้ใช้ (username)">
                <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
              </Field>
              <Field label="อีเมล">
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="เบอร์โทร">
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" />
              </Field>
            </div>
            <Field label="เกี่ยวกับฉัน">
              <textarea className="input min-h-[96px]" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="เล่าเกี่ยวกับตัวคุณสั้น ๆ" />
            </Field>
            <div className="pt-2">
              <button className="btn-primary" onClick={handleSaveProfile}>
                <Save className="w-4 h-4" /> บันทึกโปรไฟล์
              </button>
            </div>
          </Card>
        </section>
      )}

      {tab === "contact" && (
        <section className="grid lg:grid-cols-2 gap-6">
          <Card title="ช่องทางการติดต่อ" desc="ข้อมูลเหล่านี้จะช่วยให้ผู้เช่าติดต่อคุณได้ง่ายขึ้น">
            <Field label="อีเมล">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </Field>
            <Field label="เบอร์โทร">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" />
              </div>
            </Field>
            <Field label="ที่อยู่">
              <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ที่อยู่/โครงการ" />
            </Field>
            <Field label="บริษัท (ถ้ามี)">
              <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="ชื่อบริษัท/ทีม" />
            </Field>
          </Card>

          <Card title="โซเชียล" desc="ลิงก์ไปยังช่องทางโซเชียลของคุณ">
            <Field label="Facebook URL">
              <input className="input" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/yourpage" />
            </Field>
            <Field label="LINE ID">
              <input className="input" value={lineId} onChange={(e) => setLineId(e.target.value)} placeholder="@yourline หรือ line id" />
            </Field>
            <div className="pt-2">
              <button className="btn-primary" onClick={handleSaveProfile}>
                <Save className="w-4 h-4" /> บันทึกการติดต่อ/โซเชียล
              </button>
            </div>
          </Card>
        </section>
      )}

      {tab === "security" && (
        <section className="grid lg:grid-cols-2 gap-6">
          <Card title="เปลี่ยนรหัสผ่าน" desc="เพื่อความปลอดภัย ควรเปลี่ยนรหัสผ่านเป็นระยะ">
            <div className="space-y-3">
              <Field label="รหัสผ่านปัจจุบัน">
                <input className="input" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="รหัสผ่านใหม่ (≥ 6 ตัว)">
                  <input className="input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" />
                </Field>
                <Field label="ยืนยันรหัสผ่านใหม่">
                  <input className="input" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" />
                </Field>
              </div>
            </div>
            <div className="pt-2">
              <button onClick={handleChangePassword} className="btn-primary">
                <Lock className="w-4 h-4" /> เปลี่ยนรหัสผ่าน
              </button>
            </div>
          </Card>

          <Card title="2FA (เร็ว ๆ นี้)" desc="กำลังพัฒนา: เปิดยืนยันตัวตนสองชั้น">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              ฟีเจอร์นี้จะพร้อมใช้งานเร็ว ๆ นี้
            </div>
          </Card>
        </section>
      )}

      {tab === "notifications" && (
        <section className="grid lg:grid-cols-2 gap-6">
          <Card title="การแจ้งเตือน" desc="เลือกเหตุการณ์ที่ต้องแจ้งให้คุณทราบ">
            <Toggle label="อีเมลแจ้งเตือน" checked={notifEmail} onChange={setNotifEmail} />
            <Toggle label="มีผู้สนใจ/จองบ้าน" checked={notifProperty} onChange={setNotifProperty} />
            <Toggle label="ผลการอนุมัติประกาศ" checked={notifApprovals} onChange={setNotifApprovals} />
            <div className="pt-2">
              <button className="btn-primary" onClick={() => alert("บันทึกการแจ้งเตือน (ตัวอย่าง)")}>
                <Bell className="w-4 h-4" /> บันทึก
              </button>
            </div>
          </Card>

          <Card title="รูปแบบการรับแจ้งเตือน" desc="(กำลังพัฒนา) Push/Line Notify">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              จะสามารถเชื่อมต่อ Line Notify / Push ได้ในอนาคต
            </div>
          </Card>
        </section>
      )}

      {tab === "payout" && (
        <section className="grid lg:grid-cols-2 gap-6">
          <Card title="บัญชีรับเงิน" desc="ข้อมูลการโอน/วอลเล็ตของคุณ (กำลังพัฒนา)">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              เร็ว ๆ นี้คุณจะสามารถเพิ่มบัญชีธนาคาร/วอลเล็ตเพื่อรับรายได้จากระบบได้โดยตรง
            </div>
          </Card>
          <Card title="สถานะเอกสาร" desc="KYC/ยืนยันตัวตนสำหรับการรับเงิน (กำลังพัฒนา)">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              ส่วนนี้จะโชว์สถานะยืนยันตัวตนและเอกสารที่ต้องการ
            </div>
          </Card>
        </section>
      )}
    </section>
  );
}

/* ------------ Small UI helpers (Card/Field/Toggle/Buttons/Inputs) ------------ */
function Card({ title, desc, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {desc && <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{label}</span>
      {children}
    </label>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition
          ${checked ? "bg-blue-600" : "bg-gray-300 dark:bg-white/10"}`}
        aria-pressed={checked}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition
            ${checked ? "translate-x-5" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}

/* Tailwind shortcuts (ถ้ายังไม่มี ใน global.css ใส่สไตล์พวกนี้ก็ได้)
.input { @apply w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500; }
.btn-primary { @apply inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700; }
.btn-outline { @apply inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5; }
*/
