import { doc, getDoc, updateDoc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export const requestCourier = async (transactionId: string) => {
    try {
        if (!auth.currentUser) {
            throw new Error("Debes iniciar sesión para solicitar un vehículo.");
        }

        const txRef = doc(db, "transactions", transactionId);
        const txSnap = await getDoc(txRef);

        if (!txSnap.exists()) {
            throw new Error("La transacción no existe.");
        }

        const txData = txSnap.data();

        // Verificar permisos
        if (txData.sellerId !== auth.currentUser.uid) {
            throw new Error("No tienes permiso para despachar esta transacción.");
        }

        // Verificar estado y método
        if (txData.deliveryMethod !== "domicilio") {
            throw new Error("El método de entrega no es apto para vehículos On-Demand.");
        }
        if (txData.trackingNumber) {
            throw new Error("Ya se ha solicitado un vehículo para esta orden.");
        }
        
        // ==== SIMULADOR (SANDBOX) ====
        // En producción, aquí harías: fetch('https://api.uber.com/v1/deliveries'...)
        
        // 1. Generar Tracking y Datos de Chofer simulados
        const mockTrackingId = `UBER-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const mockTrackingUrl = `https://vendelohoy.com/track/${mockTrackingId}`; // Mock tracking URL

        // 2. Registrar el pedido en Firestore (Para tener historial del sistema On-Demand)
        const courierReqRef = doc(collection(db, "courier_requests"));
        await setDoc(courierReqRef, {
            transactionId: transactionId,
            sellerId: txData.sellerId,
            buyerId: txData.buyerId,
            provider: 'sandbox_uber_cabify',
            status: 'driver_assigned',
            trackingId: mockTrackingId,
            trackingUrl: mockTrackingUrl,
            driverDetails: {
                name: 'Carlos (Conductor de Prueba)',
                vehicle: 'Toyota Etios Gris',
                plate: 'AF 123 AB'
            },
            paymentMethod: txData.shippingPaymentMethod || 'pay_on_delivery',
            createdAt: serverTimestamp()
        });

        // 3. Actualizar la Transacción
        await updateDoc(txRef, {
            trackingNumber: mockTrackingId,
            courier: 'Uber / Cabify (Simulado)',
            status: 'SHIPPED',
            updatedAt: serverTimestamp()
        });

        return { success: true, trackingId: mockTrackingId, trackingUrl: mockTrackingUrl };

    } catch (error: any) {
        console.error("Error requesting courier:", error);
        throw new Error(error.message || "Ocurrió un error al solicitar el vehículo.");
    }
};
