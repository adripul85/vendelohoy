import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminAuth } from '../lib/firebase-admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { tradeId } = req.body;
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No autorizado: Falta el token de seguridad.' });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (e) {
            return res.status(401).json({ error: 'No autorizado: Token invalido.' });
        }

        const uid = decodedToken.uid;

        if (!adminDb) {
            return res.status(500).json({ error: 'Firebase Admin no disponible.' });
        }

        const tradeSnap = await adminDb.collection('trades').doc(tradeId).get();
        if (!tradeSnap.exists) {
            return res.status(404).json({ error: 'Canje no encontrado.' });
        }

        const trade = tradeSnap.data() as any;
        const isInitiator = uid === trade.initiatorId;
        const isReceiver = uid === trade.receiverId;

        if (!isInitiator && !isReceiver) {
            return res.status(403).json({ error: 'No eres participante de este canje.' });
        }

        const baseFee = trade.protectionFeePerUser || 2000;
        let amountToPay = baseFee;

        // Si el usuario tiene que pagar diferencia en dinero ademas del fee:
        if (isInitiator && trade.cashDifference > 0) {
            amountToPay += Number(trade.cashDifference);
        } else if (isReceiver && trade.cashDifference < 0) {
            amountToPay += Math.abs(Number(trade.cashDifference));
        }

        const platformAccessToken = process.env.MP_ACCESS_TOKEN;
        if (!platformAccessToken) {
            return res.status(500).json({ error: 'Mercado Pago no configurado en el servidor.' });
        }

        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'vendelohoy.vercel.app';
        const baseUrl = `${protocol}://${host}`;

        const preferencePayload = {
            items: [
                {
                    title: `Fee de Garantia Canje #${tradeId.slice(0, 6)}`,
                    description: `Proteccion de Intercambio Seguro en VendeloHoy`,
                    quantity: 1,
                    unit_price: Number(amountToPay),
                    currency_id: 'ARS'
                }
            ],
            external_reference: `TRADE_${tradeId}_${isInitiator ? 'INITIATOR' : 'RECEIVER'}`,
            notification_url: `${baseUrl}/api/mercadopago-webhook`,
            back_urls: {
                success: `${baseUrl}/trade/${tradeId}?payment_status=approved`,
                failure: `${baseUrl}/trade/${tradeId}?payment_status=failure`,
                pending: `${baseUrl}/trade/${tradeId}?payment_status=pending`
            },
            auto_return: 'approved'
        };

        const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${platformAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preferencePayload)
        });

        const mpData = await mpRes.json();

        if (!mpRes.ok) {
            console.error('[MP TRADE FEE] Error preference:', mpData);
            return res.status(500).json({ error: mpData.message || 'Error al conectar con Mercado Pago' });
        }

        return res.status(200).json({
            id: mpData.id,
            url: mpData.init_point || mpData.sandbox_init_point
        });

    } catch (error: any) {
        console.error('[MP TRADE FEE] Exception:', error);
        return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
}
