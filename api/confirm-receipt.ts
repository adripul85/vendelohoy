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

        const docRef = adminDb.collection('transactions').doc(transactionId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'Transacción no encontrada' });
        }

        const data = docSnap.data() as any;

        if (data.buyerId !== buyerId) {
            return res.status(403).json({ error: 'Prohibido: Solo el comprador puede confirmar la recepción.' });
        }

        if (data.status === 'DELIVERED_PENDING_REVIEW') {
            return res.status(200).json({ success: true });
        }

        if (data.status !== 'SHIPPED' && data.status !== 'PAID_HELD') {
            return res.status(400).json({ error: 'La transacción no está en estado válido para confirmar recepción.' });
        }

        const now = new Date();
        const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        await docRef.update({
            status: 'DELIVERED_PENDING_REVIEW',
            deliveredAt: FieldValue.serverTimestamp(),
            inspectionDeadline: deadline,
            updatedAt: FieldValue.serverTimestamp()
        });

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Error in confirm-receipt:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
