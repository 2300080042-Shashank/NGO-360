const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  attendance: { type: Number, default: 0 },
  performance: { type: String }
});

module.exports = mongoose.model('Student', studentSchema);
