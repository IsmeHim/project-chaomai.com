// src/pages/OwnerProfile.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import Footer from '../components/Footer';
import { BadgeCheck, MapPin, Phone, Home, BedDouble, Bath, Ruler, Star, Building2 } from 'lucide-react';

export default function OwnerProfile() {
  const { slug } = useParams();
  const [sp, setSp] = useSearchParams();
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
  const pageSize = Math.max(1, parseInt(sp.get('pageSize') || '24', 10));
  const sort = sp.get('sort') || '-createdAt';

  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState({ items: [], total: 0 });

  // const toLineUrl = (id = '') =>
  //   id ? `https://line.me/R/ti/p/~${encodeURIComponent(String(id).replace(/^@/, ''))}` : '';

  const toPublicUrl = (u) => {
    if (!u) return '/placeholder.svg';
    if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u)) return u;
    try {
      const base = (api?.defaults?.baseURL || '').replace(/\/+$/, '');
      const origin = base.replace(/\/api(?:\/)?$/, '');
      return `${origin}${u.startsWith('/') ? u : `/${u}`}`;
    } catch { return u; }
  };

  // โหลดโปรไฟล์ก่อน แล้วค่อยโหลด listings (กันกรณี listings ล้ม)
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: prof } = await api.get(`/public/owners/${slug}`);
      setOwner(prof);
      try {
        const { data: lst } = await api.get(`/public/owners/${slug}/listings`, { params: { page, pageSize, sort } });
        setListings(lst);
      } catch (e) {
        console.error('load listings error', e);
        setListings({ items: [], total: 0, page, pageSize });
      }
    } catch (e) {
      console.error('load profile error', e);
      setOwner(null);
    } finally {
      setLoading(false);
    }
  }, [slug, page, pageSize, sort]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-gray-600">กำลังโหลด…</div>
      </div>
    );
  }
  if (!owner) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="rounded-xl border border-black/10 bg-white px-6 py-5">
          ไม่พบเจ้าของ
          <div className="mt-3 text-right">
            <Link to="/" className="text-sm text-blue-600 hover:underline">กลับหน้าแรก</Link>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(listings.total / pageSize));
  const goPage = (p) => setSp({ page: String(p), pageSize: String(pageSize), sort });

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header card */}
        <section className="rounded-2xl bg-white border border-black/10 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <img
              src={
                owner.profile
                  ? toPublicUrl(owner.profile)
                  : `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(owner.username || owner.name || 'owner')}`
              }
              alt={owner.name}
              className="w-24 h-24 rounded-full object-cover border"
            />

            <div className="flex-1">
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-2xl font-extrabold text-gray-900">{owner.name}</h1>
                {owner.verified && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-xs font-semibold">
                    <BadgeCheck size={14} /> ยืนยันแล้ว
                  </span>
                )}
              </div>

              <div className="mt-1 text-sm text-gray-600">
                @{owner.username} · เข้าร่วมเมื่อ {new Date(owner.joinedAt).toLocaleDateString('th-TH')}
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                {owner.company && <InfoRow icon={Building2} label="บริษัท/ร้าน" value={owner.company} />}
                {owner.address && <InfoRow icon={MapPin} label="ที่อยู่" value={owner.address} />}
                <InfoRow icon={Star} label="จำนวนประกาศ" value={`${owner.listings} รายการ`} />
              </div>

              {owner.about && (
                <p className="mt-4 text-gray-700 leading-relaxed">{owner.about}</p>
              )}

              {/* quick actions */}
              {/* <div className="mt-4 flex flex-wrap gap-2">
                {owner.phone && (
                  <a href={`tel:${owner.phone}`} className="px-3 py-2 rounded-xl bg-gray-900 text-white hover:bg-black text-sm inline-flex items-center gap-2">
                    <Phone size={16}/> โทร: {owner.phone}
                  </a>
                )}
                {owner.lineId && (
                  <a href={toLineUrl(owner.lineId)} target="_blank" rel="noreferrer"
                     className="px-3 py-2 rounded-xl border border-black/10 hover:bg-black/5 text-sm">
                    LINE: {owner.lineId}
                  </a>
                )}
                {owner.facebookUrl && (
                  <a href={owner.facebookUrl} target="_blank" rel="noreferrer"
                     className="px-3 py-2 rounded-xl border border-black/10 hover:bg-black/5 text-sm">
                    Facebook
                  </a>
                )}
              </div> */}
            </div>
          </div>
        </section>

        {/* Contact & Links card */}
        

        {/* Listings */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900">ประกาศทั้งหมดของ {owner.name}</h2>
            <div className="text-sm text-gray-600">ทั้งหมด {listings.total} รายการ</div>
          </div>

          {listings.items.length === 0 ? (
            <div className="rounded-xl border border-black/10 bg-white p-6 text-center text-gray-600">
              ยังไม่มีประกาศ
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.items.map((p) => <PropertyCard key={p._id} p={p} toPublicUrl={toPublicUrl} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                className="px-3 py-1.5 rounded-lg border border-black/10 text-sm disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
              >ก่อนหน้า</button>
              <div className="px-3 py-1.5 text-sm">หน้า {page}/{totalPages}</div>
              <button
                className="px-3 py-1.5 rounded-lg border border-black/10 text-sm disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => goPage(page + 1)}
              >ถัดไป</button>
            </div>
          )}
        </section>
      </div>
      <div className="h-10" />
      <Footer />
    </div>
  );
}

// Sub-components

// eslint-disable-next-line no-unused-vars
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 text-gray-700">
      <Icon size={16} className="shrink-0" />
      <span className="text-gray-500">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function PropertyCard({ p, toPublicUrl }) {
  const cover = useMemo(() => {
    const im = Array.isArray(p.images) ? (p.images.find(i => i.isCover) || p.images[0]) : null;
    return im ? toPublicUrl(im.url) : '/placeholder.svg';
  }, [p, toPublicUrl]);
  const typeName = p?.type?.name || '-';
  const catName  = p?.category?.name || '-';
  return (
    <Link to={`/properties/${p._id}`} className="group rounded-2xl overflow-hidden border border-black/10 bg-white shadow-sm hover:shadow transition">
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
      </div>
    </Link>
  );
}
