export default function Footer() {
  return (
    <footer id="contact" className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-home text-white text-xl"></i>
              </div>
              <h3 className="text-2xl font-bold">chaomai.com</h3>
            </div>
            <p className="text-gray-400 mb-6">แพลตฟอร์มค้นหาที่พักที่ดีที่สุดในยะลา เพื่อตอบสนองทุกความต้องการของคุณ</p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700"><i className="fab fa-instagram"></i></a>
              <a href="#" className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700"><i className="fab fa-line"></i></a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">บริการ</h4>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#" className="hover:text-white">ค้นหาที่พัก</a></li>
              <li><a href="#" className="hover:text-white">ลงประกาศ</a></li>
              <li><a href="#" className="hover:text-white">บริการพรีเมียม</a></li>
              <li><a href="#" className="hover:text-white">ที่ปรึกษาอสังหาฯ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">ช่วยเหลือ</h4>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#" className="hover:text-white">วิธีใช้งาน</a></li>
              <li><a href="#" className="hover:text-white">คำถามที่พบบ่อย</a></li>
              <li><a href="#" className="hover:text-white">ติดต่อเรา</a></li>
              <li><a href="#" className="hover:text-white">รายงานปัญหา</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6">ติดต่อเรา</h4>
            <div className="space-y-3 text-gray-400">
              <p className="flex items-center"><i className="fas fa-phone mr-3"></i> 073-123-456</p>
              <p className="flex items-center"><i className="fas fa-envelope mr-3"></i> info@chaomai.com</p>
              <p className="flex items-center"><i className="fas fa-map-marker-alt mr-3"></i> ยะลา ประเทศไทย</p>
            </div>
          </div>
        </div>

        <hr className="border-gray-700 my-8" />
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">© 2025 chaomai.com สงวนลิขสิทธิ์</p>
          <div className="flex space-x-6 text-gray-400">
            <a href="#" className="hover:text-white">นโยบายความเป็นส่วนตัว</a>
            <a href="#" className="hover:text-white">ข้อกำหนดการใช้งาน</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
