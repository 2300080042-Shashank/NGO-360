const express = require('express');
const Campaign = require('../models/Campaign');
const Organization = require('../models/Organization');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/campaigns
// @desc    Get all campaigns (Public)
router.get('/', async (req, res) => {
  try {
    const { title, category, organizationId } = req.query;
    let query = {};

    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (organizationId) {
      query.organizationId = organizationId;
    }

    const campaigns = await Campaign.find(query)
      .populate('organizationId', ['name', 'logo'])
      .sort({ createdAt: -1 });
      
    res.json(campaigns);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/campaigns/:id
// @desc    Get campaign details by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('organizationId', ['name', 'logo', 'coverImage', 'description', 'location']);
    
    if (!campaign) {
      return res.status(404).json({ msg: 'Campaign not found.' });
    }
    
    res.json(campaign);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Campaign not found.' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/campaigns
// @desc    Create a new fundraising campaign (Private - NGO Admin only)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access Denied: Only NGO Admins can create campaigns.' });
  }

  const { title, description, image, goalAmount, category, endDate } = req.body;

  try {
    // Find organization associated with this admin
    const org = await Organization.findOne({ createdBy: req.user.id });
    if (!org) {
      return res.status(400).json({ msg: 'Please complete your NGO organization profile first before publishing campaigns.' });
    }

    const newCampaign = new Campaign({
      title,
      description,
      image: image || undefined,
      goalAmount,
      category,
      organizationId: org._id,
      endDate: endDate || undefined
    });

    const campaign = await newCampaign.save();
    res.json(campaign);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/campaigns/:id
// @desc    Update campaign details (Private - Admin only)
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access Denied: Only NGO Admins can edit campaigns.' });
  }

  const { title, description, image, goalAmount, category, endDate } = req.body;

  try {
    let campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ msg: 'Campaign not found.' });
    }

    // Verify ownership via organization
    const org = await Organization.findById(campaign.organizationId);
    if (!org || org.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access Denied: You can only edit campaigns belonging to your NGO.' });
    }

    if (title) campaign.title = title;
    if (description) campaign.description = description;
    if (image) campaign.image = image;
    if (goalAmount) campaign.goalAmount = goalAmount;
    if (category) campaign.category = category;
    if (endDate) campaign.endDate = endDate;

    await campaign.save();
    res.json(campaign);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
