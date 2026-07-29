import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type AnalyticsEventType = 'page_view' | 'add_to_cart' | 'checkout_start' | 'purchase';

interface EventData {
    productId?: string;
    productTitle?: string;
    [key: string]: any;
}

const getVisitorId = () => {
    if (typeof window === 'undefined') return 'unknown';
    let vid = localStorage.getItem('visitor_id');
    if (!vid) {
        vid = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('visitor_id', vid);
    }
    return vid;
};

const getReferrerSource = () => {
    if (typeof window === 'undefined') return 'Directo';
    const ref = document.referrer.toLowerCase();
    if (!ref) return 'Directo';
    if (ref.includes('google.com') || ref.includes('google.com.ar')) return 'Google (Orgánico)';
    if (ref.includes('instagram.com')) return 'Instagram';
    if (ref.includes('facebook.com')) return 'Facebook';
    if (ref.includes('tiktok.com')) return 'TikTok';
    return 'Referral';
};

export const trackEvent = async (storeId: string, eventType: AnalyticsEventType, eventData?: EventData) => {
    try {
        if (!storeId) return;
        
        const visitorId = getVisitorId();
        const source = getReferrerSource();
        
        await addDoc(collection(db, 'store_events'), {
            storeId,
            type: eventType,
            visitorId,
            source,
            timestamp: serverTimestamp(),
            ...eventData
        });
    } catch (error) {
        console.error("Failed to track event:", error);
    }
};
