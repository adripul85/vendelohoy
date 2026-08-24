import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../lib/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { processPayoutWrites } from './payout-logic.js';

export async function processTransactionRelease(transactionId: string, autoReason: string) {
    return await adminDb.runTransaction(async (t) => {
        const docRef = adminDb.collection('transactions').doc(transactionId);
        const docSnap = await t.get(docRef);

        if (!docSnap.exists) {
            throw new Error(`Transacción ${transactionId} no encontrada`);
        }

        const data = docSnap.data() as any;

        if (data.status === 'COMPLETED') {
            return { id: transactionId, status: 'already_completed' };
        }

        if (data.status !== 'PAID_HELD' && data.status !== 'SHIPPED' && data.status !== 'DELIVERED_PENDING_REVIEW') {
            throw new Error(`Estado inválido para auto-liberar: ${data.status}`);
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

        // 1. DISTRIBUTE FUNDS & GAMIFICATION via shared helper
        const { sellerProceeds, platformRevenue } = await processPayoutWrites(t, transactionId, data, sellerRef, sellerData, adminId, true, autoReason);

        // In-app Notifications
        const buyerNotifRef = adminDb.collection('notifications').doc();
        t.set(buyerNotifRef, {
            userId: data.buyerId,
            title: '✅ Pago en custodia completado',
            message: `Han transcurrido más de 48/72hs de la orden "${data.itemTitle || 'Producto'}". El pago ha sido liberado automáticamente al vendedor.`,
            type: 'info',
            icon: 'schedule',
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            link: `/transaction/${transactionId}`
        });

        const sellerNotifRef = adminDb.collection('notifications').doc();
        t.set(sellerNotifRef, {
            userId: data.sellerId,
            title: '💰 ¡Pago liberado automáticamente!',
            message: `El pago de "${data.itemTitle || 'Producto'}" ($${sellerProceeds.toLocaleString('es-AR')}) fue liberado por tiempo cumplido y procesado hacia tu cuenta.`,
            type: 'success',
            icon: 'payments',
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            link: '/dashboard'
        });

        return { id: transactionId, status: 'success', sellerProceeds, platformRevenue };
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const now = new Date();
        const cutoff72h = new Date(now.getTime() - 72 * 60 * 60 * 1000);
        const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

        // 1. Fetch Candidates
        const [reviewSnap, shippedSnap, paidHeldSnap] = await Promise.all([
            // DELIVERED_PENDING_REVIEW where inspection deadline has passed
            adminDb.collection('transactions')
                .where('status', '==', 'DELIVERED_PENDING_REVIEW')
                .get(),
            // SHIPPED transactions
            adminDb.collection('transactions')
                .where('status', '==', 'SHIPPED')
                .get(),
            // PAID_HELD transactions
            adminDb.collection('transactions')
                .where('status', '==', 'PAID_HELD')
                .get()
        ]);

        const candidates: { id: string; reason: string }[] = [];

        // Check Review Snap
        reviewSnap.forEach(doc => {
            const data = doc.data();
            const deadline = data.inspectionDeadline ? (data.inspectionDeadline.toDate ? data.inspectionDeadline.toDate() : new Date(data.inspectionDeadline)) : null;
            if (!deadline || deadline <= now) {
                candidates.push({ id: doc.id, reason: 'inspection_deadline_expired' });
            }
        });

        // Check Shipped Snap (> 48/72hs since shipped or updated)
        shippedSnap.forEach(doc => {
            const data = doc.data();
            const dateRef = data.updatedAt || data.createdAt;
            const date = dateRef ? (dateRef.toDate ? dateRef.toDate() : new Date(dateRef)) : null;
            if (!date || date <= cutoff72h || date <= cutoff48h) {
                candidates.push({ id: doc.id, reason: 'shipped_over_72h_timeout' });
            }
        });

        // Check Paid Held Snap (> 48/72hs since purchase without dispute)
        paidHeldSnap.forEach(doc => {
            const data = doc.data();
            const dateRef = data.updatedAt || data.createdAt;
            const date = dateRef ? (dateRef.toDate ? dateRef.toDate() : new Date(dateRef)) : null;
            if (!date || date <= cutoff72h) {
                candidates.push({ id: doc.id, reason: 'paid_held_over_72h_timeout' });
            }
        });

        if (candidates.length === 0) {
            return res.status(200).json({ success: true, message: 'No hay transacciones pendientes para auto-liberar.', released: [] });
        }

        const results = [];
        for (const candidate of candidates) {
            try {
                const resObj = await processTransactionRelease(candidate.id, candidate.reason);
                results.push(resObj);
            } catch (err: any) {
                console.error(`Error auto-releasing ${candidate.id}:`, err);
                results.push({ id: candidate.id, status: 'error', error: err.message });
            }
        }

        return res.status(200).json({
            success: true,
            totalFound: candidates.length,
            released: results
        });
    } catch (error: any) {
        console.error('Error in auto-release-escrow handler:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
