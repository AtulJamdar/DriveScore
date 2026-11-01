import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccount) {
    try {
      const parsedServiceAccount = JSON.parse(serviceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(parsedServiceAccount),
      });
    } catch {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } else {
    admin.initializeApp();
  }
}

export default admin;


