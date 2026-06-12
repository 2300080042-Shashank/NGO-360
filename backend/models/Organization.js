const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String, default: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=200&h=200&q=80' },
  coverImage: { type: String, default: 'https://images.unsplash.com/photo-1469571486090-7d99c43d74a1?auto=format&fit=crop&w=1200&h=400&q=80' },
  description: { type: String, required: true },
  mission: { type: String },
  location: { type: String, required: true },
  contactDetails: {
    email: { type: String },
    phone: { type: String },
    website: { type: String }
  },
  verificationStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Verified' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
