const { migrate } = require('./migrate');

const paginatedList = async (Model, req, res, next) => {
  try {
    const userId = req.admin._id; // Get the current user's ID

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = (page - 1) * limit;
    const { sortBy = 'enabled', sortValue = -1, filter, equal } = req.query;

    // Search fields for fuzzy matching if provided
    const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];
    let fields = fieldsArray.length === 0 ? {} : { $or: [] };

    for (const field of fieldsArray) {
      fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
    }

    // Define the main query with user filter and other conditions
    const queryConditions = {
      removed: false,
      $or: [
        { administrators: userId },
        { coaches: userId },
        { clients: userId }
      ],
      [filter]: equal,
      ...fields,
    };

    // Retrieve paginated results and total count in parallel
    const resultsPromise = Model.find(queryConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortValue })
      .populate()
      .exec();

    const countPromise = Model.countDocuments(queryConditions);

    const [result, count] = await Promise.all([resultsPromise, countPromise]);
    const pages = Math.ceil(count / limit);

    if (count > 0) {
      const migratedData = result.map((x) => migrate(x));
      return res.status(200).json({
        success: true,
        result: migratedData,
        pagination: { page, pages, count },
        message: 'Successfully found gyms for the current user',
      });
    } else {
      return res.status(203).json({
        success: true,
        result: [],
        pagination: { page, pages, count },
        message: 'No gyms found for the current user',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: true,
      result: [],
      pagination: { page, pages, count },
      message: `${error}`,
    });
  }
};

module.exports = paginatedList;
