import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDocs, 
    getDoc, 
    query, 
    where, 
    orderBy, 
    Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// --- Hero Slider ---
export interface HeroSlide {
    id?: string;
    badge: string;
    title: string;
    description: string;
    image: string;
    bgColor: string;
    accentColor: string;
    btnText: string;
    btnLink: string;
    active: boolean;
    order: number;
}

export const getHeroSlides = async () => {
    try {
        const q = query(collection(db, 'marketing_hero'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as HeroSlide));
    } catch (e) {
        console.error('Error fetching hero slides:', e);
        return [];
    }
};

export const upsertHeroSlide = async (slide: HeroSlide) => {
    const { id, ...data } = slide;
    Object.keys(data).forEach(key => (data as any)[key] === undefined && delete (data as any)[key]);
    if (id) {
        await updateDoc(doc(db, 'marketing_hero', id), data as any);
        return id;
    } else {
        const res = await addDoc(collection(db, 'marketing_hero'), data);
        return res.id;
    }
};

export const deleteHeroSlide = async (id: string) => {
    await deleteDoc(doc(db, 'marketing_hero', id));
};

// --- Coupons ---
export interface Coupon {
    id?: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minAmount: number;
    limit: number;
    used: number;
    expiryDate: any;
    active: boolean;
    createdAt?: any;
}

export const getCoupons = async () => {
    const snap = await getDocs(collection(db, 'coupons'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon));
};

export const validateCoupon = async (code: string, currentTotal: number) => {
    const q = query(collection(db, 'coupons'), where('code', '==', code.toUpperCase()), where('active', '==', true));
    const snap = await getDocs(q);
    
    if (snap.empty) return { success: false, error: 'Cupón no válido o inexistente.' };
    
    const coupon = { id: snap.docs[0].id, ...snap.docs[0].data() } as Coupon;
    
    // Checks
    if (coupon.expiryDate && coupon.expiryDate.toDate() < new Date()) {
        return { success: false, error: 'Este cupón ha expirado.' };
    }
    if (coupon.limit > 0 && coupon.used >= coupon.limit) {
        return { success: false, error: 'Este cupón ha alcanzado su límite de usos.' };
    }
    if (currentTotal < coupon.minAmount) {
        return { success: false, error: `Compra mínima requerida: $${coupon.minAmount.toLocaleString()}` };
    }
    
    let discount = 0;
    if (coupon.type === 'percentage') {
        discount = Math.round(currentTotal * (coupon.value / 100));
    } else {
        discount = coupon.value;
    }
    
    return { success: true, discount, couponId: coupon.id, couponCode: coupon.code };
};

// --- Broadcast Announcements ---
export interface Broadcast {
    id: string; // global
    message: string;
    active: boolean;
    type: 'info' | 'promo' | 'warning';
    btnText?: string;
    btnLink?: string;
}

export const getGlobalBroadcast = async () => {
    const d = await getDoc(doc(db, 'platform', 'broadcast'));
    if (d.exists()) return { id: d.id, ...d.data() } as Broadcast;
    return null;
};

export const updateGlobalBroadcast = async (data: Partial<Broadcast>) => {
    const cleanData = { ...data };
    Object.keys(cleanData).forEach(key => (cleanData as any)[key] === undefined && delete (cleanData as any)[key]);
    await updateDoc(doc(db, 'platform', 'broadcast'), cleanData as any);
};

// --- Category Banners ---
export interface CategoryBanner {
    id?: string;
    categoryId: string;
    image: string;
    title: string;
    active: boolean;
}

export const getCategoryBanners = async () => {
    const snap = await getDocs(collection(db, 'category_banners'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryBanner));
};

export const upsertCategoryBanner = async (banner: CategoryBanner) => {
    const { id, ...data } = banner;
    Object.keys(data).forEach(key => (data as any)[key] === undefined && delete (data as any)[key]);
    if (id) {
        await updateDoc(doc(db, 'category_banners', id), data as any);
    } else {
        await addDoc(collection(db, 'category_banners'), data);
    }
};

// --- Coupon Tracking ---
export const incrementCouponUsage = async (couponId: string) => {
    try {
        const couponRef = doc(db, 'coupons', couponId);
        const snap = await getDoc(couponRef);
        if (snap.exists()) {
            const data = snap.data() as Coupon;
            await updateDoc(couponRef, {
                used: (data.used || 0) + 1
            });
            return true;
        }
        return false;
    } catch (e) {
        console.error('Error incrementing coupon usage:', e);
        return false;
    }
};

// --- Platform Notifications ---
export interface MarketingNotification {
    id?: string;
    title: string;
    message: string;
    icon: string;
    type: 'promo' | 'alert' | 'event';
    active: boolean;
    createdAt: any;
    link?: string;
}

export const getMarketingNotifications = async () => {
    const q = query(collection(db, 'marketing_notifications'), where('active', '==', true), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketingNotification));
};

export const upsertMarketingNotification = async (notif: MarketingNotification) => {
    const { id, ...data } = notif;
    Object.keys(data).forEach(key => (data as any)[key] === undefined && delete (data as any)[key]);
    if (id) {
        await updateDoc(doc(db, 'marketing_notifications', id), data as any);
    } else {
        await addDoc(collection(db, 'marketing_notifications'), {
            ...data,
            createdAt: Timestamp.now()
        });
    }
};

export const deleteMarketingNotification = async (id: string) => {
    await deleteDoc(doc(db, 'marketing_notifications', id));
};

// --- Seasonal Collections ---
export interface SeasonalCollection {
    id?: string;
    title: string;
    subtitle?: string;
    image?: string;
    link: string;
    size: 'large' | 'small' | 'banner'; // 'large' = left 2x2 card, 'small' = 1x1 card, 'banner' = bottom wide card
    bgColor?: string; // For solid colored banners like Ofertas Relámpago
    icon?: string; // For icons like local_fire_department
    active: boolean;
    order: number;
}

export const getSeasonalCollections = async () => {
    try {
        const q = query(collection(db, 'marketing_collections'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SeasonalCollection));
    } catch (e) {
        console.error('Error fetching seasonal collections:', e);
        return [];
    }
};

export const upsertSeasonalCollection = async (item: SeasonalCollection) => {
    const { id, ...data } = item;
    Object.keys(data).forEach(key => (data as any)[key] === undefined && delete (data as any)[key]);
    if (id) {
        await updateDoc(doc(db, 'marketing_collections', id), data as any);
        return id;
    } else {
        const res = await addDoc(collection(db, 'marketing_collections'), data);
        return res.id;
    }
};

export const deleteSeasonalCollection = async (id: string) => {
    await deleteDoc(doc(db, 'marketing_collections', id));
};
