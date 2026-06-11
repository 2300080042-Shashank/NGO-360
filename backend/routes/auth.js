const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const auth = require('../middleware/auth');

const router = express.Router();

// Register Action
router.post('/register', async (req, res) => {
  const { name, email, password, role, phone, skills, availability } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ name, email, password, role, phone });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();

    // If volunteer, create volunteer profile
    if (role === 'volunteer') {
      const vol = new Volunteer({
        userId: user._id,
        skills: skills || [],
        availability: availability || ''
      });
      await vol.save();
    }

    // Return JWT
    const payload = { user: { id: user.id, role: user.role, name: user.name } };
    jwt.sign(payload, process.env.JWT_SECRET || 'supersecretjwtkey12345', { expiresIn: 360000 }, (err, token) => {
      if (err) {
        console.error("JWT Sign Error:", err);
        return res.status(500).json({ msg: 'Error generating token' });
      }
      res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
    });
  } catch (err) {
    console.error("Signup Error:", err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Login Action
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const payload = { user: { id: user.id, role: user.role, name: user.name } };
    jwt.sign(payload, process.env.JWT_SECRET || 'supersecretjwtkey12345', { expiresIn: 360000 }, (err, token) => {
      if (err) {
        console.error("JWT Sign Error:", err);
        return res.status(500).json({ msg: 'Error generating token' });
      }
      res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
    });
  } catch (err) {
    console.error("Login Error:", err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
