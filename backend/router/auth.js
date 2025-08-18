const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
    const { username, email, password, phone } = req.body;

    // Validate input
    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'กรอกข้อมูลให้ครบถ้วน' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }
        // ตัวอย่าง validate เบอร์ (ไทย 10 หลัก) – ปรับได้ตามต้องการ
    let normalizedPhone = null;
    if (typeof phone === 'string' && phone.trim() !== '') {
      const onlyDigits = phone.replace(/\D/g, '');
      if (!/^\d{9,12}$/.test(onlyDigits)) {
        return res.status(400).json({ message: 'รูปแบบเบอร์ไม่ถูกต้อง' });
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
            role: 'user' // Default role
        });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {   
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Server error' });
    } 
})

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign({ userId: user._id, role: user.role, username: user.username }, process.env.JWT_SECRET, { expiresIn: '12h' });
        res.json({ token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
         });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;