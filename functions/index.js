'use strict';
const path = require('path');

require('module-alias').addAlias('@', path.join(__dirname, 'src'));
require('dotenv').config({ path: path.join(__dirname, '.env') });

const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp();
  console.log('[init] Firebase Admin initialized, project:', admin.app().options.projectId || 'auto');
}

const mongoose = require('mongoose');
const { globSync } = require('glob');
const DATABASE = process.env.DATABASE;

const DB_PREFIX = DATABASE ? DATABASE.substring(0, 30) + '...' : '(not set)';
console.log('[init] DATABASE prefix:', DB_PREFIX);

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 45000,
};

let dbReady = false;
let dbConnecting = null;

function connectDB() {
  if (dbReady) return Promise.resolve();
  if (dbConnecting) return dbConnecting;
  if (!DATABASE) {
    console.error('[init] DATABASE env var not set!');
    return Promise.reject(new Error('DATABASE not set'));
  }
  dbConnecting = mongoose.connect(DATABASE, MONGO_OPTIONS)
    .then(() => {
      dbReady = true;
      dbConnecting = null;
      console.log('[init] MongoDB connected successfully');
    })
    .catch((err) => {
      dbConnecting = null;
      console.error('[init] DB connection FAILED:', err.message);
      throw err;
    });
  return dbConnecting;
}

connectDB().catch(() => {});

const modelFiles = globSync(path.join(__dirname, 'src/models/**/*.js'));
modelFiles.forEach((f) => require(f));

const app = require('./src/app');

// ── Cloud Functions 2nd gen (Cloud Run backed) ──
const { onRequest } = require('firebase-functions/v2/https');

const CORS_ALLOW_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const CORS_ALLOW_HEADERS = 'Content-Type, Authorization, X-Requested-With, Accept, Cookie';

exports.api = onRequest(
  {
    timeoutSeconds: 120,
    memory: '1GiB',
    region: 'us-central1',
    minInstances: 0,
    maxInstances: 10,
    concurrency: 80,
  },
  async (req, res) => {
    const origin = req.headers['origin'] || '*';
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Methods', CORS_ALLOW_METHODS);
    res.set('Access-Control-Allow-Headers', CORS_ALLOW_HEADERS);
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Access-Control-Max-Age', '86400');
    res.set('Vary', 'Origin');
    if (req.method === 'OPTIONS') return res.status(204).send('');

    if (!dbReady) {
      try {
        await connectDB();
      } catch (err) {
        console.error('[request] DB connect failed on request:', err.message);
        return res.status(503).json({
          success: false,
          message: 'Database connection failed: ' + err.message,
          dbPrefix: DB_PREFIX,
        });
      }
    }

    if (!req.url.startsWith('/api')) {
      req.url = '/api' + req.url;
    }

    return app(req, res);
  }
);
