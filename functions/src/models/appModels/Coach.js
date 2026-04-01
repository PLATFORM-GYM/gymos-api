const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    phone: {
      type: String,
    },
    specialty: {
      type: String, // E.g., personal trainer, yoga instructor, etc.
    },
    gym: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Gym',
      autopopulate: true,
    }],
    created: {
      type: Date,
      default: Date.now,
    },
  });
  
  coachSchema.plugin(require('mongoose-autopopulate'));
  
  module.exports = mongoose.model('Coach', coachSchema);
  