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

        const callerUid = decodedToken.uid;
        
        // Validate if user is Admin
        const userRef = adminDb.collection('users').doc(callerUid);
        const userSnap = await userRef.get();
        if (!userSnap.exists || !userSnap.data()?.isAdmin) {
            return res.status(403).json({ error: 'Prohibido: Se requieren permisos de administrador.' });
        }

        const txRef = adminDb.collection('transactions').doc(transactionId);
        
        await adminDb.runTransaction(async (t) => {
            const txSnap = await t.get(txRef);
            if (!txSnap.exists) {
                throw new Error('Transacción no encontrada');
            }
            
            const txData = txSnap.data();

            if (txData?.status === 'REFUNDED') {
                throw new Error('Esta transacción ya fue reembolsada.');
            }

            // Refund the product amount to the buyer
            const productAmount = txData?.amountProduct || txData?.amount;
            const buyerRef = adminDb.collection('users').doc(txData?.buyerId);
            
            t.update(buyerRef, {
                "wallet.available": FieldValue.increment(productAmount)
            });

            // Remove the held funds from the seller's escrow
            const sellerRef = adminDb.collection('users').doc(txData?.sellerId);
            t.update(sellerRef, {
                "wallet.inEscrow": FieldValue.increment(-productAmount)
            });

            // Update Transaction Status
            t.update(txRef, {
                status: 'REFUNDED',
                escrowReleased: true,
                lastSystemMessage: `⚖️ Resolución Administrativa: Reembolso completo emitido al Comprador por el administrador #${callerUid.slice(0, 5)}.`,
                updatedAt: FieldValue.serverTimestamp()
            });

            // Log Wallet Movement for Buyer
            const buyerLogRef = adminDb.collection('wallet_logs').doc();
            t.set(buyerLogRef, {
                uid: txData?.buyerId,
                type: 'ESCROW_RELEASE',
                amount: productAmount,
                referenceId: transactionId,
                itemTitle: txData?.itemTitle,
                description: `Reembolso administrativo: ${txData?.itemTitle}`,
                createdAt: FieldValue.serverTimestamp(),
                status: 'COMPLETED'
            });

            // Log Wallet Movement for Seller
            const sellerLogRef = adminDb.collection('wallet_logs').doc();
            t.set(sellerLogRef, {
                uid: txData?.sellerId,
                type: 'ESCROW_RELEASE',
                amount: productAmount,
                referenceId: transactionId,
                itemTitle: txData?.itemTitle,
                description: `Escrow devuelto al comprador por resolución admin: ${txData?.itemTitle}`,
                createdAt: FieldValue.serverTimestamp(),
                status: 'COMPLETED'
            });
            
            // Register financial system log
            const financialLogRef = adminDb.collection('financial_logs').doc();
            t.set(financialLogRef, {
                transactionId: transactionId,
                type: 'admin_refund',
                amount: productAmount,
                currency: 'ARS',
                timestamp: FieldValue.serverTimestamp(),
                description: 'Admin forced refund completed, funds returned to buyer'
            });
        });

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error("Admin Refund API Error:", error);
        return res.status(500).json({ error: error.message || 'Error interno procesando el reembolso administrativo' });
    }
}
