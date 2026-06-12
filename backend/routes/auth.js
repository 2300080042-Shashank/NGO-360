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

// Get Profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    let profile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role
    };
    
    if (user.role === 'volunteer') {
      const volunteer = await Volunteer.findOne({ userId: user._id });
      if (volunteer) {
        profile.skills = volunteer.skills || [];
        profile.availability = volunteer.availability || '';
      } else {
        profile.skills = [];
        profile.availability = '';
      }
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update Profile
router.put('/profile', auth, async (req, res) => {
  const { name, phone, password, skills, availability } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    if (user.role === 'volunteer') {
      let volunteer = await Volunteer.findOne({ userId: user._id });
      if (!volunteer) {
        volunteer = new Volunteer({ userId: user._id });
      }
      if (skills !== undefined) {
        volunteer.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (availability !== undefined) {
        volunteer.availability = availability;
      }
      await volunteer.save();
    }

    // Return updated user (excluding password)
    const updatedUser = await User.findById(req.user.id).select('-password');
    let responseData = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      role: updatedUser.role
    };

    if (updatedUser.role === 'volunteer') {
      const volunteer = await Volunteer.findOne({ userId: updatedUser._id });
      if (volunteer) {
        responseData.skills = volunteer.skills || [];
        responseData.availability = volunteer.availability || '';
      }
    }

    res.json(responseData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all profiles (Admin only)
router.get('/profiles', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access Denied: Admin role required.' });
  }
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    const volunteers = await Volunteer.find();
    
    const volunteerMap = {};
    volunteers.forEach(v => {
      volunteerMap[v.userId.toString()] = v;
    });

    const profiles = users.map(user => {
      const userObj = user.toObject();
      if (user.role === 'volunteer') {
        const vol = volunteerMap[user._id.toString()];
        userObj.skills = vol ? (vol.skills || []) : [];
        userObj.availability = vol ? (vol.availability || '') : '';
      }
      return userObj;
    });

    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
