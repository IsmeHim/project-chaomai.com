const express = require('express');
const { requireRole } = require('../middleware/roles');
const auth = require('../middleware/auth'); // ของโปรเจกต์คุณ
const ctrl = require('../controllers/taxonomyController');
const router = express.Router();


// ---------- Category ----------//
// GET /categories (public: เฉพาะ isActive=true, รองรับ q)
router.get('/categories', ctrl.getCategories);
router.post('/categories', auth, requireRole('admin'), ctrl.createCategory);
router.patch('/categories/:id', auth, requireRole('admin'), ctrl.updateCategory);
router.delete('/categories/:id', auth, requireRole('admin'), ctrl.deleteCategory);
// ✅ แอดมินดูหมวดทั้งหมด (ไม่กรอง isActive)
router.get('/categories/all', auth, requireRole('admin'), ctrl.getAllCategories);


// ---------- Property Types ----------
router.get('/types', ctrl.getTypes);

router.post('/types', auth, requireRole('admin'), ctrl.createType);

router.patch('/types/:id', auth, requireRole('admin'), ctrl.updateType);

router.delete('/types/:id', auth, requireRole('admin'), ctrl.deleteType);

module.exports = router;
