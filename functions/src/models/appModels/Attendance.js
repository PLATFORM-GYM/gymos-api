const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    required: true,
    autopopulate: true,
  },
  gym:
  {
    type: mongoose.Schema.ObjectId,
    ref: 'Gym',
    required: true,
    autopopulate: true,
  },
  checkInTime: {
    type: Date,
    required: true,
  },
  checkOutTime: {
    type: Date,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

attendanceSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Attendance', attendanceSchema);
