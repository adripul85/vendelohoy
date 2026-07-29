import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ItemData } from '../lib/items';
import CountdownTimer from './product/CountdownTimer';
import { triggerHaptic } from '../lib/haptics';
import SellerBadge from './seller/SellerBadge';
import { getUserProfile, UserProfile } from '../lib/users';
import { useCart } from '../context/CartContext';
import { useAuth } from '../lib/auth';
import { useNotification } from '../context/NotificationContext';
import { FavoriteButton } from './FavoriteButton';
interface ProductCardProps {
    product: ItemData & { id: string };
    location?: string;
    isVerified?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, location, isVerified }) => {

    const [sellerProfile, setSellerProfile] = React.useState<UserProfile | null>(null);
    const { addToCart } = useCart();
    const { user } = useAuth();
    const { notify } = useNotification();

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (user && (product.sellerId === user.uid || product.seller?.id === user.uid)) {
            notify({ type: 'error', title: 'Operación inválida', message: 'No podés agregar tu propio producto al carrito.', icon: 'block' });
            return;
        }
        triggerHaptic('medium');
        addToCart({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.images?.[0] || '',
            sellerId: product.seller?.id || product.sellerId || '',
            sellerName: product.seller?.displayName || product.seller?.name || 'Vendedor'
        });
    };

    React.useEffect(() => {
        if (product.sellerId) {
            getUserProfile(product.sellerId).then(setSellerProfile);
        }
    }, [product.sellerId]);

    // Calcular tiempo transcurrido
    const getRelativeTime = (timestamp: any) => {
        if (!timestamp) return 'Recién';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Recién';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
        const days = Math.floor(diffInSeconds / 86400);
        return days === 1 ? 'Hace 1 día' : `Hace ${days} días`;
    };

    const isSold = product.status === 'SOLD' || (product.quantity !== undefined && product.quantity <= 0);

    return (
        <motion.div
            whileHover={isSold ? {} : { y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`group bg-surface-container-lowest rounded-2xl shadow-premium hover:shadow-2xl transition-all flex flex-col h-full w-full relative overflow-hidden ${isSold ? 'opacity-60 grayscale-[0.3]' : ''}`}
        >
            <Link
                to={`/product/${product.id}`}
                onClick={() => !isSold && triggerHaptic('light')}
                className={`flex flex-col h-full ${isSold ? 'cursor-default' : ''}`}
                onPointerDown={(e) => isSold && e.preventDefault()}
            >
                {/* Image Container: Square aspect ratio makes product photos larger and fuller */}
                <div className="aspect-square bg-surface-container-low relative overflow-hidden">
                    <img
                        src={product.images?.[0] || 'https://picsum.photos/400/400?tech'}
                        alt={product.title}
                        className={`w-full h-full object-cover transition-transform duration-1000 ease-out ${!isSold && 'group-hover:scale-110'}`}
                    />

                    {/* Favorite Button */}
                    <div className="absolute top-4 right-4 z-20">
                        <FavoriteButton product={{
                            id: product.id,
                            title: product.title,
                            price: product.price,
                            image: product.images?.[0] || '',
                            sellerName: product.seller?.displayName || product.seller?.name || 'Vendedor'
                        }} />
                    </div>

                    {/* High-End Badges */}
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 items-start pointer-events-none">
                        {product.condition === 'new' && (
                            <span className="bg-secondary-container text-on-surface px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-xl">
                                Nuevo
                            </span>
                        )}
                        {!isSold && product.oldPrice && product.oldPrice > product.price && (
                            <div className="bg-tertiary-container text-white px-3 py-1 rounded-md font-black text-[9px] shadow-xl flex items-center gap-1">
                                -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                            </div>
                        )}
                    </div>

                    {/* Quick Add To Cart (High Energy CTA) */}
                    {!isSold && (
                        <button 
                            onClick={handleAddToCart}
                            className="absolute bottom-4 right-4 size-12 bg-secondary-container text-on-surface rounded-xl shadow-2xl flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-20 hover:scale-110"
                        >
                            <span className="material-symbols-outlined text-2xl font-black">add_shopping_cart</span>
                        </button>
                    )}
                </div>

                <div className="p-4 sm:p-5 flex flex-col flex-1 space-y-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary/30 uppercase tracking-[0.3em] mb-1">
                            {product.category || 'Selección'}
                        </span>
                        <h3 className={`text-sm font-black font-display line-clamp-1 transition-colors leading-tight ${isSold ? 'text-primary/20' : 'text-primary'}`}>
                            {product.title}
                        </h3>
                    </div>

                    <div className="flex items-baseline gap-2 mt-auto">
                        <span className={`text-lg font-black font-display tracking-tighter ${isSold ? 'text-primary/20' : 'text-primary'}`}>
                            ${product.price.toLocaleString('es-AR')}
                        </span>
                        {product.oldPrice && product.oldPrice > product.price && !isSold && (
                            <span className="text-[11px] font-bold text-primary/20 line-through">
                                ${product.oldPrice.toLocaleString('es-AR')}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default ProductCard;
