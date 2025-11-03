const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { readdirSync } = require('fs');
const path = require('path');

const app = express();

app.disable('x-powered-by');
app.set('etag', false);

// ===== CORS (ใช้แพ็กเกจ) =====
const allowlist = new Set([
  'https://chao-mai.com',
  'https://www.chao-mai.com',
  'https://project-chaomai-com.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const corsOptions = {
  origin(origin, callback) {
    // อนุญาต no-origin (เช่น curl, health check) = ปรับเป็น true/false ตามต้องการ
    if (!origin) return callback(null, false);
    callback(null, allowlist.has(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204, // ให้ preflight กลับ 204
};

app.use(cors(corsOptions));              // ✅ ใช้ก่อนทุกอย่าง
// app.options('*', cors(corsOptions));  // (ไม่จำเป็น ส่วนใหญ่ cors จัดการให้แล้ว)

app.use(express.json());

// กัน cache บน API
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  next();
});

// Static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test ping
app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Routes auto-mount
readdirSync(path.join(__dirname, 'router'))
  .map((r) => app.use('/api', require(path.join(__dirname, 'router', r))));

// Root
app.get('/', (req, res) => { res.send('Hello World from Express!'); });

// DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
