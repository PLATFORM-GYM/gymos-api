const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    required: true,
    autopopulate: true,
  },
  membership: {
    type: mongoose.Schema.ObjectId,
    ref: 'Membership',
    required: true,
    autopopulate: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
  },
  attendances: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Attendance',
      autopopulate: true,
    },
  ],
  created: {
    type: Date,
    default: Date.now,
  },
});

subscriptionSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Subscription', subscriptionSchema);
