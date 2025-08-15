import React from 'react'
import { Link } from 'react-router-dom'

export default function FeaturedProperties({ items = [] }) {
  return (
    <section id='Featured' className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h3 className="text-4xl font-bold text-gray-800 mb-2">ที่พักแนะนำ</h3>
            <p className="text-gray-600 text-lg">รายการที่พักยอดนิยมและมีคุณภาพ</p>
          </div>
          <Link to="/search" className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
            ดูทั้งหมด <i className="fas fa-arrow-right ml-2"></i>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {items.map((p) => (
            <Link key={p.id} to={`/property/${p.slug || p.id}`}
                  className="block bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
              <div className="relative h-40 w-full">
                <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                {p.badge && (
                  <span className={`absolute top-3 left-3 ${p.badgeColor || 'bg-green-500'} text-white px-2 py-0.5 rounded-full text-xs font-medium`}>
                    {p.badge}
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="text-blue-600 font-bold text-lg">
                  ฿{p.price.toLocaleString()} <span className="text-gray-500 text-sm">/เดือน</span>
                </div>
                <h4 className="font-semibold text-gray-800 text-sm mt-1">{p.title}</h4>
                <p className="text-gray-500 text-xs mt-1 flex items-center">
                  <i className="fas fa-map-marker-alt text-red-500 mr-1"></i> {p.location}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
