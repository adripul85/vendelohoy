import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_PRIVATE_KEY || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
        console.error("CRITICAL: Missing Firebase Admin Environment Variables in Vercel.");
    } else {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
            });
            console.log("Firebase Admin initialized successfully in Node API.");
        } catch (error) {
            console.error('Firebase Admin initialization error', error);
        }
    }
}

// Si la app se inicializó, exportamos bd y auth, de lo contrario exportamos null 
// para que el módulo general no crashee en Vercel y el endpoint pueda devolver JSON
export const adminDb = admin.apps.length ? admin.firestore() : null as any;
export const adminAuth = admin.apps.length ? admin.auth() : null as any;
