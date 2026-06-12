const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Original single volunteer assignment
  status: { type: String, enum: ['Pending', 'In-progress', 'Completed'], default: 'Pending' },
  deadline: { type: Date },
  createdAt: { type: Date, default: Date.now },
  
  // Upgraded multi-NGO volunteer opportunity fields
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  location: { type: String },
  date: { type: Date },
  requiredVolunteers: { type: Number, default: 1 },
  skillsNeeded: [{ type: String }],
  volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Volunteers who signed up for this task
});

module.exports = mongoose.model('Task', taskSchema);
