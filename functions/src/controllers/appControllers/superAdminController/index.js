const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const listGyms = async (req, res) => {
  try {
    const Gym = mongoose.model('Gym');
    const gyms = await Gym.find({ removed: false })
      .select('-wompiSettings.privateKey -wompiSettings.eventsKey -salt')
      .sort({ created: -1 })
      .exec();

    return res.status(200).json({
      success: true,
      result: gyms,
      message: 'Gyms retrieved successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getGymDetail = async (req, res) => {
  try {
    const Gym = mongoose.model('Gym');
    const Subscription = mongoose.model('Subscription');
    const Client = mongoose.model('Client');

    const gym = await Gym.findById(req.params.id)
      .select('-wompiSettings.privateKey -wompiSettings.eventsKey -salt')
      .exec();

    if (!gym) return res.status(404).json({ success: false, message: 'Gym not found' });

    const clientCount = await Client.countDocuments({ gym: req.params.id, removed: false });
    const activeSubscriptions = await Subscription.countDocuments({
      'membership.gymId': req.params.id,
      status: 'active',
    });

    return res.status(200).json({
      success: true,
      result: { gym, stats: { clientCount, activeSubscriptions } },
      message: 'Gym detail retrieved',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getGymClients = async (req, res) => {
  try {
    const Client = mongoose.model('Client');
    const clients = await Client.find({ gym: req.params.gymId, removed: false })
      .sort({ created: -1 })
      .exec();

    return res.status(200).json({ success: true, result: clients, message: 'Clients retrieved' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Generate a short-lived impersonation token for a gym admin
const impersonate = async (req, res) => {
  try {
    const Admin = mongoose.model('Admin');
    const Gym = mongoose.model('Gym');

    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const gym = await Gym.findById(req.params.gymId).exec();
    if (!gym || !gym.administrators?.length) {
      return res.status(404).json({ success: false, message: 'Gym or admin not found' });
    }

    const adminId = gym.administrators[0]._id || gym.administrators[0];
    const admin = await Admin.findById(adminId).exec();
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    const token = jwt.sign(
      { id: admin._id, role: admin.role, gymId: gym._id, impersonatedBy: req.admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      success: true,
      result: { token, adminName: `${admin.name} ${admin.surname || ''}`, gymName: gym.name },
      message: 'Impersonation token generated',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPlatformStats = async (req, res) => {
  try {
    const Gym = mongoose.model('Gym');
    const Client = mongoose.model('Client');
    const Subscription = mongoose.model('Subscription');

    const [totalGyms, activeGyms, totalClients, activeSubscriptions] = await Promise.all([
      Gym.countDocuments({ removed: false }),
      Gym.countDocuments({ removed: false, 'platformSubscription.status': 'active' }),
      Client.countDocuments({ removed: false }),
      Subscription.countDocuments({ status: 'active' }),
    ]);

    const revenueGyms = await Gym.find({
      removed: false,
      'platformSubscription.status': 'active',
    }).select('name platformSubscription').exec();

    const monthlyRevenue = revenueGyms.reduce((sum, g) => sum + (g.platformSubscription?.price || 0), 0);

    return res.status(200).json({
      success: true,
      result: { totalGyms, activeGyms, totalClients, activeSubscriptions, monthlyRevenue },
      message: 'Platform stats retrieved',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { listGyms, getGymDetail, getGymClients, impersonate, getPlatformStats };
