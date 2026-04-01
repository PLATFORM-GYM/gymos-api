const mongoose = require('mongoose');

const create = async (Model, req, res) => {
  const { name, email, address, contactPhone, logo, category, createdBy } = req.body;
  let { administrators, coaches, clients } = req.body;
  // Validate required fields
  if (!name || !address) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both name and address for the gym.',
    });
  }
  console.log(administrators,coaches, clients, typeof(administrators) )
  // Extract the unique ID from the `logo` field
  let extractedSalt = '';
  if (logo) {
    try {
      const parts = logo.split('/'); // Example: "public/uploads/gyms/uniqueId/image/logo.jpg"
      extractedSalt = parts[3]; // Assuming "uniqueId" is the 4th part
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid logo path format.',
      });
    }
  }

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
    return ids.map((id) => {
      try {
        return new mongoose.Types.ObjectId(id); // Convert to ObjectId
      } catch (err) {
        console.error(`Invalid ObjectId: ${id}`);
        return null; // Filter out invalid IDs
      }
    }).filter((id) => id !== null); // Remove invalid IDs
  };

  // Convert fields to ObjectId arrays
  const adminObjectIds = convertToObjectIdArray(administrators);
  const coachObjectIds = convertToObjectIdArray(coaches);
  const clientObjectIds = convertToObjectIdArray(clients);

  // Check if a gym with the same name, address, and salt already exists
  const existingGym = await Model.findOne({
    name,
    address,
    removed: false,
  });

  if (existingGym) {
    return res.status(403).json({
      success: false,
      message: 'Gym already exists.',
    });
  }

  // Prepare gym data
  const gymData = {
    name,
    email,
    address,
    contactPhone,
    logo,
    administrators: adminObjectIds, // Converted ObjectId array
    coaches: coachObjectIds, // Converted ObjectId array
    clients: clientObjectIds, // Converted ObjectId array
    category,
    createdBy,
    salt: extractedSalt,
    removed: false,
  };

  // Create and save the gym
  const newGym = new Model(gymData);
  const result = await newGym.save();

  return res.status(201).json({
    success: true,
    result,
    message: 'Successfully created the gym.',
  });
};

module.exports = create;
