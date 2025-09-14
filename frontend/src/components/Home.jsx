import React, { useEffect, useMemo, useState } from 'react'
import Hero from './Hero'
import CategoriesSection from './CategoriesSection'
import FeaturedProperties from './FeaturedProperties'
import WhyChooseUs from './WhyChooseUs'
import Footer from './Footer'
import { api } from '../lib/api'

// ช่วยให้ URL รูปจาก backend ทำงานได้ทั้ง dev/prod
function toPublicUrl(u) {
  if (!u) return '/placeholder.svg'
  if (/^(https?:)?\/\//i.test(u) || /^data:/i.test(u)) return u
  try {
    const base = (api?.defaults?.baseURL || '').replace(/\/+$/, '')
    const origin = base.replace(/\/api(?:\/)?$/, '')
    return `${origin}${u.startsWith('/') ? u : `/${u}`}`
  } catch {
    return u
  }
}

export default function Home() {
  // ===== categories (คงไว้ตามเดิม) =====
  const [cats, setCats] = useState([])
  const [catsLoading, setCatsLoading] = useState(true)

  // ===== featured properties (ของจริงจาก API) =====
  const [items, setItems] = useState([])
  const [propLoading, setPropLoading] = useState(true)
  const [propError, setPropError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setCatsLoading(true)
        const [cRes, tRes] = await Promise.all([
          api.get('/categories'),
          api.get('/types'),
        ])

        const typeCounts = (tRes.data || []).reduce((acc, t) => {
          const catId = t.category?._id || t.category
          acc[catId] = (acc[catId] || 0) + 1
          return acc
        }, {})
        const list = (cRes.data || []).map(c => ({
          id: c._id,
          name: c.name,
          icon: c.icon,
          slug: c.slug,
          count: typeCounts[c._id] || 0,
        }))
        if (alive) setCats(list)
      } finally {
        if (alive) setCatsLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setPropError('')
        setPropLoading(true)

        const { data } = await api.get('/properties')

        // ✅ รองรับทั้ง response แบบเก่า (array) และแบบใหม่ ({items,total,...})
        const list = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : []

        // ...ใน Home.jsx ตอน map แต่ละ property
        const mapped = list.map(p => {
          const imgs = Array.isArray(p.images) ? p.images : [];
          const cover = imgs.find(im => im.isCover) || imgs[0];
          const image = toPublicUrl(cover?.url);

          return {
            id: p._id,
            slug: p.slug,
            title: p.title,
            price: Number(p.price || 0),
            location: p.address || '-',
            image,
            badge: p.approvalStatus === 'approved' ? 'แนะนำ' : undefined,
            badgeColor: 'bg-emerald-600',
            // ✅ เพิ่ม 3 ฟิลด์นี้
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            area: p.area,
          };
        });

        if (alive) setItems(mapped)
      } catch (e) {
        if (alive) setPropError(e?.response?.data?.message || 'โหลดรายการที่พักไม่สำเร็จ')
      } finally {
        if (alive) setPropLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])


  const featured = useMemo(() => items.slice(0, 12), [items])

  return (
    <>
      <Hero />
      <CategoriesSection categories={cats} loading={catsLoading} />
      <FeaturedProperties
        items={featured}
        loading={propLoading}
        error={propError}
      />
      <WhyChooseUs />
      <Footer />
    </>
  )
}
