export default function WhyChooseUs() {
  const items = [
    { icon: 'fa-search',   title: 'ค้นหาง่าย',   desc: 'ระบบค้นหาที่ทันสมัยและใช้งานง่าย พบที่พักในฝันได้ในไม่กี่คลิก', color: 'from-blue-500 to-purple-600' },
    { icon: 'fa-shield-alt', title: 'ปลอดภัย',  desc: 'ข้อมูลทั้งหมดได้รับการตรวจสอบ ให้ความมั่นใจในทุกการเช่า', color: 'from-green-500 to-blue-600' },
    { icon: 'fa-clock',    title: 'ตลอด 24 ชั่วโมง', desc: 'บริการตลอด 24 ชั่วโมง พร้อมช่วยเหลือคุณทุกเวลา', color: 'from-purple-500 to-pink-600' },
    { icon: 'fa-heart',    title: 'ใส่ใจลูกค้า', desc: 'ทีมงานมืออาชีพพร้อมให้คำแนะนำและช่วยเหลือในทุกขั้นตอน', color: 'from-orange-500 to-red-600' },
  ]
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-4xl font-bold text-gray-800 mb-4">ทำไมต้องเลือก chaomai.com</h3>
          <p className="text-gray-600 text-lg">เราคือแพลตฟอร์มที่ดีที่สุดสำหรับการหาที่พักในยะลา</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((it) => (
            <div key={it.title} className="text-center p-6">
              <div className={`w-20 h-20 bg-gradient-to-r ${it.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <i className={`fas ${it.icon} text-white text-3xl`}></i>
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-4">{it.title}</h4>
              <p className="text-gray-600">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
