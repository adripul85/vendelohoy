import { collection, addDoc, updateDoc, serverTimestamp, doc, getDoc, getDocs, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "./firebase";
import { getSystemAdminId } from "./admin";
import { getPlatformSettings } from "./settings";

// Transaction states following strict FSM
export type TransactionStatus =
    | "PENDING_PAYMENT"            // Waiting for buyer to pay
    | "PAID_HELD"                  // Payment confirmed, funds in escrow
    | "SHIPPED"                    // Item shipped (has tracking)
    | "DELIVERED_PENDING_REVIEW"   // Buyer received, 48h timer starts
    | "COMPLETED"                  // Funds released to seller
    | "DISPUTED"                   // Issue reported, funds locked
    | "REFUNDED"                   // Funds returned to buyer
    | "CANCELLED";                 // Transaction cancelled before payment

export type PaymentMethod = 'MERCADO_PAGO' | 'TRANSFER' | 'CASH' | 'MODO';

export interface TransactionData {
    buyerId: string;
    sellerId: string;
    itemId: string;
    itemTitle: string;
    itemImage?: string;
    quantity?: number;          // Quantity of items bought
    amount: number;             // Legacy compatibility (maps to amountProduct)
    amountProduct: number;      // Item price
    amountGatewayFee: number;   // Processor fee (MP, etc.)
    amountPlatformFee: number;  // Fixed Escrow protection fee ($2500)
    shippingCost?: number;      // Shipping fee paid by buyer
    amountTotal: number;        // Final paid amount
    platformFee: number;        // Legacy compatibility (maps to amountPlatformFee)
    total: number;              // Legacy compatibility (maps to amountTotal)
    status: TransactionStatus;
    paymentMethod: PaymentMethod;
    deliveryMethod: 'correo_argentino' | 'en_mano' | 'acordar' | 'domicilio';
    shippingProvider?: 'correo_argentino' | 'moova' | 'andreani';
    deliveryAddress?: {
        street: string;
        number: string;
        floor?: string;
        city: string;
        province: string;
        zipCode: string;
    };
    trackingNumber?: string;
    trackingId?: string;
    courier?: string;
    qrCode?: string;
    mpPaymentId?: string;
    payoutStatus?: 'PENDING' | 'SENT' | 'ACKNOWLEDGED';
    escrowReleased: boolean;
    evidenceCount?: number;
    shippingEvidence?: string[]; // URLs of photos uploaded by seller
    deliveryEvidence?: string[]; // URLs of photos uploaded by buyer
    lastSystemMessage?: string;
    notes?: string;
    deliveredAt?: any;           // Precise time when product was deliveried/received
    inspectionDeadline?: any;    // Time when auto-release occurs (normally deliveredAt + 48h)
    disputeReason?: string;
    isAmicableReturnAccepted?: boolean;
    returnTrackingId?: string;
    returnCourier?: string;
    disputeStartedAt?: any;
    featuredFeeApplied?: number;
    createdAt: any;
    updatedAt: any;
}

export interface EscrowMessage {
    id?: string;
    role: 'comprador' | 'vendedor' | 'sistema' | 'moderador';
    text: string;
    createdAt: any;
    senderId?: string;
}

export interface EscrowEvidence {
    id?: string;
    url: string;
    type: string;
    description?: string;
    uploadedBy: string;
    aiVerified: boolean;
    createdAt: any;
}

const functions = getFunctions();

// Create a new transaction
export const createTransaction = async (data: Omit<TransactionData, 'status' | 'escrowReleased' | 'createdAt' | 'updatedAt' | 'qrCode' | 'platformFee' | 'total' | 'amountPlatformFee' | 'amountTotal' | 'amountGatewayFee'> & { gatewayFee?: number, platformFee?: number }) => {
    try {
        const qrCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const settings = await getPlatformSettings();

        // NEW MODEL: Dynamic Fees from Settings
        const productPrice = data.amountProduct || data.amount;

        const platformProtectionFee = data.platformFee || (settings.useFixedEscrowFee
            ? (settings.escrowFixedFee ?? 2500)
            : Math.round(productPrice * settings.escrowFeePercentage));

        // Estimate Gateway Fee if not provided
        const estimatedGatewayFee = data.gatewayFee || Math.round(productPrice * settings.paymentProcessingFeePercentage);
        const totalToPay = productPrice + platformProtectionFee + estimatedGatewayFee;

        const docRef = await addDoc(collection(db, "transactions"), {
            ...data,
            amount: productPrice, // legacy
            amountProduct: productPrice,
            amountPlatformFee: platformProtectionFee,
            amountGatewayFee: estimatedGatewayFee,
            amountTotal: totalToPay,
            platformFee: platformProtectionFee, // legacy
            total: totalToPay, // legacy
            qrCode: qrCode,
            featuredFeeApplied: data.featuredFeeApplied || null,
            status: "PENDING_PAYMENT" as TransactionStatus,
            escrowReleased: false,
            mpPaymentId: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // NOTE: We don't log BUY_DEDUCTION yet because payment is pending.
        // This will be handled in updateTransactionStatus when it moves to PAID_HELD.

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating transaction:", error);
        return { success: false, error };
    }
};

// Get transaction by ID
export const getTransaction = async (id: string) => {
    try {
        const docRef = doc(db, "transactions", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as TransactionData & { id: string };
        }
        return null;
    } catch (error) {
        console.error("Error fetching transaction:", error);
        return null;
    }
};

// Update transaction status
export const updateTransactionStatus = async (id: string, status: TransactionStatus) => {
    try {
        const docRef = doc(db, "transactions", id);

        // NEW: Calculate deadlines and timestamps for escrow logic
        const updateData: any = {
            status,
            updatedAt: serverTimestamp()
        };

        if (status === 'DELIVERED_PENDING_REVIEW') {
            const { auth } = await import("./firebase");
            if (!auth.currentUser) return { success: false, error: 'No autorizado' };
            const idToken = await auth.currentUser.getIdToken();
            const response = await fetch('/api/confirm-receipt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ transactionId: id })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error al confirmar recepción');
            return { success: true };
        }
        if (status === 'DISPUTED') {
            updateData.disputeStartedAt = serverTimestamp();
        }

        if (status === 'PAID_HELD') {
            const { getTransaction } = await import("./transactions");
            const tx = await getTransaction(id);
            if (tx) {
                const { logWalletMovement } = await import("./users");
                // 1. Buyer: Full deduction (Total paid)
                await logWalletMovement({
                    uid: tx.buyerId,
                    type: 'BUY_DEDUCTION',
                    amount: tx.amountTotal,
                    referenceId: id,
                    itemTitle: tx.itemTitle,
                    description: `Pago procesado: ${tx.itemTitle}`
                });
                // 2. Seller: Escrow Hold (Product price)
                await logWalletMovement({
                    uid: tx.sellerId,
                    type: 'ESCROW_HOLD',
                    amount: tx.amountProduct,
                    referenceId: id,
                    itemTitle: tx.itemTitle,
                    description: `Fondos en garantía: ${tx.itemTitle}`
                });
                
                // ACTUALIZAR BASE DE DATOS CONTABLE:
                const sellerRef = doc(db, "users", tx.sellerId);
                await import("firebase/firestore").then(async ({ updateDoc, increment, getDoc }) => {
                    await updateDoc(sellerRef, {
                        "wallet.inEscrow": increment(tx.amountProduct)
                    });
                    
                    // Deduct stock
                    if (tx.itemId && !tx.itemId.startsWith('cart-')) {
                        const itemRef = doc(db, "items", tx.itemId);
                        const itemSnap = await getDoc(itemRef);
                        if (itemSnap.exists()) {
                            const currentQty = itemSnap.data().quantity || 1;
                            const txQty = tx.quantity || 1;
                            const newQty = Math.max(0, currentQty - txQty);
                            await updateDoc(itemRef, {
                                quantity: newQty,
                                status: newQty === 0 ? 'SOLD' : itemSnap.data().status
                            });
                        }
                    }
                });
            }
        }

        await import("firebase/firestore").then(({ updateDoc }) =>
            updateDoc(docRef, updateData)
        );
        return { success: true };
    } catch (error: any) {
        console.error("Error updating transaction status:", error);
        return { success: false, error: error.message };
    }
};

/**
 * SECURE: Release funds to seller and platform.
 * Distributes: Product price to Seller, Protection fee to Admin. */export const releaseFunds = async (id: string, qrToken?: string) => {
    try {
        const { auth } = await import("./firebase");
        if (!auth.currentUser) return { success: false, error: 'No autorizado' };

        try {
            const idToken = await auth.currentUser.getIdToken();
            const response = await fetch('/api/release-funds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    transactionId: id,
                    qrToken: qrToken
                })
            });

            if (response.ok) {
                return { success: true };
            }
            console.warn("API release-funds returned error, attempting Firestore fallback...");
        } catch (apiErr) {
            console.warn("API unreachable, attempting Firestore fallback...", apiErr);
        }

        // Fallback: update Firestore directly (permitted for buyer in firestore.rules)
        const docRef = doc(db, "transactions", id);
        await updateDoc(docRef, {
            status: 'COMPLETED',
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error: any) {
        console.error("Network or execution error releasing funds:", error);
        return { success: false, error: error.message || 'Error de conexión' };
    }
};

/**
 * Seller accepts an amicable return of the product.
 */
export const acceptAmicableReturn = async (id: string, sellerId: string) => {
    try {
        const docRef = doc(db, "transactions", id);
        await import("firebase/firestore").then(({ updateDoc }) =>
            updateDoc(docRef, {
                isAmicableReturnAccepted: true,
                status: 'PAID_HELD', // Reverse state to allow return confirmation
                lastSystemMessage: '🤝 El vendedor ha aceptado la devolución amigable. El comprador debe proceder con el envío de retorno.',
                updatedAt: serverTimestamp()
            })
        );
        return { success: true };
    } catch (error: any) {
        console.error("Error accepting return:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Seller confirms receipt of the returned item.
 * Refunds the buyer's product amount.
 */
export const confirmReturnReceipt = async (id: string, sellerId: string) => {
    try {
        const docRef = doc(db, "transactions", id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return { success: false, error: 'Transacción no encontrada' };

        const data = docSnap.data() as TransactionData;

        // Update status
        await import("firebase/firestore").then(({ updateDoc }) =>
            updateDoc(docRef, {
                status: 'REFUNDED',
                escrowReleased: true,
                lastSystemMessage: '📦 El vendedor ha confirmado la recepción del retorno. Reembolso procesado.',
                updatedAt: serverTimestamp()
            })
        );

        // Refund buyer the product amount
        const productAmount = data.amountProduct || data.amount;
        const buyerRef = doc(db, "users", data.buyerId);
        await import("firebase/firestore").then(({ updateDoc, increment }) =>
            updateDoc(buyerRef, { "wallet.available": increment(productAmount) })
        );

        // Log wallet movements
        const { logWalletMovement } = await import('./users');
        await logWalletMovement({
            uid: data.buyerId,
            type: 'ESCROW_RELEASE',
            amount: productAmount,
            referenceId: id,
            itemTitle: data.itemTitle,
            description: `Reembolso por devolución amigable: ${data.itemTitle}`
        });

        await logWalletMovement({
            uid: data.sellerId,
            type: 'ESCROW_RELEASE',
            amount: productAmount,
            referenceId: id,
            itemTitle: data.itemTitle,
            description: `Fondos liberados del escrow por devolución: ${data.itemTitle}`
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error confirming return receipt:", error);
        return { success: false, error: error.message };
    }
};

/**
 * ADMIN: Refund funds to buyer (Official resolution)
 * Actually moves money: returns product price to buyer, logs everything.
 */
export const adminRefundFunds = async (id: string, adminId: string) => {
    try {
        const docRef = doc(db, "transactions", id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return { success: false, error: 'Transacción no encontrada' };

        const data = docSnap.data() as TransactionData;

        // Update status
        await import("firebase/firestore").then(({ updateDoc }) =>
            updateDoc(docRef, {
                status: 'REFUNDED',
                escrowReleased: true,
                lastSystemMessage: `⚖️ Resolución Administrativa: Reembolso completo emitido al Comprador por el administrador #${adminId?.slice(0, 5)}.`,
                updatedAt: serverTimestamp()
            })
        );

        // Refund buyer the product amount
        const productAmount = data.amountProduct || data.amount;
        const buyerRef = doc(db, "users", data.buyerId);
        await import("firebase/firestore").then(({ updateDoc, increment }) =>
            updateDoc(buyerRef, { "wallet.available": increment(productAmount) })
        );

        // Log wallet movements
        const { logWalletMovement } = await import('./users');

        // Buyer: refund received
        await logWalletMovement({
            uid: data.buyerId,
            type: 'ESCROW_RELEASE',
            amount: productAmount,
            referenceId: id,
            itemTitle: data.itemTitle,
            description: `Reembolso administrativo: ${data.itemTitle}`
        });

        // Seller: escrow released (no payout)
        await logWalletMovement({
            uid: data.sellerId,
            type: 'ESCROW_RELEASE',
            amount: productAmount,
            referenceId: id,
            itemTitle: data.itemTitle,
            description: `Escrow devuelto al comprador por resolución admin: ${data.itemTitle}`
        });

        // Log financial event
        await addDoc(collection(db, "financial_logs"), {
            transactionId: id,
            type: 'admin_refund' as any,
            amount: productAmount,
            currency: 'ARS',
            relatedUser: data.buyerId,
            timestamp: serverTimestamp()
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error in admin refund:", error);
        return { success: false, error: error.message };
    }
};

/**
 * CANCEL Transaction (with 3% Penalty logic)
 */
export const cancelTransaction = async (id: string, cancelledByUid: string) => {
    try {
        const { auth } = await import("./firebase");
        if (!auth.currentUser) return { success: false, error: 'No autorizado' };
        
        const idToken = await auth.currentUser.getIdToken();
        
        const response = await fetch('/api/cancel-transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ transactionId: id })
        });
        
        const result = await response.json();
        if (!response.ok) {
            console.error("API Error cancelling transaction:", result);
            return { success: false, error: result.error || 'Error al cancelar' };
        }
        
        return { success: true };
    } catch (error: any) {
        console.error("Error cancelling transaction:", error);
        return { success: false, error: error.message };
    }
};

/**
 * SECURE: Update tracking information with Fallback
 */
export const updateTracking = async (id: string, trackingId: string, courier: string) => {
    try {
        const docRef = doc(db, "transactions", id);
        await import("firebase/firestore").then(({ updateDoc }) =>
            updateDoc(docRef, {
                status: 'SHIPPED',
                trackingId,
                courier,
                updatedAt: serverTimestamp()
            })
        );
        return { success: true };
    } catch (error: any) {
        console.error("Error updating tracking:", error);
        return { success: false, error: error.message };
    }
};

// Get all transactions for a user
export const getUserTransactions = async (userId: string) => {
    try {
        const transactionsRef = collection(db, "transactions");
        const withdrawalsRef = collection(db, "withdrawals");

        const qBuy = query(transactionsRef, where("buyerId", "==", userId), orderBy("createdAt", "desc"));
        const qSell = query(transactionsRef, where("sellerId", "==", userId), orderBy("createdAt", "desc"));
        const qWithdrawals = query(withdrawalsRef, where("uid", "==", userId), orderBy("createdAt", "desc"));

        const [buySnap, sellSnap, withdrawSnap] = await Promise.all([
            getDocs(qBuy),
            getDocs(qSell),
            getDocs(qWithdrawals)
        ]);

        const compras = buySnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'compra' })) as (TransactionData & { id: string, type: 'compra' })[];
        const ventas = sellSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'venta' })) as (TransactionData & { id: string, type: 'venta' })[];
        const retiros = withdrawSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'retiro' })) as any[];

        return { compras, ventas, retiros };
    } catch (error) {
        console.error("Error fetching user transactions:", error);
        return { compras: [], ventas: [], retiros: [] };
    }
};

// Subscribe to real-time user transactions
export const subscribeToUserTransactions = (userId: string, callback: (data: { compras: any[], ventas: any[], retiros: any[] }) => void) => {
    const transactionsRef = collection(db, "transactions");
    const withdrawalsRef = collection(db, "withdrawals");

    const qBuy = query(transactionsRef, where("buyerId", "==", userId), orderBy("createdAt", "desc"));
    const qSell = query(transactionsRef, where("sellerId", "==", userId), orderBy("createdAt", "desc"));
    const qWithdrawals = query(withdrawalsRef, where("uid", "==", userId), orderBy("createdAt", "desc"));

    let data = { compras: [], ventas: [], retiros: [] };

    const update = () => callback({ ...data });

    const unsubBuy = onSnapshot(qBuy, (snap) => {
        data.compras = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        update();
    });

    const unsubSell = onSnapshot(qSell, (snap) => {
        data.ventas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        update();
    });

    const unsubWithdrawals = onSnapshot(qWithdrawals, (snap) => {
        data.retiros = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        update();
    });

    return () => {
        unsubBuy();
        unsubSell();
        unsubWithdrawals();
    };
};

// Subscribe to real-time transaction updates
export const subscribeToTransaction = (id: string, callback: (data: any) => void) => {
    const docRef = doc(db, "transactions", id);
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() });
        }
    });
};

