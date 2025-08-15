// src/components/CategoriesSection.jsx
import React from 'react'
import { Link } from 'react-router-dom'

export default function CategoriesSection({ categories = [], loading = false }) {
  const skeletons = Array.from({ length: 10 })

  return (
    <section className="py-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">ประเภทที่พัก</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">เลือกประเภทที่พักที่ตรงกับความต้องการของคุณ</p>
        </div>

        {/* จัดกลางแนวนอนด้วย justify-center และคอลัมน์กว้าง 100px */}
        <div className="grid gap-10 justify-center [grid-template-columns:repeat(auto-fit,minmax(100px,100px))]">
          {loading ? (
            skeletons.map((_, i) => (
              <div key={i} className="text-center">
                <div className="w-[100px] aspect-square rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse mx-auto" />
                <div className="h-3 w-20 bg-gray-200 dark:bg-white/10 rounded mt-2 mx-auto animate-pulse" />
                <div className="h-2 w-12 bg-gray-200 dark:bg-white/10 rounded mt-1 mx-auto animate-pulse" />
              </div>
            ))
          ) : (
            categories.map((c) => (
              <Link
                key={c.id || c._id}
                to={`/search?category=${encodeURIComponent(c.slug || c.id)}`}
                className="text-center cursor-pointer focus:outline-none group"
              >
                <div
                  className="w-[100px] aspect-square rounded-lg overflow-hidden shadow bg-center bg-cover mx-auto transform transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url('${c.icon || '/images/default.jpg'}')` }}
                />
                <h4 className="mt-1 text-gray-800 dark:text-gray-100 font-medium text-xs truncate">{c.name}</h4>
                <p className="text-gray-500 dark:text-gray-400 text-[10px]">{c.count ?? 0} รายการ</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
