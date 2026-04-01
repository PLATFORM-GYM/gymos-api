const mongoose = require('mongoose');
const Subscription = mongoose.model('Subscription');

const update = async (Model, req, res) => {
  try {
    const { id } = req.params;

    const updatedSubscription = await Subscription.findOneAndUpdate(
      { _id: id, removed: false },
      req.body,
      { new: true, runValidators: true }
    ).exec();

    if (!updatedSubscription) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Subscription not found.',
      });
    }

    return res.status(200).json({
      success: true,
      result: updatedSubscription,
      message: 'Subscription successfully updated.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating subscription: ' + error.message,
    });
  }
};

module.exports = update;
