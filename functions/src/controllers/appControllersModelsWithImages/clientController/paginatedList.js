const { migrate } = require('./migrate');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const paginatedList = async (Model, req, res) => {
  try {
    // Extract query parameters
    const {
      page = 1,
      items = 10,
      sortBy = 'enabled',
      sortValue = -1,
      filter,
      equal,
      fields,
      q,
      gymId,
    } = req.query;

    // Convert page and items to integers
    const pageNumber = parseInt(page, 10);
    const limit = parseInt(items, 10);
    const skip = (pageNumber - 1) * limit;

    // Initialize query conditions
    const queryConditions = { removed: false };

    // Add gymId to query conditions if provided
    if (gymId) {
      queryConditions.gym = new ObjectId(gymId);
    }

    // Add filter and equal conditions if provided
    if (filter && equal) {
      queryConditions[filter] = equal;
    }

    // Handle search fields and query
    if (fields && q) {
      const fieldsArray = fields.split(',');
      queryConditions.$or = fieldsArray.map((field) => ({
        [field]: { $regex: new RegExp(q, 'i') },
      }));
    }

    // Execute the query with pagination and sorting
    const [results, count] = await Promise.all([
      Model.find(queryConditions)
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortValue })
        .populate()
        .exec(),
      Model.countDocuments(queryConditions),
    ]);

    // Calculate total pages
    const pages = Math.ceil(count / limit);

    // Prepare pagination information
    const pagination = { page: pageNumber, pages, count };

    // Migrate data if necessary
    const migratedData = results.map((x) => migrate(x));

    // Respond with the results
    return res.status(200).json({
      success: true,
      result: migratedData,
      pagination,
      message: count > 0 ? 'Successfully found all documents' : 'Collection is Empty',
    });
  } catch (error) {
    // Handle errors
    return res.status(500).json({
      success: false,
      result: [],
      message: `An error occurred: ${error.message}`,
    });
  }
};

module.exports = paginatedList;
