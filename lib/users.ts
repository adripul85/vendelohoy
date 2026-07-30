import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "./firebase";
import { deleteUser } from "firebase/auth";


// User Profile Interface
export interface UserProfile {
    uid: string;
    displayName: string;
    dni: string;
    email: string;
    phone: string;
    location: {
        city: string;
        state: string;
        zipCode?: string;
        address?: string;
    };
    bio?: string;
    avatar: string;
    coverImage?: string;
    profileComplete: boolean;
    certifications?: string[];
    role?: 'admin' | 'moderator' | 'user';
    trustLevel?: 'Bajo' | 'Medio' | 'Alto' | 'Premium';
    sellerStatus?: 'Socio Activo' | 'Socio en Prueba' | 'Socio Elite';
    successfulSales?: number;
    lastSaleDate?: any;
    initials?: string;
    verificationBadges?: {
        identityVerified: boolean;
        addressVerified: boolean;
        phoneVerified: boolean;
    };
    verificationEvidence?: {
        dniFront: string;
        dniFrontBack?: string; // Compatibility
        dniBack: string;
        selfie: string;
        addressProof?: string;
        submittedAt: any;
        status: 'pending' | 'approved' | 'rejected' | 'none';
        rejectionReason?: string;
    };
    wallet?: {
        available: number;
        inEscrow: number;
        pending: number;
        currency: string;
        lastUpdated: any;
    };
    bankDetails?: {
        cbu: string;
        alias: string;
        bankName: string;
        holderName: string;
        accountType: string;
        dni?: string;
    };
    taxDetails?: {
        cuit: string;
        taxCondition: 'Monotributo' | 'Responsable Inscripto' | 'Consumidor Final' | 'Exento';
    };
    reputationPoints?: number;
    reputation?: {
        averageRating: number;
        totalReviews: number;
        ratingDistribution?: { [key: number]: number };
        lastUpdated: any;
    };
    store?: {
        isActive: boolean;
        name: string;
        slug: string;
        logo: string;
        banner: string;
        description: string;
        tagline?: string;
        announcement?: string;
        announcementColor?: string;
        announcementActive?: boolean;
        warranty?: string;
        dispatchTime?: string;
        showCouponsPublic?: boolean;
        featuredProductId?: string;
        featuredProductIds?: string[];
        catalogSort?: 'default' | 'featured_first' | 'best_sellers' | 'price_low' | 'price_high';
        socialLinks?: {
            instagram?: string;
            tiktok?: string;
            whatsapp?: string;
            website?: string;
            facebook?: string;
            youtube?: string;
            twitter?: string;
        };
        plan: 'FREE' | 'PRO';
        paidOfficialTick?: boolean;
        coupons?: {
            id: string;
            code: string;
            discountPercentage: number;
            maxUses: number;
            uses: number;
            active: boolean;
            createdAt: any;
        }[];
    };
    followersCount?: number;
    followingCount?: number;
    responseTime?: string;
    lastDailyXpDate?: string;

    social?: {
        whatsapp?: string;
        instagram?: string;
        tiktok?: string;
        twitter?: string;
    };
    logistics?: {
        shippingInfo?: string;
        deliveryMethods?: string[];
        businessHours?: string;
        meetingPoints?: string[];
    };
    identity?: {
        birthday?: string;
        gender?: string;
    };
    notificationPreferences?: {
        emailAlerts: boolean;
        pushAlerts: boolean;
        marketingAlerts: boolean;
    };
    shopTheme?: {
        primaryColor?: string;
        secondaryColor?: string;
        backgroundType: 'color' | 'image' | 'gradient';
        backgroundColor?: string;
        backgroundImage?: string;
        accentColor?: string;
        typography?: string;
    };
    mercadoPagoOAuth?: {
        accessToken: string;
        refreshToken: string;
        publicKey: string;
        userId: string;
        expiresIn: number;
        updatedAt: any;
    };

    createdAt: any;
    updatedAt?: any;
    recentSearches?: string[];
    lastInteraction?: any;
}

// Create a new user profile
export const createUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    try {
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, {
            ...data,
            uid,
            profileComplete: false,
            role: 'user',
            wallet: {
                available: 0,
                inEscrow: 0,
                pending: 0,
                currency: 'ARS',
                lastUpdated: serverTimestamp()
            },
            verificationEvidence: {
                status: 'none',
                dniFront: '',
                dniBack: '',
                selfie: '',
                submittedAt: null,
                rejectionReason: ''
            },
            reputationPoints: 0,
            reputation: {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                lastUpdated: serverTimestamp()
            },
            trustLevel: 'Bajo',
            sellerStatus: 'Socio en Prueba',
            successfulSales: 0,
            createdAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error creating user profile:", error);
        return { success: false, error };
    }
};

