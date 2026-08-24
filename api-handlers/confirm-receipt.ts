import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminAuth } from '../lib/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { transactionId } = req.body;
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

        const buyerId = decodedToken.uid;

        await adminDb.runTransaction(async (t) => {
            const docRef = adminDb.collection('transactions').doc(transactionId);
            const docSnap = await t.get(docRef);

            if (!docSnap.exists) {
                throw new Error('NOT_FOUND');
            }

            const data = docSnap.data() as any;

            if (data.buyerId !== buyerId) {
                throw new Error('FORBIDDEN');
            }

            if (data.status === 'DELIVERED_PENDING_REVIEW') {
                return; // Idempotency
            }

            if (data.status !== 'SHIPPED' && data.status !== 'PAID_HELD') {
                throw new Error('INVALID_STATUS');
            }

            const sellerRef = adminDb.collection('users').doc(data.sellerId);
            const sellerSnap = await t.get(sellerRef);
            const sellerLevel = sellerSnap.data()?.trustLevel || 'Bajo';
            
            // Diamante (Premium) gets 24h escrow, others get 48h
            const hours = sellerLevel === 'Premium' ? 24 : 48;

            const now = new Date();
            const deadline = new Date(now.getTime() + hours * 60 * 60 * 1000);

            t.update(docRef, {
                status: 'DELIVERED_PENDING_REVIEW',
                deliveredAt: FieldValue.serverTimestamp(),
                inspectionDeadline: deadline,
                updatedAt: FieldValue.serverTimestamp()
            });
        });

        return res.status(200).json({ success: true });
    } catch (error: any) {
        if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'Transacción no encontrada' });
        if (error.message === 'FORBIDDEN') return res.status(403).json({ error: 'Prohibido: Solo el comprador puede confirmar la recepción.' });
        if (error.message === 'INVALID_STATUS') return res.status(400).json({ error: 'La transacción no está en estado válido para confirmar recepción.' });
        
        console.error('Error in confirm-receipt:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
