const mongoose = require('mongoose');

const getBySlug = async (Model, req, res) => {
  try {
    const { slug } = req.params;

    const result = await Model.findOne({ slug, removed: false, enabled: true })
      .select('-wompiSettings.privateKey -wompiSettings.eventsKey -salt')
      .exec();

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Gym not found',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Gym found successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, result: null, message: error.message });
  }
};

module.exports = getBySlug;
