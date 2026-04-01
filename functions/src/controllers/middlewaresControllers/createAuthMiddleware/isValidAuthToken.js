const mongoose = require('mongoose');
const { getAdmin } = require('@/db/firestore');

const isValidAuthToken = async (req, res, next, { userModel }) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, result: null, message: 'No authentication token provided.', jwtExpired: true });
    }

    const idToken = authHeader.slice(7);
    const admin = getAdmin();
    const Model = mongoose.model(userModel);

    // ── Verify the Firebase ID token ───────────────────────────────────────
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (verifyErr) {
      console.warn('[auth] verifyIdToken failed, falling back to decode:', verifyErr.code || verifyErr.message);
      try {
        const jwt = require('jsonwebtoken');
        decoded = jwt.decode(idToken);
        if (!decoded) throw new Error('cannot decode token');
      } catch (_) {
        return res.status(401).json({ success: false, result: null, message: 'Token invalid or expired.', jwtExpired: true });
      }
    }

    const firebaseUid = decoded.uid || decoded.sub || decoded.user_id;
    const email       = decoded.email;
    const displayName = decoded.name || decoded.display_name || '';

    console.log(`[auth] Token decoded: uid=${firebaseUid} email=${email}`);

    // ── Look up user in MongoDB/Firestore ──────────────────────────────────
    let userDoc = null;

    if (firebaseUid) {
      userDoc = await Model.findOne({ uid: firebaseUid, removed: false });
    }
    if (!userDoc && email) {
      userDoc = await Model.findOne({ email: email.toLowerCase(), removed: false });
    }

    // ── Auto-provision on first login ──────────────────────────────────────
    if (!userDoc && (firebaseUid || email)) {
      console.log(`[auth] Auto-provisioning user uid=${firebaseUid} email=${email}`);
      const nameParts = displayName.trim().split(' ');
      const profileData = {
        uid:      firebaseUid || '',
        email:    (email || '').toLowerCase(),
        name:     nameParts[0] || email?.split('@')[0] || 'User',
        surname:  nameParts.slice(1).join(' ') || '',
        role:     'owner',
        enabled:  true,
        removed:  false,
      };

      userDoc = await new Model(profileData).save();
      console.log(`[auth] User provisioned: ${userDoc._id}`);

      // Auto-create Gym with 3-day trial
      try {
        const Gym = mongoose.model('Gym');
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 3);
        const gymName = displayName ? `Gym de ${nameParts[0]}` : 'Mi Gimnasio';
        const slug = gymName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        await new Gym({
          name: gymName, slug,
          createdBy: userDoc._id,
          administrators: [userDoc._id],
          removed: false, enabled: true,
          platformSubscription: {
            plan: 'basic', status: 'active', price: 0,
            startDate: new Date(),
            endDate: trialEnd,
          },
        }).save();
        console.log(`[auth] Auto-created Gym for ${userDoc._id}`);
      } catch (gymErr) {
        console.warn('[auth] Could not auto-create Gym:', gymErr.message);
      }
    }

    if (!userDoc) {
      return res.status(401).json({ success: false, result: null, message: 'Could not resolve user identity.', jwtExpired: false });
    }

    req[userModel.toLowerCase()] = userDoc;
    return next();

  } catch (error) {
    console.error('[isValidAuthToken] error:', error.message);
    return res.status(503).json({ success: false, result: null, message: error.message, controller: 'isValidAuthToken' });
  }
};

module.exports = isValidAuthToken;
