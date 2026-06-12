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

const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay Instance
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured in environment variables.');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

// Create Razorpay Order
router.post('/razorpay-order', auth, async (req, res) => {
  if (req.user.role !== 'donor') {
    return res.status(403).json({ msg: 'Access Denied: Only Donors can make payments.' });
  }

  const { amount, projectId } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ msg: 'Invalid donation amount.' });
  }

  try {
    const razorpay = getRazorpayInstance();
    const amountInPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    if (!order) {
      return res.status(500).json({ msg: 'Failed to create Razorpay order.' });
    }

    // Save pending donation to MongoDB
    const newDonation = new Donation({
      donorId: req.user.id,
      amount: Number(amount),
      projectId: projectId || undefined,
      orderId: order.id,
      status: 'Pending'
    });

    await newDonation.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Razorpay Order Error:', err.message);
    res.status(500).json({ msg: 'Server error generating payment order.', error: err.message });
  }
});

// Verify Razorpay Payment Signature
router.post('/razorpay-verify', auth, async (req, res) => {
  if (req.user.role !== 'donor') {
    return res.status(403).json({ msg: 'Access Denied: Only Donors can make payments.' });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ msg: 'Missing verification fields.' });
  }

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ msg: 'Razorpay secret key not configured on server.' });
    }

    // Generate expected signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    const isSignatureValid = generatedSignature === razorpay_signature;

    if (isSignatureValid) {
      // Find the pending donation and update status to Successful
      const donation = await Donation.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { 
          $set: { 
            status: 'Successful',
            paymentId: razorpay_payment_id
          } 
        },
        { new: true }
      );

      if (!donation) {
        return res.status(404).json({ msg: 'Associated donation record not found.' });
      }

      res.json({ success: true, donation });
    } else {
      // Mark as Failed
      await Donation.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { $set: { status: 'Failed' } }
      );
      res.status(400).json({ success: false, msg: 'Invalid signature verification failed.' });
    }
  } catch (err) {
    console.error('Razorpay Verify Error:', err.message);
    res.status(500).json({ msg: 'Server error verifying payment.', error: err.message });
  }
});

module.exports = router;
