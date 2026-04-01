const axios = require('axios');
const crypto = require('crypto');
const mongoose = require('mongoose');

const PLATFORM_PLANS = {
  basic: { price: 50000, name: 'GymOS Básico', description: 'Plan básico - 1 gimnasio, hasta 100 clientes' },
  pro: { price: 120000, name: 'GymOS Pro', description: 'Plan Pro - 3 gimnasios, clientes ilimitados' },
  ultra: { price: 200000, name: 'GymOS Ultra', description: 'Plan Ultra - gimnasios ilimitados, white-label' },
};

const WOMPI_SANDBOX_BASE = 'https://sandbox.wompi.co/v1';
const WOMPI_PROD_BASE = 'https://production.wompi.co/v1';
const isProd = process.env.NODE_ENV === 'production';
const WOMPI_BASE = isProd ? WOMPI_PROD_BASE : WOMPI_SANDBOX_BASE;

const PLATFORM_PUBLIC_KEY = process.env.WOMPI_PUB_KEY || process.env.WOMPI_PUBLIC_KEY || '';
const PLATFORM_PRIVATE_KEY = process.env.WOMPI_PRV_KEY || process.env.WOMPI_PRIVATE_KEY || '';
const INTEGRITY_KEY = process.env.WOMPI_INTEGRITY_KEY || '';

const platformCheckout = async (req, res) => {
  try {
    const { plan, billing } = req.body;
    const gymId = req.body.gymId || req.adminId;

    if (!PLATFORM_PUBLIC_KEY) {
      return res.status(500).json({ success: false, message: 'Wompi public key not configured on server' });
    }
    if (!INTEGRITY_KEY) {
      return res.status(500).json({ success: false, message: 'Wompi integrity key not configured on server' });
    }

    const planInfo = PLATFORM_PLANS[plan];
    if (!planInfo) {
      return res.status(400).json({ success: false, message: `Plan '${plan}' not found. Valid: ${Object.keys(PLATFORM_PLANS).join(', ')}` });
    }

    let amountInCents;
    if (billing === 'annual') {
      amountInCents = Math.round(planInfo.price * 12 * 0.8) * 100;
    } else {
      amountInCents = planInfo.price * 100;
    }

    const reference = `GY-PLATFORM-${gymId || 'NEW'}-${Date.now()}`;
    const currency = 'COP';

    const hashInput = `${reference}${amountInCents}${currency}${INTEGRITY_KEY}`;
    const hash = crypto.createHash('sha256').update(hashInput).digest('hex');

    return res.status(200).json({
      success: true,
      result: {
        publicKey: PLATFORM_PUBLIC_KEY,
        currency,
        amountInCents,
        reference,
        hash,
        plan,
        billing,
      },
      message: 'Checkout data created successfully',
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
        const amountCents = transaction.amount_in_cents || 0;
        const isAnnual = amountCents > 200000 * 100;
        if (isAnnual) {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        const planGuess = amountCents <= 5000000 ? 'basic' : amountCents <= 12000000 ? 'pro' : 'ultra';

        await Gym.findByIdAndUpdate(gymId, {
          'platformSubscription.status': 'active',
          'platformSubscription.plan': planGuess,
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
