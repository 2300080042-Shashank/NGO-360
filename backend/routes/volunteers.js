const express = require('express');
const Volunteer = require('../models/Volunteer');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all volunteers (Admin only)
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access Denied: Only admins can view volunteer lists.' });
  }

  try {
    const { name, skill } = req.query;
    let volunteerQuery = {};

    if (skill) {
      volunteerQuery.skills = { $regex: skill, $options: 'i' };
    }

    let volunteers = await Volunteer.find(volunteerQuery)
      .populate('userId', ['name', 'email', 'phone'])
      .populate('assignedTasks');

    if (name) {
      const nameRegex = new RegExp(name, 'i');
      volunteers = volunteers.filter(vol => vol.userId && nameRegex.test(vol.userId.name));
    }

    res.json(volunteers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
