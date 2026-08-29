import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { trackPageView } from '../lib/trafficStats';

/**
 * Invisible component that tracks page views on every route change.
 * Mount inside <BrowserRouter> in App.tsx.
 */
const NavigationObserver = () => {
    const { pathname } = useLocation();
    const { user } = useAuth();
    const prevPathRef = useRef<string>('');

    useEffect(() => {
        // Avoid tracking the same path twice on mount
        if (pathname === prevPathRef.current) return;
        prevPathRef.current = pathname;

        trackPageView(pathname, user?.uid);
    }, [pathname, user?.uid]);

    return null;
};

export default NavigationObserver;
