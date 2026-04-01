const mongoose = require('mongoose');

const update = async (Model, req, res) => {
  const { id } = req.params;
  let { administrators, coaches, clients, logo, ...updateFields } = req.body;

  // Check if `id` is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Gym ID provided.',
    });
  }

  console.log(logo);

  // Extract the unique ID from the `logo` field
  if (logo) {
    try {
      const parts = logo.split('/'); // Example: "public/uploads/gyms/uniqueId/image/logo.jpg"
      const extractedSalt = parts[3]; // Assuming "uniqueId" is the 4th part
      updateFields.salt = extractedSalt; // Add extracted salt to updateFields
      updateFields.logo = logo; // Add extracted salt to updateFields
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid logo path format.',
      });
    }
  }

  // Parse and validate JSON fields
  try {
    administrators = typeof administrators === 'string' ? JSON.parse(administrators) : administrators;
    coaches = typeof coaches === 'string' ? JSON.parse(coaches) : coaches;
    clients = typeof clients === 'string' ? JSON.parse(clients) : clients;
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format for administrators, coaches, or clients.',
    });
  }

  // Helper function to convert IDs to ObjectId
  const convertToObjectIdArray = (ids) => {
    if (!Array.isArray(ids)) return [];
    return ids
      .map((id) => {
        try {
          return new mongoose.Types.ObjectId(id); // Convert to ObjectId
        } catch (err) {
          console.error(`Invalid ObjectId: ${id}`);
          return null; // Filter out invalid IDs
        }
      })
      .filter((id) => id !== null); // Remove invalid IDs
  };

  // Convert fields to ObjectId arrays
  if (administrators) updateFields.administrators = convertToObjectIdArray(administrators);
  if (coaches) updateFields.coaches = convertToObjectIdArray(coaches);
  if (clients) updateFields.clients = convertToObjectIdArray(clients);

  try {
    // Find and update the gym
    const updatedGym = await Model.findOneAndUpdate(
      { _id: id, removed: false },
      updateFields,
      {
        new: true, // Return the updated document
        runValidators: true, // Enforce schema validations
      }
    ).exec();

    if (!updatedGym) {
      return res.status(404).json({
        success: false,
        message: `No Gym found with ID: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      result: updatedGym,
      message: 'Gym updated successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the gym.',
      error: error.message,
    });
  }
};

module.exports = update;