// Get user profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return { uid: userSnap.id, ...userSnap.data() } as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

// Update user profile
export const updateUserProfile = async (uid: string, data: any) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });

        if (data.store?.name || data.store?.slug) {
            await registerStoreIdentifiers(uid, data.store.name, data.store.slug);
        }

        // Trigger reputation recalculation if identity or bank details changed
        if (data.dni || data.bankDetails) {
            await recalculateReputation(uid);
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating user profile:", error);
        return { success: false, error };
    }
};

/**
 * Submit user KYC evidence for review
 */
export const submitVerification = async (uid: string) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            "verificationEvidence.status": "pending",
            "verificationEvidence.submittedAt": serverTimestamp(),
            "updatedAt": serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error submitting verification:", error);
        return { success: false, error };
    }
};

// Auto-approve verification (called after successful automatic checks)
export const approveVerification = async (uid: string) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            "verificationEvidence.status": "approved",
            "verificationEvidence.verifiedAt": serverTimestamp(),
            "verificationEvidence.verifiedBy": "auto",
            "verificationBadges.identityVerified": true,
            "updatedAt": serverTimestamp()
        });
        
        // Award gamification points
        await addReputationPoints(uid, 500, "Identidad Verificada");
        
        return { success: true };
    } catch (error) {
        console.error("Error approving verification:", error);
        return { success: false, error };
    }
};

// Auto-reject verification with reason and increment attempt counter
export const rejectVerification = async (uid: string, reason: string) => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        const currentAttempts = userSnap.data()?.verificationEvidence?.failedAttempts || 0;
        
        await updateDoc(userRef, {
            "verificationEvidence.status": "rejected",
            "verificationEvidence.rejectionReason": reason,
            "verificationEvidence.rejectedAt": serverTimestamp(),
            "verificationEvidence.failedAttempts": currentAttempts + 1,
            "updatedAt": serverTimestamp()
        });
        return { success: true, attempts: currentAttempts + 1 };
    } catch (error) {
        console.error("Error rejecting verification:", error);
        return { success: false, error };
    }
};

// Complete user profile (mark as complete)
export const completeUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            ...data,
            profileComplete: true,
            updatedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error completing user profile:", error);
        return { success: false, error };
    }
};

// Check if profile is complete
export const checkProfileComplete = async (uid: string): Promise<boolean> => {
    try {
        const profile = await getUserProfile(uid);
        return profile?.profileComplete || false;
    } catch (error) {
        console.error("Error checking profile completion:", error);
        return false;
    }
};

// Delete user account completely
export const deleteUserAccount = async (uid: string) => {
    try {
        // 1. Delete user document from Firestore
        const userRef = doc(db, "users", uid);
        await deleteDoc(userRef);

        // 2. Delete the Firebase Auth user
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === uid) {
            await deleteUser(currentUser);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user account:", error);

        // Handle re-authentication requirement
        if (error.code === 'auth/requires-recent-login') {
            return {
                success: false,
                error,
                requiresReauth: true,
                message: "Por seguridad, debes volver a iniciar sesión antes de eliminar tu cuenta."
            };
        }

        return { success: false, error };
    }
};


// --- REVIEWS & FOLLOWERS SYSTEM ---

export interface Review {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    targetId: string;
    rating: number; // 1-5
    comment: string;
    createdAt: any;
    transactionId?: string;
}

export const addUserReview = async (targetUid: string, reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    try {
        const userRef = doc(db, "users", targetUid);
        const reviewsRef = collection(userRef, "reviews");

        // 1. Add Review Doc
        await addDoc(reviewsRef, {
            ...reviewData,
            createdAt: serverTimestamp()
        });

        // 2. Update Average Rating and Distribution (Aggregation)
        const snapshot = await getDocs(reviewsRef);
        let totalStars = 0;
        let count = 0;
        const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        snapshot.forEach(doc => {
            const data = doc.data();
            const r = Math.round(data.rating);
            totalStars += data.rating;
            count++;
            if (distribution[r] !== undefined) {
                distribution[r]++;
            }
        });
        const average = count > 0 ? totalStars / count : 0;

        await updateDoc(userRef, {
            "reputation.averageRating": average,
            "reputation.totalReviews": count,
            "reputation.ratingDistribution": distribution,
            "reputation.lastUpdated": serverTimestamp()
        });

        // Trigger reputation recalculation
        await recalculateReputation(targetUid);

        return { success: true };
    } catch (error) {
        console.error("Error adding review:", error);
        return { success: false, error };
    }
};

