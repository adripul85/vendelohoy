import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../lib/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const payload = req.body;
        // Uber/Cabify Webhook payload format varies, but usually includes:
        // status (e.g. 'picked_up', 'delivered', 'canceled')
        // delivery_id
        
        console.log('[WEBHOOK DELIVERY] Recibido:', payload);
        
        const deliveryId = payload.delivery_id || payload.tracking_id;
        const status = payload.status || payload.event_type;

        if (!deliveryId || !status) {
             return res.status(400).json({ error: 'Payload inválido' });
        }

        // Buscar el request de courier en Firebase
        const queries = await adminDb.collection('courier_requests')
            .where('trackingId', '==', deliveryId)
            .limit(1)
            .get();

        if (queries.empty) {
             console.log('No se encontró el deliveryId:', deliveryId);
             return res.status(404).json({ error: 'Not Found' });
        }

        const requestDoc = queries.docs[0];
        const requestData = requestDoc.data();

        // Mapear estados (Ejemplo genérico)
        let newAppStatus = '';
        let newTxStatus = '';

        if (status === 'en_route_to_pickup') {
            newAppStatus = 'driver_on_way';
        } else if (status === 'picked_up') {
            newAppStatus = 'picked_up';
            newTxStatus = 'SHIPPED'; // Por si no estaba marcado
        } else if (status === 'delivered') {
            newAppStatus = 'delivered';
            newTxStatus = 'DELIVERED_PENDING_REVIEW';
        } else if (status === 'canceled') {
            newAppStatus = 'canceled';
        }

        const batch = adminDb.batch();

        if (newAppStatus) {
            batch.update(requestDoc.ref, { 
                status: newAppStatus,
                updatedAt: FieldValue.serverTimestamp()
            });
        }

        if (newTxStatus && requestData.transactionId) {
            const txRef = adminDb.collection('transactions').doc(requestData.transactionId);
            batch.update(txRef, { 
                status: newTxStatus,
                updatedAt: FieldValue.serverTimestamp()
            });
        }

        await batch.commit();

        return res.status(200).json({ success: true });

    } catch (error: any) {
        console.error("Error en webhook de delivery:", error);
        return res.status(500).json({ error: "Internal Error" });
    }
}
