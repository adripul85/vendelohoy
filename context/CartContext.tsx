import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNotification } from './NotificationContext';
import { trackEvent } from '../lib/storeEvents';
import { triggerHaptic } from '../lib/haptics';
import { FlyingCartOverlay, FlyingItemPayload } from '../components/cart/FlyingCartOverlay';

export interface CartItem {
    id: string;
    title: string;
    price: number;
    image: string;
    sellerId: string;
    sellerName: string;
    quantity?: number;
    selectedColor?: string | null;
    selectedSize?: string | null;
}

export type FlyOrigin = React.MouseEvent | HTMLElement | { x: number; y: number } | null | undefined;

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: CartItem, origin?: FlyOrigin) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    total: number;
    isCartBouncing: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [flyingItems, setFlyingItems] = useState<FlyingItemPayload[]>([]);
    const [isCartBouncing, setIsCartBouncing] = useState(false);
    const { notify } = useNotification();

    // Load cart from localStorage on init
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Error parsing cart from storage", e);
            }
        }
    }, []);

    // Sync with localStorage
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const removeFlyingItem = useCallback((id: string) => {
        setFlyingItems(prev => prev.filter(item => item.id !== id));
        // Impact landing feedback
        setIsCartBouncing(true);
        triggerHaptic('light');
        setTimeout(() => setIsCartBouncing(false), 600);
    }, []);

    const triggerFlyAnimation = (image: string, origin?: FlyOrigin) => {
        if (typeof window === 'undefined') return;

        // 1. Calculate Start Coordinates
        let startX = window.innerWidth / 2;
        let startY = window.innerHeight / 2;

        if (origin) {
            if ('clientX' in origin && 'clientY' in origin) {
                // MouseEvent / TouchEvent
                startX = origin.clientX;
                startY = origin.clientY;
            } else if ('getBoundingClientRect' in origin) {
                // HTMLElement
                const rect = origin.getBoundingClientRect();
                startX = rect.left + rect.width / 2;
                startY = rect.top + rect.height / 2;
            } else if ('x' in origin && 'y' in origin) {
                startX = origin.x;
                startY = origin.y;
            }
        }

        // 2. Find Target Cart Icon (Desktop or Mobile)
        const desktopCartBtn = document.getElementById('header-cart-btn');
        const mobileCartBtn = document.getElementById('mobile-header-cart-btn');

        let targetX = window.innerWidth - 60;
        let targetY = 32;

        const activeTarget = (desktopCartBtn && desktopCartBtn.offsetParent !== null)
            ? desktopCartBtn
            : (mobileCartBtn && mobileCartBtn.offsetParent !== null)
                ? mobileCartBtn
                : null;

        if (activeTarget) {
            const targetRect = activeTarget.getBoundingClientRect();
            targetX = targetRect.left + targetRect.width / 2;
            targetY = targetRect.top + targetRect.height / 2;
        }

        const newFlyId = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        setFlyingItems(prev => [
            ...prev,
            {
                id: newFlyId,
                image: image || '',
                startX,
                startY,
                targetX,
                targetY
            }
        ]);

        triggerHaptic('medium');
    };

    const addToCart = (item: CartItem, origin?: FlyOrigin) => {
        let alreadyInCart = false;

        setCart(prev => {
            if (prev.find(i => i.id === item.id)) {
                alreadyInCart = true;
                return prev;
            }
            return [...prev, item];
        });

        if (alreadyInCart) {
            notify({
                type: 'info',
                title: 'Ya en el carrito',
                message: 'Este producto ya está en tu lista.',
                icon: 'shopping_cart'
            });
        } else {
            // Trigger the flying animation
            triggerFlyAnimation(item.image, origin);

            // Track add_to_cart event
            trackEvent(item.sellerId, 'add_to_cart', { productId: item.id, productTitle: item.title });
            
            notify({
                type: 'success',
                title: 'Agregado al Carrito',
                message: `${item.title} se añadió correctamente.`,
                icon: 'add_shopping_cart'
            });
        }
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(item => item.id !== itemId));
        notify({
            type: 'info',
            title: 'Eliminado',
            message: 'Producto quitado del carrito.',
            icon: 'delete'
        });
    };

    const clearCart = () => {
        setCart([]);
    };

    const total = cart.reduce((sum, item) => sum + item.price, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total, isCartBouncing }}>
            {children}
            <FlyingCartOverlay items={flyingItems} onComplete={removeFlyingItem} />
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        return {
            cart: [],
            addToCart: () => {},
            removeFromCart: () => {},
            clearCart: () => {},
            total: 0,
            isCartBouncing: false,
        };
    }
    return context;
};
