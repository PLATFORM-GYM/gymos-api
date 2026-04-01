const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
  try {
    const Admin = mongoose.model('Admin');
    const Gym = mongoose.model('Gym');

    const { name, surname, email, password, role = 'owner', gymName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Name, email and password are required',
      });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase(), removed: false });
    if (existing) {
      return res.status(409).json({
        success: false,
        result: null,
        message: 'An account with this email already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await Admin.create({
      name,
      surname: surname || '',
      email: email.toLowerCase(),
      password: hashedPassword,
      role: ['owner', 'admin', 'superadmin'].includes(role) ? role : 'owner',
      enabled: true,
    });

    let gym = null;
    if (gymName && newAdmin.role === 'owner') {
      const slug = gymName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      gym = await Gym.create({
        name: gymName,
        slug,
        administrators: [newAdmin._id],
        createdBy: newAdmin._id,
        enabled: true,
      });
    }

    return res.status(201).json({
      success: true,
      result: {
        _id: newAdmin._id,
        name: newAdmin.name,
        surname: newAdmin.surname,
        email: newAdmin.email,
        role: newAdmin.role,
        gymId: gym?._id,
        gymName: gym?.name,
      },
      message: 'Account created successfully. Please sign in.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = register;
