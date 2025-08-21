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
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username }, // ✅ ใช้ id
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.becomeOwner = async (req, res) => {
  try {
    const userId = req.user.id;            // ✅ ใช้ req.user.id จาก middleware
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'owner') {
      return res.status(400).json({ message: 'คุณเป็นผู้ลงประกาศอยู่แล้ว' });
    }

    user.role = 'owner';
    await user.save();

    // สร้าง token ใหม่ให้สะท้อน role ล่าสุด
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
      },
      token,
    });
  } catch (err) {
    console.error('become-owner error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}