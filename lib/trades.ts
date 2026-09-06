import { 
    collection, 
    addDoc, 
    doc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    serverTimestamp, 
    Timestamp 
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { ItemData } from "./items";

export type TradeStatus = 
    | 'PROPOSED'                    // Oferta inicial enviada
    | 'COUNTERED'                   // Contraoferta enviada
    | 'ACCEPTED_PENDING_PAYMENT'    // Ambas partes acordaron, falta pagar el Fee de Intermediacion
    | 'FEE_PAID'                    // Ambos pagaron el fee. Datos de contacto y QR desbloqueados
    | 'IN_TRANSIT'                  // Paquetes despachados (si es por envio)
    | 'COMPLETED'                   // Ambos escanearon QR o confirmaron recepcion
    | 'DISPUTED'                    // Conflicto abierto en el tribunal de arbitraje
    | 'CANCELLED';                  // Rechazado o cancelado

export interface TradeCustomItem {
    title: string;
    description: string;
    images: string[];
    estimatedValue: number;
}

export interface TradeProposal {
    id?: string;
    initiatorId: string;            // Quien propone el canje
    initiatorName?: string;
    initiatorAvatar?: string;
    receiverId: string;             // Dueno del producto publicado
    receiverName?: string;
    receiverAvatar?: string;
    targetItemId: string;           // ID del producto publicado objetivo
    targetItemTitle?: string;
    targetItemImage?: string;
    targetItemPrice?: number;
    targetItem?: ItemData & { id: string };
    offeredItemIds?: string[];      // IDs de productos publicados del iniciador
    offeredItems?: (ItemData & { id: string })[];
    offeredCustomItems?: TradeCustomItem[];
    cashDifference: number;         // > 0 paga el iniciador, < 0 paga el receptor
    notes?: string;
    deliveryMethod: 'en_mano' | 'correo_argentino';
    
    // Pagos de Fee de Proteccion ($2.000 c/u)
    protectionFeePerUser: number;
    initiatorFeePaid: boolean;
    receiverFeePaid: boolean;
    
    // Seguridad y QR
    initiatorQrToken: string;
    receiverQrToken: string;
    initiatorScannedReceiver: boolean;
    receiverScannedInitiator: boolean;
    
    status: TradeStatus;
    chatId?: string;
    lastActionBy: string;           // uid del ultimo en modificar
    createdAt: any;
    updatedAt: any;
}

export const TRADE_PROTECTION_FEE = 2000; // $2.000 ARS por usuario

/**
 * Crea una nueva propuesta de canje
 */
export const createTradeProposal = async (data: {
    targetItemId: string;
    receiverId: string;
    offeredItemIds?: string[];
    offeredCustomItems?: TradeCustomItem[];
    cashDifference?: number;
    notes?: string;
    deliveryMethod?: 'en_mano' | 'correo_argentino';
}) => {
    try {
        if (!auth.currentUser) throw new Error("Debes iniciar sesion para proponer un canje.");
        const initiatorId = auth.currentUser.uid;
        if (initiatorId === data.receiverId) throw new Error("No puedes proponer un canje sobre tu propio producto.");

        // Generar tokens unicos de seguridad para los QR
        const initiatorQrToken = 'TRD-INI-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        const receiverQrToken = 'TRD-REC-' + Math.random().toString(36).substring(2, 10).toUpperCase();

        // Obtener datos del iniciador, receptor y producto para snapshot
        let initiatorName = 'Usuario';
        let initiatorAvatar = '';
        let receiverName = 'Usuario';
        let receiverAvatar = '';
        let targetItemTitle = '';
        let targetItemImage = '';
        let targetItemPrice = 0;

        try {
            const [initSnap, recSnap, itemSnap] = await Promise.all([
                getDoc(doc(db, "users", initiatorId)),
                getDoc(doc(db, "users", data.receiverId)),
                getDoc(doc(db, "items", data.targetItemId))
            ]);
            if (initSnap.exists()) {
                const u = initSnap.data();
                initiatorName = u.displayName || 'Usuario';
                initiatorAvatar = u.photoURL || '';
            }
            if (recSnap.exists()) {
                const u = recSnap.data();
                receiverName = u.displayName || 'Usuario';
                receiverAvatar = u.photoURL || '';
            }
            if (itemSnap.exists()) {
                const it = itemSnap.data();
                targetItemTitle = it.title || 'Producto';
                targetItemImage = it.images?.[0] || '';
                targetItemPrice = it.price || 0;
            }
        } catch (e) {
            console.warn("Could not snapshot metadata for trade proposal:", e);
        }

        const tradesRef = collection(db, "trades");
        const docRef = await addDoc(tradesRef, {
            initiatorId,
            initiatorName,
            initiatorAvatar,
            receiverId: data.receiverId,
            receiverName,
            receiverAvatar,
            targetItemId: data.targetItemId,
            targetItemTitle,
            targetItemImage,
            targetItemPrice,
            offeredItemIds: data.offeredItemIds || [],
            offeredCustomItems: data.offeredCustomItems || [],
            cashDifference: data.cashDifference || 0,
            notes: data.notes || '',
            deliveryMethod: data.deliveryMethod || 'en_mano',
            protectionFeePerUser: TRADE_PROTECTION_FEE,
            initiatorFeePaid: false,
            receiverFeePaid: false,
            initiatorQrToken,
            receiverQrToken,
            initiatorScannedReceiver: false,
            receiverScannedInitiator: false,
            status: 'PROPOSED' as TradeStatus,
            lastActionBy: initiatorId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Enviar notificacion al receptor en su subcoleccion de usuario
        const notifRef = collection(db, "users", data.receiverId, "notifications");
        await addDoc(notifRef, {
            title: '🔄 ¡Nueva propuesta de Canje!',
            message: 'Alguien te propuso un intercambio por tu producto. Hacé clic para revisarlo.',
            link: `/trade/${docRef.id}`,
            read: false,
            type: 'info',
            icon: 'sync_alt',
            createdAt: serverTimestamp()
        });

        return { success: true, id: docRef.id };
    } catch (error: any) {
        console.error("Error creating trade proposal:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Obtiene el detalle de un canje con sus productos poblados
 */
export const getTradeProposal = async (tradeId: string): Promise<TradeProposal | null> => {
    try {
        const tradeRef = doc(db, "trades", tradeId);
        const tradeSnap = await getDoc(tradeRef);
        if (!tradeSnap.exists()) return null;

        const tradeData = { id: tradeSnap.id, ...tradeSnap.data() } as TradeProposal;

        // Populate Target Item
        if (tradeData.targetItemId) {
            const targetSnap = await getDoc(doc(db, "items", tradeData.targetItemId));
            if (targetSnap.exists()) {
                tradeData.targetItem = { id: targetSnap.id, ...targetSnap.data() } as any;
            }
        }

        // Populate Offered Items
        if (tradeData.offeredItemIds && tradeData.offeredItemIds.length > 0) {
            const items: any[] = [];
            for (const id of tradeData.offeredItemIds) {
                const itemSnap = await getDoc(doc(db, "items", id));
                if (itemSnap.exists()) {
                    items.push({ id: itemSnap.id, ...itemSnap.data() });
                }
            }
            tradeData.offeredItems = items;
        }

        // Populate User Names / Profiles
        const initiatorSnap = await getDoc(doc(db, "users", tradeData.initiatorId));
        if (initiatorSnap.exists()) {
            const initUser = initiatorSnap.data();
            tradeData.initiatorName = initUser?.displayName || 'Usuario';
            tradeData.initiatorAvatar = initUser?.photoURL || '';
        }

        const receiverSnap = await getDoc(doc(db, "users", tradeData.receiverId));
        if (receiverSnap.exists()) {
            const recUser = receiverSnap.data();
            tradeData.receiverName = recUser?.displayName || 'Usuario';
            tradeData.receiverAvatar = recUser?.photoURL || '';
        }

        return tradeData;
    } catch (error) {
        console.error("Error fetching trade proposal:", error);
        return null;
    }
};

/**
 * Helper para hidratar productos y nombres de un canje si faltan
 */
export const hydrateTradeData = async (trade: TradeProposal): Promise<TradeProposal> => {
    try {
        const hydrated = { ...trade };

        // 1. Target item
        if (!hydrated.targetItem && hydrated.targetItemId) {
            if (hydrated.targetItemTitle) {
                hydrated.targetItem = {
                    id: hydrated.targetItemId,
                    title: hydrated.targetItemTitle,
                    images: hydrated.targetItemImage ? [hydrated.targetItemImage] : [],
                    price: hydrated.targetItemPrice || 0
                } as any;
            } else {
                try {
                    const snap = await getDoc(doc(db, "items", hydrated.targetItemId));
                    if (snap.exists()) {
                        hydrated.targetItem = { id: snap.id, ...snap.data() } as any;
                    }
                } catch (e) {
                    console.warn("Could not fetch target item:", e);
                }
            }
        }

        // 2. Offered items
        if ((!hydrated.offeredItems || hydrated.offeredItems.length === 0) && hydrated.offeredItemIds && hydrated.offeredItemIds.length > 0) {
            try {
                const items: any[] = [];
                for (const id of hydrated.offeredItemIds) {
                    const snap = await getDoc(doc(db, "items", id));
                    if (snap.exists()) {
                        items.push({ id: snap.id, ...snap.data() });
                    }
                }
                hydrated.offeredItems = items;
            } catch (e) {
                console.warn("Could not fetch offered items:", e);
            }
        }

        // 3. Initiator profile
        if (!hydrated.initiatorName && hydrated.initiatorId) {
            try {
                const snap = await getDoc(doc(db, "users", hydrated.initiatorId));
                if (snap.exists()) {
                    const u = snap.data();
                    hydrated.initiatorName = u?.displayName || 'Usuario';
                    hydrated.initiatorAvatar = u?.photoURL || '';
                }
            } catch (e) {
                console.warn("Could not fetch initiator:", e);
            }
        }

        // 4. Receiver profile
        if (!hydrated.receiverName && hydrated.receiverId) {
            try {
                const snap = await getDoc(doc(db, "users", hydrated.receiverId));
                if (snap.exists()) {
                    const u = snap.data();
                    hydrated.receiverName = u?.displayName || 'Usuario';
                    hydrated.receiverAvatar = u?.photoURL || '';
                }
            } catch (e) {
                console.warn("Could not fetch receiver:", e);
            }
        }

        return hydrated;
    } catch (err) {
        return trade;
    }
};

const sortTradesByDate = (a: any, b: any) => {
    const aTime = a.createdAt?.seconds || (a.createdAt?.toDate ? a.createdAt.toDate().getTime() / 1000 : (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() / 1000 : 0));
    const bTime = b.createdAt?.seconds || (b.createdAt?.toDate ? b.createdAt.toDate().getTime() / 1000 : (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() / 1000 : 0));
    return bTime - aTime;
};

/**
 * Obtener todos los canjes donde el usuario participa (con hidratación de datos)
 */
export const getUserTrades = async (uid: string): Promise<{ sent: TradeProposal[], received: TradeProposal[] }> => {
    if (!uid) return { sent: [], received: [] };
    try {
        const tradesRef = collection(db, "trades");

        const qSent = query(tradesRef, where("initiatorId", "==", uid));
        const qReceived = query(tradesRef, where("receiverId", "==", uid));

        const [sentSnap, receivedSnap] = await Promise.all([
            getDocs(qSent),
            getDocs(qReceived)
        ]);

        const rawSent = sentSnap.docs.map(d => ({ id: d.id, ...d.data() } as TradeProposal)).sort(sortTradesByDate);
        const rawReceived = receivedSnap.docs.map(d => ({ id: d.id, ...d.data() } as TradeProposal)).sort(sortTradesByDate);

        const [sent, received] = await Promise.all([
            Promise.all(rawSent.map(t => hydrateTradeData(t))),
            Promise.all(rawReceived.map(t => hydrateTradeData(t)))
        ]);

        return { sent, received };
    } catch (error: any) {
        console.warn("Could not fetch user trades:", error?.message || error);
        return { sent: [], received: [] };
    }
};

/**
 * Suscripción en tiempo real a los canjes del usuario
 */
export const subscribeUserTrades = (
    uid: string, 
    callback: (data: { sent: TradeProposal[], received: TradeProposal[] }) => void
): (() => void) => {
    if (!uid) {
        callback({ sent: [], received: [] });
        return () => {};
    }

    try {
        const tradesRef = collection(db, "trades");
        const qSent = query(tradesRef, where("initiatorId", "==", uid));
        const qReceived = query(tradesRef, where("receiverId", "==", uid));

        let currentSent: TradeProposal[] = [];
        let currentReceived: TradeProposal[] = [];

        const notify = async () => {
            const [sent, received] = await Promise.all([
                Promise.all(currentSent.map(t => hydrateTradeData(t))),
                Promise.all(currentReceived.map(t => hydrateTradeData(t)))
            ]);
            sent.sort(sortTradesByDate);
            received.sort(sortTradesByDate);
            callback({ sent, received });
        };

        const unsubSent = onSnapshot(qSent, (snap) => {
            currentSent = snap.docs.map(d => ({ id: d.id, ...d.data() } as TradeProposal));
            notify();
        }, (err) => {
            console.warn("Error in qSent trades snapshot:", err);
        });

        const unsubReceived = onSnapshot(qReceived, (snap) => {
            currentReceived = snap.docs.map(d => ({ id: d.id, ...d.data() } as TradeProposal));
            notify();
        }, (err) => {
            console.warn("Error in qReceived trades snapshot:", err);
        });

        return () => {
            unsubSent();
            unsubReceived();
        };
    } catch (err) {
        console.warn("Could not subscribe to trades:", err);
        return () => {};
    }
};

/**
 * Aceptar una propuesta de canje (Pasa a ACCEPTED_PENDING_PAYMENT)
 */
export const acceptTradeProposal = async (tradeId: string) => {
    try {
        if (!auth.currentUser) throw new Error("No autenticado");
        const tradeRef = doc(db, "trades", tradeId);
        
        await updateDoc(tradeRef, {
            status: 'ACCEPTED_PENDING_PAYMENT',
            lastActionBy: auth.currentUser.uid,
            updatedAt: serverTimestamp()
        });

        // Notificar al iniciador que su propuesta fue aceptada
        const trade = await getTradeProposal(tradeId);
        if (trade?.initiatorId) {
            await addDoc(collection(db, "users", trade.initiatorId, "notifications"), {
                title: '🤝 ¡Propuesta de Canje Aceptada!',
                message: 'Aceptaron tu propuesta de intercambio. Ingresá para abonar el Fee de Garantía y coordinar.',
                link: `/trade/${tradeId}`,
                read: false,
                type: 'success',
                icon: 'handshake',
                createdAt: serverTimestamp()
            });
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/**
 * Contraofertar un canje
 */
export const counterTradeProposal = async (tradeId: string, adjustments: {
    cashDifference?: number;
    notes?: string;
    offeredItemIds?: string[];
}) => {
    try {
        if (!auth.currentUser) throw new Error("No autenticado");
        const currentUid = auth.currentUser.uid;
        const tradeRef = doc(db, "trades", tradeId);

        await updateDoc(tradeRef, {
            status: 'COUNTERED',
            ...adjustments,
            lastActionBy: currentUid,
            updatedAt: serverTimestamp()
        });

        const trade = await getTradeProposal(tradeId);
        if (trade) {
            const recipientId = currentUid === trade.initiatorId ? trade.receiverId : trade.initiatorId;
            await addDoc(collection(db, "users", recipientId, "notifications"), {
                title: '🔄 Contraoferta de Canje',
                message: 'Te enviaron una contraoferta en la sala de canje. Entrá para responder.',
                link: `/trade/${tradeId}`,
                read: false,
                type: 'info',
                icon: 'sync_alt',
                createdAt: serverTimestamp()
            });
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/**
 * Rechazar o Cancelar un canje
 */
export const rejectTradeProposal = async (tradeId: string) => {
    try {
        if (!auth.currentUser) throw new Error("No autenticado");
        const currentUid = auth.currentUser.uid;
        const tradeRef = doc(db, "trades", tradeId);

        await updateDoc(tradeRef, {
            status: 'CANCELLED',
            lastActionBy: currentUid,
            updatedAt: serverTimestamp()
        });

        const trade = await getTradeProposal(tradeId);
        if (trade) {
            const recipientId = currentUid === trade.initiatorId ? trade.receiverId : trade.initiatorId;
            await addDoc(collection(db, "users", recipientId, "notifications"), {
                title: '❌ Canje Cancelado',
                message: 'La propuesta de intercambio fue cancelada o rechazada.',
                link: `/dashboard`,
                read: false,
                type: 'warning',
                icon: 'cancel',
                createdAt: serverTimestamp()
            });
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

/**
 * Confirmacion de escaneo de QR presencial (Doble QR)
 */
export const confirmTradeQrScan = async (tradeId: string, scannedToken: string) => {
    try {
        if (!auth.currentUser) throw new Error("No autenticado");
        const uid = auth.currentUser.uid;
        const trade = await getTradeProposal(tradeId);
        if (!trade) throw new Error("Canje no encontrado");

        const tradeRef = doc(db, "trades", tradeId);
        const updateData: any = { updatedAt: serverTimestamp() };

        // Si el usuario actual es el iniciador y escanea el token del receptor
        if (uid === trade.initiatorId && scannedToken === trade.receiverQrToken) {
            updateData.initiatorScannedReceiver = true;
            if (trade.receiverScannedInitiator) {
                updateData.status = 'COMPLETED';
            }
        } 
        // Si el usuario actual es el receptor y escanea el token del iniciador
        else if (uid === trade.receiverId && scannedToken === trade.initiatorQrToken) {
            updateData.receiverScannedInitiator = true;
            if (trade.initiatorScannedReceiver) {
                updateData.status = 'COMPLETED';
            }
        } else {
            throw new Error("El codigo QR escaneado es invalido o no corresponde a esta contraparte.");
        }

        await updateDoc(tradeRef, updateData);

        if (updateData.status === 'COMPLETED') {
            for (const pId of [trade.initiatorId, trade.receiverId]) {
                await addDoc(collection(db, "users", pId, "notifications"), {
                    title: '🎉 ¡Canje Finalizado con Éxito!',
                    message: 'Ambas partes confirmaron la entrega del intercambio con código QR.',
                    link: `/trade/${tradeId}`,
                    read: false,
                    type: 'success',
                    icon: 'verified',
                    createdAt: serverTimestamp()
                });
            }
        }

        return { 
            success: true, 
            completed: updateData.status === 'COMPLETED',
            message: updateData.status === 'COMPLETED' 
                ? '¡Canje finalizado con exito! Ambas partes confirmaron la recepcion.' 
                : 'Escaneo registrado. Esperando que la otra parte escanee tu codigo.' 
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};
