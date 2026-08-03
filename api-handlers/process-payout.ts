import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminAuth } from '../lib/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { withdrawalId } = req.body;
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

        // Validate if user is Admin
        const userRef = adminDb.collection('users').doc(decodedToken.uid);
        const userSnap = await userRef.get();
        if (!userSnap.exists || !userSnap.data()?.isAdmin) {
            return res.status(403).json({ error: 'Prohibido: Se requieren permisos de administrador.' });
        }

        // Fetch Withdrawal Request
        const withdrawalRef = adminDb.collection('withdrawals').doc(withdrawalId);
        const withdrawalSnap = await withdrawalRef.get();

        if (!withdrawalSnap.exists) {
            return res.status(404).json({ error: 'Solicitud de retiro no encontrada.' });
        }

        const withdrawalData = withdrawalSnap.data() as any;

        if (withdrawalData.status !== 'pending') {
            return res.status(400).json({ error: 'Esta solicitud ya fue procesada o rechazada.' });
        }

        // ==========================================
        // SIMULATED BANKING API INTEGRATION (PAYOUT)
        // ==========================================
        // In a real scenario, here you would call MercadoPago Transfer API or Bind:
        // const bankResponse = await fetch('https://api.mercadopago.com/v1/transfers', { ... })
        // We simulate network delay and a successful response
        
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate 1.5s bank latency
        
        const simulatedBankTransactionId = `TRX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

        const batch = adminDb.batch();

        // 1. Update Withdrawal Status
        batch.update(withdrawalRef, {
            status: 'completed',
            bankTransactionId: simulatedBankTransactionId,
            processedAt: FieldValue.serverTimestamp(),
            processedBy: decodedToken.uid
        });

        // 2. Log Wallet Movement (WITHDRAWAL_COMPLETED)
        const walletLogRef = adminDb.collection('wallet_movements').doc();
        batch.set(walletLogRef, {
            uid: withdrawalData.uid,
            type: 'WITHDRAWAL_COMPLETED',
            amount: withdrawalData.amount,
            referenceId: withdrawalId,
            description: `Retiro Bancario Completado (Ref: ${simulatedBankTransactionId})`,
            timestamp: FieldValue.serverTimestamp()
        });

        await batch.commit();

        return res.status(200).json({ 
            success: true, 
            message: 'Transferencia completada con éxito',
            bankTransactionId: simulatedBankTransactionId
        });

    } catch (error: any) {
        console.error("Payout API Error:", error);
        return res.status(500).json({ error: error.message || 'Error interno procesando la transferencia' });
    }
}
