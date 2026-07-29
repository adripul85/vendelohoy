import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminAuth } from '../lib/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { itemId } = req.body;
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No autorizado.' });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (e) {
            return res.status(401).json({ error: 'Token inválido.' });
        }

        const userId = decodedToken.uid;

        const itemRef = adminDb.collection('items').doc(itemId);
        const itemSnap = await itemRef.get();

        if (!itemSnap.exists) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const data = itemSnap.data() as any;

        if (data.sellerId !== userId) {
            return res.status(403).json({ error: 'Prohibido: Solo el vendedor puede destacar.' });
        }

        // Check user XP level
        const userRef = adminDb.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        const userData = userSnap.data() as any;
        const trustLevel = userData.trustLevel || 'Bajo';
        
        const isPremium = trustLevel === 'Premium' || trustLevel === 'Alto'; // Diamante o Oro
        const bumpCost = 500;

        const batch = adminDb.batch();

        if (!isPremium && !data.isFeatured) {
            const walletAvailable = userData.wallet?.available || 0;
            if (walletAvailable < bumpCost) {
                return res.status(400).json({ error: `Saldo insuficiente. Cuesta $${bumpCost} ARS destacar.` });
            }
            // Charge the user
            batch.update(userRef, {
                "wallet.available": FieldValue.increment(-bumpCost)
            });

            // Find admin to credit
            const usersSnapshot = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();
            if (!usersSnapshot.empty) {
                const adminDoc = usersSnapshot.docs[0];
                batch.update(adminDoc.ref, {
                    "wallet.available": FieldValue.increment(bumpCost)
                });
                
                // Log the payment
                const logRef = adminDb.collection('financial_logs').doc();
                batch.set(logRef, {
                    type: 'bump_fee',
                    amount: bumpCost,
                    currency: 'ARS',
                    relatedUser: userId,
                    relatedItem: itemId,
                    timestamp: FieldValue.serverTimestamp()
                });
            }
        }

        // Apply Bump
        batch.update(itemRef, {
            isFeatured: !data.isFeatured, // Toggle if they already had it? Usually bump is a one-time thing to move it to the top. Wait, `isFeatured` is a boolean. Let's toggle it or just set it to true.
            // Actually, we'll just toggle it for now so they can un-feature it if they want.
            // If they are un-featuring, we don't charge them again. The charge block already checks `!data.isFeatured`.
            featuredAt: !data.isFeatured ? FieldValue.serverTimestamp() : null,
            updatedAt: FieldValue.serverTimestamp()
        });

        await batch.commit();

        return res.status(200).json({ success: true, message: isPremium ? 'Destacado aplicado gratis.' : 'Pago procesado y destacado.' });
    } catch (error: any) {
        console.error('Error in bump-item:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
