import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getPlatformSettings, PlatformSettings } from '../lib/settings';
import { useAuth } from '../lib/auth';
import { useDialog } from '../context/DialogContext';
import { getTrendingItems, getSmartSuggestions, ItemData } from '../lib/items';

const Cart = () => {
    const { cart, removeFromCart, total: subtotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const { user } = useAuth();
    const { showAlert } = useDialog();
    const [recommendations, setRecommendations] = useState<(ItemData & { id: string })[]>([]);
    const [couponCode, setCouponCode] = useState('');
    const [discountInfo, setDiscountInfo] = useState<{ code: string; amount: number } | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsValidating(true);
        try {
            const { validateCoupon } = await import('../lib/marketing');
            const res = await validateCoupon(couponCode, subtotal);
            if (res.success && res.discount !== undefined) {
                setDiscountInfo({ code: res.couponCode || couponCode.toUpperCase(), amount: res.discount });
                await showAlert('Cupón Aplicado', `¡Cupón aplicado! Descuento: $${res.discount.toLocaleString()}`, 'local_activity');
            } else {
                setDiscountInfo(null);
                await showAlert('Error', res.error || 'Cupón inválido o expirado.', 'error');
            }
        } catch (e) {
            await showAlert('Error', 'Error al validar el cupón.', 'error');
        }
        setIsValidating(false);
    };

    useEffect(() => {
        getPlatformSettings().then(setSettings);
    }, []);

    useEffect(() => {
        const fetchRecs = async () => {
            try {
                if (user) {
                    const recs = await getSmartSuggestions(user.uid, 3);
                    if (recs.length > 0) {
                        setRecommendations(recs.slice(0, 3));
                        return;
                    }
                }
                const trends = await getTrendingItems(3);
                setRecommendations(trends.slice(0, 3));
            } catch (err) {
                console.error("Failed to load recommendations", err);
            }
        };
        fetchRecs();
    }, [user]);

    // Default values if settings are not loaded yet
    const escrowFeePercentage = settings?.escrowFeePercentage ?? 0.05;
    const gatewayFeePercentage = settings?.paymentProcessingFeePercentage ?? 0.06;

    // Calculations
    const escrowFee = settings?.useFixedEscrowFee
        ? (settings.escrowFixedFee ?? 2500)
        : Math.round(subtotal * escrowFeePercentage);

    const gatewayFee = Math.round(subtotal * gatewayFeePercentage);
    const finalTotal = Math.max(0, subtotal + escrowFee + gatewayFee - (discountInfo?.amount || 0));

    // Grouping by seller
    const groupedCart = cart.reduce((acc, item) => {
        if (!acc[item.sellerId]) {
            acc[item.sellerId] = {
                sellerId: item.sellerId,
                sellerName: item.sellerName || 'Vendedor Independiente',
                items: []
            };
        }
        acc[item.sellerId].items.push(item);
        return acc;
    }, {} as Record<string, { sellerId: string, sellerName: string, items: typeof cart }>);
    const sellerGroups = Object.values(groupedCart);

    if (cart.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-20 min-h-screen text-center">
                <div className="size-32 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-8">
                    <span className="material-symbols-outlined text-6xl text-on-surface-variant">shopping_cart_off</span>
                </div>
                <h1 className="text-4xl font-black text-on-surface uppercase tracking-tight mb-4">Tu carrito está vacío</h1>
                <p className="text-on-surface-variant mb-10 max-w-md mx-auto font-medium">¿Viste algo que te gustó? ¡Agrégalo al carrito para no perderlo de vista!</p>
                <Link to="/" className="btn-primary px-12 py-5 inline-block">
                    Explorar Oportunidades
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest min-h-screen pb-20 pt-16">
            <div className="max-w-[1400px] mx-auto px-4 lg:px-12">
                
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl lg:text-5xl font-black text-primary font-headline tracking-tighter mb-2">Mi Carrito</h1>
                    <p className="text-sm text-on-surface-variant font-medium">Revisa tu selección cuidadosamente antes de continuar.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
                    {/* LEFT COLUMN: Groups */}
                    <div className="lg:col-span-8 space-y-8">
                        {sellerGroups.map(group => {
                            const groupSubtotal = group.items.reduce((sum, it) => sum + it.price, 0);
                            return (
                                <div key={group.sellerId} className="bg-surface rounded-2xl p-6 border border-outline-variant/30 shadow-sm">
                                    {/* Seller Header */}
                                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant/20">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 bg-surface-container-low rounded-full flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined text-lg">storefront</span>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-primary">{group.sellerName}</h3>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-secondary">Tienda Verificada</p>
                                            </div>
                                        </div>
                                        <div className="bg-surface-container-low px-3 py-1 rounded-full">
                                            <span className="text-[10px] font-bold text-on-surface-variant">{group.items.length} {group.items.length === 1 ? 'artículo' : 'artículos'}</span>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="space-y-6">
                                        {group.items.map(item => (
                                            <div key={item.id} className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="size-24 rounded-xl object-cover shadow-sm bg-surface-container"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-base font-bold text-on-surface truncate">{item.title}</h4>
                                                    <p className="text-xs text-on-surface-variant mt-1">{item.category || 'Edición Limitada'}</p>
                                                    
                                                    <div className="flex items-center gap-4 mt-4">
                                                        {/* Fake Quantity control to match reference visually */}
                                                        <div className="flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded px-2 py-1 gap-3">
                                                            <button className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50" disabled>
                                                                <span className="material-symbols-outlined text-sm font-bold">remove</span>
                                                            </button>
                                                            <span className="text-xs font-bold text-on-surface w-4 text-center">1</span>
                                                            <button className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50" disabled>
                                                                <span className="material-symbols-outlined text-sm font-bold">add</span>
                                                            </button>
                                                        </div>

                                                        <button 
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="text-right mt-4 sm:mt-0">
                                                    <p className="text-xl font-black text-primary">${item.price.toLocaleString()}</p>
                                                    <p className="text-[10px] text-on-surface-variant mt-1">En Stock</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Seller Footer */}
                                    <div className="mt-8 pt-4 border-t border-outline-variant/20 flex justify-between items-center bg-surface-container-lowest/50 p-4 rounded-xl">
                                        <span className="text-xs font-bold text-on-surface-variant">Subtotal del Vendedor</span>
                                        <span className="text-lg font-black text-primary">${groupSubtotal.toLocaleString()}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* RIGHT COLUMN: Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-surface rounded-2xl shadow-lg border-t-4 border-t-[#00b4d8] border-x border-b border-outline-variant/20 sticky top-24 overflow-hidden">
                            <div className="p-6 lg:p-8">
                                <h3 className="text-lg font-black text-primary mb-6 uppercase tracking-wider font-headline">Resumen de Compra</h3>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-sm text-on-surface">
                                        <span>Subtotal ({cart.length} {cart.length === 1 ? 'artículo' : 'artículos'})</span>
                                        <span className="font-medium">${subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-on-surface">
                                        <span>Envío Estimado</span>
                                        <span className="font-medium text-xs text-on-surface-variant">A calcular en checkout</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-on-surface">
                                        <span>Protección Escrow y Pasarela</span>
                                        <span className="font-medium">${(escrowFee + gatewayFee).toLocaleString()}</span>
                                    </div>
                                    {discountInfo && (
                                        <div className="flex justify-between text-sm text-emerald-600 font-bold">
                                            <span>Descuento ({discountInfo.code})</span>
                                            <span>-${discountInfo.amount.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-outline-variant/20 py-6 flex justify-between items-end">
                                    <span className="text-base font-bold text-primary">Total</span>
                                    <span className="text-3xl lg:text-4xl font-black text-primary font-headline tracking-tighter">${finalTotal.toLocaleString()}</span>
                                </div>

                                <button
                                    onClick={() => navigate('/checkout')}
                                    className="w-full bg-[#00b4d8] text-white py-4 rounded-lg font-black text-sm transition-all hover:bg-[#0096c7] shadow-lg shadow-[#00b4d8]/20 flex justify-center items-center gap-2 mb-4"
                                >
                                    <span className="material-symbols-outlined text-lg">lock</span>
                                    Proceder al Pago
                                </button>
                                <p className="text-[8px] text-center uppercase tracking-widest text-on-surface-variant font-bold mb-8">Pago Seguro y Encriptado</p>

                                {/* Info Blocks */}
                                <div className="bg-surface-container-low rounded-xl p-4 mb-8 space-y-4">
                                    <div className="flex gap-3">
                                        <span className="material-symbols-outlined text-on-surface-variant text-lg">local_shipping</span>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface">Envío Estándar</p>
                                            <p className="text-xs text-on-surface-variant mt-1">Recibilo en los próximos días</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="material-symbols-outlined text-on-surface-variant text-lg">replay</span>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface">Devoluciones Gratuitas</p>
                                            <p className="text-xs text-on-surface-variant mt-1">Comprá con confianza. Calidad garantizada.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Promo Code */}
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Código Promocional</p>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            placeholder="INGRESAR CÓDIGO" 
                                            className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded text-xs px-3 py-2 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors uppercase"
                                        />
                                        <button 
                                            onClick={discountInfo ? () => { setDiscountInfo(null); setCouponCode(''); } : handleApplyCoupon}
                                            disabled={isValidating || (!couponCode && !discountInfo)}
                                            className="bg-primary text-white text-[10px] font-bold uppercase px-4 py-2 rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                                        >
                                            {isValidating ? '...' : discountInfo ? 'Remover' : 'Aplicar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Curated for You */}
                <div className="mt-24 border-t border-outline-variant/30 pt-16">
                    <div className="flex justify-between items-end mb-8">
                        <h2 className="text-2xl font-black text-primary font-headline tracking-tight">Te Podría Interesar</h2>
                        <a href="#" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-4">Ver Más Recomendaciones</a>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-[400px]">
                        {recommendations.map((item, i) => {
                            const isFirst = i === 0;
                            const isThird = i === 2;
                            return (
                                <Link 
                                    to={`/marketplace/item/${item.id}`} 
                                    key={item.id} 
                                    className={`bg-surface-container-low rounded-2xl relative overflow-hidden group shadow-sm ${isFirst ? 'md:col-span-2 lg:col-span-1' : ''} ${isThird ? 'hidden md:block' : ''}`}
                                >
                                    <img 
                                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=1000'} 
                                        alt={item.title} 
                                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isThird ? 'grayscale hover:grayscale-0' : ''}`}
                                    />
                                    {isFirst ? (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                                            <span className="text-[8px] font-black text-[#00b4d8] uppercase tracking-widest mb-1">Sugerido</span>
                                            <h3 className="text-xl font-black text-white">{item.title}</h3>
                                            <p className="text-xs text-white/70">{item.category}</p>
                                        </div>
                                    ) : (
                                        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur p-4 rounded-xl">
                                            <h3 className="text-xs font-black text-primary truncate">{item.title}</h3>
                                            <p className="text-[10px] text-on-surface-variant">${item.price.toLocaleString()}</p>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                        {/* Fallback si no hay data */}
                        {recommendations.length === 0 && (
                            <div className="col-span-3 flex items-center justify-center h-full text-on-surface-variant font-medium text-sm">
                                Cargando recomendaciones...
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Cart;
