const express = require('express');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const donorsCount = await User.countDocuments({ role: 'donor' });
      const volunteersCount = await User.countDocuments({ role: 'volunteer' });
      const tasksCount = await Task.countDocuments();
      const donationsCount = await Donation.countDocuments();
      
      const donations = await Donation.find();
      const totalFunds = donations.reduce((acc, curr) => acc + curr.amount, 0);

      const activeTasks = await Task.countDocuments({ status: { $in: ['Pending', 'In-progress'] } });

      res.json({
        role: 'admin',
        totalDonors: donorsCount,
        totalVolunteers: volunteersCount,
        totalTasks: tasksCount,
        totalDonations: donationsCount,
        totalFunds,
        activeProjects: activeTasks // Conceptually mapping tasks to active projects for MVP
      });
    } else if (req.user.role === 'volunteer') {
      const totalTasks = await Task.countDocuments({ assignedTo: req.user.id });
      const pendingTasks = await Task.countDocuments({ assignedTo: req.user.id, status: 'Pending' });
      const inProgressTasks = await Task.countDocuments({ assignedTo: req.user.id, status: 'In-progress' });
      const completedTasks = await Task.countDocuments({ assignedTo: req.user.id, status: 'Completed' });

      res.json({
        role: 'volunteer',
        totalTasks,
        pendingTasks: pendingTasks + inProgressTasks, // Grouping pending and in-progress as pending/active
        completedTasks
      });
    } else if (req.user.role === 'donor') {
      const myDonations = await Donation.find({ donorId: req.user.id });
      const myTotalDonations = myDonations.reduce((acc, curr) => acc + curr.amount, 0);

      const donations = await Donation.find();
      const totalFunds = donations.reduce((acc, curr) => acc + curr.amount, 0);

      const activeTasks = await Task.countDocuments({ status: { $in: ['Pending', 'In-progress'] } });

      res.json({
        role: 'donor',
        myTotalDonations,
        totalFunds,
        activeProjects: activeTasks
      });
    } else {
      res.status(400).json({ msg: 'Invalid user role' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
