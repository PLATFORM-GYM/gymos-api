const admin = require('firebase-admin');

function getAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp();
    console.log('[firebase] Admin initialized, project:', admin.app().options.projectId || 'auto');
  }
  return admin;
}

module.exports = { getAdmin };
