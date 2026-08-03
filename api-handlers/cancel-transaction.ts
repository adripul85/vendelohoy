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

        const userId = decodedToken.uid;

        const docRef = adminDb.collection('transactions').doc(transactionId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'Transacción no encontrada' });
        }

        const data = docSnap.data() as any;

        if (data.buyerId !== userId && data.sellerId !== userId) {
            return res.status(403).json({ error: 'Prohibido: No eres participante.' });
        }

        if (data.status === 'CANCELLED') {
            return res.status(200).json({ success: true });
        }

        // Only allow cancel if pending payment or paid held (before shipped)
        if (!['PENDING_PAYMENT', 'PAID_HELD'].includes(data.status)) {
            return res.status(400).json({ error: 'No se puede cancelar en este estado.' });
        }

        const batch = adminDb.batch();

        const isSeller = data.sellerId === userId;
        const systemMessage = isSeller ? 'El vendedor canceló la orden.' : 'El comprador canceló la orden.';

        batch.update(docRef, {
            status: 'CANCELLED',
            updatedAt: FieldValue.serverTimestamp(),
            lastSystemMessage: systemMessage
        });

        // Restore item stock
        const itemRef = adminDb.collection('items').doc(data.itemId);
        batch.update(itemRef, {
            status: 'active',
            stock: FieldValue.increment(data.quantity || 1)
        });

        if (data.status === 'PAID_HELD') {
            // Full refund to buyer
            const buyerRef = adminDb.collection('users').doc(data.buyerId);
            batch.update(buyerRef, { "wallet.available": FieldValue.increment(data.amount) });

            // Release escrow from seller
            const sellerRef = adminDb.collection('users').doc(data.sellerId);
            batch.update(sellerRef, { "wallet.inEscrow": FieldValue.increment(-data.amountProduct) });
        }

        await batch.commit();

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Error in cancel-transaction:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
