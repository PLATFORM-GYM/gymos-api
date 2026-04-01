const { migrate } = require('./migrate');
const mongoose = require('mongoose');

const paginatedList = async (Model, req, res, next) => {
  try {
    const { gymId, clientId, q, page = 1, items = 10, sortBy = 'checkInTime', sortValue = -1 } = req.query;

    const limit = parseInt(items);
    const skip = (parseInt(page) - 1) * limit;

    // Build query conditions
    const queryConditions = {};
    if (gymId && mongoose.Types.ObjectId.isValid(gymId)) {
      queryConditions.gymId = new mongoose.Types.ObjectId(gymId); // Filter by gymId
    }
    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      queryConditions.client = new mongoose.Types.ObjectId(clientId); // Filter by clientId
    }
    if (q) {
      queryConditions.$or = [
        { 'client.name': { $regex: new RegExp(q, 'i') } }, // Search by client name
        { 'client.email': { $regex: new RegExp(q, 'i') } }, // Search by client email
      ];
    }

    // Fetch paginated attendances and total count concurrently
    const attendancesPromise = Model.find(queryConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortValue })
      .populate('client') // Populate client details
      .exec();

    const countPromise = Model.countDocuments(queryConditions);

    const [attendances, count] = await Promise.all([attendancesPromise, countPromise]);
    const pages = Math.ceil(count / limit);

    if (count > 0) {
      const migratedData = attendances.map((attendance) => migrate(attendance));
      return res.status(200).json({
        success: true,
        result: migratedData,
        pagination: { page, pages, count },
        message: 'Successfully found attendance records',
      });
    } else {
      return res.status(203).json({
        success: true,
        result: [],
        pagination: { page, pages, count },
        message: 'No attendance records found',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: [],
      message: `Error fetching attendance records: ${error.message}`,
    });
  }
};

module.exports = paginatedList;
