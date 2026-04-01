const crypto = require('crypto');
const axios = require('axios');
const mongoose = require('mongoose');

const WOMPI_PUB_KEY = process.env.WOMPI_PUB_KEY || '';
const WOMPI_PRV_KEY = process.env.WOMPI_PRV_KEY || '';
const WOMPI_EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET || '';
const WOMPI_INTEGRITY_KEY = process.env.WOMPI_INTEGRITY_KEY || '';
const SELL_REFERENCE_PREFIX = 'GY';

const PLANS = [
  { id: 'basic', name: 'Básico', price: 50000, features: ['1 Gimnasio', 'Hasta 100 clientes', 'Membresías básicas', 'Dashboard de ventas'] },
  { id: 'pro', name: 'Pro', price: 120000, features: ['3 Gimnasios', 'Clientes ilimitados', 'Agenda de entrenadores', 'Integración Wompi', 'Reportes avanzados'] },
  { id: 'ultra', name: 'Ultra', price: 200000, features: ['Gimnasios ilimitados', 'Todo Pro +', 'Soporte prioritario', 'API personalizada', 'White-label'] },
];

function makeReference() {
  return `${SELL_REFERENCE_PREFIX}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function computeIntegrityHash(reference, amountInCents, currency) {
  const raw = `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_KEY}`;
  return crypto.createHash('sha256').update(raw, 'utf-8').digest('hex');
}

function verifyChecksum(data) {
  try {
    const sig = data.signature || {};
    const props = sig.properties || [];
    const tx = data.data.transaction;
    let concat = '';
    for (const prop of props) {
      const parts = prop.split('.');
      let val = tx;
      for (const p of parts.slice(1)) val = (val || {})[p] || '';
      concat += String(val);
    }
    concat += String(data.timestamp || '');
    concat += WOMPI_EVENTS_SECRET;
    const localHash = crypto.createHash('sha256').update(concat, 'utf-8').digest('hex');
    return localHash.toUpperCase() === (sig.checksum || '').toUpperCase();
  } catch (_) {
    return false;
  }
}

const getPlans = async (req, res) => {
  return res.json({ success: true, result: PLANS });
};

const platformCheckout = async (req, res) => {
  try {
    const { plan, billing } = req.body;
    const userId = req.admin?._id;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const planInfo = PLANS.find((p) => p.id === plan);
    if (!planInfo) return res.status(400).json({ success: false, message: 'Invalid plan' });

    let price = planInfo.price;
    if (billing === 'annual') price = Math.round(price * 12 * 0.8);

    const amountInCents = price * 100;
    const currency = 'COP';
    const reference = makeReference();
    const hash = computeIntegrityHash(reference, amountInCents, currency);

    const Gym = mongoose.model('Gym');
    const gym = await Gym.findOne({ administrators: userId, removed: false });

    const sellDoc = {
      reference,
      type: 'platform_subscription',
      plan: planInfo.id,
      billing: billing || 'monthly',
      amount: price,
      amountInCents,
      currency,
      userId: String(userId),
      gymId: gym ? String(gym._id) : null,
      status: 'PENDING',
      created: new Date(),
    };

    const WompiSell = mongoose.model('WompiSell');
    await new WompiSell(sellDoc).save();

    return res.json({
      success: true,
      result: {
        id: reference,
        reference,
        hash,
        amountInCents: String(amountInCents),
        currency,
        publicKey: WOMPI_PUB_KEY,
        plan: planInfo,
      },
    });
  } catch (err) {
    console.error('[wompi.platformCheckout]', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const gymClientCheckout = async (req, res) => {
  try {
    const { gymId, membershipId, clientId, amount } = req.body;

    const Gym = mongoose.model('Gym');
    const gym = await Gym.findById(gymId);
    if (!gym) return res.status(404).json({ success: false, message: 'Gym not found' });

    const wompiPub = gym.wompiPublicKey || WOMPI_PUB_KEY;
    const wompiIntegrity = gym.wompiIntegrityKey || WOMPI_INTEGRITY_KEY;

    const amountInCents = (amount || 0) * 100;
    const currency = 'COP';
    const reference = makeReference();

    const raw = `${reference}${amountInCents}${currency}${wompiIntegrity}`;
    const hash = crypto.createHash('sha256').update(raw, 'utf-8').digest('hex');

    const WompiSell = mongoose.model('WompiSell');
    await new WompiSell({
      reference,
      type: 'gym_client_payment',
      gymId: String(gymId),
      membershipId: String(membershipId || ''),
      clientId: String(clientId || ''),
      amount,
      amountInCents,
      currency,
      status: 'PENDING',
      created: new Date(),
    }).save();

    return res.json({
      success: true,
      result: {
        reference,
        hash,
        amountInCents: String(amountInCents),
        currency,
        publicKey: wompiPub,
      },
    });
  } catch (err) {
    console.error('[wompi.gymClientCheckout]', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const webhookHandler = async (req, res) => {
  try {
    const payload = req.body;
    const tx = payload?.data?.transaction;
    if (!tx?.reference) return res.status(200).json({ ok: true });

    if (!verifyChecksum(payload)) {
      console.warn('[wompi.webhook] Checksum mismatch for', tx.reference);
    }

    const WompiSell = mongoose.model('WompiSell');
    const sell = await WompiSell.findOne({ reference: tx.reference });
    if (!sell) {
      console.warn('[wompi.webhook] Unknown reference:', tx.reference);
      return res.status(200).json({ ok: true });
    }

    sell.status = tx.status;
    sell.wompiId = tx.id;
    sell.paymentMethod = tx.payment_method_type;
    sell.updatedAt = new Date();
    await sell.save();

    if (tx.status === 'APPROVED' && sell.type === 'platform_subscription') {
      const Gym = mongoose.model('Gym');
      if (sell.gymId) {
        const endDate = new Date();
        if (sell.billing === 'annual') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }
        await Gym.findByIdAndUpdate(sell.gymId, {
          'platformSubscription.plan': sell.plan,
          'platformSubscription.status': 'active',
          'platformSubscription.price': sell.amount,
          'platformSubscription.startDate': new Date(),
          'platformSubscription.endDate': endDate,
          'platformSubscription.billing': sell.billing,
        });
        console.log('[wompi.webhook] Activated subscription for gym', sell.gymId);
      }
    }

    if (tx.status === 'APPROVED' && sell.type === 'gym_client_payment') {
      console.log('[wompi.webhook] Client payment approved for gym', sell.gymId);
    }

    return res.status(200).json({ ok: true, status: tx.status });
  } catch (err) {
    console.error('[wompi.webhook]', err.message);
    return res.status(200).json({ ok: true });
  }
};

module.exports = {
  getPlans,
  platformCheckout,
  gymClientCheckout,
  webhookHandler,
};
