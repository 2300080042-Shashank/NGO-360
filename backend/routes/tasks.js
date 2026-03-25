const express = require('express');
const Task = require('../models/Task');
const Volunteer = require('../models/Volunteer');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find().populate('assignedTo', ['name', 'email']).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create task
router.post('/', auth, async (req, res) => {
  const { title, description, assignedTo, deadline } = req.body;

  try {
    const newTask = new Task({ title, description, assignedTo, deadline });
    const task = await newTask.save();
    
    // Assign to volunteer
    if (assignedTo) {
      await Volunteer.findOneAndUpdate({ userId: assignedTo }, { $push: { assignedTasks: task._id } });
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update task status
router.put('/:id', auth, async (req, res) => {
  const { status } = req.body;

  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    task = await Task.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
