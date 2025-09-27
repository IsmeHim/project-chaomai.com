// components/admin/AdminSettings.jsx
import React, { useMemo, useState, useEffect } from "react";
import { api } from "../../lib/api"; // ✅ ใช้ axios instance ของคุณ
import { toPublicUrl } from "../../lib/url";
import { notify } from "../../lib/notify";
import {
  Settings, User, ShieldCheck, Bell, ServerCog, Save, UploadCloud, Image as ImageIcon,
  Lock, Mail, Globe, Wallet, Smartphone, AlertCircle
} from "lucide-react";

export default function AdminSettings() {
  // ===== Tabs =====
  const TABS = [
    { key: "general", label: "ทั่วไป", icon: Settings },
    { key: "account", label: "บัญชีผู้ดูแล", icon: User },
    { key: "security", label: "ความปลอดภัย", icon: ShieldCheck },
    { key: "notifications", label: "การแจ้งเตือน", icon: Bell },
    { key: "system", label: "ระบบ", icon: ServerCog },
  ];
  const [tab, setTab] = useState("general");

  // ===== Mock form states (ต่อ API ทีหลังได้) =====
  const [saving, setSaving] = useState(false);

  // General
  const [siteName, setSiteName] = useState("chaomai.com");
  const [language, setLanguage] = useState("th");
  const [currency, setCurrency] = useState("THB");
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Account
  const userLS = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const [username, setUsername] = useState(userLS?.username || "");
  const [email, setEmail] = useState(userLS?.email || "");
  const [name, setName] = useState(userLS?.name || "");
  const [phone, setPhone] = useState(userLS?.phone || "");
  const [profilePath, setProfilePath] = useState(userLS?.profile || null);

  // Avatar upload preview
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  useEffect(() => {
    if (!avatarFile) return setAvatarPreview("");
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);


  // ===== Load current admin info =====
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/admin/settings/me');
        setUsername(data.username || "");
        setEmail(data.email || "");
        setName(data.name || "");
        setPhone(data.phone || "");
        setProfilePath(data.profile || null);
        // sync localStorage.user (บางส่วน)
        localStorage.setItem("user", JSON.stringify({ ...(userLS||{}), ...data }));
      } catch (e) {
        console.error("Load settings error", e);
      }
    })();
  }, []);

  // Security
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [enable2FA, setEnable2FA] = useState(false);

  // Notifications
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);
  const [notifOwnerReq, setNotifOwnerReq] = useState(true);
  const [notifApprovals, setNotifApprovals] = useState(true);
  const [notifUsers, setNotifUsers] = useState(false);

  // System
  const [maintenance, setMaintenance] = useState(false);
  const [autoApproveOwners, setAutoApproveOwners] = useState(false);

  // ===== Handlers =====
  const handleSave = async () => {
    setSaving(true);
    try {
      // บันทึก GENERAL (ยังไม่มี API จริง → คงปลอมไว้ก่อน)
      // บันทึก ACCOUNT
      const { data } = await api.patch('/admin/settings/profile', {
        username, email, name, phone,
      });
         // sync state ทันทีจากค่าที่ server ยืนยันกลับมา
       setUsername(data.username || "");
       setEmail(data.email || "");
       setName(data.name || "");
       setPhone(data.phone || "");
      // sync LS
      localStorage.setItem("user", JSON.stringify({ ...(userLS||{}), ...data }));
      notify.ok("บันทึกข้อมูลโปรไฟล์เรียบร้อย");
    } catch (e) {
        console.error(e);
      notify.err("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) return notify.warn("กรอกข้อมูลให้ครบ");
    if (newPw.length < 6) return notify.warn("รหัสผ่านใหม่ควรยาวอย่างน้อย 6 ตัวอักษร");
    if (newPw !== confirmPw) return notify.warn("รหัสผ่านใหม่ไม่ตรงกัน");
    try {
      await api.patch('/admin/settings/password', { currentPw, newPw });
      notify.ok("เปลี่ยนรหัสผ่านสำเร็จ");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (e) {
      notify.err(e?.response?.data?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return notify.warn("กรุณาเลือกไฟล์รูปก่อน");
    try {
      const form = new FormData();
      form.append('avatar', avatarFile);
      const { data } = await api.post('/admin/settings/profile/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfilePath(data.profile || null);
      setAvatarFile(null);
      setAvatarPreview("");
      // sync LS
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...u, profile: data.profile || null }));
      notify.ok("อัปเดตรูปโปรไฟล์แล้ว");
    } catch (e) {
      notify.err(e?.response?.data?.message || "อัปโหลดรูปไม่สำเร็จ");
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await api.delete('/admin/settings/profile/avatar');
      setProfilePath(null);
      setAvatarFile(null);
      setAvatarPreview("");
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...u, profile: null }));
      notify.ok("ลบรูปโปรไฟล์แล้ว");
    } catch (e) {
      notify.err(e?.response?.data?.message || "ลบรูปไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">ตั้งค่า</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ปรับแต่งระบบ แก้ไขโปรไฟล์ และการแจ้งเตือนสำหรับผู้ดูแล
          </p>
        </div>
        <button
          onClick={handleSave}
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
      {tab === "general" && (
        <section className="grid lg:grid-cols-2 gap-6">
          <Card title="ข้อมูลทั่วไป" desc="ข้อมูลหลักของเว็บไซต์และค่าพื้นฐาน">
            <Field label="ชื่อเว็บไซต์">
              <input
                className="input"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="เช่น chaomai.com"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="ภาษา">
                <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="th">ไทย (TH)</option>
                  <option value="en">English (EN)</option>
                </select>
              </Field>
              <Field label="สกุลเงิน">
                <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="THB">THB (บาท)</option>
                  <option value="USD">USD (ดอลลาร์)</option>
                </select>
              </Field>
            </div>
            <Field label="ธีม">
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`px-3 py-2 rounded-xl border ${theme === "light"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10"
                    }`}
                >
                  โหมดสว่าง
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`px-3 py-2 rounded-xl border ${theme === "dark"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10"
                    }`}
                >
                  โหมดมืด
                </button>
              </div>
            </Field>
          </Card>

          <Card title="โลโก้ / ไอคอน" desc="อัปเดตโลโก้ที่จะใช้ในระบบ (ฝั่ง client ควบคุมการแสดงผล)">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden">
                <img
                  src="/chaomai-logo1.png"
                  alt="logo"
                  className="object-contain w-full h-full"
                />
              </div>
              <button className="btn-outline">
                <UploadCloud className="w-4 h-4" />
                อัปโหลดไฟล์
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              แนะนำ PNG/SVG ขนาด 256×256px
            </p>
          </Card>
        </section>
      )}

      {tab === "account" && (
        <section className="grid lg:grid-cols-[22rem_1fr] gap-6">
          <Card title="รูปโปรไฟล์" desc="แสดงผลในมุมขวาบนและกิจกรรมต่าง ๆ">
            <div className="grid sm:grid-cols-[7rem_1fr] items-center gap-4 sm:gap-6">
                {/* Preview */}
                <div className="w-28 h-28 rounded-2xl bg-gray-100 dark:bg-white/10 ring-1 ring-gray-200 dark:ring-white/10 overflow-hidden flex items-center justify-center">
                {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar preview" className="w-full h-full object-cover" />
                ) : profilePath ? (
                    <img src={toPublicUrl(profilePath)} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                    <Image as={ImageIcon} />
                )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <label className="btn-outline cursor-pointer">
                    <UploadCloud className="w-4 h-4" />
                    เปลี่ยนรูป
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    />
                    </label>

                    <button
                    onClick={handleUploadAvatar}
                    disabled={!avatarFile}
                    className="btn-primary disabled:opacity-60"
                    title={!avatarFile ? "ยังไม่ได้เลือกไฟล์" : "อัปโหลดรูป"}
                    >
                    อัปโหลด
                    </button>

                    {profilePath && (
                    <button
                        onClick={handleDeleteAvatar}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50
                                dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                        ลบรูป
                    </button>
                    )}
                </div>

                {/* filename + hint */}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {avatarFile ? (
                        <span>ไฟล์ที่เลือก: <span className="font-medium">{avatarFile.name}</span></span>
                        ) : (
                        <span>รองรับ PNG/JPG/WEBP ≤ 5MB, สัดส่วน 1:1 แนะนำ 512×512px</span>
                        )}
                    </div>
                    </div>
                </div>
            </Card>


          <Card title="ข้อมูลบัญชี" desc="เปลี่ยนชื่อผู้ใช้และอีเมล">
            <div className="grid sm:grid-cols-2 gap-4">
                <Field label="ชื่อ - นามสกุล">
                    <input className="input" placeholder="เช่น Abdulr Jiteh" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
              <Field label="ชื่อผู้ใช้">
                <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
              </Field>
              <Field label="อีเมล">
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
                <Field label="เบอร์โทร">
                    <input className="input" placeholder="08x-xxx-xxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
            </div>
            <div className="pt-2">
              <button className="btn-primary" onClick={handleSave}>
                <Save className="w-4 h-4" />
                บันทึกโปรไฟล์
              </button>
            </div>
          </Card>
        </section>
      )}

      {tab === "security" && (
        <section className="grid lg:grid-cols-2 gap-6">
          <Card title="เปลี่ยนรหัสผ่าน" desc="เพื่อความปลอดภัย แนะนำให้เปลี่ยนรหัสผ่านสม่ำเสมอ">
                <div className="space-y-3">
                    <Field label="รหัสผ่านปัจจุบัน">
                        <input className="input" type="password" placeholder="••••••••" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="รหัสผ่านใหม่ (≥ 6 ตัว)">
                            <input className="input" type="password" placeholder="••••••••" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                        </Field>
                        <Field label="ยืนยันรหัสผ่านใหม่">
                            <input className="input" type="password" placeholder="••••••••" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                        </Field>
                    </div>
                </div>
            <div className="pt-2">
              <button onClick={handleChangePassword} className="btn-primary">
                <Lock className="w-4 h-4" />
                เปลี่ยนรหัสผ่าน
              </button>
            </div>
          </Card>

          <Card title="การยืนยันตัวตนสองชั้น (2FA)" desc="เพิ่มชั้นความปลอดภัยให้บัญชีผู้ดูแล">
            <Toggle
              label="เปิดใช้ 2FA"
              checked={enable2FA}
              onChange={setEnable2FA}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              เมื่อเปิดใช้งาน ระบบจะขอรหัสจากแอป Authenticator ทุกครั้งที่เข้าสู่ระบบ
            </p>
          </Card>
        </section>
      )}

      {tab === "notifications" && (
        <section className="grid lg:grid-cols-2 gap-6">
          <Card title="ช่องทางการแจ้งเตือน" desc="เลือกวิธีรับการแจ้งเตือน">
            <Toggle label="อีเมล" checked={notifEmail} onChange={setNotifEmail} />
            <Toggle label="Push Notification" checked={notifPush} onChange={setNotifPush} />
          </Card>

          <Card title="เหตุการณ์ที่ต้องการเตือน" desc="เลือกเหตุการณ์ที่จะให้แจ้งเตือน">
            <Toggle label="คำขอเป็นเจ้าของ (Become Owner)" checked={notifOwnerReq} onChange={setNotifOwnerReq} />
            <Toggle label="คำขอรออนุมัติ (Approvals)" checked={notifApprovals} onChange={setNotifApprovals} />
            <Toggle label="ผู้ใช้งานใหม่" checked={notifUsers} onChange={setNotifUsers} />
          </Card>
        </section>
      )}

      {tab === "system" && (
        <section className="grid lg:grid-cols-2 gap-6">
          <Card title="สถานะระบบ" desc="ตั้งค่าโหมดดูแลรักษาและนโยบาย">
            <Toggle label="โหมดปิดปรับปรุง (Maintenance Mode)" checked={maintenance} onChange={setMaintenance} />
            <Toggle label="อนุมัติเจ้าของอัตโนมัติ" checked={autoApproveOwners} onChange={setAutoApproveOwners} />
          </Card>

          <Card title="การจัดการ" desc="คำสั่งช่วยเหลือแอดมิน (ฝั่ง client)">
            <div className="flex flex-wrap gap-2">
              <button
                className="btn-outline"
                onClick={() => {
                  localStorage.clear();
                  notify.ok("ล้างข้อมูลแคชในเบราว์เซอร์แล้ว");
                }}
              >
                ล้างแคชฝั่งเบราว์เซอร์
              </button>
              <button className="btn-outline" onClick={() => window.location.reload()}>
                รีโหลดระบบ
              </button>
            </div>
          </Card>
        </section>
      )}
    </div>
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

