const mongoose = require('mongoose');

const wompiSellSchema = new mongoose.Schema({
  removed: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  reference: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['platform_subscription', 'gym_client_payment'], required: true },
  plan: { type: String },
  billing: { type: String, enum: ['monthly', 'annual'], default: 'monthly' },
  amount: { type: Number },
  amountInCents: { type: Number },
  currency: { type: String, default: 'COP' },
  userId: { type: String },
  gymId: { type: String },
  membershipId: { type: String },
  clientId: { type: String },
  status: { type: String, default: 'PENDING' },
  wompiId: { type: String },
  paymentMethod: { type: String },
  created: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('WompiSell', wompiSellSchema);
