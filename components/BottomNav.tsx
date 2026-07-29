import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export const BottomNav = () => {
    const location = useLocation();
    const { cart } = useCart();

    const navItems = [
        { path: '/', icon: 'home', label: 'Inicio' },
        { path: '/favorites', icon: 'favorite', label: 'Favoritos' },
        { path: '/publish', icon: 'add_circle', label: 'Vender', isPrimary: true },
        { path: '/cart', icon: 'shopping_cart', label: 'Carrito', badge: cart.length },
        { path: '/dashboard', icon: 'person', label: 'Mi Perfil' },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 w-full z-[100] bg-surface/90 backdrop-blur-xl border-t border-outline-variant/30 pb-safe">
            <div className="flex justify-between items-end px-2 pt-2 pb-1 relative">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    
                    if (item.isPrimary) {
                        return (
                            <Link 
                                key={item.path} 
                                to={item.path}
                                className="flex-1 flex flex-col items-center justify-center -translate-y-4"
                            >
                                <div className="bg-primary text-on-primary size-14 rounded-full flex items-center justify-center shadow-premium border-4 border-surface transform transition-transform active:scale-95">
                                    <span className="material-symbols-outlined text-3xl font-black">{item.icon}</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">{item.label}</span>
                            </Link>
                        );
                    }

                    return (
                        <Link 
                            key={item.path} 
                            to={item.path}
                            className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}
                        >
                            <div className="relative mb-1">
                                <span className={`material-symbols-outlined text-2xl ${isActive ? 'font-black' : ''}`}>
                                    {item.icon}
                                </span>
                                {item.badge && item.badge > 0 ? (
                                    <span className="absolute -top-1 -right-2 bg-error text-on-error size-4 rounded-full text-[9px] font-black flex items-center justify-center">
                                        {item.badge}
                                    </span>
                                ) : null}
                            </div>
                            <span className={`text-[9px] font-bold ${isActive ? 'font-black' : ''}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
