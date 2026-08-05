import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export const COOKIE_CONSENT_KEY = 'cookie_consent';
export type CookieConsentValue = 'all' | 'essential';

export const getCookieConsent = (): CookieConsentValue | null => {
    if (typeof window === 'undefined') return null;
    const value = localStorage.getItem(COOKIE_CONSENT_KEY);
    return value === 'all' || value === 'essential' ? value : null;
};

const CookieConsentBanner = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Solo se muestra si el usuario todavía no eligió una opción.
        if (!getCookieConsent()) {
            setVisible(true);
        }
    }, []);

    const handleChoice = (value: CookieConsentValue) => {
        localStorage.setItem(COOKIE_CONSENT_KEY, value);
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6">
            <div className="max-w-3xl mx-auto bg-dark-800 text-white rounded-[28px] shadow-premium-lg border border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="flex-1">
                    <h2 className="text-sm font-black uppercase tracking-widest text-white mb-2">
                        Tu privacidad
                    </h2>
                    <p className="text-sm text-gray-300 leading-relaxed">
                        Usamos almacenamiento esencial para que el sitio funcione (sesión, carrito) y, si lo aceptás, analítica propia para entender el uso de la plataforma. No compartimos esta información con redes de publicidad de terceros.{' '}
                        <Link to="/legal/cookies" className="underline font-bold text-white hover:text-primary-300">
                            Más información
                        </Link>
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
                    <button
                        onClick={() => handleChoice('essential')}
                        className="w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        Solo esenciales
                    </button>
                    <button
                        onClick={() => handleChoice('all')}
                        className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                    >
                        Aceptar todo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsentBanner;
