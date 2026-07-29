import {
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    collection,
    addDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
    query,
    where,
    getDocs,
    orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import { getUserProfile } from "./users";

// --- FAVORITES & LISTS ---

export interface FavoriteItem {
    productId: string;
    title: string;
    price: number;
    image: string;
    sellerName?: string;
    lists: string[];
    addedAt?: any;
}

export const toggleFavorite = async (userId: string, productId: string, productData?: Partial<FavoriteItem>, listName: string = 'General') => {
    try {
        const favoriteRef = doc(db, "users", userId, "favorites", productId);
        const docSnap = await getDoc(favoriteRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const currentLists: string[] = data.lists || ['General'];
            
            if (currentLists.includes(listName)) {
                const newLists = currentLists.filter(l => l !== listName);
                if (newLists.length === 0) {
                    await deleteDoc(favoriteRef);
                    return { isFavorite: false, lists: [] };
                } else {
                    await updateDoc(favoriteRef, { lists: newLists });
                    return { isFavorite: true, lists: newLists };
                }
            } else {
                const newLists = [...currentLists, listName];
                await updateDoc(favoriteRef, { 
                    lists: newLists,
                    ...(productData || {})
                });
                return { isFavorite: true, lists: newLists };
            }
        } else {
            await setDoc(favoriteRef, {
                productId,
                title: productData?.title || 'Producto Guardado',
                price: productData?.price || 0,
                image: productData?.image || '',
                sellerName: productData?.sellerName || 'Vendedor',
                lists: [listName],
                addedAt: serverTimestamp()
            });
            return { isFavorite: true, lists: [listName] };
        }
    } catch (error) {
        console.error("Error toggling favorite:", error);
        throw error;
    }
};

export const updateFavoriteLists = async (userId: string, productId: string, lists: string[], productData?: Partial<FavoriteItem>) => {
    try {
        const favoriteRef = doc(db, "users", userId, "favorites", productId);
        if (lists.length === 0) {
            await deleteDoc(favoriteRef);
            return { isFavorite: false, lists: [] };
        }
        await setDoc(favoriteRef, {
            productId,
            title: productData?.title || 'Producto Guardado',
            price: productData?.price || 0,
            image: productData?.image || '',
            sellerName: productData?.sellerName || 'Vendedor',
            lists,
            addedAt: serverTimestamp()
        }, { merge: true });
        return { isFavorite: true, lists };
    } catch (error) {
        console.error("Error updating favorite lists:", error);
        throw error;
    }
};

export const checkIsFavorite = async (userId: string, productId: string) => {
    try {
        const favoriteRef = doc(db, "users", userId, "favorites", productId);
        const docSnap = await getDoc(favoriteRef);
        if (docSnap.exists()) {
            return { isFavorite: true, lists: docSnap.data().lists || ['General'] };
        }
        return { isFavorite: false, lists: [] };
    } catch (error) {
        console.error("Error checking favorite:", error);
        return { isFavorite: false, lists: [] };
    }
};

export const getUserFavorites = async (userId: string): Promise<FavoriteItem[]> => {
    try {
        const favsRef = collection(db, "users", userId, "favorites");
        const snapshot = await getDocs(favsRef);
        return snapshot.docs.map(doc => ({ productId: doc.id, ...doc.data() })) as FavoriteItem[];
    } catch (error) {
        console.error("Error fetching user favorites:", error);
        return [];
    }
};

export const getFavoriteLists = async (userId: string): Promise<string[]> => {
    try {
        const metaRef = doc(db, "users", userId, "meta", "favoriteLists");
        const docSnap = await getDoc(metaRef);
        const customLists = docSnap.exists() ? (docSnap.data().lists || []) : [];
        
        // Combine with default and unique lists from items
        const items = await getUserFavorites(userId);
        const itemLists = new Set<string>(['General', ...customLists]);
        items.forEach(item => (item.lists || []).forEach(l => itemLists.add(l)));
        
        return Array.from(itemLists);
    } catch (error) {
        console.error("Error getting favorite lists:", error);
        return ['General'];
    }
};

export const addFavoriteList = async (userId: string, listName: string): Promise<string[]> => {
    try {
        const metaRef = doc(db, "users", userId, "meta", "favoriteLists");
        const docSnap = await getDoc(metaRef);
        let lists: string[] = [];
        if (docSnap.exists()) {
            lists = docSnap.data().lists || [];
            if (!lists.includes(listName)) lists.push(listName);
            await updateDoc(metaRef, { lists });
        } else {
            lists = [listName];
            await setDoc(metaRef, { lists });
        }
        return lists;
    } catch (error) {
        console.error("Error adding favorite list:", error);
        return ['General', listName];
    }
};

// --- ALERTS (Notifications) ---

export const toggleProductAlert = async (userId: string, productId: string) => {
    try {
        const alertRef = doc(db, "users", userId, "alerts", productId);
        const docSnap = await getDoc(alertRef);

        if (docSnap.exists()) {
            await deleteDoc(alertRef);
            return { hasAlert: false };
        } else {
            await setDoc(alertRef, {
                productId,
                type: 'price_drop', // Default alert type
                createdAt: serverTimestamp()
            });
            return { hasAlert: true };
        }
    } catch (error) {
        console.error("Error toggling alert:", error);
        throw error;
    }
};

export const checkHasAlert = async (userId: string, productId: string) => {
    try {
        const alertRef = doc(db, "users", userId, "alerts", productId);
        const docSnap = await getDoc(alertRef);
        return docSnap.exists();
    } catch (error) {
        console.error("Error checking alert:", error);
        return false;
    }
};

// --- REPORTING ---

export interface ReportData {
    reporterId: string;
    reporterName: string; // For quicker display
    targetId: string; // Product ID or User ID
    targetType: 'product' | 'user';
    reason: string;
    description: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    createdAt?: any;
}

export const reportItem = async (data: Omit<ReportData, 'status' | 'createdAt'>) => {
    try {
        await addDoc(collection(db, "reports"), {
            ...data,
            status: 'pending',
            createdAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error submitting report:", error);
        return { success: false, error };
    }
};

// --- ADMIN REPORTS ---

export const getReports = async () => {
    try {
        const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (ReportData & { id: string })[];
    } catch (error) {
        console.error("Error fetching reports:", error);
        return [];
    }
};

export const resolveReport = async (reportId: string, status: ReportData['status'], targetId?: string, targetType?: string) => {
    try {
        await import("firebase/firestore").then(({ updateDoc, doc }) =>
            updateDoc(doc(db, "reports", reportId), { status })
        );

        // Logic for TRUE reports (Eliminar contenido)
        if (status === 'resolved' && targetType === 'product' && targetId) {
            const { deleteItem } = await import('./items');
            await deleteItem(targetId);
        }

        // Logic for FALSE reports (Mantener contenido)
        // No action needed for 'dismissed', as the item remains AVAILABLE by default.
        // If we implemented a "hide while pending" feature, we would set it back to AVAILABLE here.

        return { success: true };
    } catch (error) {
        console.error("Error resolving report:", error);
        return { success: false, error };
    }
};
// --- FOLLOW SYSTEM ---

export const sendNotification = async (userId: string, notification: { title: string; message: string; type: 'info' | 'success' | 'warning' | 'error'; link?: string }) => {
    try {
        await addDoc(collection(db, "users", userId, "notifications"), {
            ...notification,
            read: false,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};

// --- FOLLOW SYSTEM ---

export interface FollowedSeller {
    followedId: string;
    name: string;
    avatar: string;
    slug?: string;
    reputation?: number;
    followedAt?: any;
}

export const toggleFollow = async (followerId: string, followedId: string, followerName: string = 'Alguien', sellerInfo?: Partial<FollowedSeller>) => {
    try {
        const followRef = doc(db, "users", followerId, "following", followedId);
        const docSnap = await getDoc(followRef);

        if (docSnap.exists()) {
            await deleteDoc(followRef);
            return { isFollowing: false };
        } else {
            // If sellerInfo not provided, try fetching profile
            let name = sellerInfo?.name || 'Vendedor';
            let avatar = sellerInfo?.avatar || '';
            let slug = sellerInfo?.slug || followedId;
            let reputation = sellerInfo?.reputation || 5.0;

            if (!sellerInfo?.name) {
                const profile = await getUserProfile(followedId);
                if (profile) {
                    name = profile.displayName || profile.store?.name || 'Vendedor';
                    avatar = profile.photoURL || profile.avatar || profile.store?.logo || '';
                    slug = profile.store?.slug || profile.uid;
                    reputation = profile.reputation?.averageRating || 5.0;
                }
            }

            await setDoc(followRef, {
                followedId,
                name,
                avatar,
                slug,
                reputation,
                followedAt: serverTimestamp()
            });

            // Send notification to the followed user
            await sendNotification(followedId, {
                title: 'Nuevo Seguidor',
                message: `${followerName} ha comenzado a seguirte.`,
                type: 'info',
                link: `/profile/${followerId}`
            });

            return { isFollowing: true };
        }
    } catch (error) {
        console.error("Error toggling follow:", error);
        throw error;
    }
};

export const checkIsFollowing = async (followerId: string, followedId: string) => {
    try {
        const followRef = doc(db, "users", followerId, "following", followedId);
        const docSnap = await getDoc(followRef);
        return docSnap.exists();
    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
    }
};

export const getFollowedSellers = async (userId: string): Promise<FollowedSeller[]> => {
    try {
        const followRef = collection(db, "users", userId, "following");
        const snapshot = await getDocs(followRef);
        const sellers: FollowedSeller[] = [];
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            let name = data.name;
            let avatar = data.avatar;
            let slug = data.slug || docSnap.id;
            let reputation = data.reputation || 5.0;

            // If old format without metadata, enrich from users collection
            if (!name) {
                const profile = await getUserProfile(docSnap.id);
                if (profile) {
                    name = profile.displayName || profile.store?.name || 'Vendedor';
                    avatar = profile.photoURL || profile.avatar || profile.store?.logo || '';
                    slug = profile.store?.slug || profile.uid;
                    reputation = profile.reputation?.averageRating || 5.0;
                    // update doc asynchronously for next time
                    setDoc(doc(db, "users", userId, "following", docSnap.id), { name, avatar, slug, reputation, followedId: docSnap.id }, { merge: true }).catch(() => {});
                } else {
                    name = 'Vendedor';
                }
            }
            sellers.push({ followedId: docSnap.id, name, avatar, slug, reputation, followedAt: data.followedAt });
        }
        return sellers;
    } catch (error) {
        console.error("Error fetching followed sellers:", error);
        return [];
    }
};

// --- INTERACTION TRACKING ---

export const trackProductView = async (productId: string) => {
    try {
        const { increment, updateDoc } = await import("firebase/firestore");
        const productRef = doc(db, "items", productId);
        await updateDoc(productRef, {
            views: increment(1)
        });
    } catch (error) {
        console.error("Error tracking product view:", error);
    }
};
