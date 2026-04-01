const { migrate } = require('./migrate');
const mongoose = require('mongoose');

const paginatedList = async (Model, req, res, next) => {
  try {
    const gymId = req.query.gymId; // Get gymId from query parameters

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = (page - 1) * limit;
    const { sortBy = 'name', sortValue = -1, filter, equal } = req.query;
    const gymObjectId = new mongoose.Types.ObjectId(gymId);
    // Prepare search conditions based on provided fields and search query (fuzzy matching)
    const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];
    let fields = fieldsArray.length === 0 ? {} : { $or: [] };

    for (const field of fieldsArray) {
      fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
    }

    // Define the main query conditions to filter by gymId and other parameters
    const queryConditions = {
      gymId: gymObjectId, // Filter by gymId from query params
      [filter]: equal,
      ...fields,
    };

    // Fetch paginated memberships and total count concurrently
    const membershipsPromise = Model.find(queryConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortValue })
      .populate('category') // Populate categories if needed
      .exec();

    const countPromise = Model.countDocuments(queryConditions);

    const [memberships, count] = await Promise.all([membershipsPromise, countPromise]);
    const pages = Math.ceil(count / limit);

    if (count > 0) {
      const migratedData = memberships.map((membership) => migrate(membership));
      return res.status(200).json({
        success: true,
        result: migratedData,
        pagination: { page, pages, count },
        message: 'Successfully found memberships for the specified gym',
      });
    } else {
      return res.status(203).json({
        success: true,
        result: [],
        pagination: { page, pages, count },
        message: 'No memberships found for the specified gym',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: true,
      result: [],
      message: `${error}`,
    });
  }
};

module.exports = paginatedList;
