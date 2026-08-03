import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../lib/firebase-admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // Mercado Pago envía notificaciones por query params o body dependiendo del tipo
    const { action, data, type } = req.body;

    // A veces MercadoPago envía un ping de confirmación
    if (action === "test.created") {
        return res.status(200).send('OK');
    }

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
                            "wallet.inEscrow": adminDb.FieldValue ? adminDb.FieldValue.increment(amountProduct) : amountProduct
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
        // Respondemos 200 de todas formas para que MP no reintente infinitamente si es un error de lógica
        return res.status(200).send('Error but handled');
    }
}
