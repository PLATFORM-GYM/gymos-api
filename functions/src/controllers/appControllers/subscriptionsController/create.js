const mongoose = require('mongoose');
const Subscription = mongoose.model('Subscription');

const create = async (Model, req, res) => {
  try {
    const { client, membership, startDate, endDate, status, attendances } = req.body;

    // Validate required fields
    if (!client || !membership || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Client, membership, startDate, and endDate are required.',
      });
    }

    // Create a new subscription
    const newSubscription = await Subscription.create({
      client,
      membership,
      startDate,
      endDate,
      status,
      attendances,
    });

    return res.status(201).json({
      success: true,
      result: newSubscription,
      message: 'Subscription created successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating subscription: ' + error.message,
    });
  }
};

module.exports = create;
