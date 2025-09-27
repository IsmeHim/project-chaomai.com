import { Facebook, Instagram, Mail, Phone, Map } from "lucide-react";

export default function Footer() {
  return (
    <footer id="contact" className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              {/* ===== วิธีใส่โลโก้: ใส่ไฟล์ไว้ที่ public/logo.svg แล้วใช้ src="/logo.svg" ===== */}
              <img
                src="/chaomai-logo1.png"
                alt="chaomai logo"
                className="h-16 w-16 rounded-lg object-contain"
              />
              <h3 className="text-2xl font-bold">chao-mai.com</h3>
            </div>
            <p className="text-gray-400 mb-6">แพลตฟอร์มค้นหาที่พักที่ดีที่สุดในยะลา เพื่อตอบสนองทุกความต้องการของคุณ</p>
            <div className="flex space-x-4">
              <a 
                href="https://www.facebook.com/share/15jbXPTYKa/?mibextid=wwXIfr&utm_medium=social&utm_source=heylink.me" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700"
              >
                <Facebook className="inline text-black" />
              </a>
              <a href="https://www.instagram.com/chaomaii?igsh=MW96ZTRycjhiZ2lsbA%3D%3D&utm_source=qr&utm_medium=social&utm_source=heylink.me"
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700">
                <Instagram className="inline text-black"/>
              </a>
              <a href="https://www.tiktok.com/@chaomai66"
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center hover:bg-gray-600">
                <i className="fa-brands fa-tiktok"></i>
              </a>
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
              <p className="flex items-center"><Phone className="w-4 h-4 mr-3"></Phone> 073-123-456</p>
              <p className="flex items-center"><Mail className="w-4 h-4 mr-3"></Mail> info@chaomai.com</p>
              <p className="flex items-center"><Map className="w-4 h-4 mr-3"></Map> ยะลา ประเทศไทย</p>
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
