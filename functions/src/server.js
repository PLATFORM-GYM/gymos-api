require('module-alias/register');

const [major] = process.versions.node.split('.').map(parseFloat);
if (major < 20) {
  console.log('Please upgrade node.js to v20 or greater.');
  process.exit();
}

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

const mongoose = require('mongoose');

// Initialize Firebase Admin for auth token verification
const { getAdmin } = require('./db/firestore');
getAdmin();

const DATABASE = process.env.DATABASE || 'mongodb://localhost:27017/gymos';

mongoose.connect(DATABASE).then(() => {
  console.log('[server] MongoDB/Firestore connected');

  const app = require('./app');
  app.set('port', process.env.PORT || 8888);
  const server = app.listen(app.get('port'), () => {
    console.log(`GymOS API running on PORT: ${server.address().port}`);
  });
}).catch((err) => {
  console.error('[server] Database connection failed:', err.message);
  process.exit(1);
});
