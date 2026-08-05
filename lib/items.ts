import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc, orderBy, limit } from "firebase/firestore";
import { db, auth } from "./firebase";

// Definimos qué forma tiene un Producto
export interface ItemData {
    title: string;
    price: number;
    description: string;
    masterCategory?: string;
    category: string;
    subcategory?: string;
    condition: 'new' | 'like_new' | 'good' | 'used' | 'repair' | 'digital' | 'service';
    images: string[];
    shippingAvailable?: boolean;
    deliveryMethods?: string[]; // ['correo_argentino', 'en_mano', 'acordar', 'domicilio']
    views?: number;
    sellerId: string; // ID del usuario que vende
    sellerName?: string; // Nombre para mostrar del vendedor
    brand?: string;
    model?: string;
    warranty?: string;
    color?: string | string[];
    size?: string | string[];
    productDimensions?: { length?: number; width?: number; height?: number; weight?: number }; // medidas del producto en sí
    status?: 'AVAILABLE' | 'PENDING_PAYMENT' | 'PAID_IN_CUSTODY' | 'SHIPPED' | 'DELIVERED' | 'SOLD' | 'CANCELLED';
    location?: string; // Ubicación del vendedor (ej: "Mendoza, AR")
    isFeatured?: boolean;
    isFlashSale?: boolean;
    quantity?: number; // 1 for unique, >1 for stock
    oldPrice?: number;
    weight?: number; // kg - peso del paquete para envío
    dimensions?: { length: number; width: number; height: number }; // cm - dimensiones del paquete para envío
    featuredUntil?: any;
    featuredFeeApplied?: number;
    cost?: number;
    showPriceInStore?: boolean;
    videoUrl?: string;
    hasInfiniteStock?: boolean;
    sku?: string;
    barcode?: string;
    mpn?: string;
    ageRange?: string;
    gender?: string;
    tags?: string[];
    seoTitle?: string;
    seoDescription?: string;
    flashSaleFeeApplied?: number;
    flashSaleExpiresAt?: any;
    createdAt?: any;
    updatedAt?: any;
}

export type ItemCondition = 'new' | 'like_new' | 'good' | 'used' | 'repair' | 'digital' | 'service';

export interface StockHistoryEntry {
    date: any;
    type: 'add' | 'subtract' | 'replace' | 'sale' | 'cancel';
    previousStock: number | 'infinite';
    newStock: number | 'infinite';
    adjustment: number;
    reason?: string;
    userId: string;
}

import { CATEGORIES as CONST_CATEGORIES } from "./constants";
import { updateDoc } from "firebase/firestore";

export const adjustItemStock = async (
    itemId: string,
    newQuantity: number,
    hasInfiniteStock: boolean,
    historyEntry: Omit<StockHistoryEntry, 'date' | 'userId'>
) => {
    try {
        if (!auth.currentUser) throw new Error("UNAUTHORIZED");
        
        const itemRef = doc(db, 'items', itemId);
        
        // Update item quantity
        await updateDoc(itemRef, {
            quantity: newQuantity,
            hasInfiniteStock,
            updatedAt: serverTimestamp()
        });

        // Add history entry in subcollection
        const historyRef = collection(itemRef, 'stock_history');
        await addDoc(historyRef, {
            ...historyEntry,
            date: serverTimestamp(),
            userId: auth.currentUser.uid
        });

        return { success: true };
    } catch (error) {
        console.error("Error adjusting stock:", error);
        return { success: false, error };
    }
};

const cleanUndefined = (obj: Record<string, any>): Record<string, any> => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            acc[key] = value;
        }
        return acc;
    }, {} as Record<string, any>);
};

export const publishItem = async (data: ItemData) => {
    try {
        if (!auth.currentUser) {
            throw new Error("UNAUTHORIZED: Debes iniciar sesión para publicar.");
        }
        if (data.price <= 0) {
            throw new Error("INVALID_PRICE: El precio debe ser mayor a cero.");
        }
        // Referencia a la colección "items" en la base de datos
        const cleanPayload = cleanUndefined({
            ...data,
            sellerId: auth.currentUser.uid, // Override with secure token id
            status: data.status || 'AVAILABLE',
            quantity: data.quantity ?? 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            searchKeywords: generateKeywords(data.title)
        });
        const docRef = await addDoc(collection(db, "items"), cleanPayload);

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error al publicar:", error);
        return { success: false, error };
    }
};

