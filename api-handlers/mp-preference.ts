import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../lib/firebase-admin.js';
import { checkRateLimit } from './rate-limit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown';
    const rateLimit = checkRateLimit(clientIp, 'mp-preference', 5, 60000); // 5 requests per minute per IP

    if (!rateLimit.success) {
        return res.status(429).json({ error: rateLimit.message });
    }

    const { title, price, quantity, productId, sellerId, transactionId } = req.body;
    console.log(`[MP API] Initiating preference for: Product: ${productId}, Seller: ${sellerId}, Price: ${price}`);

    try {
        if (!sellerId || !transactionId) {
            console.error("[MP API] Error: Missing sellerId or transactionId in Request Payload");
            return res.status(400).json({ error: 'Faltan datos de la transacción' });
        }

        // Validación de Firebase Admin
        if (!adminDb) {
            console.error("[MP API] Error Crítico: Firebase Admin SDK no se inicializó correctamente en Vercel. Faltan variables de entorno.");
            return res.status(500).json({ error: 'Fallo interno de servidor: Credenciales de Base de Datos ausentes.' });
        }

        // SECURITY FIX: Buscar la transacción real en Firestore para usar su precio total
        const txSnap = await adminDb.collection('transactions').doc(transactionId).get();
        if (!txSnap.exists) {
            return res.status(404).json({ error: 'Transacción no encontrada en la base de datos' });
        }
        
        const txData = txSnap.data();
        const realPrice = txData?.amountTotal || txData?.total || Number(price);

        // Obtener datos del Vendedor para OAuth y Comisiones
        const sellerSnap = await adminDb.collection('users').doc(sellerId).get();
        if (!sellerSnap.exists) {
             return res.status(404).json({ error: 'Vendedor no encontrado' });
        }
        const sellerData = sellerSnap.data() || {};
        const mpOAuth = sellerData.mercadoPagoOAuth;

        if (!process.env.MP_ACCESS_TOKEN) {
            console.error("[MP API] Error: Platform MP_ACCESS_TOKEN not set in environment.");
            return res.status(500).json({ error: 'Falta configurar la pasarela de pagos de la plataforma.' });
        }

        const isLocalHost = req.headers.host?.includes('localhost');
        
        // --- CÁLCULO DE COMISIÓN PARA MARKETPLACE FEE ---
        const baseSellerProceeds = Number(realPrice);
        let commissionRate = 0.07; // Base 7%
        const trustLevel = sellerData.trustLevel || 'Bajo';
        
        if (trustLevel === 'Premium' || trustLevel === 'Alto') {
            commissionRate = 0.05; // 5% para niveles altos
        }
        
        // Si hay cuota mensual gratis (Premium < 3 ventas), sería 0%, pero para simplificar
        // en el checkout aplicamos la tasa actual. El ajuste fino se hace en payout-logic si difiere.
        
        const baseCommission = Math.round(baseSellerProceeds * commissionRate);
        const buyerPlatformFee = txData?.amountPlatformFee || txData?.platformFee || 0;
        const featuredCommission = txData?.featuredFeeApplied ? Math.round(baseSellerProceeds * txData.featuredFeeApplied) : 0;
        const flashSaleCommission = txData?.flashSaleFeeApplied ? Math.round(baseSellerProceeds * txData.flashSaleFeeApplied) : 0;

        const totalMarketplaceFee = buyerPlatformFee + baseCommission + featuredCommission + flashSaleCommission;

        const mpPayload: any = {
            items: [
                {
                    title: title || txData?.itemTitle || 'Producto',
                    unit_price: Number(realPrice),
                    quantity: Number(quantity),
                    currency_id: 'ARS'
                }
            ],
            external_reference: transactionId, 
            metadata: {
                seller_id: sellerId,
                product_id: productId || txData?.itemId,
                transaction_id: transactionId
            },
            back_urls: {
                success: `https://${req.headers.host}/payment/success`,
                failure: `https://${req.headers.host}/payment/failure`,
                pending: `https://${req.headers.host}/payment/pending`
            },
            auto_return: 'approved'
        };

        // Si el vendedor vinculó su cuenta (OAuth), usamos Split Payments
        if (!mpOAuth || !mpOAuth.accessToken) {
            console.error(`[MP API] Seller DOES NOT have OAuth. Blocking transaction to prevent centralized escrow.`);
            return res.status(400).json({ error: 'El vendedor aún no configuró su cuenta para recibir pagos. Por favor, intentá más tarde.' });
        }

        const accessTokenToUse = mpOAuth.accessToken;
        mpPayload.marketplace_fee = totalMarketplaceFee;
        console.log(`[MP API] Seller HAS OAuth. Using Split Payments (Marketplace Fee: ${totalMarketplaceFee})`);

        // MercadoPago a menudo bloquea webhooks hacia "localhost" con un error 400.
        if (!isLocalHost) {
            mpPayload.notification_url = `https://${req.headers.host}/api/mercadopago-webhook`;
        }
        
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessTokenToUse}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mpPayload)
        });

        // Parse result carefully
        let data;
        const rawRes = await response.text();


        try {
            data = JSON.parse(rawRes);
        } catch(e) {
            console.error(`[MP API] Error parsing MP response. Raw text:`, rawRes);
            throw new Error('Respuesta inválida de Mercado Pago');
        }

        if (!response.ok) {
            console.error(`[MP API] Preference Creation Failed. Status: ${response.status}`, data);
            throw new Error(data.message || 'Error creating preference in Mercado Pago');
        }

        console.log(`[MP API] Preference Created Success. ID: ${data.id}`);
        return res.status(200).json({ id: data.id, init_point: data.init_point });
    } catch (error: any) {
        console.error("[MP API] Fatal Error Catch Block:", error);
        return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
}
