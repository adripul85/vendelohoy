"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShippingLabel = exports.createShippingOrder = exports.getShippingRates = void 0;
const functions = require("firebase-functions");
// Configuración de URLs basada en entorno (por defecto prod si no se define)
const ENV = process.env.CORREO_ARG_API_ENV || "prod";
const MICORREO_URL = ENV === "dev"
    ? "http://app-correoargintercotizador-dev.apps.ocpbarr.correo.local"
    : ENV === "test"
        ? "https://apitest.correoargentino.com.ar/micorreo/v1"
        : "https://api.correoargentino.com.ar/micorreo/v1";
const PAQAR_URL = ENV === "test"
    ? "https://apitest.correoargentino.com.ar/paqar/v1"
    : "https://api.correoargentino.com.ar/paqar/v1";
/**
 * Helper para obtener el Token de MiCorreo
 */
async function getMiCorreoToken() {
    const user = process.env.CORREO_ARG_MICORREO_USER || "usuario_prueba";
    const pass = process.env.CORREO_ARG_MICORREO_PASS || "password_prueba";
    // Auth Basic
    const encoded = Buffer.from(`${user}:${pass}`).toString("base64");
    const res = await fetch(`${MICORREO_URL}/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${encoded}`,
        },
    });
    if (!res.ok) {
        throw new Error(`Fallo al autenticar MiCorreo: ${res.statusText}`);
    }
    const data = (await res.json());
    return data.token;
}
/**
 * 1. Cotizar Envío (MiCorreo - /rates)
 */
exports.getShippingRates = functions.https.onCall(async (request) => {
    // request.data contiene los parámetros
    const { originZip, destinationZip, dimensions } = request.data;
    if (!originZip || !destinationZip || !dimensions) {
        throw new functions.https.HttpsError("invalid-argument", "Datos insuficientes para cotizar.");
    }
    try {
        const token = await getMiCorreoToken();
        const customerId = process.env.CORREO_ARG_CUSTOMER_ID || "0090000025";
        const payload = {
            customerId,
            postalCodeOrigin: originZip.toString(),
            postalCodeDestination: destinationZip.toString(),
            dimensions: {
                weight: Math.ceil(dimensions.weight * 1000), // kg a gramos
                height: Math.ceil(dimensions.height),
                width: Math.ceil(dimensions.width),
                length: Math.ceil(dimensions.length),
            },
        };
        const res = await fetch(`${MICORREO_URL}/rates`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Error de API: ${errBody}`);
        }
        const data = (await res.json());
        return data;
    }
    catch (error) {
        console.error("Error en getShippingRates:", error);
        throw new functions.https.HttpsError("internal", error.message || "Error calculando cotización.");
    }
});
/**
 * 2. Alta de Orden de Envío (Paq.ar - /v1/orders)
 */
exports.createShippingOrder = functions.https.onCall(async (request) => {
    // Si no está autenticado en Firebase
    if (!request.auth)
        throw new functions.https.HttpsError("unauthenticated", "Acceso denegado.");
    const payload = request.data;
    const apiKey = process.env.CORREO_ARG_PAQAR_APIKEY || "APIKEY_PRUEBA";
    const agreement = process.env.CORREO_ARG_PAQAR_AGREEMENT || "18017";
    try {
        const res = await fetch(`${PAQAR_URL}/orders`, {
            method: "POST",
            headers: {
                Authorization: `Apikey ${apiKey}`,
                agreement: agreement,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        const data = (await res.json());
        if (!res.ok || data.error) {
            throw new Error(data.message ||
                `Fallo al crear orden en Paq.ar (Status: ${res.status})`);
        }
        return data; // Debería contener el trackingNumber
    }
    catch (error) {
        console.error("Error en createShippingOrder:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * 3. Obtener Rótulo/Etiqueta (Paq.ar - /v1/labels)
 */
exports.getShippingLabel = functions.https.onCall(async (request) => {
    if (!request.auth)
        throw new functions.https.HttpsError("unauthenticated", "Acceso denegado.");
    const { trackingNumber, sellerId } = request.data;
    if (!trackingNumber) {
        throw new functions.https.HttpsError("invalid-argument", "Tracking number es requerido.");
    }
    const apiKey = process.env.CORREO_ARG_PAQAR_APIKEY || "APIKEY_PRUEBA";
    const agreement = process.env.CORREO_ARG_PAQAR_AGREEMENT || "18017";
    const payload = [
        {
            sellerId: sellerId || "",
            trackingNumber: trackingNumber,
        },
    ];
    try {
        const res = await fetch(`${PAQAR_URL}/labels?labelFormat=10x15`, {
            method: "POST",
            headers: {
                Authorization: `Apikey ${apiKey}`,
                agreement: agreement,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        const data = (await res.json());
        if (!res.ok) {
            throw new Error(data.message || "Error al obtener etiqueta.");
        }
        // data suele ser un array de respuestas por tracking
        return data;
    }
    catch (error) {
        console.error("Error en getShippingLabel:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
//# sourceMappingURL=correoArgentino.js.map