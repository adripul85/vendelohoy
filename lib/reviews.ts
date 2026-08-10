import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { updateUserProfile } from "./users";

export interface ReviewData {
    transactionId: string;
    itemId: string;
    sellerId: string;
    buyerId: string;
    buyerName: string;
    buyerAvatar: string;
    rating: number; // 1-5
    comment?: string;
    createdAt: any;
}

// Create a new review
export const createReview = async (data: Omit<ReviewData, 'createdAt'>) => {
    try {
        if (!data.transactionId || !data.sellerId) {
            return { success: false, error: 'Datos de transacción inválidos.' };
        }

        const { auth } = await import("./firebase");
        if (!auth.currentUser) return { success: false, error: 'No autorizado' };
        
        let idToken = '';
        try {
            idToken = await auth.currentUser.getIdToken();
        } catch (e) {}

        // 1. Try serverless API endpoint
        if (idToken) {
            try {
                const response = await fetch('/api/submit-review', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const result = await response.json().catch(() => ({}));
                    return { success: true, id: result.id };
                }

                console.warn(`API /api/submit-review returned status ${response.status}. Using direct Firestore fallback...`);
            } catch (apiErr) {
                console.warn("API /api/submit-review call failed. Using direct Firestore fallback...", apiErr);
            }
        }

        // 2. Fallback: Save directly to Firestore
        const cleanData: any = {
            transactionId: data.transactionId || "",
            itemId: data.itemId || "",
            sellerId: data.sellerId || "",
            buyerId: data.buyerId || auth.currentUser.uid,
            reviewerId: auth.currentUser.uid,
            buyerName: data.buyerName || "Usuario",
            buyerAvatar: data.buyerAvatar || "",
            rating: data.rating || 5,
            createdAt: serverTimestamp(),
        };
        if (data.comment && typeof data.comment === 'string' && data.comment.trim() !== '') {
            cleanData.comment = data.comment.trim();
        }

        const docRef = await addDoc(collection(db, "reviews"), cleanData);

        // Background update seller reputation if allowed
        updateSellerReputation(data.sellerId).catch(() => {});

        return { success: true, id: docRef.id };
    } catch (error: any) {
        console.error("Error creating review:", error);
        return { success: false, error: error.message || error };
    }
};

// Get all reviews for a seller
export const getReviewsForSeller = async (sellerId: string): Promise<(ReviewData & { id: string })[]> => {
    try {
        if (!sellerId) return [];
        const q = query(
            collection(db, "reviews"),
            where("sellerId", "==", sellerId),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as (ReviewData & { id: string })[];
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
};

// Check if transaction has been reviewed
export const getReviewForTransaction = async (transactionId: string): Promise<(ReviewData & { id: string }) | null> => {
    try {
        if (!transactionId) return null;
        const q = query(
            collection(db, "reviews"),
            where("transactionId", "==", transactionId)
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;

        const doc = querySnapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        } as (ReviewData & { id: string });
    } catch (error) {
        console.error("Error checking review:", error);
        return null;
    }
};

// Update seller's reputation (recalculate average)
export const updateSellerReputation = async (sellerId: string) => {
    try {
        const reviews = await getReviewsForSeller(sellerId);

        if (reviews.length === 0) {
            await updateUserProfile(sellerId, {
                reputation: {
                    averageRating: 0,
                    totalReviews: 0,
                    lastUpdated: serverTimestamp()
                }
            } as any);
            return { success: true };
        }

        // Calculate average and distribution
        let totalRating = 0;
        const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        reviews.forEach(review => {
            const r = Math.round(review.rating);
            totalRating += review.rating;
            if (distribution[r] !== undefined) {
                distribution[r]++;
            }
        });

        const averageRating = totalRating / reviews.length;
        const ratingDistribution = distribution;

        // Update user profile
        await updateUserProfile(sellerId, {
            reputation: {
                averageRating: Math.round(averageRating * 10) / 10,
                totalReviews: reviews.length,
                ratingDistribution,
                lastUpdated: serverTimestamp()
            }
        } as any);

        return { success: true };
    } catch (error) {
        console.error("Error updating reputation:", error);
        return { success: false, error };
    }
};
