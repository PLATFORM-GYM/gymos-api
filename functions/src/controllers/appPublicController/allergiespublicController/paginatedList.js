const { migrate } = require('./migrate');
const mongoose = require('mongoose');

const paginatedList = async (Model, req, res) => {
  try {
    const { gymId } = req.query;

    if (!gymId || !mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Valid gymId is required',
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.items, 10) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'name';
    const sortValue = parseInt(req.query.sortValue, 10) || 1;

    const query = { gymId: new mongoose.Types.ObjectId(gymId) };

    const [allergies, count] = await Promise.all([
      Model.find(query).skip(skip).limit(limit).sort({ [sortBy]: sortValue }).exec(),
      Model.countDocuments(query),
    ]);

    const pages = Math.ceil(count / limit);
    const migratedData = allergies.map(migrate);

    return res.status(200).json({
      success: true,
      result: migratedData,
      pagination: { page, pages, count },
      message: 'Successfully retrieved allergies',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

module.exports = paginatedList;
