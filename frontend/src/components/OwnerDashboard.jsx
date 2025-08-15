import React from 'react'
import { Link } from 'react-router-dom'

export default function OwnerDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Owner Dashboard</h1>
      <p className="text-gray-600 mt-1">สวัสดีคุณ <b>{user?.username || 'Owner'}</b></p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Link to="/owner/properties" className="p-5 border rounded-xl hover:shadow transition">
          <div className="text-xl font-semibold">ประกาศของฉัน</div>
          <p className="text-gray-500 text-sm mt-1">ดู/แก้ไขประกาศบ้านเช่าของคุณ</p>
        </Link>

        <Link to="/owner/properties/new" className="p-5 border rounded-xl hover:shadow transition">
          <div className="text-xl font-semibold">ลงประกาศใหม่</div>
          <p className="text-gray-500 text-sm mt-1">เพิ่มบ้าน/ห้องเช่าใหม่อย่างรวดเร็ว</p>
        </Link>

        <Link to="/owner/bookings" className="p-5 border rounded-xl hover:shadow transition">
          <div className="text-xl font-semibold">การจอง</div>
          <p className="text-gray-500 text-sm mt-1">ตรวจสอบคำขอ/ตารางนัดดูห้อง</p>
        </Link>

        <Link to="/owner/messages" className="p-5 border rounded-xl hover:shadow transition">
          <div className="text-xl font-semibold">ข้อความ</div>
          <p className="text-gray-500 text-sm mt-1">คุยกับผู้สนใจเช่าของคุณ</p>
        </Link>
      </div>
    </div>
  )
}
