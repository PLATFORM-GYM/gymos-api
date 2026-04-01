const mongoose = require('mongoose');
const Attendance = mongoose.model('Attendance');

// Create a new attendance record
const create = async (Model, req, res) => {
  try {
    const { client, checkInTime, checkOutTime } = req.body;

    // Validate required fields
    if (!client || !checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Client and check-in time are required',
      });
    }

    // Create the attendance record
    const newAttendance = await Attendance.create({
      client,
      checkInTime,
      checkOutTime,
    });

    return res.status(201).json({
      success: true,
      data: newAttendance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating attendance',
      error: error.message,
    });
  }
};

module.exports = create;
