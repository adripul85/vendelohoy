import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, adminAuth } from '../lib/firebase-admin.js';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { transactionId, itemId, sellerId, rating, comment, buyerName, buyerAvatar } = req.body;
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No autorizado: Falta el token de seguridad.' });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (e) {
            return res.status(401).json({ error: 'No autorizado: Token inválido.' });
        }

        const buyerId = decodedToken.uid;

        if (!transactionId || !sellerId || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Datos de reseña inválidos.' });
        }

        const reviewId = await adminDb.runTransaction(async (t) => {
            // 1. Verify existing review
            const reviewsSnap = await t.get(
                adminDb.collection('reviews')
                    .where('transactionId', '==', transactionId)
                    .where('buyerId', '==', buyerId)
            );
            
            if (!reviewsSnap.empty) {
                throw new Error('Ya has calificado esta transacción.');
            }

            // 2. Verify transaction exists and belongs to the caller
            const txRef = adminDb.collection('transactions').doc(transactionId);
            const txSnap = await t.get(txRef);
            
            if (!txSnap.exists) {
                throw new Error('Transacción no encontrada.');
            }
            if (txSnap.data()?.buyerId !== buyerId) {
                throw new Error('Prohibido: No eres el comprador de esta transacción.');
            }

            // 3. Create the review
            const reviewRef = adminDb.collection('reviews').doc();
            const reviewData = {
                transactionId,
                itemId: itemId || "",
                sellerId,
                buyerId,
                reviewerId: buyerId, // Fix for firestore.rules
                buyerName: buyerName || "Usuario",
                buyerAvatar: buyerAvatar || "",
                rating: Number(rating),
                comment: comment ? comment.trim() : null,
                createdAt: FieldValue.serverTimestamp()
            };
            t.set(reviewRef, reviewData);

            // 4. Calculate new Seller Reputation
            const allReviewsSnap = await t.get(
                adminDb.collection('reviews').where('sellerId', '==', sellerId)
            );
            
            let totalRating = Number(rating);
            const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            distribution[Math.round(Number(rating))] = 1;

            allReviewsSnap.docs.forEach(doc => {
                const r = doc.data() as any;
                totalRating += r.rating;
                const rounded = Math.round(r.rating);
                if (distribution[rounded] !== undefined) {
                    distribution[rounded]++;
                }
            });

            const totalReviews = allReviewsSnap.docs.length + 1;
            const averageRating = Math.round((totalRating / totalReviews) * 10) / 10;

            const sellerRef = adminDb.collection('users').doc(sellerId);
            const sellerSnap = await t.get(sellerRef);
            const sellerData = sellerSnap.data() || {};

            const userUpdate: any = {
                "reputation.averageRating": averageRating,
                "reputation.totalReviews": totalReviews,
                "reputation.ratingDistribution": distribution,
                "reputation.lastUpdated": FieldValue.serverTimestamp()
            };

            // 5. Award XP and Gamification logic
            if (Number(rating) >= 4) {
                const currentPoints = sellerData.reputationPoints || 0;
                const newPoints = currentPoints + 5;
                userUpdate.reputationPoints = newPoints;

                // Trust Level Calculation
                let trustLevel = 'BRONZE';
                if (newPoints >= 15000) trustLevel = 'DIAMOND';
                else if (newPoints >= 5000) trustLevel = 'GOLD';
                else if (newPoints >= 1500) trustLevel = 'SILVER';

                userUpdate.trustLevel = trustLevel;

                const logRef = adminDb.collection('reputationLogs').doc();
                t.set(logRef, {
                    uid: sellerId,
                    points: 5,
                    reason: `Recibiste una calificación de ${rating} estrellas por una venta.`,
                    timestamp: FieldValue.serverTimestamp()
                });
            }

            t.update(sellerRef, userUpdate);

            return reviewRef.id;
        });

        return res.status(200).json({ success: true, id: reviewId });

    } catch (error: any) {
        console.error("API Error creating review:", error);
        return res.status(400).json({ error: error.message || 'Error del servidor al procesar la reseña.' });
    }
}
