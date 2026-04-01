const { migrate } = require('./migrate');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const search = async (Model, req, res) => {
  try {
    const { gymId } = req.query;

    if (!gymId || !ObjectId.isValid(gymId)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Valid gymId is required',
      });
    }

    const result = await Model.findOne({ _id: new ObjectId(gymId), removed: false }).exec();
    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No document found for the specified gym',
      });
    }

    const migratedData = migrate(result);

    return res.status(200).json({
      success: true,
      result: migratedData,
      message: 'Successfully found the document for the specified gym',
    });
  } catch (error) {
    return res.status(500).json({ success: false, result: null, message: error.message });
  }
};

module.exports = search;
