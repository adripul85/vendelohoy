import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotification } from './NotificationContext';
import { trackEvent } from '../lib/analytics';

export interface CartItem {
    id: string;
    title: string;
    price: number;
    image: string;
    sellerId: string;
    sellerName: string;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
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

    const addToCart = (item: CartItem) => {
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
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
