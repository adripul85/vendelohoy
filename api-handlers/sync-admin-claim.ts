import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminAuth } from '../lib/firebase-admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No autorizado: Falta el token de seguridad.' });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (e) {
            return res.status(401).json({ error: 'No autorizado: Token inválido.' });
        }

        const uid = decodedToken.uid;
        
        // Fetch the user's document from Firestore to check their true role
        const userRef = adminDb.collection('users').doc(uid);
        const userSnap = await userRef.get();
        
        if (!userSnap.exists) {
            return res.status(404).json({ error: 'Usuario no encontrado en la base de datos.' });
        }
        
        const userData = userSnap.data();
        const isAdmin = userData?.isAdmin === true || userData?.role === 'admin';

        if (isAdmin) {
            // Set the custom claim
            await adminAuth.setCustomUserClaims(uid, { admin: true });
            
            // Log that claims were synced
            console.log(`Custom claims synced for admin: ${uid}`);
            
            return res.status(200).json({ 
                success: true, 
                message: 'Admin claims synced successfully.',
                hasClaim: true
            });
        } else {
            // If they are not admin but somehow have the claim (e.g. role revoked), remove it
            if (decodedToken.admin) {
                await adminAuth.setCustomUserClaims(uid, { admin: null });
                console.log(`Custom claims removed for former admin: ${uid}`);
            }
            
            return res.status(200).json({ 
                success: true, 
                message: 'User is not admin, no claims set.',
                hasClaim: false
            });
        }

    } catch (error: any) {
        console.error("Sync Admin Claim API Error:", error);
        return res.status(500).json({ error: error.message || 'Error interno sincronizando claims' });
    }
}