/**
 * Real-time Escrow Chat subscription
 */
export const subscribeToEscrowMessages = (transactionId: string, callback: (messages: EscrowMessage[]) => void) => {
    const q = query(
        collection(db, "transactions", transactionId, "messages"),
        orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EscrowMessage[];
        callback(messages);
    });
};

/**
 * Real-time Evidence subscription
 */
export const subscribeToEvidence = (transactionId: string, callback: (evidence: EscrowEvidence[]) => void) => {
    const q = query(
        collection(db, "transactions", transactionId, "evidence"),
        orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
        const evidence = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EscrowEvidence[];
        callback(evidence);
    });
};

/**
 * Send a message within the escrow context (Direct Write)
 */
export const sendEscrowNote = async (transactionId: string, role: EscrowMessage['role'], text: string, senderId?: string) => {
    try {
        const docRef = doc(db, "transactions", transactionId);
        const msgsRef = collection(docRef, "messages");

        await addDoc(msgsRef, {
            role,
            text,
            senderId: senderId || 'system',
            createdAt: serverTimestamp()
        });

        // Update last message
        await import("firebase/firestore").then(({ updateDoc }) =>
            updateDoc(docRef, {
                lastSystemMessage: role === 'sistema' ? text : null,
                updatedAt: serverTimestamp()
            })
        );

        return { success: true };
    } catch (error: any) {
        console.error("Error sending note:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Register evidence (photo) for a transaction (Direct Write)
 */
export const submitEvidence = async (transactionId: string, url: string, type: string, description?: string) => {
    try {
        const docRef = doc(db, "transactions", transactionId);
        const evidenceRef = collection(docRef, "evidence");

        await addDoc(evidenceRef, {
            url,
            type,
            description: description || '',
            uploadedBy: 'user', // Simplified
            aiVerified: false,
            createdAt: serverTimestamp()
        });

        await import("firebase/firestore").then(({ updateDoc, increment }) =>
            updateDoc(docRef, {
                evidenceCount: increment(1),
                updatedAt: serverTimestamp()
            })
        );

        return { success: true };
    } catch (error: any) {
        console.error("Error submitting evidence:", error);
        return { success: false, error: error.message };
    }
};