export const getUserReviews = async (targetUid: string) => {
    try {
        const reviewsRef = collection(db, "users", targetUid, "reviews");
        const q = query(reviewsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
};

// --- FOLLOW SYSTEM ---

export const followUser = async (followerUid: string, targetUid: string) => {
    try {
        // Add target to follower's "following" collection
        const followingRef = doc(db, "users", followerUid, "following", targetUid);
        await setDoc(followingRef, {
            uid: targetUid,
            followedAt: serverTimestamp()
        });

        // Add follower to target's "followers" collection (optional, for count)
        const followersRef = doc(db, "users", targetUid, "followers", followerUid);
        await setDoc(followersRef, {
            uid: followerUid,
            followedAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error("Error following user:", error);
        return { success: false, error };
    }
};

export const unfollowUser = async (followerUid: string, targetUid: string) => {
    try {
        await deleteDoc(doc(db, "users", followerUid, "following", targetUid));
        await deleteDoc(doc(db, "users", targetUid, "followers", followerUid));
        return { success: true };
    } catch (error) {
        console.error("Error unfollowing user:", error);
        return { success: false, error };
    }
};

export const isFollowingUser = async (followerUid: string, targetUid: string) => {
    try {
        const docRef = doc(db, "users", followerUid, "following", targetUid);
        const snapshot = await getDoc(docRef);
        return snapshot.exists();
    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
    }
};
export interface Withdrawal {
    id: string;
    uid: string;
    amount: number;
    bankDetails: UserProfile['bankDetails'];
    status: 'pending' | 'completed' | 'rejected';
    createdAt: any;
    updatedAt: any;
}

/**
 * Handle fund withdrawal request
 */
export const withdrawFunds = async (uid: string, amount: number, bankDetails: UserProfile['bankDetails']) => {
    try {
        const { runTransaction } = await import("firebase/firestore");
        
        if (!bankDetails?.cbu) {
            return { success: false, error: 'CBU no proporcionado.' };
        }

        // Validación estricta de CBU en backend
        const { validateCbuChecksum } = await import('./banking');
        // Check if it's 22 digits to avoid checking ALIAS format incorrectly. Wait, banking.ts supports aliases too? No, validateCbuChecksum is only for 22 digits.
        if (/^\d{22}$/.test(bankDetails.cbu.trim()) && !validateCbuChecksum(bankDetails.cbu.trim())) {
            return { success: false, error: 'El CBU/CVU ingresado es inválido según su suma de verificación.' };
        }

        let withdrawalId = '';

        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", uid);
            const userDoc = await transaction.get(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('Usuario no encontrado.');
            }
            
            const userData = userDoc.data() as UserProfile;
            
            // 1. Validar KYC
            if (userData.trustLevel === 'Bajo' || !userData.trustLevel) {
                throw new Error('REQUIRE_KYC');
            }

            // 2. Validar Fondos
            const currentAvailable = userData.wallet?.available || 0;
            if (currentAvailable < amount) {
                throw new Error('Fondos insuficientes.');
            }

            // 3. Crear registro de retiro
            const withdrawalRef = doc(collection(db, "withdrawals"));
            withdrawalId = withdrawalRef.id;
            
            transaction.set(withdrawalRef, {
                uid,
                amount,
                bankDetails,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // 4. Deducir fondos
            transaction.update(userRef, {
                "wallet.available": currentAvailable - amount,
                "wallet.lastUpdated": serverTimestamp()
            });
        });

        return { success: true, id: withdrawalId };
    } catch (error: any) {
        console.error("Error withdrawing funds:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Fetch top sellers based on reputation
 */
export const getTopSellers = async (limitCount: number = 5): Promise<UserProfile[]> => {
    try {
        const usersRef = collection(db, "users");
        // We filter for users who have at least 1 review and a high rating
        const q = query(
            usersRef,
            where("reputation.totalReviews", ">", 0),
            orderBy("reputation.totalReviews", "desc"),
            orderBy("reputation.averageRating", "desc")
        );

        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => doc.data() as UserProfile);

        // Sort by averageRating descending and then totalReviews
        // (Firestore multiple orderBy on different fields requires index, 
        // using simple logic here or client sort for small numbers)
        return users
            .sort((a, b) => (b.reputation?.averageRating || 0) - (a.reputation?.averageRating || 0))
            .slice(0, limitCount);
    } catch (error) {
        console.error("Error fetching top sellers:", error);
        return [];
    }
};

// --- WALLET MOVEMENTS SYSTEM ---

export interface WalletMovement {
    id?: string;
    uid: string;
    type: 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'FEE_PROTECTION' | 'SALE_REVENUE' | 'BUY_DEDUCTION' | 'WITHDRAWAL_REQUEST' | 'WITHDRAWAL_COMPLETED' | 'PENALTY' | 'PLATFORM_REVENUE';
    amount: number;
    referenceId: string; // Transaction ID or Withdrawal ID
    itemTitle?: string;
    description: string;
    timestamp: any;
}

/**
 * Log a movement in the user's wallet history
 */
export const logWalletMovement = async (movement: Omit<WalletMovement, 'id' | 'timestamp'>) => {
    try {
        const movementsRef = collection(db, "wallet_movements");
        await addDoc(movementsRef, {
            ...movement,
            timestamp: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error logging wallet movement:", error);
        return { success: false, error };
    }
};

/**
 * Fetch wallet movements for a user (Snapshot)
 */
export const getUserWalletMovements = async (uid: string): Promise<WalletMovement[]> => {
    try {
        const movementsRef = collection(db, "wallet_movements");
        const q = query(movementsRef, where("uid", "==", uid), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletMovement));
    } catch (error) {
        console.error("Error fetching wallet movements:", error);
        return [];
    }
};

/**
 * Subscribe to wallet movements for a user
 */
export const subscribeToUserWalletMovements = (uid: string, callback: (movements: WalletMovement[]) => void) => {
    const movementsRef = collection(db, "wallet_movements");
    const q = query(movementsRef, where("uid", "==", uid), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
        const movements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletMovement));
        callback(movements);
    });
};

// --- BEHAVIOR TRACKING SYSTEM ---

/**
 * Track user searches to improve suggestions
 */
export const trackUserSearch = async (userId: string, searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 3) return;

    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const recentSearches = userData.recentSearches || [];

            // Limit to last 10 unique searches
            const term = searchTerm.toLowerCase().trim();
            const updatedSearches = [term, ...recentSearches.filter((s: string) => s !== term)].slice(0, 10);

            await updateDoc(userRef, {
                recentSearches: updatedSearches,
                lastInteraction: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error tracking search:", error);
    }
};

/**
 * Track product views to improve suggestions
 */
export const trackProductView = async (userId: string, productId: string, category: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();

            // Track categories (limit 10)
            const viewedCategories = userData.viewedCategories || [];
            const updatedCategories = [category, ...viewedCategories.filter((c: string) => c !== category)].slice(0, 10);

            // Track products (limit 20)
            const viewedProducts = userData.viewedProducts || [];
            const updatedProducts = [productId, ...viewedProducts.filter((p: string) => p !== productId)].slice(0, 20);

            await updateDoc(userRef, {
                viewedCategories: updatedCategories,
                viewedProducts: updatedProducts,
                lastInteraction: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error tracking product view:", error);
    }
};
/**
 * Recalculate user trust level and status based on activity and verification
 */
export interface ReputationLog {
    id?: string;
    uid: string;
    points: number;
    reason: string;
    timestamp: any;
}

export const addReputationPoints = async (uid: string, points: number, reason: string) => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) return { success: false };
        
        const currentPoints = userSnap.data()?.reputationPoints || 0;
        const newPoints = Math.max(0, currentPoints + points); // Prevent negative total points
        
        // Add log
        await addDoc(collection(db, "reputationLogs"), {
            uid,
            points,
            reason,
            timestamp: serverTimestamp()
        });
        
        // Update user
        await updateDoc(userRef, {
            reputationPoints: newPoints,
            updatedAt: serverTimestamp()
        });
        
        // Recalculate level
        await recalculateReputation(uid);
        
        return { success: true, newPoints };
    } catch (error) {
        console.error("Error adding reputation points:", error);
        throw error;
    }
};

/**
 * Checks if a user meets criteria to move up or down in Trust Level (Gamification)
 */
export const recalculateReputation = async (uid: string) => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return;

        const data = userSnap.data() as UserProfile;
        let newLevel: UserProfile['trustLevel'] = data.trustLevel || 'Bajo';
        let newStatus: UserProfile['sellerStatus'] = data.sellerStatus || 'Socio en Prueba';

        const xp = data.reputationPoints || 0;
        const hasDni = !!data.dni || !!data.verificationBadges?.identityVerified;
        const hasBank = !!(data.bankDetails?.cbu || data.bankDetails?.alias);

        // Logic based on XP and requirements
        if (xp >= 5000 && hasDni && hasBank) {
            newLevel = 'Premium'; // Diamante
            newStatus = 'Socio Elite';
        } else if (xp >= 2500 && hasDni && hasBank) {
            newLevel = 'Alto'; // Oro
            newStatus = 'Socio Elite';
        } else if (xp >= 1000 && hasDni) {
            newLevel = 'Medio'; // Plata
            newStatus = 'Socio Activo';
        } else {
            newLevel = 'Bajo'; // Bronce
            newStatus = 'Socio en Prueba';
        }

        if (newLevel !== data.trustLevel || newStatus !== data.sellerStatus) {
            await updateDoc(userRef, {
                trustLevel: newLevel,
                sellerStatus: newStatus,
                updatedAt: serverTimestamp()
            });
            console.log(`Reputation upgraded for ${uid}: ${newLevel} - ${newStatus}`);
        }
    } catch (error) {
        console.error("Error recalculating reputation:", error);
    }
};

