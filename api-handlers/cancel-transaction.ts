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

        await adminDb.runTransaction(async (t) => {
            const docRef = adminDb.collection('transactions').doc(transactionId);
            const docSnap = await t.get(docRef);

            if (!docSnap.exists) {
                throw new Error('NOT_FOUND');
            }

            const data = docSnap.data() as any;

            if (data.buyerId !== userId && data.sellerId !== userId) {
                throw new Error('FORBIDDEN');
            }

            if (data.status === 'CANCELLED') {
                return; // Idempotency
            }

            // Only allow cancel if pending payment or paid held (before shipped)
            if (!['PENDING_PAYMENT', 'PAID_HELD'].includes(data.status)) {
                throw new Error('INVALID_STATUS');
            }

            const isSeller = data.sellerId === userId;
            const systemMessage = isSeller ? 'El vendedor canceló la orden.' : 'El comprador canceló la orden.';

            t.update(docRef, {
                status: 'CANCELLED',
                updatedAt: FieldValue.serverTimestamp(),
                lastSystemMessage: systemMessage
            });

            // Restore item stock
            const itemRef = adminDb.collection('items').doc(data.itemId);
            t.update(itemRef, {
                status: 'active',
                stock: FieldValue.increment(data.quantity || 1)
            });

            if (data.status === 'PAID_HELD') {
                // Full refund to buyer
                const buyerRef = adminDb.collection('users').doc(data.buyerId);
                const refundAmount = data.amountTotal || data.total || data.amount || 0;
                t.update(buyerRef, { "wallet.available": FieldValue.increment(refundAmount) });

                const buyerWalletLogRef = adminDb.collection('wallet_movements').doc();
                t.set(buyerWalletLogRef, {
                    uid: data.buyerId,
                    type: 'ESCROW_RELEASE', // Or REFUND but type only has limited ENUMs. Maybe ESCROW_RELEASE
                    amount: refundAmount,
                    referenceId: transactionId,
                    itemTitle: data.itemTitle || 'Producto',
                    description: `Reembolso por cancelacin de compra: ${data.itemTitle || 'Producto'}`,
                    timestamp: FieldValue.serverTimestamp()
                });

                // Release escrow from seller
                const sellerRef = adminDb.collection('users').doc(data.sellerId);
                const productAmount = data.amountProduct || data.amount || 0;
                t.update(sellerRef, { "wallet.inEscrow": FieldValue.increment(-productAmount) });

                const sellerWalletLogRef = adminDb.collection('wallet_movements').doc();
                t.set(sellerWalletLogRef, {
                    uid: data.sellerId,
                    type: 'ESCROW_RELEASE',
                    amount: productAmount,
                    referenceId: transactionId,
                    itemTitle: data.itemTitle || 'Producto',
                    description: `Cancelacin de garanta retenida: ${data.itemTitle || 'Producto'}`,
                    timestamp: FieldValue.serverTimestamp()
                });
            }
        });

        return res.status(200).json({ success: true });
    } catch (error: any) {
        if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'Transacción no encontrada' });
        if (error.message === 'FORBIDDEN') return res.status(403).json({ error: 'Prohibido: No eres participante.' });
        if (error.message === 'INVALID_STATUS') return res.status(400).json({ error: 'No se puede cancelar en este estado.' });

        console.error('Error in cancel-transaction:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
