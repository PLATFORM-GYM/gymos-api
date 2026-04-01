const { migrate } = require('./migrate');

const listAll = async (Model, req, res) => {
  try {
    const userId = req.admin._id;

    const result = await Model.find({
      removed: false,
      $or: [
        { administrators: userId },
        { coaches: userId },
        { clients: userId }
      ]
    })
      .sort({ created: parseInt(req.query.sort) || 'desc' })
      .populate()
      .exec();

    const migratedData = result.map((x) => migrate(x));

    return res.status(200).json({
      success: true,
      result: migratedData,
      message: 'Successfully found all gyms for the current user',
    });
  } catch (error) {
    console.error('[gym.listAll] error:', error.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = listAll;
