const mongoose = require('mongoose');
const moment = require('moment');

const InvoiceModel = mongoose.model('Invoice');

const summary = async (Model, req, res, next) => {
  try {
    let defaultType = 'month';
    const { type } = req.query;

    if (type && ['week', 'month', 'year'].includes(type)) {
      defaultType = type;
    } else if (type) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid type',
      });
    }

    const currentDate = moment();
    const startDate = currentDate.clone().startOf(defaultType);
    const endDate = currentDate.clone().endOf(defaultType);

    const pipeline = [
      {
        $facet: {
          totalClients: [
            {
              $match: {
                removed: false,
                enabled: true,
              },
            },
            {
              $count: 'count',
            },
          ],
          newClients: [
            {
              $match: {
                removed: false,
                created: { $gte: startDate.toDate(), $lte: endDate.toDate() },
                enabled: true,
              },
            },
            {
              $count: 'count',
            },
          ],
          activeClients: [
            {
              $lookup: {
                from: InvoiceModel.collection.name,
                localField: '_id', // Match _id from Gym model
                foreignField: 'gym', // Match gym field in Invoice model
                as: 'invoices',
              },
            },
            {
              $match: {
                'invoices.removed': false,
              },
            },
            {
              $group: {
                _id: '$_id',
              },
            },
            {
              $count: 'count',
            },
          ],
        },
      },
    ];

    const aggregationResult = await Model.aggregate(pipeline);
    const result = aggregationResult[0];
    const totalClients = result.totalClients[0] ? result.totalClients[0].count : 0;
    const totalNewClients = result.newClients[0] ? result.newClients[0].count : 0;
    const activeClients = result.activeClients[0] ? result.activeClients[0].count : 0;

    const totalActiveClientsPercentage = totalClients > 0 ? (activeClients / totalClients) * 100 : 0;
    const totalNewClientsPercentage = totalClients > 0 ? (totalNewClients / totalClients) * 100 : 0;

    return res.status(200).json({
      success: true,
      result: {
        new: Math.round(totalNewClientsPercentage),
        active: Math.round(totalActiveClientsPercentage),
      },
      message: 'Successfully retrieved summary of new and active clients',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = summary;
