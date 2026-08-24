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
        const userRef = adminDb.collection('users').doc(userId);

        await adminDb.runTransaction(async (t) => {
            const itemSnap = await t.get(itemRef);
            if (!itemSnap.exists) throw new Error('NOT_FOUND');

            const data = itemSnap.data() as any;
            if (data.sellerId !== userId) throw new Error('FORBIDDEN');

            const userSnap = await t.get(userRef);
            if (!userSnap.exists) throw new Error('USER_NOT_FOUND');

            const userData = userSnap.data() as any;
            const trustLevel = userData.trustLevel || 'Bajo';
            const isPremium = trustLevel === 'Premium' || trustLevel === 'Alto';
            const bumpCost = 500;

            if (!isPremium && !data.isFeatured) {
                const walletAvailable = userData.wallet?.available || 0;
                if (walletAvailable < bumpCost) {
                    throw new Error('INSUFFICIENT_FUNDS');
                }
                
                t.update(userRef, {
                    "wallet.available": FieldValue.increment(-bumpCost)
                });

                const usersQuery = adminDb.collection('users').where('role', '==', 'admin').limit(1);
                const usersSnapshot = await t.get(usersQuery);
                if (!usersSnapshot.empty) {
                    const adminDoc = usersSnapshot.docs[0];
                    t.update(adminDoc.ref, {
                        "wallet.available": FieldValue.increment(bumpCost)
                    });

                    const logRef = adminDb.collection('financial_logs').doc();
                    t.set(logRef, {
                        type: 'bump_fee',
                        amount: bumpCost,
                        currency: 'ARS',
                        relatedUser: userId,
                        relatedItem: itemId,
                        timestamp: FieldValue.serverTimestamp()
                    });
                }
            }

            t.update(itemRef, {
                isFeatured: !data.isFeatured,
                featuredAt: !data.isFeatured ? FieldValue.serverTimestamp() : null,
                updatedAt: FieldValue.serverTimestamp()
            });
        });

        return res.status(200).json({ success: true, message: isPremium ? 'Destacado aplicado gratis.' : 'Pago procesado y destacado.' });
    } catch (error: any) {
        if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'Producto no encontrado' });
        if (error.message === 'FORBIDDEN') return res.status(403).json({ error: 'Prohibido: Solo el vendedor puede destacar.' });
        if (error.message === 'USER_NOT_FOUND') return res.status(404).json({ error: 'Usuario no encontrado' });
        if (error.message === 'INSUFFICIENT_FUNDS') return res.status(400).json({ error: 'Saldo insuficiente. Cuesta $500 ARS destacar.' });

        console.error('Error in bump-item:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
