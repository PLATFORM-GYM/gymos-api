const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  removed: {
    type: Boolean,
    default: false,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  dniType: {
    type: String,
    trim: true,
    enum: ['CC', 'TI', 'RC', 'CE', 'PAS', 'PEP', 'NIT'], 
    required: true, 
  },
  dni: {
    type: String,
    trim: true,
  },
  cardId: {
    type:String
  },
  gym: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Gym',
      required: true,
      autopopulate: true,
    },
  ],
  subscriptions: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Subscription',
      autopopulate: true,
    },
  ],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  photo: {
    type: String,
    trim: true,
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  birthDate: {
    type: Date,
  },
  notes: {
    type: String,
    trim: true,
  },
  healthParams: {
    weight: {
      type: Number, // Weight in kilograms
    },
    height: {
      type: Number, // Height in centimeters
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    bodyFatPercentage: {
      type: Number, // Body fat percentage
    },
    muscleMassPercentage: {
      type: Number, // Muscle mass percentage
    },
    restingHeartRate: {
      type: Number, // Resting heart rate in BPM
    },
    maxHeartRate: {
      type: Number, // Max heart rate in BPM
    },
    allergies: {
      type: [String], // List of allergies
    },
    medicalConditions: {
      type: [String], // List of medical conditions
    },
  },
  address: {
    streetAddress: {
      type: String,
      trim: true,
    },
    apartmentSuite: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true,
    },
    relationship: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

clientSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Client', clientSchema);
