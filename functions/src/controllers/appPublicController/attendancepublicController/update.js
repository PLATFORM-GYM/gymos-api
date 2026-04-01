const mongoose = require('mongoose');
const Attendance = mongoose.model('Attendance');
const Client = mongoose.model('Client');

const update = async (Model, req, res) => {
  try {
    // Ensure the document is not marked as removed
    req.body.removed = false;

    // Find the attendance record by ID and update it with the request body
    const result = await Model.findOneAndUpdate(
      { _id: req.params.id, removed: false }, // Match only non-removed records
      req.body,
      {
        new: true, // Return the updated document
        runValidators: true, // Enforce schema validations
      }
    ).exec();

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No attendance record found',
      });
    }

    // Optional: Cascade updates to related models if necessary
    // Example: Updating the client's last attendance date
    if (result.client) {
      await Client.findOneAndUpdate(
        { _id: result.client },
        { lastAttendance: result.checkOutTime || new Date() }, // Update with the new check-out time or current date
        { new: true }
      ).exec();
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully updated the attendance record',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error updating attendance record: ' + error.message,
    });
  }
};

module.exports = update;
