const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
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