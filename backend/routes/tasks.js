const express = require('express');
const jwt = require('jsonwebtoken');
const Task = require('../models/Task');
const Volunteer = require('../models/Volunteer');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { createNotification } = require('../utils/notifications');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper to check token optionally for public endpoints
const getOptionalUser = (req) => {
  const token = req.header('x-auth-token');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey12345');
    return decoded.user;
  } catch (err) {
    return null;
  }
};

// @route   GET /api/tasks
// @desc    Get tasks / volunteer opportunities (Public browsing, private filtering)
router.get('/', async (req, res) => {
  try {
    const user = getOptionalUser(req);
    let query = {};

    // Search and filters
    if (req.query.title) {
      query.title = { $regex: req.query.title, $options: 'i' };
    }

    if (req.query.location) {
      query.location = { $regex: req.query.location, $options: 'i' };
    }

    if (req.query.organizationId) {
      query.organizationId = req.query.organizationId;
    }

    if (req.query.status) {
      let statusQuery = req.query.status;
      if (statusQuery === 'In Progress') {
        statusQuery = 'In-progress';
      }
      query.status = statusQuery;
    }

    // Role-based filtering and scoping
    if (user && user.role === 'admin') {
      // NGO Admin: see all tasks created by their organization
      const org = await Organization.findOne({ createdBy: user.id });
      if (org) {
        query.organizationId = org._id;
      } else {
        return res.json([]);
      }
    } else if (user && user.role === 'volunteer' && req.query.joined === 'true') {
      // Volunteer: return only tasks they joined or are assigned to
      query.$or = [
        { assignedTo: user.id },
        { volunteers: user.id }
      ];
    } else {
      // Guest or Volunteer browsing public opportunities: return all open/active opportunities
      query.organizationId = { $exists: true };
      if (!req.query.status) {
        query.status = { $ne: 'Completed' };
      }
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', ['name', 'email'])
      .populate('organizationId', ['name', 'logo'])
      .populate('volunteers', ['name', 'email', 'phone'])
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/tasks
// @desc    Create a task or volunteer opportunity (Private - NGO Admin only)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access Denied: Only Admin can create tasks.' });
  }

  const { title, description, assignedTo, deadline, location, date, requiredVolunteers, skillsNeeded } = req.body;

  try {
    const org = await Organization.findOne({ createdBy: req.user.id });
    
    // Create new task with upgraded optional properties
    const newTask = new Task({
      title,
      description,
      assignedTo: assignedTo || undefined,
      deadline,
      organizationId: org ? org._id : undefined,
      location,
      date: date || deadline,
      requiredVolunteers: requiredVolunteers ? Number(requiredVolunteers) : 1,
      skillsNeeded: Array.isArray(skillsNeeded) ? skillsNeeded : (skillsNeeded ? skillsNeeded.split(',').map(s => s.trim()).filter(Boolean) : [])
    });

    const task = await newTask.save();
    
    // Backward compatibility: Assign to volunteer profile if specifically assigned to a user
    if (assignedTo) {
      await Volunteer.findOneAndUpdate({ userId: assignedTo }, { $push: { assignedTasks: task._id } });
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/tasks/:id/participate
// @desc    Join a volunteer opportunity (Private - Volunteer only)
router.post('/:id/participate', auth, async (req, res) => {
  if (req.user.role !== 'volunteer') {
    return res.status(403).json({ msg: 'Access Denied: Only Volunteers can participate in opportunities.' });
  }

  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ msg: 'Opportunity/Task not found.' });
    }

    // Check if duplicate joining
    if (task.volunteers && task.volunteers.includes(req.user.id)) {
      return res.status(400).json({ msg: 'You have already joined this volunteer opportunity.' });
    }

    // Check capacity
    if (task.volunteers && task.volunteers.length >= (task.requiredVolunteers || 1)) {
      return res.status(400).json({ msg: 'This opportunity is already full.' });
    }

    // Add user to volunteer list
    task = await Task.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { volunteers: req.user.id } },
      { new: true }
    );

    // Also push to volunteer's assignedTasks list for dashboard tracking
    await Volunteer.findOneAndUpdate({ userId: req.user.id }, { $addToSet: { assignedTasks: task._id } });

    // Notify organization admin of new participant
    if (task.organizationId) {
      const org = await Organization.findById(task.organizationId);
      if (org) {
        const volUser = await User.findById(req.user.id);
        const volName = volUser ? volUser.name : 'A volunteer';
        await createNotification(
          org.createdBy,
          req.user.id,
          'Volunteer Registered',
          `Volunteer "${volName}" has signed up for your opportunity "${task.title}".`,
          'success'
        );
      }
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task status (Private - Assigned volunteer or Admin)
router.put('/:id', auth, async (req, res) => {
  const { status } = req.body;

  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    // Role check
    if (req.user.role === 'volunteer') {
      const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user.id;
      const isJoined = task.volunteers && task.volunteers.includes(req.user.id);
      
      if (!isAssigned && !isJoined) {
        return res.status(403).json({ msg: 'Access Denied: You can only update tasks you are assigned to or have joined.' });
      }
    } else if (req.user.role === 'donor') {
      return res.status(403).json({ msg: 'Access Denied: Donors cannot update tasks.' });
    }

    task = await Task.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });

    // Notify volunteers and admin of status change
    try {
      const actorUser = await User.findById(req.user.id);
      const actorName = actorUser ? actorUser.name : 'Someone';

      // 1. Notify NGO Admin
      if (req.user.role === 'volunteer' && task.organizationId) {
        const org = await Organization.findById(task.organizationId);
        if (org) {
          await createNotification(
            org.createdBy,
            req.user.id,
            'Task Status Changed',
            `Volunteer "${actorName}" updated status of "${task.title}" to "${status}".`,
            'info'
          );
        }
      }

      // 2. Notify assigned / registered volunteers
      if (task.volunteers && task.volunteers.length > 0) {
        for (const volId of task.volunteers) {
          if (volId.toString() !== req.user.id) {
            await createNotification(
              volId,
              req.user.id,
              'Task Status Updated',
              `The status of opportunity "${task.title}" has been set to "${status}" by ${actorName}.`,
              'info'
            );
          }
        }
      }
      if (task.assignedTo && task.assignedTo.toString() !== req.user.id) {
        await createNotification(
          task.assignedTo,
          req.user.id,
          'Task Status Updated',
          `The status of opportunity "${task.title}" has been set to "${status}" by ${actorName}.`,
          'info'
        );
      }
    } catch (notifyErr) {
      console.error('Error dispatching update notifications', notifyErr);
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
