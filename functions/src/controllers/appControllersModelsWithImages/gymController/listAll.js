const { migrate } = require('./migrate');

const listAll = async (Model, req, res, next) => {
  try {
    const userId = req.admin._id; // Get the current user’s ID

    // Query gyms where the user is a coach, client, or administrator
    const result = await Model.find({
      removed: false,
      $or: [
        { administrators: userId },
        { coaches: userId },
        { clients: userId }
      ]
    })
      .sort({ created: parseInt(req.query.sort) || 'desc' })
      .populate() // Autopopulate related fields if needed
      .exec();

    // Apply migration or transformation if necessary
    const migratedData = result.map((x) => migrate(x));

    return res.status(200).json({
      success: true,
      result: migratedData,
      message: 'Successfully found all gyms for the current user',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = listAll;
