const mongoose = require('mongoose');
const { migrate } = require('./migrate');
const { ObjectId } = mongoose.Types;
const listAll = async (Model, req, res) => {
  try {
    // Extract gymId and sort from query parameters
    const { gymId, sort = 'desc' } = req.query;

    if (!gymId || gymId === 'undefined' || !ObjectId.isValid(gymId)) {
      return res.status(203).json({
        success: true,
        result: [],
        message: 'No gymId provided — select a gym first.',
      });
    }

    // Determine sort order
    const sortOrder = sort.toLowerCase() === 'asc' ? 1 : -1;

    // Query the database for clients associated with the specified gymId
    const results = await Model.find({
      removed: false,
      gym: new ObjectId(gymId),
    })
      .sort({ created: sortOrder })
      .populate()
      .exec();

    // Migrate data if necessary
    const migratedData = results.map((x) => migrate(x));

    // Respond with the results
    if (results.length > 0) {
      return res.status(200).json({
        success: true,
        result: migratedData,
        message: 'Successfully found all documents.',
      });
    } else {
      return res.status(204).json({
        success: true,
        result: [],
        message: 'No documents found for the specified gym.',
      });
    }
  } catch (error) {
    // Handle errors
    return res.status(500).json({
      success: false,
      result: [],
      message: `An error occurred: ${error.message}`,
    });
  }
};

module.exports = listAll;
