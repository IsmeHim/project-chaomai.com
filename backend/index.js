const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { readdirSync } = require('fs')

const app = express();

// Routes อันนี้เป็นเราท์แบบวิธีแรกที่ผมใช้ตรงนี้ประกาศตัวแปรและ import จากเราท์
// const authRoutes = require('./router/auth');
// const protectedRoutes = require('./router/protected');
// const taxonomyRouter = require('./router/taxonomy');

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // หรือพอร์ตของ frontend
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'], // 👈 ให้แน่ใจว่ามี
}))
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// อันนี้คือวิธีแรกที่คอมเม้นท์ข้างบนตอนนี้มาใช้วิธีที่ 3 แทน
// app.use('/api/auth', authRoutes);
// app.use('/api', protectedRoutes);
// app.use('/api', taxonomyRouter);

// Route 3 แบบวนลูป
readdirSync('./router')
    .map((r) => app.use('/api', require('./router/' + r)))

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});