const inMemoryXpClaims = new Set<string>();

export const claimDailyLoginXp = async (uid: string): Promise<boolean> => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const claimKey = `${uid}_${todayStr}`;
        if (inMemoryXpClaims.has(claimKey) || sessionStorage.getItem(`xp_claimed_${claimKey}`) === 'true') {
            return false;
        }
        inMemoryXpClaims.add(claimKey);
        sessionStorage.setItem(`xp_claimed_${claimKey}`, 'true');

        const { runTransaction } = await import("firebase/firestore");
        
        let claimed = false;
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", uid);
            const userDoc = await transaction.get(userRef);
            
            if (!userDoc.exists()) {
                throw new Error("User does not exist");
            }
            
            const data = userDoc.data() as UserProfile;
            const today = new Date().toISOString().split('T')[0];
            
            if (data.lastDailyXpDate === today) {
                return false; // Already claimed
            }
            
            transaction.update(userRef, { lastDailyXpDate: today });
            claimed = true;
        });

        if (claimed) {
            await addReputationPoints(uid, 10, 'Recompensa por visita diaria');
            return true;
        }
        return false;
    } catch (error: any) {
        const todayStr = new Date().toISOString().split('T')[0];
        const claimKey = `${uid}_${todayStr}`;
        inMemoryXpClaims.delete(claimKey);
        sessionStorage.removeItem(`xp_claimed_${claimKey}`);
        console.error("Error claiming daily XP:", error);
        return false;
    }
};

