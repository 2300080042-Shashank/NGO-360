const express = require('express');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/stats', auth, async (req, res) => {
  try {
    const donorsCount = await User.countDocuments({ role: 'donor' });
    const volunteersCount = await User.countDocuments({ role: 'volunteer' });
    
    const donations = await Donation.find();
    const totalFunds = donations.reduce((acc, curr) => acc + curr.amount, 0);

    const activeTasks = await Task.countDocuments({ status: { $in: ['Pending', 'In-progress'] } });

    res.json({
      totalDonors: donorsCount,
      totalVolunteers: volunteersCount,
      totalFunds,
      activeProjects: activeTasks // Conceptually mapping tasks to active projects for MVP
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