// Pequeña ayuda para poder buscar "iphone" y encontrar "iPhone 13"
const generateKeywords = (title: string) => {
    return title.toLowerCase().split(' ');
};

// Fetch all available items
export const getItems = async () => {
    try {
        const q = query(
            collection(db, "items"),
            where("status", "==", "AVAILABLE"),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })).filter((item: any) => item.quantity === undefined || item.quantity > 0) as (ItemData & { id: string })[];
    } catch (error) {
        console.error("Error al obtener items:", error);
        return [];
    }
};

// Fetch items by seller ID (sorted in memory to avoid Firestore composite index requirements)
export const getItemsBySeller = async (sellerId: string) => {
    try {
        const q = query(
            collection(db, "items"),
            where("sellerId", "==", sellerId)
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as (ItemData & { id: string })[];
        
        return docs.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || 0;
            return timeB - timeA;
        });
    } catch (error) {
        console.error("Error fetching items by seller:", error);
        return [];
    }
};

// Fetch featured items with smart algorithm (Facebook Marketplace-style)
// Premisas: 1) Urgencia, 2) Geolocalización, 3) Engagement (CTR), 4) Calidad
export const getFeaturedItems = async (userLocation?: string) => {
    try {
        const now = new Date();
        const q = query(
            collection(db, "items"),
            where("isFeatured", "==", true)
        );
        const querySnapshot = await getDocs(q);
        const allFeatured = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as (ItemData & { id: string })))
            // Filtrar estado disponible
            .filter(item => item.status === "AVAILABLE")
            // Filtrar expirados
            .filter(item => !item.featuredUntil || item.featuredUntil.toDate() > now)
            // Filtro de Calidad: al menos 1 imagen
            .filter(item => item.images && item.images.length >= 1)
            // Filtro de Stock
            .filter(item => item.quantity === undefined || item.quantity > 0);

        // Scoring: combinar urgencia + engagement
        const scored = allFeatured.map(item => {
            const expiresAt = item.featuredUntil?.toDate?.() || new Date(Date.now() + 86400000);
            const msLeft = expiresAt.getTime() - now.getTime();
            // Menor tiempo restante = más urgente = score más alto
            const urgencyScore = Math.max(0, 1 - (msLeft / (48 * 3600 * 1000))); // normalizado 0-1
            // Más vistas = más popular
            const engagementScore = Math.min(1, (item.views || 0) / 100); // normalizado 0-1
            // Scoring: combinar urgencia + engagement
            const totalScore = (urgencyScore * 0.2) + (engagementScore * 0.8);
            // Match de ubicación
            const isLocal = userLocation && item.location
                ? item.location.toLowerCase().includes(userLocation.toLowerCase())
                : false;

            return { ...item, _score: totalScore, _isLocal: isLocal };
        });

        // Separar locales y nacionales, cada grupo ordenado por score descendente
        const localItems = scored.filter(i => i._isLocal).sort((a, b) => b._score - a._score);
        const nationalItems = scored.filter(i => !i._isLocal).sort((a, b) => b._score - a._score);

        // Locales primero, luego nacionales
        return [...localItems, ...nationalItems];
    } catch (error) {
        console.error("Error fetching featured items:", error);
        return [];
    }
};

export const getFlashSaleItems = async (userLocation?: string) => {
    try {
        const now = new Date();
        const q = query(
            collection(db, "items"),
            where("isFlashSale", "==", true)
        );
        const querySnapshot = await getDocs(q);
        const allFlash = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as (ItemData & { id: string })))
            .filter(item => item.status === "AVAILABLE")
            .filter(item => !item.flashSaleExpiresAt || item.flashSaleExpiresAt.toDate() > now)
            .filter(item => item.images && item.images.length >= 1)
            .filter(item => item.quantity === undefined || item.quantity > 0);

        const scored = allFlash.map(item => {
            const expiresAt = item.flashSaleExpiresAt?.toDate?.() || new Date(Date.now() + 48 * 3600 * 1000);
            const msLeft = expiresAt.getTime() - now.getTime();
            const urgencyScore = Math.max(0, 1 - (msLeft / (48 * 3600 * 1000)));
            const engagementScore = Math.min(1, (item.views || 0) / 100);
            const totalScore = (urgencyScore * 0.2) + (engagementScore * 0.8);
            const isLocal = userLocation && item.location
                ? item.location.toLowerCase().includes(userLocation.toLowerCase())
                : false;
            return { ...item, _score: totalScore, _isLocal: isLocal };
        });

        const localItems = scored.filter(i => i._isLocal).sort((a, b) => b._score - a._score);
        const nationalItems = scored.filter(i => !i._isLocal).sort((a, b) => b._score - a._score);

        return [...localItems, ...nationalItems];
    } catch (error) {
        console.error("Error fetching flash sale items:", error);
        return [];
    }
};


