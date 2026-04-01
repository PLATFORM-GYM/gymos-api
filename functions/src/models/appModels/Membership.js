const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    required: true,
  },
  attendances: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['daily', 'alternate_days'],
    required: true,
  },
  category: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipCategory', // Replace 'Category' with the actual model name for categories
    required: false,
    autopopulate: true,
  }],
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym', // Replace 'Gym' with the actual model name for gyms
    required: true,
    autopopulate: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

membershipSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Membership', membershipSchema);
