const mongoose = require('mongoose');

const membershipCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  membershipId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership', // Replace 'Membership' with the actual model name for memberships
    required: true,
    autopopulate: true,
  }],
});

membershipCategorySchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('MembershipCategory', membershipCategorySchema);