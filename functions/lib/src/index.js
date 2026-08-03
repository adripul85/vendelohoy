"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShippingLabel =
  exports.createShippingOrder =
  exports.getShippingRates =
  exports.mercadoPagoWebhook =
  exports.autoReleaseEscrow =
  exports.submitEvidence =
  exports.addEscrowNote =
  exports.refundFunds =
  exports.releaseFunds =
  exports.updateTracking =
  exports.updateTransactionStatus =
  exports.createPayment =
    void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const mercadopago_1 = require("mercadopago");
admin.initializeApp();
const db = admin.firestore();
// 1. CONFIGURACIÓN MERCADO PAGO
// 🛡️ Sentinel: Security Enhancement - No hardcoded secrets
const client = new mercadopago_1.MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "",
});
/**
 * 2. HELPERS
 */
async function getSystemAdminId() {
  const usersRef = db.collection("users");
  const snapshot = await usersRef
    .where("role", "==", "admin")
    .orderBy("createdAt", "asc")
    .limit(1)
    .get();
  if (!snapshot.empty) return snapshot.docs[0].id;
  return null;
}
async function distributeEscrowFunds(transactionId, data) {
  const adminId = await getSystemAdminId();
  const sellerRef = db.collection("users").doc(data.sellerId);
  // Calculated based on new model (Step Id 5789 logic)
  // amountProduct is the net for the seller, amountPlatformFee is for the platform
  const sellerProceeds = data.amountProduct || data.amount || 0;
  const platformRevenue = data.amountPlatformFee || 0;
  const batch = db.batch();
  // A. Pay Seller
  batch.update(sellerRef, {
    "wallet.available": admin.firestore.FieldValue.increment(sellerProceeds),
    "wallet.lastUpdated": admin.firestore.FieldValue.serverTimestamp(),
  });
  // B. Pay Admin
  if (adminId && platformRevenue > 0) {
    const adminRef = db.collection("users").doc(adminId);
    batch.update(adminRef, {
      "wallet.available": admin.firestore.FieldValue.increment(platformRevenue),
      "wallet.lastUpdated": admin.firestore.FieldValue.serverTimestamp(),
    });
    // C. Log Revenue
    const logRef = db.collection("financial_logs").doc();
    batch.set(logRef, {
      transactionId,
      type: "platform_fee",
      amount: platformRevenue,
      currency: "ARS",
      relatedUser: data.sellerId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
}
/**
 * 3. CREAR PREFERENCIA DE PAGO
 */
exports.createPayment = functions.https.onCall(async (request) => {
  const data = request.data;
  if (!request.auth)
    throw new functions.https.HttpsError("unauthenticated", "Acceso denegado.");
  try {
    const preference = new mercadopago_1.Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: data.transactionId,
            title: data.title,
            quantity: 1,
            unit_price: Number(data.price),
            currency_id: "ARS",
          },
        ],
        back_urls: {
          success: "https://deoportunidades.web.app/#/payment/success",
          failure: "https://deoportunidades.web.app/#/payment/failure",
          pending: "https://deoportunidades.web.app/#/payment/pending",
        },
        auto_return: "approved",
        external_reference: data.transactionId,
      },
    });
    return { url: result.init_point || result.sandbox_init_point };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});
/**
 * 3. ACTUALIZAR ESTADO DE TRANSACCIÓN (SECURE FSM)
 */