// Fetch single item by ID
export const getProduct = async (id: string) => {
    try {
        const docRef = doc(db, "items", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as (ItemData & { id: string });
        }
        return null;
    } catch (error) {
        console.error("Error al obtener producto:", error);
        return null;
    }
};

export const updateItem = async (id: string, data: Partial<ItemData>) => {
    try {
        if (!auth.currentUser) {
            throw new Error("UNAUTHORIZED: Debes iniciar sesión para editar.");
        }
        if (data.price !== undefined && data.price <= 0) {
            throw new Error("INVALID_PRICE: El precio debe ser mayor a cero.");
        }

        const docRef = doc(db, "items", id);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
            throw new Error("Item not found");
        }

        const currentData = snap.data() as ItemData;

        // Security check: Only the owner can edit, unless it's an automated status update
        const isOnlyStatusUpdate = Object.keys(data).length === 1 && data.status !== undefined;
        if (currentData.sellerId !== auth.currentUser.uid && !isOnlyStatusUpdate) {
            throw new Error("UNAUTHORIZED: No puedes editar un producto que no es tuyo.");
        }

        // Regla automática: si el precio cambia y el frontend no envió explícitamente un oldPrice, guardamos el anterior.
        // Si el frontend envió un oldPrice (incluso null para borrarlo), respetamos la decisión del usuario.
        if (data.price !== undefined && currentData.price !== data.price) {
            if (data.oldPrice === undefined) {
                data.oldPrice = currentData.price;
            }
        }

        const cleanPayload = cleanUndefined({ ...data });
        await import("firebase/firestore").then(({ updateDoc }) => updateDoc(docRef, cleanPayload));
        return { success: true };
    } catch (error) {
        console.error("Error al actualizar ítem:", error);
        return { success: false, error };
    }
};

export const seedMockData = async (sellerId: string) => {
    const MOCK_ITEMS = [
        {
            title: "MacBook Pro M2 14'",
            price: 1850000,
            description: "Impecable, uso de oficina. Batería al 98%. Incluye cargador original y funda.",
            category: "Tecnología y Accesorios",
            subcategory: "Laptops",
            condition: "like_new",
            images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80"],
            shippingAvailable: true,
            status: "AVAILABLE"
        },
        {
            title: "Silla de Oficina Ergonómica",
            price: 85000,
            description: "Silla mesh respirable, apoyo lumbar ajustable. Súper cómoda para trabajo remoto.",
            category: "Espacios Habitables",
            subcategory: "Muebles de Oficina",
            condition: "used",
            images: ["https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800&q=80"],
            shippingAvailable: false,
            status: "AVAILABLE"
        },
        {
            title: "iPhone 13 Pro Max 256GB",
            price: 950000,
            description: "Color grafito. Libre de fábrica. Pantalla impecable con templado.",
            category: "Tecnología y Accesorios",
            subcategory: "Celulares",
            condition: "used",
            images: ["https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800&q=80"],
            shippingAvailable: true,
            status: "AVAILABLE"
        },
        {
            title: "Set de Herramientas Bosch",
            price: 125000,
            description: "Taladro percutor + 40 accesorios. Ideal para emprendedores o taller en casa.",
            category: "Accesorios Artesanales",
            subcategory: "Herramientas",
            condition: "new",
            images: ["https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80"],
            shippingAvailable: true,
            status: "AVAILABLE"
        },
        {
            title: "Zapatillas Nike Air Max",
            price: 110000,
            description: "Talle 42. Casi nuevas, las usé 2 veces pero me van chicas.",
            category: "Ropa y Moda",
            subcategory: "Calzado",
            condition: "like_new",
            images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"],
            shippingAvailable: true,
            status: "AVAILABLE"
        },
        {
            title: "Auriculares Sony WH-1000XM4",
            price: 280000,
            description: "Cancelación de ruido líder en el mercado. En caja original.",
            category: "Tecnología y Accesorios",
            subcategory: "Audio",
            condition: "used",
            images: ["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80"],
            shippingAvailable: true,
            status: "AVAILABLE"
        },
        {
            title: "Campera de Cuero Vintage",
            price: 75000,
            description: "Auténtico cuero vacuno. Estilo motero. Talle L.",
            category: "Ropa y Moda",
            subcategory: "Abrigos",
            condition: "good",
            images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80"],
            shippingAvailable: true,
            status: "AVAILABLE"
        },
        {
            title: "Mesa Ratona de Roble",
            price: 65000,
            description: "Madera maciza, diseño nórdico. Medidas 100x50x45cm.",
            category: "Espacios Habitables",
            subcategory: "Muebles",
            condition: "new",
            images: ["https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800&q=80"],
            shippingAvailable: false,
            status: "AVAILABLE"
        }
    ];

    try {
        const itemsCol = collection(db, "items");
        for (const item of MOCK_ITEMS) {
            await addDoc(itemsCol, {
                ...item,
                sellerId,
                sellerName: "Usuario de Prueba",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                views: Math.floor(Math.random() * 500),
                isFeatured: Math.random() > 0.5
            });
        }
        return { success: true };
    } catch (error) {
        console.error("Error seeding mock data:", error);
        return { success: false, error };
    }
};

