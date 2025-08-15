const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Routes
const authRoutes = require('./router/auth');
const protectedRoutes = require('./router/protected');
const taxonomyRouter = require('./router/taxonomy');

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

app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api', taxonomyRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});