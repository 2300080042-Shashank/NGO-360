const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  projectId: { type: String }, // Backwards compatibility for custom project strings
  paymentId: { type: String },
  orderId: { type: String },
  status: { type: String, enum: ['Pending', 'Successful', 'Failed'], default: 'Successful' },
  
  // Upgraded multi-NGO fields
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }
});

module.exports = mongoose.model('Donation', donationSchema);
