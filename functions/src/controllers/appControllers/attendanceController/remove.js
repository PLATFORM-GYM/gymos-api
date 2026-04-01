const mongoose = require('mongoose');
const Attendance = mongoose.model('Attendance');

const remove = async (Model, req, res) => {
  try {
    const { id } = req.params;

    // Check if the attendance record exists and has not already been removed
    const attendance = await Attendance.findOne({
      _id: id,
      removed: false,
    }).exec();

    if (!attendance) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No attendance record found by this ID: ' + id,
      });
    }

    // Implement business rules to restrict deletion if necessary
    // Example: Prevent deletion of attendance records older than a certain date
    const today = new Date();
    if (attendance.checkInTime && attendance.checkInTime < today.setDate(today.getDate() - 30)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Cannot delete attendance records older than 30 days',
      });
    }

    // Mark the attendance record as removed
    const result = await Model.findOneAndUpdate(
      { _id: id, removed: false },
      {
        $set: {
          removed: true,
        },
      }
    ).exec();

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No attendance record found by this ID: ' + id,
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully deleted the attendance record by ID: ' + id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error deleting attendance record: ' + error.message,
    });
  }
};

module.exports = remove;
