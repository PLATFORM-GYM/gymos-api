const mongoose = require('mongoose');
const Subscription = mongoose.model('Subscription');

const remove = async (Model, req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findOne({ _id: id, removed: false }).exec();

    if (!subscription) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Subscription not found.',
      });
    }

    const result = await Subscription.findOneAndUpdate(
      { _id: id, removed: false },
      { $set: { removed: true } },
      { new: true }
    ).exec();

    return res.status(200).json({
      success: true,
      result,
      message: 'Subscription successfully removed.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error removing subscription: ' + error.message,
    });
  }
};

module.exports = remove;
