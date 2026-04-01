const { migrate } = require('./migrate');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const search = async (Model, req, res, next) => {
  try {
    const { gymId, type, category } = req.query;

    // Validate gymId
    if (!gymId || !ObjectId.isValid(gymId)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Valid gymId is required',
      });
    }

    // Build query
    const query = { gymId: new ObjectId(gymId) };

    // Optional filters
    if (type) query.type = type; // Filter by membership type
    if (category && ObjectId.isValid(category)) query.category = new ObjectId(category);

    // Fetch memberships
    const results = await Model.find(query).exec();

    if (!results || results.length === 0) {
      return res.status(204).json({
        success: true,
        result: null,
        message: 'No memberships found for the specified gym',
      });
    }

    // Migrate and format the results if needed
    const migratedData = results.map(migrate);

    return res.status(200).json({
      success: true,
      result: migratedData,
      message: 'Successfully found memberships for the specified gym',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = search;
