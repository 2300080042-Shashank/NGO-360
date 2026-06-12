const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, default: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&h=400&q=80' },
  goalAmount: { type: Number, required: true },
  amountRaised: { type: Number, default: 0 },
  category: { type: String, required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
