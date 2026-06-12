const express = require('express');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Task = require('../models/Task');
const Campaign = require('../models/Campaign');
const Organization = require('../models/Organization');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/public-stats
// @desc    Get platform stats (Public - no auth required)
router.get('/public-stats', async (req, res) => {
  try {
    const totalDonationsCount = await Donation.countDocuments({ status: 'Successful' });
    const donations = await Donation.find({ status: 'Successful' });
    const totalFunds = donations.reduce((acc, curr) => acc + curr.amount, 0);

    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
    const totalNgos = await Organization.countDocuments({ verificationStatus: 'Verified' });

    // Success stories for public visual wow-factor
    const successStories = [
      {
        id: '1',
        title: 'Clean Water Project',
        description: 'Successfully installed 15 water filters, bringing safe drinking water to 500+ families.',
        image: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=600&h=350&q=80',
        raised: 120000,
        ngo: 'Green Earth Foundation'
      },
      {
        id: '2',
        title: 'Slum Youth Digital Literacy',
        description: 'Set up a 10-computer lab training 120 kids in coding, spreadsheet utilities and tech basics.',
        image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&h=350&q=80',
        raised: 250000,
        ngo: 'Hope Foundation'
      }
    ];

    res.json({
      totalDonations: totalDonationsCount,
      totalFunds,
      totalVolunteers,
      totalNgos,
      successStories
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/dashboard/stats
// @desc    Get dashboard metrics (Private - NGO Admin, Volunteer, or Donor)
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const org = await Organization.findOne({ createdBy: req.user.id });
      if (!org) {
        return res.json({ role: 'admin', hasOrg: false });
      }

      // NGO specific stats
      const campaignsCount = await Campaign.countDocuments({ organizationId: org._id });
      const activeCampaigns = await Campaign.find({ organizationId: org._id });
      
      const tasks = await Task.find({ organizationId: org._id });
      const activeTasksCount = tasks.filter(t => t.status !== 'Completed').length;
      
      // Calculate unique volunteers engaged in tasks
      const volunteerIds = new Set();
      tasks.forEach(t => {
        if (t.assignedTo) volunteerIds.add(t.assignedTo.toString());
        if (t.volunteers) {
          t.volunteers.forEach(v => volunteerIds.add(v.toString()));
        }
      });
      const uniqueVolunteersJoined = volunteerIds.size;

      // Calculate total funds and donations count for this organization
      const orgDonations = await Donation.find({ organizationId: org._id, status: 'Successful' });
      const totalFunds = orgDonations.reduce((acc, curr) => acc + curr.amount, 0);
      const totalDonationsCount = orgDonations.length;

      // Group donations for trend analysis (aggregate by month in JS)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = new Date().getFullYear();
      
      // Initialize trend map for past 6 months
      const trendMap = {};
      const currentMonthIndex = new Date().getMonth();
      for (let i = 5; i >= 0; i--) {
        const index = (currentMonthIndex - i + 12) % 12;
        trendMap[months[index]] = { month: months[index], donations: 0, volunteers: 0 };
      }

      orgDonations.forEach(d => {
        const date = new Date(d.date);
        if (date.getFullYear() === currentYear) {
          const monthName = months[date.getMonth()];
          if (trendMap[monthName]) {
            trendMap[monthName].donations += d.amount;
          }
        }
      });

      // Distribute tasks to trends for volunteers signups count
      tasks.forEach(t => {
        const date = new Date(t.createdAt);
        const monthName = months[date.getMonth()];
        if (trendMap[monthName]) {
          const count = (t.volunteers ? t.volunteers.length : 0) + (t.assignedTo ? 1 : 0);
          trendMap[monthName].volunteers += count;
        }
      });

      const trendData = Object.values(trendMap);

      res.json({
        role: 'admin',
        hasOrg: true,
        orgName: org.name,
        orgId: org._id,
        totalCampaigns: campaignsCount,
        totalTasks: tasks.length,
        activeTasks: activeTasksCount,
        totalDonations: totalDonationsCount,
        totalFunds,
        totalVolunteers: uniqueVolunteersJoined,
        trendData
      });

    } else if (req.user.role === 'volunteer') {
      const totalTasks = await Task.countDocuments({
        $or: [{ assignedTo: req.user.id }, { volunteers: req.user.id }]
      });
      const pendingTasks = await Task.countDocuments({
        organizationId: { $exists: true },
        status: { $ne: 'Completed' }
      });
      const completedTasks = await Task.countDocuments({
        $or: [{ assignedTo: req.user.id }, { volunteers: req.user.id }],
        status: 'Completed'
      });

      res.json({
        role: 'volunteer',
        totalTasks,
        pendingTasks,
        completedTasks
      });

    } else if (req.user.role === 'donor') {
      const myDonations = await Donation.find({ donorId: req.user.id, status: 'Successful' });
      const myTotalDonations = myDonations.reduce((acc, curr) => acc + curr.amount, 0);

      // Total verified NGOs
      const totalNgos = await Organization.countDocuments({ verificationStatus: 'Verified' });
      // Total active campaigns across the platform
      const totalCampaigns = await Campaign.countDocuments();

      res.json({
        role: 'donor',
        myTotalDonations,
        totalCampaigns,
        totalNgos
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
