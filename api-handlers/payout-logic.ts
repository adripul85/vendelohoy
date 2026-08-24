import { adminDb } from '../lib/firebase-admin.js';
import { FieldValue, Transaction } from 'firebase-admin/firestore';

export async function processPayoutWrites(
    t: Transaction,
    transactionId: string,
    data: any,
    sellerRef: any,
    sellerData: any,
    adminId: string | null,
    isAutoRelease: boolean,
    autoReason?: string
) {
    const docRef = adminDb.collection('transactions').doc(transactionId);

    // 1. Update Status
    const statusUpdate: any = {
        status: 'COMPLETED',
        escrowReleased: true,
        updatedAt: FieldValue.serverTimestamp()
    };
    if (isAutoRelease) {
        statusUpdate.autoReleased = true;
        statusUpdate.autoReleaseReason = autoReason;
    }
    t.update(docRef, statusUpdate);

    // 2. Increment successful sales for seller
    t.update(sellerRef, {
        successfulSales: FieldValue.increment(1),
        lastSaleDate: FieldValue.serverTimestamp()
    });

    // 3. XP for successful sale and recalculate level
    const currentPoints = sellerData.reputationPoints || 0;
    const currentConsecutive = sellerData.consecutiveSuccessfulSales || 0;
    
    let pointsToAward = 10;
    let newConsecutive = currentConsecutive + 1;
    let reason = isAutoRelease ? "Completar una Venta Exitosa (Auto-liberada)" : "Completar una Venta Exitosa";

    if (newConsecutive >= 10) {
        pointsToAward += 100;
        newConsecutive = 0;
        reason = isAutoRelease ? "Completar una Venta Exitosa + Bonus Racha de 10 Ventas (Auto-liberada)" : "Completar una Venta Exitosa + Bonus Racha de 10 Ventas";
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

    // 4. DISTRIBUTE FUNDS
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
            description: `Comisión Pago Protegido${isAutoRelease ? ' (Auto-liberación)' : ''}: ${data.itemTitle || 'Producto'}`,
            timestamp: FieldValue.serverTimestamp()
        });
        
        if (!isAutoRelease) {
            const simulatedInvoiceNumber = `0001-${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
            const simulatedInvoiceUrl = `https://afip.gov.ar/fe/comprobantes?cae=${Math.random().toString().substring(2)}`;
            t.update(docRef, {
                'invoice.number': simulatedInvoiceNumber,
                'invoice.url': simulatedInvoiceUrl,
                'invoice.amount': platformRevenue,
                'invoice.issuedAt': FieldValue.serverTimestamp()
            });
        }
    }

    const escrowLogRef = adminDb.collection('wallet_movements').doc();
    t.set(escrowLogRef, {
        uid: data.sellerId,
        type: 'ESCROW_RELEASE',
        amount: data.amountProduct || 0,
        referenceId: transactionId,
        itemTitle: data.itemTitle || 'Producto',
        description: `Liberación${isAutoRelease ? ' automática (48/72hs)' : ''} de garantía: ${data.itemTitle || 'Producto'}`,
        timestamp: FieldValue.serverTimestamp()
    });

    const saleLogRef = adminDb.collection('wallet_movements').doc();
    t.set(saleLogRef, {
        uid: data.sellerId,
        type: 'DIRECT_TRANSFER',
        amount: sellerProceeds,
        referenceId: transactionId,
        itemTitle: data.itemTitle || 'Producto',
        description: `Transferencia automática a CBU/CVU por venta${isAutoRelease ? ' auto-completada' : ''}: ${data.itemTitle || 'Producto'}`,
        timestamp: FieldValue.serverTimestamp()
    });

    if (featuredCommission > 0) {
        const featLogRef = adminDb.collection('wallet_movements').doc();
        t.set(featLogRef, {
            uid: data.sellerId,
            type: 'PENALTY',
            amount: featuredCommission,
            referenceId: transactionId,
            itemTitle: data.itemTitle || 'Producto',
            description: `Comisión por producto destacado`,
            timestamp: FieldValue.serverTimestamp()
        });
    }

    if (flashSaleCommission > 0) {
        const flashLogRef = adminDb.collection('wallet_movements').doc();
        t.set(flashLogRef, {
            uid: data.sellerId,
            type: 'PENALTY',
            amount: flashSaleCommission,
            referenceId: transactionId,
            itemTitle: data.itemTitle || 'Producto',
            description: `Comisión por oferta relámpago`,
            timestamp: FieldValue.serverTimestamp()
        });
    }

    return { sellerProceeds, platformRevenue };
}
