/**
 * GymOS API — Firebase Cloud Functions entry point
 * Express app wrapped as a single HTTPS function.
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
    .connect(process.env.DATABASE, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB error:', err.message));
}

mongoose.connection.on('error', (err) =>
  console.error('Mongoose connection error:', err.message)
);

// Auto-load all Mongoose models
const modelsFiles = globSync('./src/models/**/*.js', { cwd: __dirname });
for (const filePath of modelsFiles) {
  require(path.resolve(__dirname, filePath));
}

const app = require('./src/app');

// Export as a single Firebase HTTPS function
exports.api = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB',
  })
  .https.onRequest(app);
