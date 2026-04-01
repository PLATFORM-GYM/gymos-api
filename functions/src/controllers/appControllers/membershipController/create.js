const mongoose = require('mongoose');
const Membership = mongoose.model('Membership');

// Create a new membership
const create =async (Model, req, res) => {
  try {
    const { name, price, type, categoryIds, gymId,attendances } = req.body;
    const newMembership = await Membership.create({
      name,
      price,
      type,
      attendances,
      category: categoryIds, 
      gymId
    });

    return res.status(201).json({
      success: true,
      data: newMembership,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating membership',
      error: error.message,
    });
  }
};

module.exports = create;