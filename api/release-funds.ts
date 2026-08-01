import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminAuth } from '../lib/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';

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

        // Fetch transaction
        const docRef = adminDb.collection('transactions').doc(transactionId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'Transacción no encontrada' });
        }

        const data = docSnap.data() as any;

        // Verify user is buyer OR (seller validating QR code for in-person delivery)
        if (data.buyerId !== decodedToken.uid && data.sellerId !== decodedToken.uid) {
            return res.status(403).json({ error: 'Prohibido: No eres participante de esta transacción.' });
        }

        // QR Validation (Client-Side) for in-person delivery
        if (data.deliveryMethod === 'en_mano') {
            if (data.sellerId === decodedToken.uid) {
                if (!qrToken || data.qrCode !== qrToken) {
                    return res.status(400).json({ error: 'Token de seguridad inválido' });
                }
            } else if (data.buyerId === decodedToken.uid) {
                // Buyer is releasing funds manually (no QR needed)
            }
        } else {
             // For shipping, usually buyer releases funds. If seller tries, block.
             if (data.sellerId === decodedToken.uid) {
                 return res.status(403).json({ error: 'Prohibido: Solo el comprador puede liberar los fondos para envíos.' });
             }
        }

        if (data.status === 'COMPLETED') {
            return res.status(200).json({ success: true }); // Idempotency check
        }

        // Use batch to ensure atomic updates
        const batch = adminDb.batch();

        // 1. Update Status
        batch.update(docRef, {
            status: 'COMPLETED',
            escrowReleased: true,
            updatedAt: FieldValue.serverTimestamp()
        });

        // 2. Increment successful sales for seller
        const sellerRef = adminDb.collection('users').doc(data.sellerId);
        batch.update(sellerRef, {
            successfulSales: FieldValue.increment(1),
            lastSaleDate: FieldValue.serverTimestamp()
        });

        // 3. XP for successful sale and recalculate level
        const sellerSnap = await sellerRef.get();
        const sellerData = sellerSnap.data() || {};
        const currentPoints = sellerData.reputationPoints || 0;
        const newPoints = Math.max(0, currentPoints + 25);

        batch.update(sellerRef, {
            reputationPoints: newPoints,
            updatedAt: FieldValue.serverTimestamp()
        });

        // Add log
        const repLogRef = adminDb.collection('reputationLogs').doc();
        batch.set(repLogRef, {
            uid: data.sellerId,
            points: 25,
            reason: "Completar una Venta Exitosa",
            timestamp: FieldValue.serverTimestamp()
        });

        // Recalculate level logic
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
            batch.update(sellerRef, {
                trustLevel: newLevel,
                sellerStatus: newStatus
            });
        }

        // 4. DISTRIBUTE FUNDS
        // Find Admin user
        const usersSnap = await adminDb.collection('users').where('isAdmin', '==', true).limit(1).get();
        let adminId = null;
        if (!usersSnap.empty) {
            adminId = usersSnap.docs[0].id;
        }

        const baseSellerProceeds = data.amountProduct || data.amount || 0;
        const basePlatformRevenue = data.amountPlatformFee || data.platformFee || 0;
        const featuredCommission = data.featuredFeeApplied ? Math.round(baseSellerProceeds * data.featuredFeeApplied) : 0;
        const flashSaleCommission = data.flashSaleFeeApplied ? Math.round(baseSellerProceeds * data.flashSaleFeeApplied) : 0;

        const totalCommissions = featuredCommission + flashSaleCommission;
        const sellerProceeds = baseSellerProceeds - totalCommissions;
        const platformRevenue = basePlatformRevenue + totalCommissions;

        // A. Pay Seller (DIRECT TRANSFER MODEL)
        // Se descuenta del Escrow y se genera la orden de pago directa al CBU
        batch.update(sellerRef, {
            "wallet.inEscrow": FieldValue.increment(-baseSellerProceeds)
        });

        const payoutRef = adminDb.collection('payouts').doc();
        batch.set(payoutRef, {
            sellerId: data.sellerId,
            transactionId: transactionId,
            amount: sellerProceeds,
            status: 'PROCESSING',
            method: 'DIRECT_TRANSFER',
            bankDetails: sellerData.bankDetails || {},
            timestamp: FieldValue.serverTimestamp()
        });

        // B. Pay Admin
        if (adminId && platformRevenue > 0) {
            const adminRef = adminDb.collection('users').doc(adminId);
            batch.update(adminRef, { "wallet.available": FieldValue.increment(platformRevenue) });

            const finLogRef = adminDb.collection('financial_logs').doc();
            batch.set(finLogRef, {
                transactionId: transactionId,
                type: 'platform_fee',
                amount: platformRevenue,
                currency: 'ARS',
                relatedUser: data.sellerId,
                timestamp: FieldValue.serverTimestamp()
            });

            const adminWalletLogRef = adminDb.collection('wallet_movements').doc();
            batch.set(adminWalletLogRef, {
                uid: adminId,
                type: 'PLATFORM_REVENUE',
                amount: platformRevenue,
                referenceId: transactionId,
                itemTitle: data.itemTitle || 'Producto',
                description: `Comisión Pago Protegido: ${data.itemTitle || 'Producto'}`,
                timestamp: FieldValue.serverTimestamp()
            });

            // ==========================================
            // SIMULATED AFIP ELECTRONIC INVOICING (FACTURACIÓN)
            // ==========================================
            // In a real scenario, here we call AFIP WSFEv1 to emit a Factura B/C for the platformRevenue
            const simulatedInvoiceNumber = `0001-${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
            const simulatedInvoiceUrl = `https://afip.gov.ar/fe/comprobantes?cae=${Math.random().toString().substring(2)}`;
            
            batch.update(docRef, {
                'invoice.number': simulatedInvoiceNumber,
                'invoice.url': simulatedInvoiceUrl,
                'invoice.amount': platformRevenue,
                'invoice.issuedAt': FieldValue.serverTimestamp()
            });
        }

        // Seller Wallet logs
        const escrowLogRef = adminDb.collection('wallet_movements').doc();
        batch.set(escrowLogRef, {
            uid: data.sellerId,
            type: 'ESCROW_RELEASE',
            amount: data.amountProduct || 0,
            referenceId: transactionId,
            itemTitle: data.itemTitle || 'Producto',
            description: `Liberación de garantía: ${data.itemTitle || 'Producto'}`,
            timestamp: FieldValue.serverTimestamp()
        });

        const saleLogRef = adminDb.collection('wallet_movements').doc();
        batch.set(saleLogRef, {
            uid: data.sellerId,
            type: 'DIRECT_TRANSFER',
            amount: sellerProceeds,
            referenceId: transactionId,
            itemTitle: data.itemTitle || 'Producto',
            description: `Transferencia automática a CBU/CVU por venta: ${data.itemTitle || 'Producto'}`,
            timestamp: FieldValue.serverTimestamp()
        });

        if (featuredCommission > 0) {
            const featLogRef = adminDb.collection('wallet_movements').doc();
            batch.set(featLogRef, {
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
            batch.set(flashLogRef, {
                uid: data.sellerId,
                type: 'PENALTY',
                amount: flashSaleCommission,
                referenceId: transactionId,
                itemTitle: data.itemTitle || 'Producto',
                description: `Comisión por oferta relámpago`,
                timestamp: FieldValue.serverTimestamp()
            });
        }

        // Execute batch
        await batch.commit();

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error("Error releasing funds API:", error);
        return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
}
