const express = require('express');

const cors = require('cors');
const compression = require('compression');

const cookieParser = require('cookie-parser');

const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
const coreApiRouter = require('./routes/coreRoutes/coreApi');
const coreDownloadRouter = require('./routes/coreRoutes/coreDownloadRouter');
const corePublicRouter = require('./routes/coreRoutes/corePublicRouter');
const adminAuth = require('./controllers/coreControllers/adminAuth');

const errorHandlers = require('./handlers/errorHandlers');
const erpApiRouter = require('./routes/appRoutes/appApi');
const gymsOsRouter = require('./routes/appRoutes/gymsOsRoutes');

const fileUpload = require('express-fileupload');
// create our Express app
const app = express();
const flattenNestedFields = (req, res, next) => {
  if (req.body && req.body['file[fileList]'] && req.body['file[file]']) {
    try {
      // Parse and map file metadata
      const fileMetadata = JSON.parse(req.body['file[fileList]']); // Convert metadata to an object
      req.fileMetadata = fileMetadata[0]; // Store first metadata object for use later
    } catch (err) {
      console.error('Failed to parse file metadata:', err);
    }
  }
  next();
};

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(compression());
app.use(flattenNestedFields);
// // default options
// app.use(fileUpload());

// Health endpoint (no auth)
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  return res.json({
    success: true,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    ts: new Date().toISOString(),
  });
});

// Here our API Routes — public routes MUST come before authenticated routes
// because /api/public/* would otherwise match the /api auth middleware first

app.use('/api/public', corePublicRouter);
app.use('/public', corePublicRouter);
app.use('/download', coreDownloadRouter);
app.use('/api', coreAuthRouter);
app.use('/api', adminAuth.isValidAuthToken, coreApiRouter);
app.use('/api', adminAuth.isValidAuthToken, erpApiRouter);
app.use('/api', adminAuth.isValidAuthToken, gymsOsRouter);

// If that above routes didnt work, we 404 them and forward to error handler
app.use(errorHandlers.notFound);

// production error handler
app.use(errorHandlers.productionErrors);

// done! we export it so we can start the site in start.js
module.exports = app;
