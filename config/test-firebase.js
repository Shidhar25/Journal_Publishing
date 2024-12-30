import { auth, db, storage } from './firebase.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Print the loaded configuration (without sensitive values)
console.log('Firebase Configuration Test:');
console.log('Auth initialized:', !!auth);
console.log('Database initialized:', !!db);
console.log('Storage initialized:', !!storage);
console.log('Environment variables loaded:', {
    hasApiKey: !!process.env.FIREBASE_API_KEY,
    hasAuthDomain: !!process.env.FIREBASE_AUTH_DOMAIN,
    hasDatabaseUrl: !!process.env.FIREBASE_DATABASE_URL,
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET,
    hasMessagingSenderId: !!process.env.FIREBASE_MESSAGING_SENDER_ID,
    hasAppId: !!process.env.FIREBASE_APP_ID,
    hasMeasurementId: !!process.env.FIREBASE_MEASUREMENT_ID
}); 