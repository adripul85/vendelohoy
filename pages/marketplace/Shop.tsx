import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemsBySeller, ItemData } from '../../lib/items';
import { getUserProfile, getStoreBySlug, UserProfile } from '../../lib/users';
import ProductCard from '../../components/ProductCard';
import SkeletonCard from '../../components/SkeletonCard';
import ReputationCard from '../../components/seller/ReputationCard';
import { useNotification } from '../../context/NotificationContext';
import { checkIsFollowing, toggleFollow } from '../../lib/interactions';
import { useAuth } from '../../lib/auth';
import { FaWhatsapp, FaInstagram, FaTiktok, FaGlobe, FaXTwitter, FaFacebook, FaYoutube } from 'react-icons/fa6';
import { motion, AnimatePresence } from 'framer-motion';

const Shop = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { notify } = useNotification();

    const [seller, setSeller] = useState<UserProfile | null>(null);
    const [products, setProducts] = useState<(ItemData & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showPoliciesModal, setShowPoliciesModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [buyerSort, setBuyerSort] = useState<string>('default');
    const [showShareModal, setShowShareModal] = useState(false);

    useEffect(() => {
        const fetchShopData = async () => {
            if (!slug) return;
            setLoading(true);
            try {
                // Try fetching by slug first, fallback to uid (to support old URLs)
                let sellerData = await getStoreBySlug(slug);
                if (!sellerData) {
                    sellerData = await getUserProfile(slug);
                }

                if (sellerData) {
                    const targetSellerId = sellerData.uid || (sellerData as any).id || slug;
                    const productsData = await getItemsBySeller(targetSellerId);
                    // Solo mostrar al público los productos que están disponibles o activos (robust and case-insensitive)
                    const isOwner = user && (user.uid === targetSellerId || user.uid === sellerData.uid);
                    const availableProducts = productsData.filter(p => {
                        if (isOwner) return true;
                        if (!p.status) return true;
                        const s = p.status.toUpperCase();
                        return ['AVAILABLE', 'ACTIVE', 'PUBLISHED', 'EN_VENTA', 'PUBLICADO'].includes(s);
                    });
                    setSeller(sellerData);
                    setProducts(availableProducts);

                    if (user) {
                        const following = await checkIsFollowing(user.uid, sellerData.uid);
                        setIsFollowing(following);
                    }
                } else {
                    notify({ type: 'error', title: 'Tienda no encontrada', message: 'El vendedor no existe o ha sido desactivado.', icon: 'error' });
                    navigate('/');
                }
            } catch (error) {
                console.error("Error fetching shop data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchShopData();
    }, [slug, user, navigate, notify]);

    const handleFollow = async () => {
        if (!user) {
            notify({ type: 'error', title: 'Acceso Denegado', message: 'Inicia sesión para seguir a este vendedor.', icon: 'lock' });
            return;
        }
        if (!seller) return;
        if (user.uid === seller.uid) return;

        try {
            const result = await toggleFollow(user.uid, seller.uid, user.displayName || 'Alguien', {
                name: seller.displayName || seller.store?.name || 'Vendedor',
                avatar: seller.photoURL || seller.avatar || seller.store?.logo || '',
                slug: seller.store?.slug || seller.uid,
                reputation: seller.reputation?.averageRating || 5.0
            });
            setIsFollowing(result.isFollowing);
            notify({
                type: 'success',
                title: result.isFollowing ? 'Siguiendo' : 'Dejaste de seguir',
                message: result.isFollowing ? `Ahora sigues a ${seller?.displayName || seller?.store?.name}` : `Ya no sigues a ${seller?.displayName || seller?.store?.name}`,
                icon: 'person_add'
            });
        } catch (error) {
            notify({ type: 'error', title: 'Error', message: 'No se pudo procesar la acción.', icon: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="max-w-[1440px] mx-auto px-6 py-20">
                <div className="animate-pulse space-y-10">
                    <div className="h-64 bg-light-100 rounded-[40px]" />
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!seller) return null;

    const rating = seller.reputation?.averageRating || 0;

    const theme = seller.shopTheme || {
        layoutTemplate: 'classic',
        backgroundType: 'gradient',
        primaryColor: '#e11d48', // primary-600
        secondaryColor: '#4f46e5', // indigo-600
        accentColor: '#e11d48',
    };
    const layoutTemplate = theme.layoutTemplate || 'classic';

    const headerStyle = seller.coverImage || theme.backgroundType === 'image'
        ? { backgroundImage: `url(${seller.coverImage || theme.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : theme.backgroundType === 'color' 
        ? { backgroundColor: theme.backgroundColor || '#0f172a' }
        : { 
            // Better gradient implementation for dark/all colors
            background: `linear-gradient(135deg, ${theme.primaryColor}80 0%, transparent 100%), 
                         radial-gradient(circle at top right, ${theme.primaryColor} 0%, transparent 60%),
                         radial-gradient(circle at bottom left, ${theme.secondaryColor} 0%, transparent 60%),
                         #0f172a` 
          }; // #0f172a acts as a solid deeply dark fallback base ensuring blacks blend smoothly

    const store = seller.store;
    const storeSocials = store?.socialLinks;
    const activeCoupons = store?.coupons?.filter(c => c.active) || [];
    const showPublicCoupons = store?.showCouponsPublic && activeCoupons.length > 0;

    // Catalog sorting and searching
    const processedProducts = [...products]
        .filter(p => {
            if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const titleMatch = p.title?.toLowerCase().includes(q);
                const descMatch = p.description?.toLowerCase().includes(q);
                const catMatch = p.category?.toLowerCase().includes(q);
                return titleMatch || descMatch || catMatch;
            }
            return true;
        })
        .sort((a, b) => {
            const effectiveSort = buyerSort !== 'default' ? buyerSort : (store?.catalogSort || 'default');
            switch (effectiveSort) {
                case 'featured_first':
                    if (a.isFeatured && !b.isFeatured) return -1;
                    if (!a.isFeatured && b.isFeatured) return 1;
                    if (a.isFlashSale && !b.isFlashSale) return -1;
                    if (!a.isFlashSale && b.isFlashSale) return 1;
                    return 0;
                case 'price_low':
                    return (a.price || 0) - (b.price || 0);
                case 'price_high':
                    return (b.price || 0) - (a.price || 0);
                case 'best_sellers':
                    return (b.views || 0) - (a.views || 0);
                case 'newest':
                    const dateA = a.createdAt?.seconds || 0;
                    const dateB = b.createdAt?.seconds || 0;
                    return dateB - dateA;
                default:
                    return 0;
            }
        });

    // Category tabs and filtering
    const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

    // VIP Featured Products
    const featuredIds = store?.featuredProductIds || [];
    const vipProducts = featuredIds.length > 0
        ? products.filter(p => featuredIds.includes(p.id))
        : products.filter(p => p.isFeatured || p.isFlashSale).slice(0, 4);

    return (
        <div className={`bg-background min-h-screen ${theme.typography || 'font-sans'}`}>
            {/* ANNOUNCEMENT BAR */}
            {store?.announcementActive && store?.announcement && (
                <div 
                    className="text-center py-2.5 px-4 text-white text-xs font-bold tracking-wide animate-in fade-in duration-500"
                    style={{ backgroundColor: store.announcementColor || '#e11d48' }}
                >
                    {store.announcement}
                </div>
            )}

            {/* SHOP HEADER */}
            <div 
                className={`relative overflow-hidden transition-colors duration-1000 ${layoutTemplate === 'bold' || (!theme.backgroundColor && theme.backgroundType !== 'image' && theme.backgroundType !== 'gradient') ? 'bg-dark-950' : ''}`}
                style={store?.banner && layoutTemplate !== 'minimalist' ? { backgroundImage: `url(${store.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' } : headerStyle}
            >
                {/* Background Effects Overlay */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 z-0"
                >
                    {store?.banner && layoutTemplate !== 'minimalist' ? (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
                    ) : (
                        <>
                            {theme.backgroundType === 'gradient' && !seller.coverImage && (
                                <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
                            )}
                            {(theme.backgroundType === 'image' || seller.coverImage) && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                            )}
                        </>
                    )}
                </motion.div>

                {/* Hero Content */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                    className={`relative z-10 max-w-7xl mx-auto px-6 ${layoutTemplate === 'minimalist' ? 'pt-20 pb-8 flex flex-row items-center justify-between text-left gap-8' : layoutTemplate === 'modern' ? 'pt-28 pb-20 flex flex-col md:flex-row items-center text-left gap-12' : 'pt-28 pb-14 flex flex-col items-center text-center gap-5'}`}
                >
                    
                    {layoutTemplate === 'modern' && store?.banner && (
                        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-1/2 bg-black/20" style={{ backgroundImage: `url(${store.banner})`, backgroundSize: 'cover', backgroundPosition: 'center', clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%)' }}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />
                        </div>
                    )}

                    <div className={`flex flex-col gap-4 ${layoutTemplate === 'minimalist' ? 'items-start flex-1' : layoutTemplate === 'modern' ? 'items-start md:w-1/2 z-10' : 'items-center'}`}>
                        {/* Store Logo */}
                        {store?.logo && (
                            <div className={`${layoutTemplate === 'minimalist' ? 'size-20 rounded-2xl' : layoutTemplate === 'modern' ? 'size-28 rounded-[2rem]' : 'size-24 rounded-3xl'} bg-white/10 backdrop-blur-md border-2 border-white/20 shadow-2xl shadow-black/30 overflow-hidden flex items-center justify-center`}>
                                <img 
                                    src={store.logo} 
                                    alt={store.name || 'Logo'} 
                                    className="w-full h-full object-contain p-2"
                                />
                            </div>
                        )}

                        {/* Store Name */}
                        {store?.name && (
                            <h1 className={`${layoutTemplate === 'minimalist' ? 'text-2xl sm:text-3xl' : layoutTemplate === 'bold' ? 'text-5xl sm:text-6xl tracking-tighter' : 'text-3xl sm:text-4xl'} font-black text-white drop-shadow-lg flex items-center gap-3`}>
                                {store.name}
                                {store.paidOfficialTick && (
                                    <span className="material-symbols-outlined text-sky-400 text-2xl drop-shadow-md" title="Tienda Verificada">verified</span>
                                )}
                            </h1>
                        )}

                        {/* Tagline */}
                        {store?.tagline && (
                            <p className={`text-white/70 ${layoutTemplate === 'bold' ? 'text-lg font-bold uppercase tracking-widest' : 'text-sm font-bold tracking-wide italic'} max-w-2xl mx-auto`}>
                                "{store.tagline}"
                            </p>
                        )}

                        {/* Quick Stats */}
                        <div className={`flex flex-wrap items-center gap-6 mt-2 ${layoutTemplate === 'minimalist' || layoutTemplate === 'modern' ? 'justify-start' : 'justify-center'}`}>
                            <div className="flex items-center gap-1.5 text-white/60">
                                <span className="material-symbols-outlined text-sm">inventory_2</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">{products.length} productos</span>
                            </div>
                            {rating > 0 && (
                                <div className="flex items-center gap-1.5 text-yellow-400/80">
                                    <span className="material-symbols-outlined text-sm">star</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{rating.toFixed(1)} reputación</span>
                                </div>
                            )}
                            {seller.location?.city && (
                                <div className="flex items-center gap-1.5 text-white/60">
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{seller.location.city}</span>
                                </div>
                            )}
                            <button
                                onClick={() => setShowPoliciesModal(true)}
                                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-full backdrop-blur-md transition-all border border-white/20 cursor-pointer shadow-sm"
                            >
                                <span className="material-symbols-outlined text-xs text-emerald-400">shield</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Garantía y Políticas</span>
                            </button>
                        </div>
                    </div>

                    {layoutTemplate === 'minimalist' && store?.banner && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, rotate: 2 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                            className="hidden md:block w-1/3 max-w-[300px] h-32 rounded-3xl overflow-hidden shadow-lg border-2 border-white/20 ml-auto flex-shrink-0"
                        >
                            <img src={store.banner} alt="Banner" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" />
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* VIP FEATURED PRODUCTS SHOWCASE */}
            {vipProducts.length > 0 && (
                <div className="max-w-7xl mx-auto px-6 pt-12 relative z-10">
                    <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent p-6 sm:p-8 rounded-[36px] border border-amber-500/20 shadow-xl mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                                    <span className="material-symbols-outlined text-xl font-black">star</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                        Vitrina VIP
                                        <span className="text-[10px] bg-amber-500 text-white font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">Destacados</span>
                                    </h3>
                                    <p className="text-xs font-bold text-slate-500">Selección especial de la tienda</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {vipProducts.map(p => <ProductCard key={`vip-${p.id}`} product={p} />)}
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCT GRID SECTION */}
            <main className={`max-w-7xl mx-auto px-6 py-12 flex flex-col ${layoutTemplate === 'modern' ? 'lg:flex-row-reverse' : layoutTemplate === 'bold' ? 'lg:flex-col' : 'lg:flex-row'} gap-6 md:gap-12 relative z-10 ${layoutTemplate === 'bold' ? 'bg-dark-900 rounded-[32px] mt-6 p-8 shadow-2xl' : ''}`}>
                {/* Main Column */}
                <div className="flex-1">
                    <div className="flex items-end justify-between mb-8 border-b border-outline-variant/30 pb-8">
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h2 className="text-2xl sm:text-3xl font-black text-primary tracking-tight font-headline">
                                    Catálogo de Productos
                                </h2>
                                <span 
                                    className="inline-flex items-center gap-1.5 text-white text-xs px-3.5 py-1 rounded-full uppercase font-black tracking-wider whitespace-nowrap shadow-sm h-7"
                                    style={{ backgroundColor: theme.accentColor || '#0284c7' }}
                                >
                                    <span className="material-symbols-outlined text-sm font-black">inventory_2</span>
                                    {processedProducts.length} {processedProducts.length === 1 ? 'Producto' : 'Productos'}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Todos los productos verificados</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                            {/* Live Search */}
                            <div className="relative flex-1 sm:flex-initial min-w-[220px]">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar por nombre o palabra..."
                                    className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl py-3 pl-10 pr-10 font-bold text-xs text-on-surface outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-on-surface-variant/50"
                                />
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface size-5 flex items-center justify-center rounded-full hover:bg-surface-variant/50 cursor-pointer">
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                )}
                            </div>

                            {/* Live Sort Dropdown */}
                            <div className="relative shrink-0">
                                <select
                                    value={buyerSort}
                                    onChange={(e) => setBuyerSort(e.target.value)}
                                    className="bg-surface-container-low border border-outline-variant/50 rounded-xl py-3 pl-4 pr-10 font-bold text-xs text-on-surface outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer appearance-none"
                                >
                                    <option value="default">Orden de la Tienda</option>
                                    <option value="featured_first">Destacados primero</option>
                                    <option value="price_low">Precio: Menor a Mayor</option>
                                    <option value="price_high">Precio: Mayor a Menor</option>
                                    <option value="best_sellers">Más Populares</option>
                                    <option value="newest">Más Recientes</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm">expand_more</span>
                            </div>
                        </div>
                    </div>

                    {/* PUBLIC COUPONS PROMOTIONAL STRIP */}
                    {showPublicCoupons && (
                        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 rounded-[32px] shadow-xl text-white mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
                            <div className="absolute -right-10 -top-4 md:p-10 size-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="size-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner shrink-0">
                                    <span className="material-symbols-outlined text-2xl font-black">local_offer</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                                        ¡Descuentos Exclusivos de esta Tienda!
                                        <span className="text-[9px] bg-white text-indigo-900 font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Activos</span>
                                    </h3>
                                    <p className="text-xs text-white/80 font-medium">Copia tu código y canjéalo durante el pago protegido.</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 w-full sm:w-auto relative z-10">
                                {activeCoupons.map(coupon => (
                                    <button
                                        key={coupon.id}
                                        onClick={() => {
                                            navigator.clipboard.writeText(coupon.code);
                                            notify({ type: 'success', title: '¡Cupón Copiado!', message: `Código "${coupon.code}" copiado (${coupon.discountPercentage}% OFF).`, icon: 'content_copy' });
                                        }}
                                        className="flex items-center gap-3 bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md px-4 py-2 rounded-2xl transition-all group cursor-pointer"
                                    >
                                        <span className="text-sm font-black tracking-wider font-mono text-yellow-300">{coupon.code}</span>
                                        <span className="text-[11px] font-black bg-white text-slate-900 px-2 py-0.5 rounded-lg shadow-sm">-{coupon.discountPercentage}%</span>
                                        <span className="material-symbols-outlined text-xs text-white/70 group-hover:text-white transition-colors">content_copy</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Category Filter Tabs */}
                    {categories.length > 2 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-5 py-2.5 rounded-2xl font-black text-xs whitespace-nowrap transition-all uppercase tracking-wider flex items-center gap-2 ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    {cat === 'all' ? (
                                        <>
                                            <span className="material-symbols-outlined text-sm">grid_view</span>
                                            Todos
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-sm">category</span>
                                            {cat}
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {processedProducts.length > 0 ? (
                        <motion.div 
                            layout={layoutTemplate === 'magnetic'}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                            style={layoutTemplate === 'spatial' ? { perspective: '1000px' } : undefined}
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: { opacity: 0 },
                                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                            }}
                        >
                            <AnimatePresence mode="popLayout">
                                {processedProducts.map(p => (
                                    <motion.div 
                                        key={p.id}
                                        layout={layoutTemplate === 'magnetic'}
                                        initial={layoutTemplate === 'cinematic' ? { opacity: 0, scale: 0.8, y: 80 } : { opacity: 0, y: 20 }}
                                        animate={layoutTemplate === 'cinematic' ? undefined : { opacity: 1, y: 0, scale: 1 }}
                                        whileInView={layoutTemplate === 'cinematic' ? { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } } : undefined}
                                        viewport={layoutTemplate === 'cinematic' ? { once: false, margin: "-50px" } : undefined}
                                        exit={layoutTemplate === 'magnetic' ? { opacity: 0, scale: 0.5, transition: { duration: 0.2 } } : undefined}
                                        whileHover={layoutTemplate === 'spatial' ? { rotateX: 5, rotateY: -5, scale: 1.03, z: 20 } : layoutTemplate === 'magnetic' ? { scale: 1.02, y: -5 } : undefined}
                                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                                        style={layoutTemplate === 'spatial' ? { transformStyle: 'preserve-3d' } : undefined}
                                    >
                                        <ProductCard product={p} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : searchQuery ? (
                        <div className="py-24 text-center bg-surface rounded-[40px] border border-outline-variant/30 p-8">
                            <div className="size-16 bg-surface-container-low rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <span className="material-symbols-outlined text-3xl text-on-surface-variant">search_off</span>
                            </div>
                            <h3 className="text-xl font-black text-primary mb-1 font-headline">Sin resultados para "{searchQuery}"</h3>
                            <p className="text-on-surface-variant font-bold uppercase text-[10px] tracking-widest mb-6">No encontramos ningún producto que coincida con esa búsqueda</p>
                            <button onClick={() => setSearchQuery('')} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md cursor-pointer">
                                Ver todo el catálogo
                            </button>
                        </div>
                    ) : (
                        <div className="py-40 text-center bg-surface rounded-[40px] border border-outline-variant/30">
                            <div className="size-20 bg-surface-container-low rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-4xl text-on-surface-variant">inventory_2</span>
                            </div>
                            <h3 className="text-2xl font-black text-primary mb-2 font-headline">Tienda Vacía</h3>
                            <p className="text-on-surface-variant font-bold uppercase text-[10px] tracking-[0.2em]">Este vendedor no tiene productos publicados actualmente</p>
                        </div>
                    )}

                    {/* Seller Credentials */}
                    <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: 'Identidad Verificada', icon: 'shield_person', text: 'Vendedor verificado en la plataforma.' },
                            { title: 'Pago Protegido', icon: 'lock', text: 'Tus compras están aseguradas.' },
                            { title: 'Soporte Directo', icon: 'support_agent', text: 'Asistencia directa con el vendedor.' }
                        ].map((feature, i) => (
                            <div key={i} className="bg-surface p-8 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col items-center text-center group hover:border-primary/30 transition-all">
                                <div className="size-16 bg-surface-container-low rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-on-primary text-on-surface-variant transition-colors duration-500">
                                    <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2">{feature.title}</h4>
                                <p className="text-[11px] font-bold text-on-surface-variant leading-relaxed uppercase tracking-tight">{feature.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Column */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
                    className={`${layoutTemplate === 'bold' ? 'w-full grid grid-cols-1 md:grid-cols-2 gap-6' : 'w-full lg:w-[420px] flex-shrink-0 space-y-6'}`}
                >
                    <ReputationCard seller={seller} />
                    
                    {/* Actions & Stats Card */}
                    <div className="bg-white rounded-[40px] p-8 shadow-2xl shadow-slate-200/60 border border-slate-100 flex flex-col gap-8">
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleFollow}
                                style={!isFollowing ? { backgroundColor: theme.accentColor || '#e11d48' } : {}}
                                className={`w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl ${isFollowing
                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    : 'text-white hover:scale-[1.02] active:scale-[0.98]'
                                    }`}
                            >
                                {isFollowing ? 'Siguiendo Vendedor' : 'Seguir Vendedor'}
                            </button>
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="w-full py-4 bg-slate-50 text-slate-700 rounded-[24px] flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-xs uppercase tracking-widest shadow-sm cursor-pointer group"
                            >
                                <span className="material-symbols-outlined text-lg text-indigo-600 group-hover:scale-125 group-hover:rotate-12 transition-transform animate-pulse">share</span>
                                Compartir Tienda
                            </button>
                        </div>

                        <div className="flex flex-col gap-6 pt-6 border-t border-slate-100">
                            {/* Location */}
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                    <span className="material-symbols-outlined text-sm" style={{ color: theme.accentColor || '#e11d48' }}>location_on</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ubicación</span>
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                        {seller.location?.city}, {seller.location?.state}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Store Description (Quiénes Somos) */}
                            {store?.description && (
                                <div className="flex items-start gap-4">
                                    <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                        <span className="material-symbols-outlined text-sm" style={{ color: theme.accentColor || '#e11d48' }}>storefront</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Quiénes Somos</span>
                                        <p className="text-xs font-bold text-slate-500 leading-relaxed">
                                            {store.description}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Bio fallback if no store description */}
                            {!store?.description && seller.bio && (
                                <div className="flex items-start gap-4">
                                    <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                        <span className="material-symbols-outlined text-sm" style={{ color: theme.accentColor || '#e11d48' }}>description</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Biografía</span>
                                        <p className="text-xs font-bold text-slate-500 line-clamp-3 italic leading-relaxed">
                                            "{seller.bio}"
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Warranty & Dispatch Badges */}
                            {(store?.warranty || store?.dispatchTime) && (
                                <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                                    {store?.warranty && (
                                        <div className="flex items-center gap-3 bg-emerald-50 rounded-2xl px-4 py-3 border border-emerald-100">
                                            <span className="material-symbols-outlined text-emerald-600 text-lg">verified_user</span>
                                            <div>
                                                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest block">Garantía del Vendedor</span>
                                                <span className="text-xs font-bold text-emerald-600">{store.warranty}</span>
                                            </div>
                                        </div>
                                    )}
                                    {store?.dispatchTime && (
                                        <div className="flex items-center gap-3 bg-indigo-50 rounded-2xl px-4 py-3 border border-indigo-100">
                                            <span className="material-symbols-outlined text-indigo-600 text-lg">local_shipping</span>
                                            <div>
                                                <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block">Tiempo de Despacho</span>
                                                <span className="text-xs font-bold text-indigo-600">{store.dispatchTime}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Store Social Links (prioritized over personal socials) */}
                            {storeSocials && (storeSocials.whatsapp || storeSocials.instagram || storeSocials.tiktok || storeSocials.facebook || storeSocials.youtube || storeSocials.twitter || storeSocials.website) ? (
                                <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                                    <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                        <span className="material-symbols-outlined text-sm" style={{ color: theme.accentColor || '#e11d48' }}>connect_without_contact</span>
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">Redes de la Tienda</span>
                                        <div className="flex flex-wrap gap-2.5">
                                            {storeSocials.whatsapp && (
                                                <motion.a whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }} href={`https://wa.me/${storeSocials.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="group px-3.5 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 hover:shadow-md transition-all flex items-center gap-2 border border-emerald-200/50">
                                                    <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                                                        <FaWhatsapp className="text-base group-hover:scale-125 transition-transform" />
                                                    </motion.div>
                                                    WhatsApp
                                                </motion.a>
                                            )}
                                            {storeSocials.instagram && (
                                                <motion.a whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }} href={`https://instagram.com/${storeSocials.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="group px-3.5 py-2 bg-pink-50 text-pink-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-pink-100 hover:shadow-md transition-all flex items-center gap-2 border border-pink-200/50">
                                                    <motion.div animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
                                                        <FaInstagram className="text-base group-hover:scale-125 transition-transform" />
                                                    </motion.div>
                                                    Instagram
                                                </motion.a>
                                            )}
                                            {storeSocials.tiktok && (
                                                <motion.a whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }} href={`https://tiktok.com/@${storeSocials.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="group px-3.5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 hover:shadow-md transition-all flex items-center gap-2 shadow-sm border border-slate-700">
                                                    <motion.div animate={{ y: [0, -3, 0], rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}>
                                                        <FaTiktok className="text-base group-hover:scale-125 transition-transform" />
                                                    </motion.div>
                                                    TikTok
                                                </motion.a>
                                            )}
                                            {storeSocials.facebook && (
                                                <motion.a whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }} href={storeSocials.facebook.startsWith('http') ? storeSocials.facebook : `https://facebook.com/${storeSocials.facebook}`} target="_blank" rel="noopener noreferrer" className="group px-3.5 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 hover:shadow-md transition-all flex items-center gap-2 border border-blue-200/50">
                                                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                                                        <FaFacebook className="text-base group-hover:scale-125 transition-transform" />
                                                    </motion.div>
                                                    Facebook
                                                </motion.a>
                                            )}
                                            {storeSocials.youtube && (
                                                <motion.a whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }} href={storeSocials.youtube.startsWith('http') ? storeSocials.youtube : `https://youtube.com/${storeSocials.youtube}`} target="_blank" rel="noopener noreferrer" className="group px-3.5 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-100 hover:shadow-md transition-all flex items-center gap-2 border border-red-200/50">
                                                    <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}>
                                                        <FaYoutube className="text-base group-hover:scale-125 transition-transform" />
                                                    </motion.div>
                                                    YouTube
                                                </motion.a>
                                            )}
                                            {storeSocials.twitter && (
                                                <motion.a whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }} href={storeSocials.twitter.startsWith('http') ? storeSocials.twitter : `https://x.com/${storeSocials.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="group px-3.5 py-2 bg-slate-100 text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-200 hover:shadow-md transition-all flex items-center gap-2 border border-slate-300/50">
                                                    <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}>
                                                        <FaXTwitter className="text-base group-hover:scale-125 transition-transform" />
                                                    </motion.div>
                                                    X (Twitter)
                                                </motion.a>
                                            )}
                                            {storeSocials.website && (
                                                <motion.a whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }} href={storeSocials.website.startsWith('http') ? storeSocials.website : `https://${storeSocials.website}`} target="_blank" rel="noopener noreferrer" className="group px-3.5 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-100 hover:shadow-md transition-all flex items-center gap-2 border border-indigo-200/50">
                                                    <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }}>
                                                        <FaGlobe className="text-base group-hover:scale-125 transition-transform" />
                                                    </motion.div>
                                                    Sitio Web
                                                </motion.a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : seller.social && (seller.social.whatsapp || seller.social.instagram || seller.social.tiktok || seller.social.twitter) ? (
                                <div className="flex items-start gap-4 pt-4 border-t border-slate-100">
                                    <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                        <span className="material-symbols-outlined text-sm" style={{ color: theme.accentColor || '#e11d48' }}>connect_without_contact</span>
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">Redes Sociales</span>
                                        <div className="flex flex-wrap gap-2.5">
                                            {seller.social.whatsapp && (
                                                <motion.a whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }} href={`https://wa.me/${seller.social.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="group px-3.5 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 hover:shadow-md transition-all flex items-center gap-2 border border-emerald-200/50">
                                                    <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                                                        <FaWhatsapp className="text-base group-hover:scale-125 transition-transform" />
                                                    </motion.div>
                                                    WA
                                                </motion.a>
                                            )}
                                            {seller.social.instagram && (
                                                <motion.a whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }} href={`https://instagram.com/${seller.social.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="group px-3.5 py-2 bg-pink-50 text-pink-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-pink-100 hover:shadow-md transition-all flex items-center gap-2 border border-pink-200/50">
                                                    <motion.div animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
                                                        <FaInstagram className="text-base group-hover:scale-125 transition-transform" />
                                                    </motion.div>
                                                    IG
                                                </motion.a>
                                            )}
                                            {seller.social.tiktok && (
                                                <motion.a whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }} href={`https://tiktok.com/@${seller.social.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="group px-3.5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 hover:shadow-md transition-all flex items-center gap-2 shadow-sm border border-slate-700">
                                                    <motion.div animate={{ y: [0, -3, 0], rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}>
                                                        <FaTiktok className="text-base group-hover:scale-125 transition-transform" />
                                                    </motion.div>
                                                    TK
                                                </motion.a>
                                            )}
                                            {seller.social.twitter && (
                                                <motion.a whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }} href={`https://twitter.com/${seller.social.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="group px-3.5 py-2 bg-sky-50 text-sky-500 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-sky-100 hover:shadow-md transition-all flex items-center gap-2 border border-sky-200/50">
                                                    <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}>
                                                        <FaXTwitter className="text-base group-hover:scale-125 transition-transform" />
                                                    </motion.div>
                                                    X
                                                </motion.a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {/* Public Coupons Vitrine */}
                            {showPublicCoupons && (
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="material-symbols-outlined text-sm" style={{ color: theme.accentColor || '#e11d48' }}>local_offer</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cupones Disponibles</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {activeCoupons.slice(0, 3).map(coupon => (
                                            <button
                                                key={coupon.id}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(coupon.code);
                                                    notify({ type: 'success', title: '¡Cupón Copiado!', message: `Usa "${coupon.code}" en el checkout para obtener ${coupon.discountPercentage}% de descuento.`, icon: 'content_copy' });
                                                }}
                                                className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl px-4 py-3 hover:from-indigo-100 hover:to-purple-100 transition-all group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 bg-white rounded-xl flex items-center justify-center font-black text-indigo-600 shadow-sm text-xs border border-indigo-100">
                                                        {coupon.discountPercentage}%
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-black text-slate-800 text-xs tracking-tight">{coupon.code}</p>
                                                        <p className="text-[9px] font-bold text-slate-400">{coupon.discountPercentage}% de descuento</p>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest group-hover:text-indigo-700 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">content_copy</span>
                                                    Copiar
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* STORE POLICIES & TRUST MODAL */}
            {showPoliciesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowPoliciesModal(false)}>
                    <div className="bg-white rounded-[36px] max-w-lg w-full p-8 shadow-2xl border border-slate-100 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                        <button onClick={() => setShowPoliciesModal(false)} className="absolute top-6 right-6 size-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="size-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-100">
                                <span className="material-symbols-outlined text-3xl font-black">verified_user</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Políticas de Garantía y Envíos</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{store?.name || seller.displayName}</p>
                            </div>
                        </div>

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-600 text-base">shield</span>
                                    Garantía del Vendedor
                                </h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                    {store?.warranty || 'Este vendedor opera bajo la Protección del Comprador de VendeloHoy. Tienes 30 días de cobertura si el producto no coincide con la descripción o llega defectuoso.'}
                                </p>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-indigo-600 text-base">local_shipping</span>
                                    Tiempos y Despacho
                                </h4>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                    {store?.dispatchTime ? `Tiempo de despacho habitual: ${store.dispatchTime}.` : 'El vendedor realiza envíos coordinados por mensajería o retiro en persona. Los tiempos exactos se acuerdan al confirmar la compra.'}
                                </p>
                            </div>

                            <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200/60 space-y-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-amber-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-600 text-base">lock</span>
                                    Pago 100% Protegido en Escrow
                                </h4>
                                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                    Al comprar en esta tienda, tu dinero queda retenido de forma segura en la cuenta de cobro del marketplace hasta que recibas y verifiques el producto en tus manos.
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setShowPoliciesModal(false)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md cursor-pointer">
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Store & QR Code Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                        onClick={() => setShowShareModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[40px] max-w-md w-full p-8 shadow-2xl border border-slate-100 relative overflow-hidden flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 leading-none">Tarjeta Digital de Tienda</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Escaneá o compartí con 1 clic</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="size-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all flex items-center justify-center font-bold"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>

                            {/* Digital Card Preview */}
                            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden flex flex-col items-center text-center border border-white/10">
                                <div className="absolute -right-12 -top-4 md:p-12 size-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
                                <div className="absolute -left-12 -bottom-12 size-36 bg-pink-500/20 rounded-full blur-2xl pointer-events-none"></div>

                                {/* Avatar / Logo */}
                                <div className="relative mb-3">
                                    <img
                                        src={store?.logo || seller.photoURL || 'https://via.placeholder.com/150'}
                                        alt={store?.name || seller.displayName || 'Vendedor'}
                                        className="size-16 rounded-2xl object-cover border-2 border-white/20 shadow-lg mx-auto"
                                    />
                                    {store?.paidOfficialTick && (
                                        <div className="absolute -bottom-1 -right-1 bg-sky-500 text-white rounded-full p-0.5 shadow-md flex items-center justify-center">
                                            <span className="material-symbols-outlined text-xs font-black">verified</span>
                                        </div>
                                    )}
                                </div>

                                {/* Store Name */}
                                <h4 className="text-xl font-black tracking-tight flex items-center justify-center gap-1.5 mb-1">
                                    {store?.name || seller.displayName || 'Tienda Oficial'}
                                </h4>
                                <p className="text-white/70 text-xs font-medium max-w-xs line-clamp-1 mb-5">
                                    {store?.tagline || 'Encontrá los mejores productos y oportunidades'}
                                </p>

                                {/* Official QR Code */}
                                <div className="bg-white p-3.5 rounded-2xl shadow-2xl mb-4 border-2 border-indigo-500/20 group hover:scale-105 transition-transform duration-300">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=5&data=${encodeURIComponent(window.location.href)}`}
                                        alt="Código QR de la Tienda"
                                        className="size-44 object-contain rounded-xl"
                                    />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-xs animate-pulse">photo_camera</span>
                                    Escaneá con la cámara del celular
                                </p>
                            </div>

                            {/* Share actions */}
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Compartir en Redes</span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <motion.a
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`¡Mirá la tienda oficial de ${store?.name || seller.displayName} en De Oportunidades! 👉 ${window.location.href}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-colors shadow-sm"
                                    >
                                        <FaWhatsapp className="text-lg" />
                                        WhatsApp
                                    </motion.a>
                                    <motion.a
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-colors shadow-sm"
                                    >
                                        <FaFacebook className="text-lg" />
                                        Facebook
                                    </motion.a>
                                    <motion.a
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`¡Mirá la tienda oficial de ${store?.name || seller.displayName} en De Oportunidades! 👉 ${window.location.href}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-slate-100 text-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-200 transition-colors shadow-sm"
                                    >
                                        <FaXTwitter className="text-lg" />
                                        X (Twitter)
                                    </motion.a>
                                    <motion.button
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            notify({ type: 'success', title: '¡Enlace Copiado!', message: 'Ya podés pegarlo en Instagram, TikTok o donde quieras.', icon: 'link' });
                                        }}
                                        className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-100 transition-colors shadow-sm cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-lg">link</span>
                                        Copiar Link
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Shop;

