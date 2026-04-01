const { migrate } = require('./migrate');
const mongoose = require('mongoose');

const paginatedList = async (Model, req, res, next) => {
  try {
    const { clientId, membershipId, page = 1, items = 10, sortBy = 'startDate', sortValue = -1 } = req.query;

    const limit = parseInt(items);
    const skip = (parseInt(page) - 1) * limit;

    const queryConditions = {};

    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      queryConditions.client = clientId;
    }

    if (membershipId && mongoose.Types.ObjectId.isValid(membershipId)) {
      queryConditions.membership = membershipId;
    }

    const subscriptionsPromise = Model.find(queryConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortValue })
      .exec();

    const countPromise = Model.countDocuments(queryConditions);

    const [subscriptions, count] = await Promise.all([subscriptionsPromise, countPromise]);
    const pages = Math.ceil(count / limit);

    if (subscriptions.length > 0) {
      const migratedData = subscriptions.map(migrate);
      return res.status(200).json({
        success: true,
        result: migratedData,
        pagination: { page, pages, count },
        message: 'Successfully retrieved subscriptions.',
      });
    } else {
      return res.status(204).json({
        success: true,
        result: [],
        pagination: { page, pages, count },
        message: 'No subscriptions found.',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: [],
      message: 'Error retrieving subscriptions: ' + error.message,
    });
  }
};

module.exports = paginatedList;
