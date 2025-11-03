const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { readdirSync } = require('fs');
const path = require('path');

const app = express();

app.disable('x-powered-by');
// วางใกล้ ๆ หลังสร้าง app
app.set('etag', false);

/* ✅ CORS: วางก่อนทุกอย่าง + allow preflight */
/* ✅ CORS robust */
app.use((req, res, next) => {
  const allowed = new Set([
    'https://chao-mai.com',
    'https://www.chao-mai.com',
    'https://project-chaomai-com.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ]);

  const origin = req.headers.origin;

  // ใส่ header พื้นฐานทุกครั้ง (ไม่ขึ้นกับ allow/ไม่ allow)
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

  // ถ้า origin อยู่ใน allow-list → ใส่ Allow-Origin + Credentials
  if (origin && allowed.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  // ตอบ preflight พร้อม header เสมอ
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});
                            // ✅ preflight ทุก path

app.use(express.json());

// (เลือก) ปิด cache บน API กัน 304 แล้ว header หายจาก proxy
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  next();
});

/* Static uploads */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* Test ping (ช่วยดีบัก CORS ได้เร็ว) */
app.get('/api/ping', (req, res) => res.json({ ok: true }));

/* Routes auto-mount ใต้ /api */
readdirSync(path.join(__dirname, 'router'))
  .map((r) => app.use('/api', require(path.join(__dirname, 'router', r))));

/* (จะมี/ไม่มีก็ได้) root หลัง CORS */
app.get('/', (req, res) => { res.send('Hello World from Express!'); });

/* DB */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
