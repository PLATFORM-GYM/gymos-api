const axios = require('axios');
const mongoose = require('mongoose');

const PLATFORM_PLANS = {
  basic: { price: 50000, name: 'GymOS Basic', description: 'Plan básico - hasta 50 clientes' },
  pro: { price: 120000, name: 'GymOS Pro', description: 'Plan Pro - hasta 200 clientes' },
  enterprise: { price: 250000, name: 'GymOS Enterprise', description: 'Plan Enterprise - clientes ilimitados' },
};

const WOMPI_SANDBOX_BASE = 'https://sandbox.wompi.co/v1';
const WOMPI_PROD_BASE = 'https://production.wompi.co/v1';
const isProd = process.env.NODE_ENV === 'production';
const WOMPI_BASE = isProd ? WOMPI_PROD_BASE : WOMPI_SANDBOX_BASE;

const PLATFORM_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || '';
const PLATFORM_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY || '';

// Checkout for PLATFORM subscription (gym owners paying GymOS)
const platformCheckout = async (req, res) => {
  try {
    const { gymId, plan } = req.body;

    const planInfo = PLATFORM_PLANS[plan];
    if (!planInfo) {
      return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    const reference = `GY-PLATFORM-${gymId}-${Date.now()}`;

    const response = await axios.post(
      `${WOMPI_BASE}/payment_links`,
      {
        name: planInfo.name,
        description: planInfo.description,
        single_use: true,
        collect_shipping: false,
        currency: 'COP',
        amount_in_cents: planInfo.price * 100,
        redirect_url: `${process.env.FRONTEND_URL}/dashboard/settings?payment=platform`,
        reference,
      },
      {
        headers: {
          Authorization: `Bearer ${PLATFORM_PRIVATE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json({
      success: true,
      result: {
        checkoutUrl: response.data?.data?.payment_link?.permalink,
        reference,
        plan,
        amount: planInfo.price,
      },
      message: 'Checkout created successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Checkout for GYM CLIENT subscription (using gym's own Wompi keys)
const gymClientCheckout = async (req, res) => {
  try {
    const { gymId, membershipId, clientName, clientEmail } = req.body;

    const Gym = mongoose.model('Gym');
    const Membership = mongoose.model('Membership');

    const gym = await Gym.findById(gymId).exec();
    if (!gym) return res.status(404).json({ success: false, message: 'Gym not found' });

    const { wompiSettings } = gym;
    if (!wompiSettings?.privateKey) {
      return res.status(400).json({
        success: false,
        message: 'This gym has not configured Wompi payment settings yet',
      });
    }

    const membership = await Membership.findById(membershipId).exec();
    if (!membership) return res.status(404).json({ success: false, message: 'Membership not found' });

    const reference = `GY-${gymId.toString().slice(-6).toUpperCase()}-${membershipId.toString().slice(-6).toUpperCase()}-${Date.now()}`;

    const response = await axios.post(
      `${WOMPI_BASE}/payment_links`,
      {
        name: `${gym.name} - ${membership.name}`,
        description: `Suscripción ${membership.name} - ${gym.name}`,
        single_use: true,
        collect_shipping: false,
        currency: 'COP',
        amount_in_cents: membership.price * 100,
        redirect_url: wompiSettings.redirectUrl || `${process.env.FRONTEND_URL}/payment-success`,
        reference,
      },
      {
        headers: {
          Authorization: `Bearer ${wompiSettings.privateKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json({
      success: true,
      result: {
        checkoutUrl: response.data?.data?.payment_link?.permalink,
        reference,
        gymName: gym.name,
        membershipName: membership.name,
        amount: membership.price,
      },
      message: 'Checkout created successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Wompi webhook handler — GY prefix routes here
const webhookHandler = async (req, res) => {
  try {
    const payload = req.body;
    const event = payload?.event;
    const transaction = payload?.data?.transaction;

    if (!transaction) return res.status(200).json({ received: true });

    const { reference, status } = transaction;

    if (reference?.startsWith('GY-PLATFORM-')) {
      const parts = reference.split('-');
      const gymId = parts[2];

      if (status === 'APPROVED') {
        const Gym = mongoose.model('Gym');
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        await Gym.findByIdAndUpdate(gymId, {
          'platformSubscription.status': 'active',
          'platformSubscription.startDate': startDate,
          'platformSubscription.endDate': endDate,
          'platformSubscription.wompiRef': reference,
        });
      }
    } else if (reference?.startsWith('GY-')) {
      if (status === 'APPROVED') {
        const Subscription = mongoose.model('Subscription');
        await Subscription.findOneAndUpdate(
          { wompiRef: reference },
          { status: 'active', wompiStatus: status }
        );
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get platform pricing plans
const getPlans = async (req, res) => {
  return res.status(200).json({
    success: true,
    result: Object.entries(PLATFORM_PLANS).map(([key, val]) => ({ id: key, ...val })),
    message: 'Plans retrieved',
  });
};

module.exports = { platformCheckout, gymClientCheckout, webhookHandler, getPlans };
