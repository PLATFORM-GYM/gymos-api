const mongoose = require('mongoose');
const Attendance = mongoose.model('Attendance');
const Client = mongoose.model('Client'); // Assuming Client is the model for clients
const { migrate } = require('./migrate');
// Create a new attendance record
const create = async (Model, req, res) => {
  try {
    const { cardId, gymId } = req.body;

    // Validate required fields
    if (!cardId || !gymId) {
      return res.status(400).json({
        success: false,
        message: 'Card ID and Gym ID are required',
      });
    }

    // Find the client based on card ID and gym ID
    const client = await Client.findOne({
      cardId,
      gym: gymId,
      removed: false, // Assuming a "removed" flag for soft deletes
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found for the provided Card ID and Gym ID',
      });
    }

    // Use the server time for check-in
    const checkInTime = new Date();

    // Create the attendance record
    const newAttendance = await Attendance.create({
      client: client._id,
      checkInTime,
      gym: gymId, // Associate the attendance with the gym
    });
    const migratedData = migrate(newAttendance);
    return res.status(201).json({
      success: true,
      data: migratedData,
      message: 'Attendance successfully created, Welcome back ' + `${client.name}`,
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
