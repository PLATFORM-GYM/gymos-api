const listAll = async (Model, req, res) => {
  const sort = req.query.sort || 'desc';
  const enabled = req.query.enabled || undefined;
  const gymId = req.query.gymId;

  const query = { removed: false };

  if (enabled !== undefined) {
    query.enabled = enabled;
  }

  if (gymId && gymId !== 'undefined') {
    query.gym = gymId;
  }

  const result = await Model.find(query)
    .sort({ created: sort })
    .populate()
    .exec();

  if (result.length > 0) {
    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully found all documents',
    });
  } else {
    return res.status(203).json({
      success: false,
      result: [],
      message: 'Collection is Empty',
    });
  }
};

module.exports = listAll;
