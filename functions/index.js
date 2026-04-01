'use strict';
const path = require('path');

require('module-alias').addAlias('@', path.join(__dirname, 'src'));
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ── 1. Initialize Firebase Admin (for auth token verification) ──
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp();
  console.log('[init] Firebase Admin initialized, project:', admin.app().options.projectId || 'auto');
}

// ── 2. Connect Mongoose ──
const mongoose = require('mongoose');
const { globSync } = require('glob');
const DATABASE = process.env.DATABASE;

let dbReady = false;
if (DATABASE) {
  mongoose.connect(DATABASE).then(() => {
    dbReady = true;
    console.log('[init] MongoDB/Firestore connected');
  }).catch((err) => {
    console.error('[init] DB connection failed:', err.message);
  });
} else {
  console.error('[init] DATABASE env var not set!');
}

// ── 3. Load all Mongoose model schemas before the app ──
const modelFiles = globSync(path.join(__dirname, 'src/models/**/*.js'));
modelFiles.forEach((f) => require(f));

// ── 4. Load Express app ──
const app = require('./src/app');

const functions = require('firebase-functions');
const CORS_ALLOW_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const CORS_ALLOW_HEADERS = 'Content-Type, Authorization, X-Requested-With, Accept, Cookie';

exports.api = functions.runWith({ timeoutSeconds: 60, memory: '512MB' }).https.onRequest(async (req, res) => {
  const origin = req.headers['origin'] || '*';
  res.set('Access-Control-Allow-Origin', origin);
  res.set('Access-Control-Allow-Methods', CORS_ALLOW_METHODS);
  res.set('Access-Control-Allow-Headers', CORS_ALLOW_HEADERS);
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Max-Age', '86400');
  res.set('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(204).send('');

  if (!dbReady && DATABASE) {
    try { await mongoose.connect(DATABASE); dbReady = true; } catch (_) {}
  }

  if (!req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }

  return app(req, res);
});
