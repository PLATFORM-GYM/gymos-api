const { generate: uniqueId } = require('shortid');
const mongoose = require('mongoose');

const create = async (Model, req, res) => {
  try {
    // Dynamically obtain the User and UserPassword models based on the provided Model parameter
    const Admin = mongoose.model(Model);
    const UserPassword = mongoose.model('AdminPassword'); // Uses 'AdminPassword' as the password model for users
    
    const newAdminPassword = new UserPassword();

    const { email, password, name, surname, role } = req.body;
 
    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and name.',
      });
    }

    // Check if a user with the same email already exists
    const existingUser = await Admin.findOne({ email, removed: false });
    if (existingUser) {
      return res.status(403).json({
        success: false,
        message: `${Model} with this email already exists.`,
      });
    }

    // Validate and assign role; default to 'client' if role is invalid or not provided
    const validRoles = ['client', 'coach', 'admin', 'superadmin', 'owner'];
    const assignedRole = validRoles.includes(role) ? role : 'client';

    // Generate a unique salt and hash the password
    const salt = uniqueId();
    const passwordHash = newAdminPassword.generateHash(salt, password);
    // Create and save the User document (e.g., Admin, Coach)
    const newUser = {
      email,
      name,
      role: assignedRole,
    };
    const savedUser = await new Admin(newUser).save();
    // Create and save the UserPassword document with hashed password, linking to the User document
    const userPasswordData = {
      password: passwordHash,
      emailVerified: true,
      salt: salt,
      user: savedUser._id,
    };
    await new UserPassword(userPasswordData).save();

    return res.status(201).json({
      success: true,
      result: savedUser,
      message: `Successfully created the ${Model} and associated password.`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred during user creation.',
      error: error.message,
    });
  }
};

module.exports = create;
