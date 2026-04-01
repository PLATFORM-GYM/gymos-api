const mongoose = require('mongoose');

const classScheduleSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  gymId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Gym',
    required: true,
    autopopulate: { select: 'name logo slug' },
  },
  coachId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
    autopopulate: { select: 'name surname email photo' },
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6,
  },
  capacity: {
    type: Number,
    default: 20,
  },
  enrolled: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    autopopulate: { select: 'name surname email photo' },
  }],
  color: {
    type: String,
    default: '#4F46E5',
  },
  location: {
    type: String,
    trim: true,
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

classScheduleSchema.pre('save', function (next) {
  this.updated = Date.now();
  next();
});

classScheduleSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('ClassSchedule', classScheduleSchema);
