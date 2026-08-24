import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminAuth } from '../lib/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { processPayoutWrites } from './payout-logic.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { transactionId, qrToken } = req.body;
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

        // We use runTransaction to ensure atomicity and prevent race conditions (e.g. double webhook)
        await adminDb.runTransaction(async (t) => {
            // --- 1. ALL READS ---
            const docRef = adminDb.collection('transactions').doc(transactionId);
            const docSnap = await t.get(docRef);

            if (!docSnap.exists) {
                throw new Error('Transacción no encontrada');
            }

            const data = docSnap.data() as any;

            // Verify user is buyer OR (seller validating QR code for in-person delivery)
            if (data.buyerId !== decodedToken.uid && data.sellerId !== decodedToken.uid) {
                throw new Error('Prohibido: No eres participante de esta transacción.');
            }

            // QR Validation (Client-Side) for in-person delivery
            if (data.deliveryMethod === 'en_mano') {
                if (data.sellerId === decodedToken.uid) {
                    if (!qrToken || data.qrCode !== qrToken) {
                        throw new Error('Token de seguridad inválido');
                    }
                } else if (data.buyerId === decodedToken.uid) {
                    // Buyer is releasing funds manually (no QR needed)
                }
            } else {
                 // For shipping, usually buyer releases funds. If seller tries, block.
                 if (data.sellerId === decodedToken.uid) {
                     throw new Error('Prohibido: Solo el comprador puede liberar los fondos para envíos.');
                 }
            }

            if (data.status === 'COMPLETED') {
                return; // Idempotency check
            }

            // CRITICAL SECURITY FIX: Ensure the transaction has actually been paid
            if (data.status !== 'PAID_HELD' && data.status !== 'SHIPPED') {
                throw new Error(`Estado inválido para liberar fondos: ${data.status}. El pago debe estar acreditado en custodia primero.`);
            }

            const sellerRef = adminDb.collection('users').doc(data.sellerId);
            const sellerSnap = await t.get(sellerRef);
            const sellerData = sellerSnap.data() || {};

            const usersQuery = adminDb.collection('users').where('isAdmin', '==', true).limit(1);
            const usersSnap = await t.get(usersQuery);
            let adminId = null;
            if (!usersSnap.empty) {
                adminId = usersSnap.docs[0].id;
            }

            // 4. DISTRIBUTE FUNDS & GAMIFICATION via shared helper
            await processPayoutWrites(t, transactionId, data, sellerRef, sellerData, adminId, false);
        });

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error("Error releasing funds API:", error);
        return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
}
