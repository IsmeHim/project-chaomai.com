// backend/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/User");

exports.register = async (req, res) => {
  const { username, email, password, phone } = req.body;

  // Validate input
  if (!username?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: "กรอกข้อมูลให้ครบถ้วน" });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });
  }

  // กันตั้งแต่ต้น: มีอยู่แล้วก็ตอบกลับ 409
  const exists = await User.findOne({ email }).lean();
  if (exists) {
    return res.status(409).json({ message: "อีเมลนี้มีผู้ใช้แล้ว" });
  }
  // ตัวอย่าง validate เบอร์ (ไทย 10 หลัก) – ปรับได้ตามต้องการ
  let normalizedPhone = null;
  if (typeof phone === "string" && phone.trim() !== "") {
    const onlyDigits = phone.replace(/\D/g, "");
    if (!/^\d{9,12}$/.test(onlyDigits)) {
      return res.status(400).json({ message: "รูปแบบเบอร์ไม่ถูกต้อง" });
    }
    // สมมติใช้เลขล้วน (ไม่มี +66) เก็บเป็น onlyDigits ไปก่อน
    normalizedPhone = onlyDigits;
  }
  try {
    // Check if user already exists
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phone: normalizedPhone ?? null, // ✅ null ได้ถ้าไม่กรอก
      role: "user", // Default role
    });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.email) {
      return res.status(409).json({ message: "อีเมลนี้มีผู้ใช้แล้ว" });
    }
    if (normalizedPhone) {
      const phoneTaken = await User.findOne({ phone: normalizedPhone }).lean();
      if (phoneTaken) return res.status(409).json({ message: "เบอร์นี้มีผู้ใช้อยู่แล้ว" });
    }

    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // ✅ บล็อกผู้ใช้ที่ถูกระงับ
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username }, // ✅ ใช้ id
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role,
        phone: user.phone ?? null,      // 
        name: user.name ?? '',
        company: user.company ?? '',
        lineId: user.lineId ?? '',
        facebookUrl: user.facebookUrl ?? '',
        address: user.address ?? '',
        about: user.about ?? '',
       },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// --- ใน exports.becomeOwner ---
// ปรับให้รองรับการรับฟอร์มและบังคับ phone
// backend/controllers/authController.js
exports.becomeOwner = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว' });
    }
    if (user.role === 'owner') {
      return res.status(400).json({ message: 'คุณเป็นผู้ลงประกาศอยู่แล้ว' });
    }

    // รับค่าจากฟอร์ม
    const {
      phone,
      name: nameRaw,             // ✅ รองรับ 'name'
      displayName,               // ✅ เผื่อฟอร์มเก่าส่ง 'displayName'
      company,
      lineId,
      facebookUrl,
      address,
      about,
    } = req.body || {};

    // validate phone
    const normalized = String(phone || '').replace(/\D/g, '');
    if (!normalized) return res.status(400).json({ message: 'กรุณากรอกเบอร์โทร' });
    if (!/^\d{9,12}$/.test(normalized)) {
      return res.status(400).json({ message: 'รูปแบบเบอร์ไม่ถูกต้อง' });
    }

    // กันซ้ำเบอร์
    const dup = await User.findOne({ phone: normalized, _id: { $ne: userId } }).lean();
    if (dup) return res.status(409).json({ message: 'เบอร์นี้มีผู้ใช้อยู่แล้ว' });

    // === อัปเดตข้อมูล ===
    user.phone = normalized;

    // ใช้ name เป็น Display name กลาง
    const nameFinal = (nameRaw ?? displayName ?? '').trim();
    if (nameFinal) user.name = nameFinal;

    if (typeof company === 'string')     user.company     = company.trim();
    if (typeof lineId === 'string')      user.lineId      = lineId.trim();
    if (typeof facebookUrl === 'string') user.facebookUrl = facebookUrl.trim();
    if (typeof address === 'string')     user.address     = address.trim();
    if (typeof about === 'string')       user.about       = about.trim();

    user.role = 'owner';
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      message: 'อัปเกรดเป็นผู้ลงประกาศเรียบร้อย',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone ?? null,
        name: user.name ?? '',
        company: user.company ?? '',
        lineId: user.lineId ?? '',
        facebookUrl: user.facebookUrl ?? '',
        address: user.address ?? '',
        about: user.about ?? '',
      },
      token,
    });
  } catch (err) {
    console.error('become-owner error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
