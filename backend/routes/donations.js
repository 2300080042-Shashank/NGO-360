const express = require('express');
const Donation = require('../models/Donation');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get donations
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'donor') {
      query.donorId = req.user.id;
    } else if (req.user.role === 'volunteer') {
      return res.status(403).json({ msg: 'Access Denied: Volunteers cannot view donations.' });
    }

    // Search by donor name or project name
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      if (req.user.role === 'admin') {
        const matchingUsers = await User.find({ name: searchRegex }).select('_id');
        const userIds = matchingUsers.map(u => u._id);
        query.$or = [
          { projectId: searchRegex },
          { donorId: { $in: userIds } }
        ];
      } else {
        query.projectId = searchRegex;
      }
    }

    // Filter by project ID
    if (req.query.project) {
      query.projectId = { $regex: req.query.project, $options: 'i' };
    }

    // Filter by amount range
    if (req.query.minAmount || req.query.maxAmount) {
      query.amount = {};
      if (req.query.minAmount) query.amount.$gte = Number(req.query.minAmount);
      if (req.query.maxAmount) query.amount.$lte = Number(req.query.maxAmount);
    }

    const donations = await Donation.find(query).populate('donorId', ['name', 'email']).sort({ date: -1 });
    res.json(donations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a donation
router.post('/', auth, async (req, res) => {
  if (req.user.role === 'volunteer') {
    return res.status(403).json({ msg: 'Access Denied: Volunteers cannot make donations.' });
  }

  const { amount, projectId } = req.body;

  try {
    const newDonation = new Donation({
      donorId: req.user.id,
      amount,
      projectId
    });

    const donation = await newDonation.save();
    res.json(donation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
