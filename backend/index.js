const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { readdirSync } = require('fs') //import อันนี้ไดเลยเพื่อวนลูปทุกเราท์

const app = express();

// Routes
// const authRoutes = require('./router/auth');
// const protectedRoutes = require('./Routes/protected');
// const taxonomyRouter = require('./Routes/taxonomy');
// Route 2
readdirSync('./router')
    .map((r) => app.use('/api', require('./router/' + r)))


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


// ใช้งานเราท์ที่ import มา
// app.use('/api/auth', authRoutes);
// app.use('/api', protectedRoutes);
// app.use('/api', taxonomyRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});