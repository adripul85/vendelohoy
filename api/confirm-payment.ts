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
            return res.status(401).json({ error: 'No autorizado: Falta el token de seguridad.' });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (e) {
            return res.status(401).json({ error: 'No autorizado: Token inválido.' });
        }

        const buyerId = decodedToken.uid;

        if (!transactionId) {
            return res.status(400).json({ error: 'Falta transactionId' });
        }

        // Fetch transaction
        const txRef = adminDb.collection('transactions').doc(transactionId);
        const txSnap = await txRef.get();

        if (!txSnap.exists) {
            return res.status(404).json({ error: 'Transacción no encontrada' });
        }

        const tx = txSnap.data() as any;

        // Verify user is buyer
        if (tx.buyerId !== buyerId) {
            return res.status(403).json({ error: 'Prohibido: No eres el comprador de esta transacción.' });
        }

        if (tx.status !== 'PENDING_PAYMENT') {
            return res.status(400).json({ error: `La transacción ya ha sido procesada (estado: ${tx.status}).`, success: true });
        }

        // --- Lógica de Stock ---
        const productId = tx.itemId;
        const txQuantity = tx.quantity || 1;

        if (productId) {
            try {
                const itemRef = adminDb.collection('items').doc(productId);
                const itemSnap = await itemRef.get();
                
                if (itemSnap.exists) {
                    const itemData = itemSnap.data() as any;
                    const currentQty = itemData.quantity || 1;
                    const newQty = Math.max(0, currentQty - txQuantity);
                    
                    await itemRef.update({
                        quantity: newQty,
                        status: newQty > 0 ? 'AVAILABLE' : 'SOLD', // Si llega a 0, está vendido
                        updatedAt: new Date()
                    });
                }
            } catch (e) {
                console.warn(`Could not update item ${productId}, it might be a cart order. Continuing...`);
            }
        }

        // --- Actualizar Transacción ---
        await txRef.update({
            status: 'PAID_HELD',
            updatedAt: new Date(),
            paymentConfirmedAt: new Date()
        });

        // --- Agregar saldo 'En Custodia' al vendedor ---
        const sellerId = tx.sellerId;
        const amountProduct = tx.amountProduct || tx.amount;
        
        await adminDb.collection('users').doc(sellerId).update({
            "wallet.inEscrow": FieldValue.increment(amountProduct)
        });

        return res.status(200).json({ success: true, message: 'Pago confirmado y stock deducido.' });

    } catch (error: any) {
        console.error('Error confirming payment:', error);
        return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
}
