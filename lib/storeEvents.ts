import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getCookieConsent } from '../components/CookieConsentBanner';

export type AnalyticsEventType = 'page_view' | 'add_to_cart' | 'checkout_start' | 'purchase';

interface EventData {
    productId?: string;
    productTitle?: string;
    [key: string]: any;
}

const getVisitorId = async () => {
    if (typeof window === 'undefined') return 'unknown';
    
    let vid = sessionStorage.getItem('visitor_ip_hash');
    if (vid) return vid;

    try {
        const response = await fetch('https://api.ipify.org?format=json').catch(() => null);
        if (response && response.ok) {
            const data = await response.json();
            vid = 'ip_' + data.ip.replace(/\./g, '_').replace(/:/g, '_'); 
            sessionStorage.setItem('visitor_ip_hash', vid);
            return vid;
        }
        throw new Error('ipify unavailable');
    } catch {
        let fallback = localStorage.getItem('visitor_id');
        if (!fallback) {
            fallback = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            localStorage.setItem('visitor_id', fallback);
        }
        return fallback;
    }
};

const getReferrerSource = () => {
    if (typeof window === 'undefined') return 'Directo';
    const ref = document.referrer.toLowerCase();
    if (!ref) return 'Directo';
    if (ref.includes('google.com') || ref.includes('google.com.ar')) return 'Google (Orgǭnico)';
    if (ref.includes('instagram.com')) return 'Instagram';
    if (ref.includes('facebook.com')) return 'Facebook';
    if (ref.includes('tiktok.com')) return 'TikTok';
    return 'Referral';
};

export const trackEvent = async (storeId: string, eventType: AnalyticsEventType, eventData?: EventData) => {
    try {
        if (!storeId) return;

        // Respect the user's choice in the cookie banner:
        // if they chose "only essentials", do not track analytics events.
        if (getCookieConsent() !== 'all') return;
        
        
        const visitorId = await getVisitorId();
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
