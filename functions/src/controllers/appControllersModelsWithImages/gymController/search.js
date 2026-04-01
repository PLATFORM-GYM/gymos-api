const { migrate } = require('./migrate');

const search = async (Model, req, res) => {
  try {
    const query = req.query.q || '';
    if (!query.trim()) {
      return res.status(400).json({
        success: false,
        result: [],
        message: 'Query string cannot be empty',
      });
    }

    const userId = req.admin._id; // Get the current user's ID

    // Determine which fields to search
    const fieldsArray = req.query.fields ? req.query.fields.split(',') : ['name'];
    const searchFields = { $or: [] };

    // Add search conditions for each specified field
    for (const field of fieldsArray) {
      searchFields.$or.push({ [field]: { $regex: new RegExp(query, 'i') } });
    }

    // Query to find gyms where the user is a coach, client, or administrator
    const results = await Model.find({
      ...searchFields,
      removed: false,
      $or: [
        { administrators: userId },
        { coaches: userId },
        { clients: userId }
      ]
    })
      .limit(20) // Limit results for performance
      .exec();

    const migratedData = results.map((x) => migrate(x));

    if (results.length > 0) {
      return res.status(200).json({
        success: true,
        result: migratedData,
        message: 'Successfully found matching documents',
      });
    } else {
      return res.status(204).json({
        success: true,
        result: [],
        message: 'No matching documents found',
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, result: null, message: error.message });
  }
};

module.exports = search;