export const getStoreBySlug = async (slug: string): Promise<UserProfile | null> => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("store.slug", "==", slug), where("store.isActive", "==", true));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching store by slug:", error);
        return null;
    }
};

export const updateStoreProfile = async (uid: string, storeData: Partial<UserProfile['store']>) => {
    try {
        const userRef = doc(db, "users", uid);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
            const userData = docSnap.data();
            const currentStore = userData.store || {};
            const newStore = { ...currentStore, ...storeData };
            await updateDoc(userRef, {
                store: newStore
            });
            if (newStore.name || newStore.slug) {
                await registerStoreIdentifiers(uid, newStore.name, newStore.slug);
            }
            return { success: true };
        }
        return { success: false, error: 'User not found' };
    } catch (error: any) {
        console.error("Error updating store profile:", error);
        return { success: false, error: error.message };
    }
};

// --- ENGINE DE SEGURIDAD ANTI-PLAGIO Y UNICIDAD DE TIENDA ---

export const RESERVED_BRAND_KEYWORDS = [
    'admin', 'administrador', 'soporte', 'support', 'oficial', 'official',
    'mercadolibre', 'mercado-libre', 'mercadopago', 'mercado-pago',
    'apple', 'samsung', 'nike', 'adidas', 'puma', 'sony', 'playstation',
    'whatsapp', 'instagram', 'facebook', 'tiktok', 'youtube', 'twitter',
    'de-oportunidades', 'oportunidades', 'escrow', 'pagoseguro', 'pago-seguro',
    'garantia-oficial', 'verificado', 'moderador', 'soporte-tecnico', 'sistema',
    'banco', 'galicia', 'santander', 'bbva', 'brubank', 'ualá', 'uala'
];