exports.updateTransactionStatus = functions.https.onCall(async (request) => {
  const { transactionId, status } = request.data;
  if (!request.auth)
    throw new functions.https.HttpsError("unauthenticated", "Acceso denegado.");
  const txRef = db.collection("transactions").doc(transactionId);
  const doc = await txRef.get();
  if (!doc.exists)
    throw new functions.https.HttpsError(
      "not-found",
      "Transacción no encontrada.",
    );
  const data = doc.data();
  // VALIDAR PERMISOS
  const isBuyer = data.buyerId === request.auth.uid;
  const isSeller = data.sellerId === request.auth.uid;
  const isAdmin = data.isAdmin === true; // Simplified admin check
  // LÓGICA DE TRANSICIÓN DE ESTADOS
  if (status === "DISPUTED" && (isBuyer || isSeller || isAdmin)) {
    await txRef.update({
      status: "DISPUTED",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
  }
  if (status === "CANCELLED" && isBuyer && data.status === "PENDING_PAYMENT") {
    await txRef.update({
      status: "CANCELLED",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
  }
  throw new functions.https.HttpsError(
    "permission-denied",
    "No tienes permiso para realizar esta acción o la transición no es válida.",
  );
});
/**
 * 4. REGISTRAR TRACKING Y MARCAR COMO ENVIADO
 */
exports.updateTracking = functions.https.onCall(async (request) => {
  const { transactionId, trackingId, courier } = request.data;
  if (!request.auth)
    throw new functions.https.HttpsError("unauthenticated", "Acceso denegado.");
  const txRef = db.collection("transactions").doc(transactionId);
  const doc = await txRef.get();
  if (!doc.exists)
    throw new functions.https.HttpsError(
      "not-found",
      "Transacción no encontrada.",
    );
  const data = doc.data();
  if (data.sellerId !== request.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Solo el vendedor puede registrar el envío.",
    );
  }
  if (data.status !== "PAID_HELD") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "La transacción debe estar pagada para registrar envío.",
    );
  }
  await txRef.update({
    status: "SHIPPED",
    trackingId,
    courier,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true };
});
/**
 * 5. LIBERAR FONDOS (ESCROW RELEASE)
 */
exports.releaseFunds = functions.https.onCall(async (request) => {
  const { transactionId, qrToken } = request.data;
  if (!request.auth)
    throw new functions.https.HttpsError("unauthenticated", "Acceso denegado.");
  const txRef = db.collection("transactions").doc(transactionId);
  const doc = await txRef.get();
  if (!doc.exists)
    throw new functions.https.HttpsError(
      "not-found",
      "Transacción no encontrada.",
    );
  const data = doc.data();
  const isBuyer = data.buyerId === request.auth.uid;
  const isAdmin = false; // TODO: Implement real admin check via custom claims
  // Validar token si es intercambio en persona
  if (data.deliveryMethod === "en_mano" && data.qrCode !== qrToken) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Token de seguridad inválido.",
    );
  }
  if (!isBuyer && !isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Solo el comprador puede liberar los fondos.",
    );
  }
  if (data.status === "COMPLETED") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Los fondos ya fueron liberados.",
    );
  }
  // EJECUTAR LIBERACIÓN
  await txRef.update({
    status: "COMPLETED",
    escrowReleased: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  // DISTRIBUTE FUNDS (New model balanced logic)
  await distributeEscrowFunds(transactionId, data);
  // NOTIFICAR AL VENDEDOR (In-App y Email)
  const sellerRef = db.collection("users").doc(data.sellerId);
  const sellerDoc = await sellerRef.get();
  if (sellerDoc.exists) {
    const sellerData = sellerDoc.data();
    // 1. Notificación en la plataforma
    await db.collection("notifications").add({
      userId: data.sellerId,
      title: "¡Venta Completada!",
      message: `El comprador ha liberado el pago de "${data.itemTitle}". Los fondos ya están disponibles en tu billetera.`,
      type: "success",
      icon: "payments",
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      link: "/dashboard",
    });
    // 2. Email preparatorio (Trigger Email Extension)
    if (sellerData.email) {
      await db.collection("mail").add({
        to: sellerData.email,
        message: {
          subject: `¡Pago Liberado! - ${data.itemTitle}`,
          html: `
                        <h2>¡Felicidades, venta completada!</h2>
                        <p>El comprador ha recibido el producto en condiciones y ha liberado los fondos de la transacción <strong>#${transactionId}</strong>.</p>
                        <p>Ya puedes ver el saldo acreditado en tu Billetera dentro de De Oportunidades.</p>
                        <br/>
                        <p>Gracias por usar nuestra plataforma.</p>
                    `,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
  return { success: true };
});
/**
 * 6. REEMBOLSAR FONDOS (REFUND - ADMIN ONLY OR COMPREHENSIVE RULES)
 */
exports.refundFunds = functions.https.onCall(async (request) => {
  const { transactionId } = request.data;
  if (!request.auth)
    throw new functions.https.HttpsError("unauthenticated", "Acceso denegado.");
  const txRef = db.collection("transactions").doc(transactionId);
  const doc = await txRef.get();
  if (!doc.exists)
    throw new functions.https.HttpsError(
      "not-found",
      "Transacción no encontrada.",
    );
  const data = doc.data();
  const isAdmin = false; // TODO: Real admin check
  if (!isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Solo un administrador puede ejecutar un reembolso forzado.",
    );
  }
  if (data.status === "REFUNDED") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Los fondos ya fueron reembolsados.",
    );
  }
  // EJECUTAR REEMBOLSO
  await txRef.update({
    status: "REFUNDED",
    escrowReleased: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  // Mover saldo de vuelta al comprador
  const buyerRef = db.collection("users").doc(data.buyerId);
  await buyerRef.update({
    "wallet.available": admin.firestore.FieldValue.increment(
      data.amountTotal || data.total || data.amount,
    ),
    "wallet.lastUpdated": admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true };
});
/**
 * 7. AGREGAR NOTA AL ESCROW (SISTEMA O CHAT)
 */
exports.addEscrowNote = functions.https.onCall(async (request) => {
  const { transactionId, role, text, senderId } = request.data;
  if (!request.auth)
    throw new functions.https.HttpsError("unauthenticated", "Acceso denegado.");
  const txRef = db.collection("transactions").doc(transactionId);
  const doc = await txRef.get();
  if (!doc.exists)
    throw new functions.https.HttpsError(
      "not-found",
      "Transacción no encontrada.",
    );
  const msgRef = txRef.collection("messages").doc();
  await msgRef.set({
    role,
    text,
    senderId: senderId || request.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await txRef.update({
    lastSystemMessage: role === "sistema" ? text : null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true };
});
/**
 * 8. REGISTRAR EVIDENCIA (FOTOS/COMPROBANTES)
 */
exports.submitEvidence = functions.https.onCall(async (request) => {
  var _a;
  const { transactionId, url, type, description } = request.data;
  if (!request.auth)
    throw new functions.https.HttpsError("unauthenticated", "Acceso denegado.");
  const txRef = db.collection("transactions").doc(transactionId);
  const doc = await txRef.get();
  if (!doc.exists)
    throw new functions.https.HttpsError(
      "not-found",
      "Transacción no encontrada.",
    );
  const evidenceRef = txRef.collection("evidence").doc();
  await evidenceRef.set({
    url,
    type,
    description: description || "",
    uploadedBy: request.auth.uid,
    aiVerified: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const currentCount =
    ((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.evidenceCount) ||
    0;
  await txRef.update({
    evidenceCount: currentCount + 1,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true };
});
/**
 * 9. AUTO-RELEASE ESCROW (Scheduled 48h timer)
 * Runs every hour to check for SHIPPED transactions older than 48 hours.
 */
exports.autoReleaseEscrow = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async (context) => {
    const now = new Date();
    // Query transactions that are DELIVERED_PENDING_REVIEW and deadline has passed
    const snapshot = await db
      .collection("transactions")
      .where("status", "==", "DELIVERED_PENDING_REVIEW")
      .where("inspectionDeadline", "<=", now)
      .get();
    if (snapshot.empty) {
      console.log("No transactions to auto-release.");
      return null;
    }
    console.log(`Auto-releasing ${snapshot.size} transactions...`);
    const results = [];
    for (const doc of snapshot.docs) {
      const txId = doc.id;
      const data = doc.data();
      try {
        // 1. Update status to COMPLETED
        await doc.ref.update({
          status: "COMPLETED",
          escrowReleased: true,
          autoReleased: true, // Tracking flag
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // 2. Distribute funds
        await distributeEscrowFunds(txId, data);
        // 3. Optional: Send notification to buyer and seller
        // (System notes are added via addEscrowNote if needed, but here we just log)
        results.push({ id: txId, status: "success" });
      } catch (error) {
        console.error(`Error auto-releasing transaction ${txId}:`, error);
        results.push({ id: txId, status: "error", message: error.message });
      }
    }
    return results;
  });
/**
 * 10. MERCADO PAGO WEBHOOK (Payment Confirmation)
 */
exports.mercadoPagoWebhook = functions.https.onRequest(async (req, res) => {
  var _a;
  const { type, data } = req.body;
  // We only care about payment events
  if (type === "payment") {
    const paymentId = data.id;
    try {
      // Get payment detail from MP
      const { Payment } = await Promise.resolve().then(() =>
        __importStar(require("mercadopago")),
      );
      const mpPayment = new Payment(client);
      const paymentDetail = await mpPayment.get({ id: paymentId });
      if (paymentDetail.status === "approved") {
        const txId = paymentDetail.external_reference;
        if (txId) {
          const txRef = db.collection("transactions").doc(txId);
          const txDoc = await txRef.get();
          if (
            txDoc.exists &&
            ((_a = txDoc.data()) === null || _a === void 0
              ? void 0
              : _a.status) === "PENDING_PAYMENT"
          ) {
            await txRef.update({
              status: "PAID_HELD",
              mpPaymentId: paymentId,
              lastSystemMessage:
                "✅ Pago confirmado via Mercado Pago. Fondos en garantía.",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`Transaction ${txId} marked as PAID_HELD.`);
          }
        }
      }
    } catch (error) {
      console.error("Error processing MP Webhook:", error);
    }
  }
  res.status(200).send("OK");
});
/**
 * 11. CORREO ARGENTINO INTEGRATION
 */
var correoArgentino_1 = require("./correoArgentino");
Object.defineProperty(exports, "getShippingRates", {
  enumerable: true,
  get: function () {
    return correoArgentino_1.getShippingRates;
  },
});
Object.defineProperty(exports, "createShippingOrder", {
  enumerable: true,
  get: function () {
    return correoArgentino_1.createShippingOrder;
  },
});
Object.defineProperty(exports, "getShippingLabel", {
  enumerable: true,
  get: function () {
    return correoArgentino_1.getShippingLabel;
  },
});
//# sourceMappingURL=index.js.map
