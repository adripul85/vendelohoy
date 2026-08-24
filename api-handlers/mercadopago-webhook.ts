import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../lib/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // Validación de Firma (HMAC) de MercadoPago
    const signature = req.headers['x-signature'] as string;
    const requestId = req.headers['x-request-id'] as string;
    
    // A veces MercadoPago envía un ping de confirmación o request vacío de prueba
    if (req.body.action === "test.created" || !req.body.data?.id) {
        return res.status(200).send('OK');
    }

    // SECURITY FIX: "fail closed" — si no se puede validar la firma, rechazar
    if (!process.env.MP_WEBHOOK_SECRET) {
        console.error("MP_WEBHOOK_SECRET not configured — rejecting webhook");
        return res.status(500).send('Webhook secret not configured');
    }

    if (!signature || !requestId) {
        console.error("Missing x-signature or x-request-id headers — rejecting webhook");
        return res.status(401).send('Missing signature headers');
    }

    const parts = signature.split(',');
    let ts = '';
    let v1 = '';
    parts.forEach(part => {
        if (part.startsWith('ts=')) ts = part.substring(3);
        if (part.startsWith('v1=')) v1 = part.substring(3);
    });

    const manifest = `id:${req.body.data.id};request-id:${requestId};ts:${ts};`;
    const hmac = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET);
    hmac.update(manifest);
    const generatedHash = hmac.digest('hex');
    
    if (generatedHash !== v1) {
        console.error("Invalid Webhook Signature:", { expected: v1, generated: generatedHash });
        return res.status(401).send('Invalid Signature');
    }

    // Mercado Pago envía notificaciones por query params o body dependiendo del tipo
    const { action, data, type } = req.body;

    try {
        // Solo nos interesan los pagos (payment)
        if (type === "payment" || action === "payment.created" || action === "payment.updated") {
            const queryId = req.query['data.id'] || (req.query.data as any)?.id;
            const paymentId = data?.id || queryId || req.body?.data?.id;

            if (!paymentId) {
                 // Si MP envía un POST simple sin ID claro, logueamos
                 console.log("No payment ID in body:", req.body);
                 return res.status(400).send('No payment ID');
            }

            // ATENCIÓN: Con Split Payments, el pago se hizo a nombre del vendedor.
            // Necesitamos consultar con Credenciales (Access Token) que tenga acceso a ese cobro,
            // pero normalmente el webhook lo configuraste en TÚ aplicación (APP OWNER), 
            // así que el Bearer Token del App Owner DEBERÍA tener acceso a ver la transacción de su Marketplace.
            
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
            });

            if (!mpResponse.ok) {
                const errData = await mpResponse.json();
                console.error("Error fetching MP payment (Is API Key Valid?):", errData);
                throw new Error('Error fetching payment from MP');
            }

            const paymentData = await mpResponse.json();

            if (paymentData.status === 'approved') {
                const transactionId = paymentData.metadata?.transaction_id;
                const productId = paymentData.metadata?.product_id;
                
                if (transactionId && productId) {
                    const db = adminDb;
                    
                    const txRef = db.collection('transactions').doc(transactionId);
                    await db.runTransaction(async (t) => {
                        const txSnap = await t.get(txRef);
                        if (!txSnap.exists) {
                            throw new Error(`Tx ${transactionId} not found`);
                        }
                        const tx = txSnap.data();
                        
                        if (tx?.status !== 'PENDING_PAYMENT') {
                            console.log(`Tx ${transactionId} already processed (status: ${tx?.status}).`);
                            return; // Ya procesado, no hacemos nada
                        }

                        // SECURITY FIX: Verificar que el monto pagado coincida con el monto total de la transacción
                        const expectedAmount = tx?.amountTotal || tx?.total || 0;
                        const paidAmount = paymentData.transaction_amount || 0;
                        
                        // Permitimos una diferencia menor a 1 peso por posibles redondeos de MP
                        if (Math.abs(paidAmount - expectedAmount) > 1) {
                            console.error(`[CRITICAL] Monto pagado (${paidAmount}) no coincide con el monto esperado (${expectedAmount}) para Tx ${transactionId}.`);
                            throw new Error('Monto pagado incorrecto. Posible fraude o pago parcial.');
                        }

                        // 2. Actualizar estado del producto
                        try {
                            const itemRef = db.collection('items').doc(productId);
                            const itemSnap = await t.get(itemRef);
                            if (itemSnap.exists) {
                                const itemData = itemSnap.data();
                                const currentQty = itemData?.quantity || 1;
                                const txQuantity = tx?.quantity || 1;
                                const newQty = Math.max(0, currentQty - txQuantity);
                                
                                t.update(itemRef, {
                                    quantity: newQty,
                                    status: newQty > 0 ? 'AVAILABLE' : 'SOLD',
                                    paymentId: paymentId,
                                    updatedAt: new Date()
                                });
                            }
                        } catch (e) {
                            console.warn(`Could not update item ${productId}, it might be a cart order. Continuing...`);
                        }

                        // 3. Actualizar transaccion
                        t.update(txRef, {
                            status: 'PAID_HELD',
                            updatedAt: new Date(),
                            paymentId: paymentId
                        });
                        
                        // 4. Agregar saldo 'En Custodia' al vendedor
                        const sellerId = tx.sellerId;
                        const amountProduct = tx.amountProduct || tx.amount;
                        const sellerRef = db.collection('users').doc(sellerId);
                        
                        t.update(sellerRef, {
                            "wallet.inEscrow": FieldValue.increment(amountProduct)
                        });
                        
                        // Log del movimiento
                        const walletLogRef = db.collection('wallet_logs').doc();
                        t.set(walletLogRef, {
                            uid: sellerId,
                            type: 'ESCROW_HOLD',
                            amount: amountProduct,
                            referenceId: transactionId,
                            itemTitle: tx.itemTitle || 'Producto',
                            description: `Fondos en garantía (MercadoPago): ${tx.itemTitle}`,
                            createdAt: new Date(),
                            status: 'COMPLETED'
                        });
                    });

                    console.log(`✅ Pago MP Escrow aprobado. Transacción ${transactionId} y producto ${productId} actualizados.`);
                }
            }
        }

        return res.status(200).send('OK');
    } catch (error: any) {
        console.error("Webhook Error:", error);
        // SECURITY FIX: devolvemos 500 para que MP reintente en caso de error transitorio (ej: Firestore caído)
        // MP tiene backoff exponencial, no reintenta infinitamente
        return res.status(500).send('Internal error');
    }
}
