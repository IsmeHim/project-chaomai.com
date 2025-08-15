import React from 'react'
import Hero from './Hero'
import CategoriesSection from './CategoriesSection'
import FeaturedProperties from './FeaturedProperties'
import WhyChooseUs from './WhyChooseUs'
import Footer from './Footer'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Home() {
  // ตัวอย่าง mock data (ภายหลังดึงจาก API ได้)
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        // ดึงทั้งหมวดหมู่และประเภทมาในครั้งเดียว
        const [cRes, tRes] = await Promise.all([
          api.get('/categories'),
          api.get('/types'),
        ])

        // นับจำนวนประเภทในแต่ละหมวด (ถ้าอยากโชว์ count)
        const typeCounts = (tRes.data || []).reduce((acc, t) => {
          const catId = t.category?._id || t.category
          acc[catId] = (acc[catId] || 0) + 1
          return acc
        }, {})

        // map เป็นรูปแบบที่ CategoriesSection ใช้
        const list = (cRes.data || []).map(c => ({
          id: c._id,
          name: c.name,
          icon: c.icon,
          slug: c.slug,
          count: typeCounts[c._id] || 0,
        }))

        if (alive) setCats(list)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const featured = [
    { id: 1, title: 'บ้านเช่า 2 ห้องนอน', price: 8500, location: 'ตำบลสะเตง อำเภอเมืองยะลา', image: 'https://images.unsplash.com/photo-1722859031301-3db9619b0ebb?q=80&w=600&auto=format', badge: 'แนะนำ' },
    { id: 2, title: 'หอพักสำหรับนักศึกษา', price: 3200, location: 'ใกล้มหาวิทยาลัยยะลา', image: 'https://images.unsplash.com/photo-1754597302822-4b96f3442d3f?q=80&w=600&auto=format' },
    { id: 3, title: 'คอนโดหรู ใจกลางเมือง', price: 15000, location: 'ตำบลสะเตง อำเภอเมืองยะลา', image: 'https://via.placeholder.com/600x400', badge: 'ใหม่', badgeColor: 'bg-red-500' },
    // เติมให้ครบ 6 การ์ดตาม grid ถ้าต้องการ
  ]

  return (
    <>
      <Hero />
      <CategoriesSection categories={cats} loading={loading}  />
      <FeaturedProperties items={featured} />
      <WhyChooseUs />
      <Footer />
    </>
  )
}
