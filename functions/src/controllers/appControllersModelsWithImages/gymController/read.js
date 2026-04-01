const { migrate } = require('./migrate');

const read = async (Model, req, res) => {
  const userId = req.admin._id; // Get the current user's ID

  // Find the gym by ID and check if the user is an administrator, coach, or client
  let result = await Model.findOne({
    _id: req.params.id,
    removed: false,
    $or: [
      { administrators: userId },
      { coaches: userId },
      { clients: userId }
    ]
  }).exec();

  // If no result is found or the user is not associated, return 404
  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found or access denied',
    });
  }

  // If the document is found, migrate the data and return it
  const migratedData = migrate(result);

  return res.status(200).json({
    success: true,
    result: migratedData,
    message: 'Document found successfully',
  });
};

module.exports = read;
