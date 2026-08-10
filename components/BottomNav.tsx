import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../lib/auth';

export const BottomNav = () => {
    const location = useLocation();
    const { cart } = useCart();
    const { user, userProfile } = useAuth();

    const getFirstName = () => {
        if (!user) return 'Perfil';
        const name = userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'Perfil';
        return name.split(' ')[0];
    };

    const getAvatar = () => {
        if (!user) return 'person';
        return user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(getFirstName())}&background=random`;
    };

    const navItems = [
        { path: '/', icon: 'home', label: 'Inicio' },
        { path: '/search', icon: 'search', label: 'Buscar' },
        { path: '/publish', icon: 'add', label: 'Publicar', isPrimary: true },
        { path: '/dashboard', icon: 'notifications', label: 'Avisos' }, 
        { path: '/dashboard', icon: getAvatar(), label: getFirstName(), isAvatar: !!user },
    ];

    if (location.pathname.startsWith('/product/')) {
        return null;
    }

    return (
        <div className="md:hidden fixed bottom-0 left-0 w-full z-[100] bg-surface/90 backdrop-blur-xl border-t border-outline-variant/30 pb-safe">
            <div className="flex justify-between items-end px-2 pt-2 pb-1 relative">
                {navItems.map((item, idx) => {
                    // Only active if exactly matching path, and handles the duplicate /dashboard issue by checking index or just keeping default behavior
                    const isActive = location.pathname === item.path;
                    
                    if (item.isPrimary) {
                        return (
                            <Link 
                                key={`nav-${idx}`} 
                                to={item.path}
                                className="flex-[1.2] flex flex-col items-center justify-end pb-2 relative z-10"
                            >
                                <div className="absolute bottom-6 bg-primary text-on-primary size-16 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-[6px] border-surface transform transition-transform active:scale-95">
                                    <span className="material-symbols-outlined text-4xl font-light">{item.icon}</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary mt-12">{item.label}</span>
                            </Link>
                        );
                    }

                    return (
                        <Link 
                            key={`nav-${idx}`} 
                            to={item.path}
                            onClick={(e) => {
                                if (item.path === '/' && window.location.pathname === '/') {
                                    window.dispatchEvent(new Event('reset-home-filters'));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            }}
                            className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}
                        >
                            <div className="relative mb-1">
                                {item.isAvatar ? (
                                    <img 
                                        src={item.icon} 
                                        alt={item.label} 
                                        className={`size-6 rounded-full object-cover border-[1.5px] ${isActive ? 'border-primary' : 'border-transparent'}`} 
                                    />
                                ) : (
                                    <span className={`material-symbols-outlined text-2xl ${isActive ? 'font-black' : ''}`}>
                                        {item.icon}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[9px] font-bold truncate max-w-full px-1 ${isActive ? 'font-black' : ''}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
