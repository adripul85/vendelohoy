import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../lib/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';

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

        // 1. Update Status
        t.update(docRef, {
            status: 'COMPLETED',
            escrowReleased: true,
            autoReleased: true,
            autoReleaseReason: autoReason,
            updatedAt: FieldValue.serverTimestamp()
        });

        // 2. Increment successful sales for seller
        t.update(sellerRef, {
            successfulSales: FieldValue.increment(1),
            lastSaleDate: FieldValue.serverTimestamp()
        });

        // 3. Points & Gamification
        const currentPoints = sellerData.reputationPoints || 0;
        const currentConsecutive = sellerData.consecutiveSuccessfulSales || 0;
        let pointsToAward = 10;
        let newConsecutive = currentConsecutive + 1;
        let reason = "Completar una Venta Exitosa (Auto-liberada)";

        if (newConsecutive >= 10) {
            pointsToAward += 100;
            newConsecutive = 0;
            reason = "Completar una Venta Exitosa + Bonus Racha de 10 Ventas";
        }

        const newPoints = Math.max(0, currentPoints + pointsToAward);
        t.update(sellerRef, {
            reputationPoints: newPoints,
            consecutiveSuccessfulSales: newConsecutive,
            updatedAt: FieldValue.serverTimestamp()
        });

        const repLogRef = adminDb.collection('reputationLogs').doc();
        t.set(repLogRef, {
            uid: data.sellerId,
            points: pointsToAward,
            reason: reason,
            timestamp: FieldValue.serverTimestamp()
        });

        // Recalculate level
        let newLevel = sellerData.trustLevel || 'Bajo';
        let newStatus = sellerData.sellerStatus || 'Socio en Prueba';
        const hasDni = !!sellerData.dni || !!sellerData.verificationBadges?.identityVerified;
        const hasBank = !!(sellerData.bankDetails?.cbu || sellerData.bankDetails?.alias);

        if (newPoints >= 5000 && hasDni && hasBank) {
            newLevel = 'Premium';
            newStatus = 'Socio Elite';
        } else if (newPoints >= 2500 && hasDni && hasBank) {
            newLevel = 'Alto';
            newStatus = 'Socio Elite';
        } else if (newPoints >= 1000 && hasDni) {
            newLevel = 'Medio';
            newStatus = 'Socio Activo';
        } else {
            newLevel = 'Bajo';
            newStatus = 'Socio en Prueba';
        }

        if (newLevel !== sellerData.trustLevel || newStatus !== sellerData.sellerStatus) {
            t.update(sellerRef, {
                trustLevel: newLevel,
                sellerStatus: newStatus
            });
        }

        // 4. Distribute Funds
        const baseSellerProceeds = data.amountProduct || data.amount || 0;
        let commissionRate = 0.07;
        const currentMonth = new Date().toISOString().slice(0, 7);
        let monthlyQuota = sellerData.monthlyQuota || { freeSalesUsed: 0, lastResetMonth: currentMonth };

        if (monthlyQuota.lastResetMonth !== currentMonth) {
            monthlyQuota.freeSalesUsed = 0;
            monthlyQuota.lastResetMonth = currentMonth;
        }

        if (newLevel === 'Premium') {
            if (monthlyQuota.freeSalesUsed < 3) {
                commissionRate = 0;
                monthlyQuota.freeSalesUsed += 1;
            } else {
                commissionRate = 0.05;
            }
        } else if (newLevel === 'Alto') {
            commissionRate = 0.05;
        }

        t.update(sellerRef, { monthlyQuota });

        const baseCommission = Math.round(baseSellerProceeds * commissionRate);
        const buyerPlatformFee = data.amountPlatformFee || data.platformFee || 0;
        const featuredCommission = data.featuredFeeApplied ? Math.round(baseSellerProceeds * data.featuredFeeApplied) : 0;
        const flashSaleCommission = data.flashSaleFeeApplied ? Math.round(baseSellerProceeds * data.flashSaleFeeApplied) : 0;

        const totalCommissions = baseCommission + featuredCommission + flashSaleCommission;
        const sellerProceeds = baseSellerProceeds - totalCommissions;
        const platformRevenue = buyerPlatformFee + totalCommissions;

        // Seller payout / wallet
        t.update(sellerRef, {
            "wallet.inEscrow": FieldValue.increment(-baseSellerProceeds)
        });

        const payoutRef = adminDb.collection('payouts').doc();
        t.set(payoutRef, {
            sellerId: data.sellerId,
            transactionId: transactionId,
            amount: sellerProceeds,
            status: 'PROCESSING',
            method: 'DIRECT_TRANSFER',
            bankDetails: sellerData.bankDetails || {},
            timestamp: FieldValue.serverTimestamp()
        });

        // Admin fee
        if (adminId && platformRevenue > 0) {
            const adminRef = adminDb.collection('users').doc(adminId);
            t.update(adminRef, { "wallet.available": FieldValue.increment(platformRevenue) });

            const finLogRef = adminDb.collection('financial_logs').doc();
            t.set(finLogRef, {
                transactionId: transactionId,
                type: 'platform_fee',
                amount: platformRevenue,
                currency: 'ARS',
                relatedUser: data.sellerId,
                timestamp: FieldValue.serverTimestamp()
            });

            const adminWalletLogRef = adminDb.collection('wallet_movements').doc();
            t.set(adminWalletLogRef, {
                uid: adminId,
                type: 'PLATFORM_REVENUE',
                amount: platformRevenue,
                referenceId: transactionId,
                itemTitle: data.itemTitle || 'Producto',
                description: `Comisión Pago Protegido (Auto-liberación): ${data.itemTitle || 'Producto'}`,
                timestamp: FieldValue.serverTimestamp()
            });
        }

        // Seller Wallet logs
        const escrowLogRef = adminDb.collection('wallet_movements').doc();
        t.set(escrowLogRef, {
            uid: data.sellerId,
            type: 'ESCROW_RELEASE',
            amount: data.amountProduct || 0,
            referenceId: transactionId,
            itemTitle: data.itemTitle || 'Producto',
            description: `Liberación automática de garantía (48/72hs): ${data.itemTitle || 'Producto'}`,
            timestamp: FieldValue.serverTimestamp()
        });

        const saleLogRef = adminDb.collection('wallet_movements').doc();
        t.set(saleLogRef, {
            uid: data.sellerId,
            type: 'DIRECT_TRANSFER',
            amount: sellerProceeds,
            referenceId: transactionId,
            itemTitle: data.itemTitle || 'Producto',
            description: `Transferencia automática a CBU/CVU por venta auto-completada: ${data.itemTitle || 'Producto'}`,
            timestamp: FieldValue.serverTimestamp()
        });

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
