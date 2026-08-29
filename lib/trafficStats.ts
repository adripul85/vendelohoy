import { doc, setDoc, getDoc, getDocs, collection, query, where, orderBy, limit, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getCookieConsent } from '../components/CookieConsentBanner';

// ─── Visitor ID (anónimo, persistente en localStorage) ──────────────────────
const getVisitorId = (): string => {
    if (typeof window === 'undefined') return 'ssr';
    let vid = localStorage.getItem('sa_visitor_id');
    if (!vid) {
        vid = 'v_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        localStorage.setItem('sa_visitor_id', vid);
    }
    return vid;
};

// ─── Detect traffic source from document.referrer ───────────────────────────
const detectSource = (): string => {
    if (typeof window === 'undefined') return 'Directo';
    const ref = document.referrer.toLowerCase();
    if (!ref) return 'Directo';
    if (ref.includes('google.com')) return 'Google';
    if (ref.includes('instagram.com')) return 'Instagram';
    if (ref.includes('facebook.com')) return 'Facebook';
    if (ref.includes('tiktok.com')) return 'TikTok';
    if (ref.includes('whatsapp.com') || ref.includes('wa.me')) return 'WhatsApp';
    if (ref.includes('twitter.com') || ref.includes('x.com')) return 'Twitter/X';
    if (ref.includes('youtube.com')) return 'YouTube';
    if (ref.includes(window.location.hostname)) return 'Interno';
    return 'Referral';
};

// ─── Detect device type from user agent ─────────────────────────────────────
const detectDevice = (): string => {
    if (typeof window === 'undefined') return 'desktop';
    const ua = navigator.userAgent.toLowerCase();
    if (/ipad|tablet|playbook|silk|(android(?!.*mobi))/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android.*mobi|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
};

// ─── Format date as YYYY-MM-DD ──────────────────────────────────────────────
const getTodayKey = (): string => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// ─── Sanitize path for Firestore map key (dots not allowed) ─────────────────
const sanitizePath = (path: string): string => {
    // Normalize product/shop detail routes to reduce cardinality
    let clean = path.replace(/\/product\/[^/]+/, '/product/__id__');
    clean = clean.replace(/\/shop\/[^/]+/, '/shop/__slug__');
    clean = clean.replace(/\/transaction\/[^/]+/, '/transaction/__id__');
    clean = clean.replace(/\/messages\/[^/]+/, '/messages/__id__');
    clean = clean.replace(/\/profile\/[^/]+/, '/profile/__uid__');
    // Replace dots with underscores (Firestore map key restriction)
    clean = clean.replace(/\./g, '_');
    return clean || '/';
};

// ─── Debounce: avoid duplicate tracking on rapid navigations ────────────────
let lastTrackedPath = '';
let lastTrackedTime = 0;

// ─── Main tracking function ─────────────────────────────────────────────────
export const trackPageView = async (path: string, userId?: string): Promise<void> => {
    try {
        // Respect cookie consent
        if (getCookieConsent() !== 'all') return;

        // Debounce: skip if same path within 1 second
        const now = Date.now();
        if (path === lastTrackedPath && now - lastTrackedTime < 1000) return;
        lastTrackedPath = path;
        lastTrackedTime = now;

        const dateKey = getTodayKey();
        const visitorId = getVisitorId();
        const source = detectSource();
        const device = detectDevice();
        const hour = String(new Date().getHours());
        const sanitizedPath = sanitizePath(path);

        // 1. Update daily aggregate document (atomic increments)
        const dailyRef = doc(db, 'site_analytics', dateKey);
        await setDoc(dailyRef, {
            totalViews: increment(1),
            [`pages.${sanitizedPath}`]: increment(1),
            [`sources.${source}`]: increment(1),
            [`devices.${device}`]: increment(1),
            [`hourly.${hour}`]: increment(1),
            lastUpdated: serverTimestamp(),
        }, { merge: true });

        // 2. Track unique visitor (one doc per visitor per day)
        const visitorRef = doc(db, 'site_analytics', dateKey, 'visitors', visitorId);
        const visitorSnap = await getDoc(visitorRef);
        if (!visitorSnap.exists()) {
            await setDoc(visitorRef, {
                firstSeen: serverTimestamp(),
                lastSeen: serverTimestamp(),
                userId: userId || null,
                pageCount: 1,
                device,
                source,
            });
            // Increment unique visitor counter
            await setDoc(dailyRef, { uniqueVisitors: increment(1) }, { merge: true });
        } else {
            await setDoc(visitorRef, {
                lastSeen: serverTimestamp(),
                pageCount: increment(1),
                userId: userId || visitorSnap.data()?.userId || null,
            }, { merge: true });
        }
    } catch (error) {
        // Silent fail — analytics should never break the app
        console.warn('[SiteAnalytics] trackPageView error:', error);
    }
};

// ─── Admin: Read analytics data ─────────────────────────────────────────────

export interface DailyAnalytics {
    date: string;
    totalViews: number;
    uniqueVisitors: number;
    pages: Record<string, number>;
    sources: Record<string, number>;
    devices: Record<string, number>;
    hourly: Record<string, number>;
}

/** Fetch analytics for a single day */
export const fetchDailyAnalytics = async (dateKey: string): Promise<DailyAnalytics | null> => {
    try {
        const docRef = doc(db, 'site_analytics', dateKey);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        const data = snap.data();

        // Count unique visitors from subcollection
        const visitorsSnap = await getDocs(collection(db, 'site_analytics', dateKey, 'visitors'));
        const uniqueVisitors = data.uniqueVisitors || visitorsSnap.size;

        return {
            date: dateKey,
            totalViews: data.totalViews || 0,
            uniqueVisitors,
            pages: data.pages || {},
            sources: data.sources || {},
            devices: data.devices || {},
            hourly: data.hourly || {},
        };
    } catch (error) {
        return null;
    }
};

/** Fetch analytics for a range of days (last N days) */
export const fetchAnalyticsRange = async (days: number = 30): Promise<DailyAnalytics[]> => {
    const results: DailyAnalytics[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${day}`;

        const data = await fetchDailyAnalytics(key);
        if (data) {
            results.push(data);
        } else {
            // Fill empty days with zeros for smooth charts
            results.push({
                date: key,
                totalViews: 0,
                uniqueVisitors: 0,
                pages: {},
                sources: {},
                devices: {},
                hourly: {},
            });
        }
    }

    return results.reverse(); // Chronological order (oldest first)
};

/** Get count of users active in the last 5 minutes */
export const getOnlineUsersCount = async (): Promise<number> => {
    try {
        const d = new Date();
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const visitorsRef = collection(db, 'site_analytics', key, 'visitors');
        const q = query(visitorsRef, where('lastSeen', '>=', fiveMinutesAgo));
        const snap = await getDocs(q);
        return snap.size;
    } catch (e) {
        return 0;
    }
};
