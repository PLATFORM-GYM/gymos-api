const mongoose = require('mongoose');

const medicalConditionsSchema = new mongoose.Schema({
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym', // Replace 'Gym' with the actual model name for gyms if needed
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps automatically

module.exports = mongoose.model('MedicalConditions', medicalConditionsSchema);