const express = require('express');
const Organization = require('../models/Organization');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/organizations
// @desc    Get all verified organizations (Public)
router.get('/', async (req, res) => {
  try {
    const { name, location } = req.query;
    let query = { verificationStatus: 'Verified' };

    // Allow search by name (case-insensitive)
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    // Allow filter by location (case-insensitive)
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const organizations = await Organization.find(query).sort({ name: 1 });
    res.json(organizations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/organizations/my
// @desc    Get current user's organization (Private - NGO Admin only)
router.get('/my', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access Denied: Only NGO Admins can manage their organization profile.' });
  }

  try {
    const org = await Organization.findOne({ createdBy: req.user.id });
    if (!org) {
      return res.status(404).json({ msg: 'No organization profile found for this admin.' });
    }
    res.json(org);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/organizations/:id
// @desc    Get organization by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ msg: 'Organization not found.' });
    }
    res.json(org);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Organization not found.' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/organizations
// @desc    Register a new organization (Private - NGO Admin only)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access Denied: Only NGO Admins can register an organization.' });
  }

  const { name, logo, coverImage, description, mission, location, contactDetails } = req.body;

  try {
    // Check if user already registered an organization
    let org = await Organization.findOne({ createdBy: req.user.id });
    if (org) {
      return res.status(400).json({ msg: 'You have already registered an organization. Modify the existing one instead.' });
    }

    org = new Organization({
      name,
      logo,
      coverImage,
      description,
      mission,
      location,
      contactDetails,
      createdBy: req.user.id
    });

    await org.save();
    res.json(org);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/organizations/:id
// @desc    Update organization profile (Private - Admin owner only)
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access Denied: Only NGO Admins can edit organization profiles.' });
  }

  const { name, logo, coverImage, description, mission, location, contactDetails } = req.body;

  try {
    let org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ msg: 'Organization not found.' });
    }

    // Check ownership
    if (org.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access Denied: You can only edit organizations created by you.' });
    }

    // Update fields
    if (name) org.name = name;
    if (logo) org.logo = logo;
    if (coverImage) org.coverImage = coverImage;
    if (description) org.description = description;
    if (mission) org.mission = mission;
    if (location) org.location = location;
    if (contactDetails) org.contactDetails = contactDetails;

    await org.save();
    res.json(org);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
