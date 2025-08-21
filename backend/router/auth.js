const express = require('express');
const auth = require("../middleware/auth"); // ถ้ายังไม่ได้ require, เพิ่มบรรทัดนี้ด้านบนไฟล์
const AuthController = require('../controllers/authController');
const router = express.Router();

// Register route
router.post('/auth/register', AuthController.register);

// Login route
// backend/router/auth.js (เฉพาะส่วน login)
router.post('/auth/login', AuthController.login);
// === become owner ===
router.post('/auth/become-owner', auth, AuthController.becomeOwner);
module.exports = router;