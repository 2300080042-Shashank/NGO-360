const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  projectId: { type: String } // Optional, can link to specific projects
});

module.exports = mongoose.model('Donation', donationSchema);
