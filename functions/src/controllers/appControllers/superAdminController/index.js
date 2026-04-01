const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const DEFAULT_PLANS_CONFIG = {
  annualDiscount: 20,
  plans: [
    {
      id: 'basic',
      name: 'Básico',
      monthlyPrice: 50000,
      features: ['Hasta 50 clientes', 'Clases básicas', 'Soporte email'],
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 120000,
      features: ['Hasta 200 clientes', 'Clases ilimitadas', 'Agenda docentes', 'Soporte prioritario'],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: 250000,
      features: ['Clientes ilimitados', 'Multi-sede', 'API acceso', 'Soporte dedicado'],
    },
  ],
};

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

// ─── Platform Plans Config ────────────────────────────────────────────────────

const getPlansConfig = async (req, res) => {
  try {
    const Setting = mongoose.model('Setting');
    const setting = await Setting.findOne({ settingCategory: 'platform', settingKey: 'plans' }).exec();
    const config = setting?.settingValue || DEFAULT_PLANS_CONFIG;

    return res.status(200).json({ success: true, result: config, message: 'Plans config retrieved' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updatePlansConfig = async (req, res) => {
  try {
    const Setting = mongoose.model('Setting');
    const { plans, annualDiscount } = req.body;

    if (!Array.isArray(plans) || plans.length === 0) {
      return res.status(400).json({ success: false, message: 'plans array is required' });
    }

    const discount = Math.min(100, Math.max(0, Number(annualDiscount) || 0));

    const config = { plans, annualDiscount: discount };

    await Setting.findOneAndUpdate(
      { settingCategory: 'platform', settingKey: 'plans' },
      { settingCategory: 'platform', settingKey: 'plans', settingValue: config, valueType: 'Object' },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, result: config, message: 'Plans config updated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Gym Platform Subscriptions ───────────────────────────────────────────────

const listGymSubscriptions = async (req, res) => {
  try {
    const Gym = mongoose.model('Gym');
    const gyms = await Gym.find({ removed: false })
      .select('name email slug platformSubscription created')
      .sort({ created: -1 })
      .exec();

    return res.status(200).json({ success: true, result: gyms, message: 'Subscriptions retrieved' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateGymSubscription = async (req, res) => {
  try {
    const Gym = mongoose.model('Gym');
    const { gymId } = req.params;
    const { status, plan, price, billingCycle, extendUnit, extendAmount, endDate } = req.body;

    const gym = await Gym.findById(gymId).exec();
    if (!gym) return res.status(404).json({ success: false, message: 'Gym not found' });

    const sub = gym.platformSubscription || {};

    if (status) sub.status = status;
    if (plan) sub.plan = plan;
    if (price !== undefined) sub.price = Number(price);
    if (billingCycle) sub.billingCycle = billingCycle;

    // Extend by unit (weeks/months) or set explicit endDate
    if (endDate) {
      sub.endDate = new Date(endDate);
    } else if (extendUnit && extendAmount) {
      const base = sub.endDate && new Date(sub.endDate) > new Date() ? new Date(sub.endDate) : new Date();
      const amount = Number(extendAmount);
      if (extendUnit === 'days') base.setDate(base.getDate() + amount);
      else if (extendUnit === 'weeks') base.setDate(base.getDate() + amount * 7);
      else if (extendUnit === 'months') base.setMonth(base.getMonth() + amount);
      else if (extendUnit === 'years') base.setFullYear(base.getFullYear() + amount);
      sub.endDate = base;
    }

    if (!sub.startDate) sub.startDate = new Date();

    gym.platformSubscription = sub;
    await gym.save();

    return res.status(200).json({
      success: true,
      result: { gymId, platformSubscription: sub },
      message: 'Gym subscription updated',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listGyms,
  getGymDetail,
  getGymClients,
  impersonate,
  getPlatformStats,
  getPlansConfig,
  updatePlansConfig,
  listGymSubscriptions,
  updateGymSubscription,
};