// Delete an item (or mark as deleted)
export const deleteItem = async (id: string) => {
    try {
        const docRef = doc(db, "items", id);
        await import("firebase/firestore").then(({ deleteDoc }) => deleteDoc(docRef));
        return { success: true };
    } catch (error) {
        console.error("Error deleting item:", error);
        return { success: false, error };
    }
};

// Subscribe to a product for real-time updates (deletion/changes)
export const subscribeToProduct = (id: string, callback: (item: (ItemData & { id: string }) | null) => void) => {
    const docRef = doc(db, "items", id);
    return import("firebase/firestore").then(({ onSnapshot }) => {
        return onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                callback({ id: doc.id, ...doc.data() } as (ItemData & { id: string }));
            } else {
                callback(null);
            }
        });
    });
};

// Toggle featured status for an item
export const toggleFeaturedItem = async (id: string, currentlyFeatured: boolean) => {
    try {
        const docRef = doc(db, "items", id);
        const featuredUntil = !currentlyFeatured ? new Date(Date.now() + 12 * 60 * 60 * 1000) : null;
        const featuredFeeApplied = !currentlyFeatured ? 0.10 : null; // 10% fee

        await import("firebase/firestore").then(({ updateDoc }) => updateDoc(docRef, {
            isFeatured: !currentlyFeatured,
            featuredUntil: featuredUntil,
            featuredFeeApplied: featuredFeeApplied
        }));

        return { success: true, isFeatured: !currentlyFeatured };
    } catch (error) {
        console.error("Error toggling featured status:", error);
        return { success: false, error };
    }
};

/**
 * Fetch smart suggestions for the user based on behavior
 */
export const getSmartSuggestions = async (uid: string, limitCount: number = 8): Promise<(ItemData & { id: string })[]> => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return [];

        const userData = userSnap.data();
        const searches = userData.recentSearches || [];
        const viewedCats = userData.viewedCategories || [];
        const viewedProducts = userData.viewedProducts || [];

        // Final interest list (union of searches and viewed categories)
        const interests = [...new Set([...searches, ...viewedCats])].slice(-5);

        if (interests.length === 0) return [];

        // Pick a random interest for variety
        const randomInterest = interests[Math.floor(Math.random() * interests.length)];

        const q = query(
            collection(db, "items"),
            where("category", "==", randomInterest),
            where("status", "==", "AVAILABLE"),
            limit(limitCount + viewedProducts.length) // Fetch more to allow for filtering
        );

        const snapshot = await getDocs(q);
        const items = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as (ItemData & { id: string })))
            .filter(item => !viewedProducts.includes(item.id))
            .slice(0, limitCount);

        return items;
    } catch (error) {
        console.error("Error fetching smart suggestions:", error);
        return [];
    }
};

/**
 * Fetch top trending items by views
 */
export const getTrendingItems = async (limitCount: number = 3): Promise<(ItemData & { id: string })[]> => {
    try {
        const itemsRef = collection(db, "items");
        const q = query(
            itemsRef,
            where("status", "==", "AVAILABLE"),
            orderBy("views", "desc"),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItemData & { id: string }));
    } catch (error) {
        console.error("Error fetching trending items:", error);
        return [];
    }
};
