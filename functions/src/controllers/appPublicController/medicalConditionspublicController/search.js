const { migrate } = require('./migrate');
const mongoose = require('mongoose');

const search = async (Model, req, res) => {
  try {
    const { gymId, q } = req.query;

    if (!gymId || !mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Valid gymId is required',
      });
    }

    const query = { gymId: new mongoose.Types.ObjectId(gymId) };
    if (q && q.trim()) {
      query.name = { $regex: new RegExp(q, 'i') };
    }

    const results = await Model.find(query).exec();
    const migratedData = results.map(migrate);

    return res.status(results.length ? 200 : 204).json({
      success: true,
      result: migratedData,
      message: results.length ? 'Successfully found medical conditions' : 'No medical conditions found',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: `An error occurred: ${error.message}`,
    });
  }
};

module.exports = search;
