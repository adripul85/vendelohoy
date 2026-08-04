import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminAuth } from '../lib/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { transactionId } = req.body;
        
        // Basic auth check via headers (simplified for this sandbox)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (e) {
            return res.status(401).json({ error: 'No autorizado: Token inválido.' });
        }

        const txRef = adminDb.collection('transactions').doc(transactionId);
        const txSnap = await txRef.get();

        if (!txSnap.exists) {
            return res.status(404).json({ error: 'Transacción no encontrada' });
        }

        const txData = txSnap.data() as any;

        // Security check: Only the seller can dispatch the courier
        if (txData.sellerId !== decodedToken.uid) {
            return res.status(403).json({ error: 'Prohibido: No tienes permiso para despachar esta orden.' });
        }

        if (txData.deliveryMethod !== "domicilio") {
            return res.status(400).json({ error: 'El método de entrega no es apto para vehículos On-Demand.' });
        }
        if (txData.trackingNumber) {
            return res.status(400).json({ error: 'Ya se ha solicitado un vehículo para esta orden.' });
        }

        // ==== SIMULADOR (SANDBOX) UBER / CABIFY ====
        // En producción, aquí haríamos POST a Uber Direct API usando las credenciales seguras
        // const response = await fetch('https://api.uber.com/v1/deliveries', { headers: { Authorization: `Bearer ${process.env.UBER_CLIENT_SECRET}` } })
        
        const provider = 'UBER_DIRECT_SANDBOX';
        const mockTrackingId = `UBER-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const mockTrackingUrl = `https://vendelohoy.com/track/${mockTrackingId}`; 

        const batch = adminDb.batch();

        const courierReqRef = adminDb.collection("courier_requests").doc();
        batch.set(courierReqRef, {
            transactionId: transactionId,
            sellerId: txData.sellerId,
            buyerId: txData.buyerId,
            provider: provider,
            status: 'driver_assigned',
            trackingId: mockTrackingId,
            trackingUrl: mockTrackingUrl,
            driverDetails: {
                name: 'Carlos (Conductor de Prueba Uber)',
                vehicle: 'Toyota Etios Gris',
                plate: 'AF 123 AB'
            },
            paymentMethod: txData.shippingPaymentMethod || 'pay_on_delivery',
            createdAt: FieldValue.serverTimestamp()
        });

        batch.update(txRef, {
            trackingNumber: mockTrackingId,
            trackingUrl: mockTrackingUrl,
            courier: 'Uber (Sandbox)',
            status: 'SHIPPED',
            updatedAt: FieldValue.serverTimestamp()
        });

        await batch.commit();

        return res.status(200).json({ 
            success: true, 
            trackingId: mockTrackingId, 
            trackingUrl: mockTrackingUrl,
            provider: provider
        });

    } catch (error: any) {
        console.error("Error dispatching courier:", error);
        return res.status(500).json({ error: "Ocurrió un error al despachar el vehículo" });
    }
}
