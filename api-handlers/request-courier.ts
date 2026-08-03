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
        
        // ==== LLAMADA AL BACKEND (Vercel Function) ====
        // Obtenemos el token de Auth para seguridad
        const token = await auth.currentUser.getIdToken();
        
        const response = await fetch('/api/dispatch-courier', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ transactionId })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Ocurrió un error al despachar el vehículo");
        }

        return data;

    } catch (error: any) {
        console.error("Error requesting courier:", error);
        throw new Error(error.message || "Ocurrió un error al solicitar el vehículo.");
    }
};
