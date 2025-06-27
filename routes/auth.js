// routes/auth.js

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

const router = express.Router();
const JWT_SECRET = 'your_secret_key'; // or use process.env.JWT_SECRET

// Register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = new User({ username, password });
        await user.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(400).json({ error: 'User registration failed!' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'Account is inactive. Contact admin.' });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Login failed!' });
    }
});

module.exports = router;
