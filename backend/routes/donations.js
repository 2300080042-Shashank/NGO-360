const express = require('express');
const Donation = require('../models/Donation');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all donations
router.get('/', auth, async (req, res) => {
  try {
    const donations = await Donation.find().populate('donorId', ['name', 'email']).sort({ date: -1 });
    res.json(donations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a donation
router.post('/', auth, async (req, res) => {
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
