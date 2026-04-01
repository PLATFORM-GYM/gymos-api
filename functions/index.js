/**
 * GymOS API — Firebase Cloud Functions entry point
 * Express app wrapped as a single HTTPS function.
 * CORS is handled at the wrapper level to ensure it works
 * even if Express initialization fails.
 */
const path = require('path');

// Resolve @ alias to functions/src before any other imports
require('module-alias').addAlias('@', path.join(__dirname, 'src'));

require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const { globSync } = require('glob');
const functions = require('firebase-functions');

// Connect to MongoDB Atlas once (reused across warm invocations)
if (mongoose.connection.readyState === 0) {
  mongoose
    .connect(process.env.DATABASE, { serverSelectionTimeoutMS: 8000 })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err.message));
}

mongoose.connection.on('error', (err) =>
  console.error('Mongoose error:', err.message)
);

// Auto-load all Mongoose models
const modelsFiles = globSync('./src/models/**/*.js', { cwd: __dirname });
for (const filePath of modelsFiles) {
  require(path.resolve(__dirname, filePath));
}

const app = require('./src/app');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
  'Access-Control-Max-Age': '86400',
};

exports.api = functions
  .runWith({ timeoutSeconds: 60, memory: '512MB' })
  .https.onRequest((req, res) => {
    // Set CORS headers on every response (including errors)
    Object.entries(CORS_HEADERS).forEach(([key, value]) => res.set(key, value));

    // Handle preflight OPTIONS immediately without hitting Express
    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }

    return app(req, res);
  });