/**
 * Normaliza un string para evitar ataques homóglifos (typosquatting).
 * Convierte números que parecen letras (0->o, 1->i, 3->e, 4->a, 5->s, 8->b),
 * elimina acentos, guiones y caracteres especiales.
 */
export const normalizeStoreIdentifier = (input?: string): string => {
    if (!input) return '';
    return input
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Sin acentos
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/8/g, 'b')
        .replace(/[^a-z]/g, ''); // Solo letras del alfabeto latino
};

/**
 * Verifica en tiempo real si un nombre comercial o slug está disponible y es único en la historia.
 */
export const checkStoreIdentifierAvailability = async (
    uid: string,
    name?: string,
    slug?: string
): Promise<{ available: boolean; reason?: string }> => {
    try {
        const checkWord = (word?: string) => {
            if (!word) return null;
            const lower = word.toLowerCase();
            const normWord = normalizeStoreIdentifier(word);
            for (const reserved of RESERVED_BRAND_KEYWORDS) {
                if (lower.includes(reserved) || (normWord.length >= 4 && normWord.includes(normalizeStoreIdentifier(reserved)))) {
                    return `El término "${word}" contiene palabras oficiales o marcas protegidas ("${reserved}").`;
                }
            }
            return null;
        };

        const nameError = checkWord(name);
        if (nameError) return { available: false, reason: nameError };

        const slugError = checkWord(slug);
        if (slugError) return { available: false, reason: slugError };

        // 1. Verificar en registro permanente histórico de Firebase (Tombstones)
        if (slug) {
            const normSlug = normalizeStoreIdentifier(slug);
            if (normSlug.length < 3) {
                return { available: false, reason: "El enlace debe tener al menos 3 letras válidas." };
            }
            const slugDoc = await getDoc(doc(db, "store_registry", `slug_${normSlug}`));
            if (slugDoc.exists() && slugDoc.data()?.uid !== uid) {
                return { available: false, reason: `El enlace "${slug}" (o uno fonéticamente idéntico) ya fue registrado en la historia de la plataforma.` };
            }
        }

        if (name) {
            const normName = normalizeStoreIdentifier(name);
            if (normName.length < 3) {
                return { available: false, reason: "El nombre comercial debe tener al menos 3 letras válidas." };
            }
            const nameDoc = await getDoc(doc(db, "store_registry", `name_${normName}`));
            if (nameDoc.exists() && nameDoc.data()?.uid !== uid) {
                return { available: false, reason: `El nombre "${name}" (o similar fonéticamente) ya se encuentra registrado y protegido.` };
            }
        }

        // 2. Fallback: Verificar tiendas existentes en colección users
        const usersSnap = await getDocs(query(collection(db, "users"), where("store.isActive", "==", true)));
        for (const userDoc of usersSnap.docs) {
            if (userDoc.id === uid) continue;
            const storeData = userDoc.data()?.store;
            if (storeData) {
                if (slug && normalizeStoreIdentifier(storeData.slug || '') === normalizeStoreIdentifier(slug)) {
                    return { available: false, reason: `El enlace "${slug}" es idéntico o muy similar al de una tienda activa (${storeData.name}).` };
                }
                if (name && normalizeStoreIdentifier(storeData.name || '') === normalizeStoreIdentifier(name)) {
                    return { available: false, reason: `El nombre "${name}" es idéntico fonéticamente al de otra tienda activa (${storeData.name}).` };
                }
            }
        }

        return { available: true };
    } catch (error) {
        console.error("Error checking availability:", error);
        return { available: true };
    }
};

/**
 * Registra permanentemente los nombres y slugs en la colección store_registry para evitar que se repitan de por vida.
 */
export const registerStoreIdentifiers = async (uid: string, name?: string, slug?: string) => {
    try {
        if (slug) {
            const normSlug = normalizeStoreIdentifier(slug);
            if (normSlug) {
                await setDoc(doc(db, "store_registry", `slug_${normSlug}`), {
                    uid,
                    originalValue: slug,
                    type: 'slug',
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }
        }
        if (name) {
            const normName = normalizeStoreIdentifier(name);
            if (normName) {
                await setDoc(doc(db, "store_registry", `name_${normName}`), {
                    uid,
                    originalValue: name,
                    type: 'name',
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }
        }
    } catch (err) {
        console.error("Error registering store identifiers:", err);
    }
};
