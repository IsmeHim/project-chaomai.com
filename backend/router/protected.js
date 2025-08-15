const express = require('express');
const auth = require('../middleware/auth');
const User = require('../model/User'); // Assuming you have a User model
const router = express.Router();

router.get('/protected', auth, async (req, res) => {
    try {
        // Fetch user data from the database using req.user (which contains the user ID)
        const user = await User.findById(req.user).select('-password'); // Exclude password field
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({
            msg: 'Protected data accessed successfully',
            user: {
                id: user._id,
                email: user.email, // Assuming you have an email field
                username: user.username // Assuming you have a username field
            }
        }); // Send user data as response
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;