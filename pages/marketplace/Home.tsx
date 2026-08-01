import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { getFeaturedItems, getFlashSaleItems, getItems, ItemData } from '../../lib/items';
import { useAuth } from '../../lib/auth';
import { CATEGORIES } from '../../lib/constants';
import { LOCATION_DATA } from '../../lib/locations';
import CountdownTimer from '../../components/product/CountdownTimer';
import ProductCard from '../../components/ProductCard';
import SkeletonCard from '../../components/SkeletonCard';
import HomeHero from '../../components/HomeHero';
import { MobileHeader } from '../../components/ui/MobileHeader';

const CONDITION_LABELS: Record<string, string> = {
  'new': 'Nuevo',
  'like_new': 'Como nuevo',
  'good': 'Buen estado',
  'used': 'Usado',
  'repair': 'Para reparar',
  'digital': 'Producto digital',
  'service': 'Servicio'
};

const TRENDING_CATEGORIES = [
  "CONSTRUCCIÓN", 
  "ELECTRÓNICA", 
  "MODA VINTAGE", 
  "HOGAR", 
  "VEHÍCULOS", 
  "ARTE LOCAL"
];

const FlashDealsSection = () => {
  const [featured, setFeatured] = useState<(ItemData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();
  const userLocation = userProfile?.location?.state || undefined;

  useEffect(() => {
    const fetchFlash = async () => {
      const items = await getFlashSaleItems(userLocation);
      setFeatured(items);
      setLoading(false);
    };
    fetchFlash();
  }, [userLocation]);

  if (loading || featured.length === 0) return null;

  return (
    <section>
      {/* Banner de Oportunidades Flash — siempre visible */}
      <div className="w-full bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between mb-8 shadow-2xl shadow-primary/20 relative overflow-hidden">
        {/* Decoraciones de fondo */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-6 z-10 mb-8 md:mb-0">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/30 hidden sm:flex">
            <span className="material-symbols-outlined text-4xl text-white">timer</span>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight font-headline mb-1">Oportunidades Flash 48Hs</h2>
            <p className="text-white/80 font-bold tracking-widest text-xs uppercase">Activos premium con descuentos exclusivos y tiempo limitado</p>
          </div>
        </div>

        <Link to="/deals" className="z-10 bg-surface text-primary px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl whitespace-nowrap">
          Ver Oportunidades Ya
        </Link>
      </div>

      {/* Carrusel de Productos debajo del banner */}
      <div className="flex gap-8 overflow-x-auto no-scrollbar pb-8 snap-x px-4 -mx-4">
        {featured.slice(0, 6).map((product) => (
          <div key={product.id} className="w-[280px] md:w-[320px] flex-shrink-0 snap-start">
            <div className="relative group h-full">
              {product.featuredUntil && (
                <div className="absolute top-4 right-4 z-20">
                  <div className="bg-surface/90 backdrop-blur-md rounded-xl px-3 py-2 border border-outline-variant shadow-lg">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="material-symbols-outlined text-secondary text-xs animate-pulse">bolt</span>
                      <span className="text-[8px] font-black text-secondary uppercase tracking-widest">Termina en</span>
                    </div>
                    <CountdownTimer targetDate={product.featuredUntil} className="text-primary font-bold" />
                  </div>
                </div>
              )}
              <div className="editorial-shadow rounded-xl overflow-hidden h-full">
                <ProductCard product={product} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const NearbyProductsSection = ({ products, loading }: { products: (ItemData & { id: string })[]; loading: boolean }) => {
  const { userProfile } = useAuth();
  const userProvince = userProfile?.location?.state || '';
  const userCity = userProfile?.location?.city || '';

  const nearbyProducts = products.filter(p => {
    if (!userProvince || !p.location) return false;
    return p.location.includes(userProvince);
  });

  // Show location prompt if not logged in or no location
  if (!userProvince) {
    return (
      <section className="bg-surface rounded-[40px] p-8 lg:p-16 border border-outline-variant/30 shadow-sm text-center">
        <div className="bg-secondary-container/15 p-5 rounded-2xl inline-flex mb-6">
          <span className="material-symbols-outlined text-4xl text-secondary">location_on</span>
        </div>
        <h2 className="text-3xl font-black text-primary tracking-tight font-headline mb-4">Productos Cerca de Ti</h2>
        <p className="text-on-surface-variant max-w-md mx-auto mb-8">Iniciá sesión y configurá tu ubicación para ver productos disponibles en tu zona.</p>
        <Link to="/login" className="bg-secondary text-on-secondary px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-all inline-flex items-center gap-2">
          Iniciar Sesión
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </section>
    );
  }

  if (loading) {
    return (
      <section>
        <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight font-headline mb-8">Cerca de Ti</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </section>
    );
  }

  if (nearbyProducts.length === 0) {
    return (
      <section className="bg-surface rounded-[40px] p-8 lg:p-16 border border-outline-variant/30 shadow-sm text-center">
        <div className="bg-secondary-container/15 p-5 rounded-2xl inline-flex mb-6">
          <span className="material-symbols-outlined text-4xl text-secondary">location_searching</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight font-headline mb-4">Sin productos cerca tuyo</h2>
        <p className="text-on-surface-variant max-w-md mx-auto">Aún no hay publicaciones en <strong>{userCity ? `${userCity}, ` : ''}{userProvince}</strong>. ¡Sé el primero en publicar!</p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-secondary text-lg">location_on</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">{userCity ? `${userCity}, ` : ''}{userProvince}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight font-headline">Cerca de Ti</h2>
          <p className="text-on-surface-variant">Productos disponibles en tu zona</p>
        </div>
      </div>
      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8 snap-x -mx-2 px-2">
        {nearbyProducts.slice(0, 8).map((p, idx) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="w-[260px] md:w-[300px] flex-shrink-0 snap-start editorial-shadow rounded-xl overflow-hidden bg-surface"
          >
            <ProductCard product={p} location={p.location} />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const FeaturedDealsSection = () => {
  const [featured, setFeatured] = useState<(ItemData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();
  const userLocation = userProfile?.location?.state || undefined;

  useEffect(() => {
    const fetchFeatured = async () => {
      const items = await getFeaturedItems(userLocation);
      setFeatured(items);
      setLoading(false);
    };
    fetchFeatured();
  }, [userLocation]);

  if (loading || featured.length === 0) return null;

  return (
    <section>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight font-headline mb-1">Productos Destacados</h2>
          <p className="text-on-surface-variant text-sm font-medium">Las mejores oportunidades elegidas para vos</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {featured.map(item => (
          <div key={item.id} className="editorial-shadow rounded-xl overflow-hidden h-full bg-surface">
            <ProductCard product={item} />
          </div>
        ))}
      </div>
    </section>
  );
};


const AppDownloadSection = () => {
  return (
    <section className="bg-primary text-on-primary rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-primary/20">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
      
      <div className="z-10 max-w-xl mb-12 md:mb-0">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white mb-6 font-bold text-[10px] tracking-widest uppercase border border-white/20 backdrop-blur-md">
          <span className="material-symbols-outlined text-sm">smartphone</span>
          Próximamente
        </div>
        <h2 className="text-3xl md:text-4xl font-black font-headline tracking-tighter leading-[1.1] mb-4">
          Llevá las mejores oportunidades en tu bolsillo.
        </h2>
        <p className="text-white/80 text-sm mb-8 max-w-md">
          Nuestra app móvil está en camino. Podrás comprar, vender y chatear desde cualquier lugar, todo al alcance de un tap.
        </p>
        <div className="flex flex-wrap gap-4">
          <button className="bg-surface text-primary px-6 py-3 rounded-xl font-bold flex items-center gap-3 hover:scale-105 transition-transform shadow-xl">
            <span className="material-symbols-outlined text-2xl">android</span>
            <div className="text-left">
              <div className="text-[9px] uppercase tracking-wider opacity-70">Pronto en</div>
              <div className="text-sm">Google Play</div>
            </div>
          </button>
          <button className="bg-surface text-primary px-6 py-3 rounded-xl font-bold flex items-center gap-3 hover:scale-105 transition-transform shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" className="w-7 h-7">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </svg>
            <div className="text-left">
              <div className="text-[9px] uppercase tracking-wider opacity-70">Pronto en</div>
              <div className="text-sm">App Store</div>
            </div>
          </button>
        </div>
      </div>

      <div className="z-10 w-full md:w-1/3 flex justify-center relative">
        {/* Mockup visual representation */}
        <div className="w-[180px] h-[360px] bg-surface rounded-3xl border-[6px] border-black/80 shadow-2xl relative overflow-hidden flex flex-col transform rotate-3 md:rotate-6 hover:rotate-0 transition-transform duration-500">
          <div className="w-full bg-surface-container-low h-16 flex items-center justify-between px-4 border-b border-outline-variant/30">
             <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">bolt</span>
                <span className="font-black text-primary font-headline tracking-tight">VendeloHoy!</span>
             </div>
             <span className="material-symbols-outlined text-on-surface-variant text-sm">menu</span>
          </div>
          <div className="flex-1 p-4 bg-background">
             <div className="w-full h-32 bg-secondary/10 rounded-2xl mb-4 animate-pulse"></div>
             <div className="grid grid-cols-2 gap-3">
                <div className="h-28 bg-surface-container-low rounded-xl animate-pulse"></div>
                <div className="h-28 bg-surface-container-low rounded-xl animate-pulse delay-75"></div>
                <div className="h-28 bg-surface-container-low rounded-xl animate-pulse delay-150"></div>
                <div className="h-28 bg-surface-container-low rounded-xl animate-pulse delay-200"></div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const NewsletterSection = () => {
  return (
    <section className="bg-surface-container-low rounded-3xl p-6 md:p-10 border border-outline-variant/50 text-center relative overflow-hidden shadow-sm">
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <span className="material-symbols-outlined text-3xl text-primary">mail</span>
      </div>
      <h2 className="text-2xl md:text-3xl font-black text-primary font-headline tracking-tighter mb-3">No te pierdas de nada</h2>
      <p className="text-on-surface-variant mb-6 max-w-md mx-auto text-sm">
        Suscribite a nuestro boletín semanal y recibí las mejores oportunidades flash y tendencias antes que nadie.
      </p>
      
      <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 relative z-10" onSubmit={(e) => e.preventDefault()}>
        <input 
          type="email" 
          placeholder="Tu correo electrónico" 
          className="flex-1 bg-surface border border-outline-variant px-6 py-4 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-on-surface"
          required
        />
        <button type="submit" className="bg-primary text-on-primary font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 whitespace-nowrap">
          Suscribirme
        </button>
      </form>
      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-6 font-bold">
        Cero spam. Te podés dar de baja cuando quieras.
      </p>
    </section>
  );
};


const TESTIMONIALS = [
  {
    name: 'María González',
    location: 'Buenos Aires',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    rating: 5,
    text: 'Vendí mis muebles viejos en menos de 24 horas. La plataforma es súper intuitiva y los compradores se comunicaron rápido. ¡Increíble experiencia!',
    product: 'Juego de living completo'
  },
  {
    name: 'Carlos Rodríguez',
    location: 'Córdoba',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    rating: 5,
    text: 'Encontré exactamente lo que buscaba para mi taller a un precio imposible. La función de filtro por ubicación me ahorró mucho tiempo.',
    product: 'Herramientas de carpintería'
  },
  {
    name: 'Luciana Fernández',
    location: 'Rosario',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop',
    rating: 4,
    text: 'Arranqué vendiendo ropa que ya no usaba y ahora tengo mi propio emprendimiento acá. La comunidad es genial y el soporte siempre responde.',
    product: 'Ropa vintage'
  }
];

const TestimonialsSection = () => {
  return (
    <section>
      <div className="text-center mb-16">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 mb-6 font-bold text-[10px] tracking-widest uppercase border border-amber-500/20">
          <span className="material-symbols-outlined text-sm">format_quote</span>
          Historias reales
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight font-headline">Lo que dicen nuestros usuarios</h2>
        <p className="text-on-surface-variant mt-3 max-w-md mx-auto text-sm">Miles de personas ya confían en nosotros para comprar y vender.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="bg-surface rounded-2xl p-6 border border-outline-variant/30 shadow-sm hover:shadow-lg hover:border-secondary/30 transition-all relative group">
            {/* Quote mark */}
            <div className="absolute top-6 right-6 text-primary/5">
              <span className="material-symbols-outlined text-6xl">format_quote</span>
            </div>
            
            {/* Stars */}
            <div className="flex gap-1 mb-6">
              {Array(5).fill(0).map((_, s) => (
                <span key={s} className={`material-symbols-outlined text-lg ${s < t.rating ? 'text-amber-400' : 'text-outline-variant/50'}`} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              ))}
            </div>
            
            {/* Quote */}
            <p className="text-on-surface text-sm leading-relaxed mb-8 relative z-10">"{t.text}"</p>
            
            {/* Purchased tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 rounded-full mb-6">
              <span className="material-symbols-outlined text-green-600 text-xs">check_circle</span>
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Compró: {t.product}</span>
            </div>
            
            {/* Author */}
            <div className="flex items-center gap-4">
              <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-secondary/20" />
              <div>
                <h4 className="font-bold text-primary text-sm">{t.name}</h4>
                <p className="text-on-surface-variant text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">location_on</span>
                  {t.location}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const DynamicCategoriesSection = () => {
  const { userProfile } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    const fetchCols = async () => {
      try {
        const { getSeasonalCollections } = await import('../../lib/marketing');
        const data = await getSeasonalCollections();
        if (data && data.length > 0) {
          setCollections(data.filter((c: any) => c.active));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCols();
  }, []);
  
  // Logic for 7 days expiration
  let isRecentActive = false;
  if (userProfile?.lastInteraction) {
    const lastInteractionTime = typeof userProfile.lastInteraction.toMillis === 'function' 
      ? userProfile.lastInteraction.toMillis() 
      : (userProfile.lastInteraction.seconds ? userProfile.lastInteraction.seconds * 1000 : Date.now());
    isRecentActive = (Date.now() - lastInteractionTime) < 7 * 24 * 60 * 60 * 1000;
  }
  
  const recentSearches = userProfile?.recentSearches || [];
  const showPersonalized = isRecentActive && recentSearches.length >= 3;

  const getImageUrl = (term: string) => {
    const t = term.toLowerCase();
    if (t.includes('ropa') || t.includes('zapat') || t.includes('moda') || t.includes('campe')) return 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=800&auto=format&fit=crop';
    if (t.includes('auto') || t.includes('moto') || t.includes('vehicul') || t.includes('llanta')) return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop';
    if (t.includes('celular') || t.includes('tecnolog') || t.includes('pc') || t.includes('note') || t.includes('iphone')) return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=800&auto=format&fit=crop';
    if (t.includes('hogar') || t.includes('mueble') || t.includes('deco') || t.includes('silla')) return 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop';
    if (t.includes('herramienta') || t.includes('construccion') || t.includes('taller')) return 'https://images.unsplash.com/photo-1581147036324-c1724ac89965?q=80&w=800&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=800&auto=format&fit=crop';
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (showPersonalized) {
    const mainSearch = recentSearches[0];
    const subSearch1 = recentSearches[1];
    const subSearch2 = recentSearches[2];

    return (
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight font-headline mb-1">Inspirado en tu Búsqueda</h2>
            <p className="text-on-surface-variant">Porque estuviste buscando "{mainSearch}" y más</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[380px] lg:h-[440px]">
          <Link to={`/search?q=${encodeURIComponent(mainSearch)}`} className="md:col-span-2 md:row-span-2 bg-surface-container-low rounded-xl relative overflow-hidden group cursor-pointer min-h-[300px] block">
            <img alt={mainSearch} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={getImageUrl(mainSearch)}/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-300 mb-2 block">Búsqueda Principal</span>
              <h3 className="text-3xl font-bold text-white font-headline">{capitalize(mainSearch)}</h3>
            </div>
          </Link>
          <Link to={`/search?q=${encodeURIComponent(subSearch1)}`} className="md:col-span-2 bg-surface-container-high rounded-xl relative overflow-hidden group cursor-pointer min-h-[200px] block">
            <img alt={subSearch1} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={getImageUrl(subSearch1)}/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6">
              <h3 className="text-xl font-bold text-white font-headline">{capitalize(subSearch1)}</h3>
            </div>
          </Link>
          <Link to={`/search?q=${encodeURIComponent(subSearch2)}`} className="md:col-span-2 bg-surface-container rounded-xl relative overflow-hidden group cursor-pointer min-h-[200px] block">
            <img alt={subSearch2} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80" src={getImageUrl(subSearch2)}/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6">
              <h3 className="text-xl font-bold text-white font-headline">{capitalize(subSearch2)}</h3>
            </div>
          </Link>
        </div>
      </section>
    );
  }

  // Fallback: Colecciones Curadas (No history or expired)
  const renderList = collections.length > 0 ? collections : [
    { title: 'Armá tu Oficina en Casa', subtitle: 'Notebooks, sillas ergonómicas y monitores', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop', link: '/search?q=oficina', size: 'large' },
    { title: 'Renová tu Placard', image: 'https://images.unsplash.com/photo-1489987707023-af0825ae1eeb?q=80&w=800&auto=format&fit=crop', link: '/search?q=ropa', size: 'small' },
    { title: 'Para Emprendedores', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800&auto=format&fit=crop', link: '/search?q=herramientas', size: 'small' },
    { title: 'Ofertas Relámpago', subtitle: 'Precios que no vas a creer', link: '/deals', size: 'banner', bgColor: '#00668c', icon: 'local_fire_department' }
  ];

  return (
    <section>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight font-headline mb-1">Colecciones de Temporada</h2>
          <p className="text-on-surface-variant">Descubrí selecciones pensadas para vos</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[380px] lg:h-[440px]">
        {renderList.map((col: any, idx: number) => {
          const isLarge = col.size === 'large';
          const isBanner = col.size === 'banner';
          return (
            <Link 
              key={col.id || idx} 
              to={col.link || '/search'} 
              className={`rounded-xl relative overflow-hidden group cursor-pointer block ${isLarge ? 'md:col-span-2 md:row-span-2 min-h-[300px] bg-surface-container-low' : isBanner ? 'md:col-span-2 min-h-[200px] bg-primary flex items-center justify-center text-center' : 'md:col-span-1 min-h-[200px] bg-surface-container-high'}`}
              style={isBanner && col.bgColor ? { backgroundColor: col.bgColor } : {}}
            >
              {col.image ? (
                <img alt={col.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={col.image}/>
              ) : null}
              {col.image && !isLarge && <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>}
              
              <div className={isBanner ? "relative z-10 p-6" : `absolute bottom-0 left-0 p-6 w-full ${col.image ? 'bg-gradient-to-t from-black/80 via-black/40 to-transparent' : ''}`}>
                {isBanner && col.icon && <span className="material-symbols-outlined text-4xl text-white/90 mb-2">{col.icon}</span>}
                <h3 className={`font-bold text-white font-headline ${isLarge ? 'text-3xl md:text-4xl' : isBanner ? 'text-3xl font-black uppercase tracking-tighter' : 'text-xl'}`}>{col.title}</h3>
                {col.subtitle && <p className={`mt-1 ${isBanner ? 'text-white/80' : 'text-white/80 mt-2'}`}>{col.subtitle}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [recentProducts, setRecentProducts] = useState<(ItemData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [activeProvince, setActiveProvince] = useState<string>('');
  const [activeCity, setActiveCity] = useState<string>('');
  const [activeCondition, setActiveCondition] = useState<string>('');
  
  const [trendingIndex, setTrendingIndex] = useState(0);
  const [banners, setBanners] = useState<any[]>([]);

  useEffect(() => {
    document.title = 'Comprá, Vendé, ¡Ya! | Tu Mercado Online en Argentina';
    const fetchData = async () => {
      setLoading(true);
      const items = await getItems();
      setRecentProducts(items);
      
      const { getCategoryBanners } = await import('../../lib/marketing');
      const bannerData = await getCategoryBanners();
      setBanners(bannerData.filter(b => b.active));
      
      setLoading(false);
    };
    fetchData();
  }, []);

  const activeBanner = useMemo(() => {
    if (!activeCategory) return null;
    
    // Exact match against Categories constant
    const catObj = CATEGORIES.find(c => c.name === activeCategory || c.id === activeCategory);
    if (catObj) {
      const foundByCat = banners.find(b => b.categoryId === catObj.id || b.categoryId === catObj.name || b.categoryId.toLowerCase() === catObj.name.toLowerCase());
      if (foundByCat) return foundByCat;
    }
    
    // Direct match against banner title or categoryId
    return banners.find(b => 
      b.categoryId.toLowerCase() === activeCategory.toLowerCase() || 
      (b.title && b.title.toLowerCase().includes(activeCategory.toLowerCase()))
    );
  }, [activeCategory, banners]);

  const dynamicTrendingCategories = useMemo(() => {
    if (!recentProducts.length) return TRENDING_CATEGORIES;
    const catViews: Record<string, number> = {};
    recentProducts.forEach(p => {
      if (p.category) {
        catViews[p.category] = (catViews[p.category] || 0) + (p.views || 0);
      }
    });
    const sorted = Object.entries(catViews).sort((a, b) => b[1] - a[1]);
    const topCategories = sorted.slice(0, 3).map(entry => entry[0]);
    return topCategories.length > 0 ? topCategories : TRENDING_CATEGORIES;
  }, [recentProducts]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrendingIndex((prev) => (prev + 1) % dynamicTrendingCategories.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [dynamicTrendingCategories]);

  useEffect(() => {
    const handleReset = () => {
      handleClearFilters();
    };
    window.addEventListener('reset-home-filters', handleReset);
    return () => window.removeEventListener('reset-home-filters', handleReset);
  }, []);

  const handleClearFilters = () => {
    setActiveCategory(null);
    setActiveSubcategory('');
    setActiveProvince('');
    setActiveCity('');
    setActiveCondition('');
    setPriceRange({ min: '', max: '' });
  };

  const hasActiveFilters = activeCategory || activeSubcategory || activeProvince || activeCity || activeCondition || priceRange.min || priceRange.max;
  const selectedProvinceData = LOCATION_DATA.provinces.find(p => p.name === activeProvince);

  // Filter products logic
  const filteredProducts = recentProducts.filter(p => {
    if (activeCategory) {
      const catObj = CATEGORIES.find(c => c.name === activeCategory || c.id === activeCategory);
      const matchExact = p.category === activeCategory || (catObj && (p.category === catObj.id || p.category === catObj.name));
      const matchFuzzy = p.category && (
        p.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
        (activeCategory === 'Moda' && (p.category.toLowerCase().includes('ropa') || p.category.toLowerCase().includes('moda') || p.category.toLowerCase().includes('calzado') || p.category.toLowerCase().includes('fashion'))) ||
        (activeCategory === 'Tecnología' && (p.category.toLowerCase().includes('tecnolog') || p.category.toLowerCase().includes('comput') || p.category.toLowerCase().includes('celular') || p.category.toLowerCase().includes('laptop') || p.category.toLowerCase().includes('audio'))) ||
        (activeCategory === 'Hogar, Muebles y Jardín' && (p.category.toLowerCase().includes('hogar') || p.category.toLowerCase().includes('mueble') || p.category.toLowerCase().includes('espacio') || p.category.toLowerCase().includes('jardin'))) ||
        (activeCategory === 'Herramientas' && (p.category.toLowerCase().includes('herramienta') || p.category.toLowerCase().includes('taller') || p.category.toLowerCase().includes('accesorio')))
      );
      if (!matchExact && !matchFuzzy) return false;
    }
    if (activeSubcategory && p.subcategory !== activeSubcategory && p.category !== activeSubcategory) return false;
    if (priceRange.min && p.price < Number(priceRange.min)) return false;
    if (priceRange.max && p.price > Number(priceRange.max)) return false;
    if (activeCondition && p.condition !== activeCondition) return false;
    if (activeProvince && (!p.location || !p.location.includes(activeProvince))) return false;
    if (activeCity && (!p.location || !p.location.includes(activeCity))) return false;
    return true;
  });

  return (
    <div className="bg-background font-body text-on-surface w-full flex">
      <Helmet>
        <title>Tu Mercado Online en Argentina</title>
      </Helmet>

      {/* --- SIDEBAR PANEL DE FILTROS --- */}
      <aside className="hidden lg:block w-60 shrink-0 bg-surface sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar z-20 border-r border-outline-variant/50">
        <div className="p-5 space-y-7">
          <h2 className="text-lg font-bold text-on-surface font-headline tracking-tighter">Filtros</h2>

          <div className="space-y-6">
            {/* Categorías */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1">Categorías</label>
              <div className="relative">
                <select
                  value={activeCategory || ''}
                  onChange={(e) => {
                    setActiveCategory(e.target.value || null);
                    setActiveSubcategory('');
                  }}
                  className="w-full bg-surface border border-outline-variant rounded-lg py-2.5 px-3 text-xs font-medium focus:ring-2 focus:ring-primary outline-none transition-all appearance-none pr-10 text-on-surface"
                >
                  <option value="">Todas las categorías</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
              </div>

              {/* Subcategorías */}
              {activeCategory && CATEGORIES.find(c => c.name === activeCategory)?.categories && (
                <div className="relative animate-in slide-in-from-top-2 duration-300">
                  <select
                    value={activeSubcategory}
                    onChange={(e) => setActiveSubcategory(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 text-xs font-medium focus:ring-2 focus:ring-primary outline-none transition-all appearance-none pr-10 text-on-surface"
                  >
                    <option value="">Todas las subcategorías</option>
                    {CATEGORIES.find(c => c.name === activeCategory)?.categories.map(sub => (
                      <option key={sub.name} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              )}
            </div>

            {/* Estado */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1">Estado</label>
              <div className="relative">
                <select
                  value={activeCondition}
                  onChange={(e) => setActiveCondition(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-lg py-2.5 px-3 text-xs font-medium focus:ring-2 focus:ring-primary outline-none transition-all appearance-none pr-10 text-on-surface"
                >
                  <option value="">Todos los estados</option>
                  {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* Precio */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1">Precio</label>
              <div className="space-y-3">
                <div className="relative flex rounded-xl overflow-hidden border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary transition-all bg-surface">
                  <span className="bg-surface-container flex items-center justify-center px-4 border-r border-outline-variant text-on-surface-variant font-bold">$</span>
                  <input
                    type="number"
                    placeholder="Mínimo"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full py-2.5 px-3 text-xs outline-none font-medium text-on-surface bg-transparent"
                  />
                </div>
                <div className="relative flex rounded-xl overflow-hidden border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary transition-all bg-surface">
                  <span className="bg-surface-container flex items-center justify-center px-4 border-r border-outline-variant text-on-surface-variant font-bold">$</span>
                  <input
                    type="number"
                    placeholder="Máximo"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full py-2.5 px-3 text-xs outline-none font-medium text-on-surface bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1">Ubicación</label>
              <div className="space-y-3">
                <div className="relative">
                  <select
                    value={activeProvince}
                    onChange={(e) => {
                      setActiveProvince(e.target.value);
                      setActiveCity('');
                    }}
                    className="w-full bg-surface border border-outline-variant rounded-lg py-2.5 px-3 text-xs font-medium focus:ring-2 focus:ring-primary outline-none transition-all appearance-none pr-10 text-on-surface"
                  >
                    <option value="">Todas las provincias</option>
                    {LOCATION_DATA.provinces.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>

                <div className="relative">
                  <select
                    disabled={!activeProvince}
                    value={activeCity}
                    onChange={(e) => setActiveCity(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-lg py-2.5 px-3 text-xs font-medium focus:ring-2 focus:ring-primary outline-none transition-all appearance-none pr-10 text-on-surface disabled:opacity-50"
                  >
                    <option value="">Todas las ciudades</option>
                    {selectedProvinceData?.cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            {/* Borrar Filtros */}
            <div className="pt-4">
              <button
                onClick={handleClearFilters}
                className="w-full py-3 rounded-full border-2 border-[#FF7043] text-[#FF7043] font-bold text-sm hover:bg-[#FF7043] hover:text-white transition-all active:scale-95"
              >
                Borrar filtros
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 pt-0 md:pt-16 pb-16 overflow-x-hidden px-0 md:px-4 lg:px-8 w-full bg-background/50">
        
        {/* MOBILE SPECIFIC UI */}
        <MobileHeader variant="home" />
        
        <div className="md:hidden px-4 pt-4 pb-2 space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input 
              type="text"
              placeholder="Busca en el marketplace..."
              className="w-full bg-surface-container-low text-on-surface rounded-2xl py-4 pl-12 pr-4 font-medium outline-none border border-transparent focus:border-primary/20 transition-all shadow-sm"
              onClick={() => {
                // Navegar a búsqueda o abrir modal
              }}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x">
            <button 
              onClick={() => setActiveCategory(null)}
              className={`snap-start shrink-0 px-6 py-2 rounded-xl font-bold text-xs border flex items-center gap-2 transition-colors ${!activeCategory ? 'bg-primary text-on-primary shadow-md shadow-primary/20 border-primary' : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-low'}`}
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
              All
            </button>
            <button 
              onClick={() => setActiveCategory('Herramientas')}
              className={`snap-start shrink-0 px-6 py-2 rounded-xl font-bold text-xs border flex items-center gap-2 transition-colors ${activeCategory === 'Herramientas' ? 'bg-primary text-on-primary shadow-md shadow-primary/20 border-primary' : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-low'}`}
            >
              <span className="material-symbols-outlined text-sm">build</span>
              Tools
            </button>
            <button 
              onClick={() => setActiveCategory('Tecnología')}
              className={`snap-start shrink-0 px-6 py-2 rounded-xl font-bold text-xs border flex items-center gap-2 transition-colors ${activeCategory === 'Tecnología' ? 'bg-primary text-on-primary shadow-md shadow-primary/20 border-primary' : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-low'}`}
            >
              <span className="material-symbols-outlined text-sm">devices</span>
              Tech
            </button>
            <button 
              onClick={() => setActiveCategory('Hogar, Muebles y Jardín')}
              className={`snap-start shrink-0 px-6 py-2 rounded-xl font-bold text-xs border flex items-center gap-2 transition-colors ${activeCategory === 'Hogar, Muebles y Jardín' ? 'bg-primary text-on-primary shadow-md shadow-primary/20 border-primary' : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-low'}`}
            >
              <span className="material-symbols-outlined text-sm">chair</span>
              Hogar
            </button>
          </div>
        </div>
        
        {/* TEMPORARY SEED BUTTON */}
        {recentProducts.length === 0 && (
          <div className="max-w-screen-2xl mx-auto mb-8 bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-amber-900 text-lg">Modo Desarrollo: Base de datos vacía</h3>
              <p className="text-amber-700 text-sm">Parece que no hay productos publicados todavía.</p>
            </div>
            <button 
              onClick={async () => {
                const { seedMockData } = await import('../../lib/items');
                const { auth } = await import('../../lib/firebase');
                if (auth.currentUser) {
                  await seedMockData(auth.currentUser.uid);
                  alert("Datos generados exitosamente! Recarga la página (F5).");
                } else {
                  alert("Por favor iniciá sesión primero para poder generar los datos bajo tu usuario.");
                }
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg flex items-center gap-2"
            >
              <span className="material-symbols-outlined">database</span>
              Generar Datos de Prueba
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {hasActiveFilters ? (
            /* RESULTADOS DE BÚSQUEDA (MOSTRAR AL FILTRAR) */
            <motion.div 
              key="filtered"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-screen-2xl mx-auto"
            >
             {activeBanner && (
              <div className="w-full h-48 md:h-64 rounded-3xl overflow-hidden relative mb-8 shadow-xl shadow-primary/10">
                <img src={activeBanner.image} className="size-full object-cover" alt={activeBanner.title} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center p-8 md:p-12">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none">{activeBanner.title}</h2>
                  </div>
                </div>
              </div>
            )}
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-black text-primary font-headline">Resultados de Búsqueda</h2>
               <p className="text-sm text-on-surface-variant font-bold">{filteredProducts.length} productos encontrados</p>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 px-4 md:px-0">
                {loading ? (
                  Array(10).fill(0).map((_, i) => <SkeletonCard key={i} />)
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((p, idx) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (idx % 4) * 0.1 }}
                      className="editorial-shadow rounded-xl overflow-hidden h-full bg-surface"
                    >
                      <ProductCard product={p} location={p.location} />
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-32 text-center bg-surface rounded-[40px] border border-outline-variant/50 shadow-sm">
                    <div className="size-24 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-50">search_off</span>
                    </div>
                    <h3 className="text-2xl font-black mb-2 text-primary">Sin resultados</h3>
                    <p className="text-on-surface-variant mb-6 text-sm">No encontramos productos con estos filtros.</p>
                    <button onClick={handleClearFilters} className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all">Limpiar Filtros</button>
                  </div>
                )}
             </div>
            </motion.div>
          ) : (
            /* EDITORIAL LANDING PAGE (MOSTRAR SIN FILTROS) */
            <motion.div 
              key="unfiltered"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-screen-2xl mx-auto space-y-14"
            >
            
            {/* --- DYNAMIC HERO SECTION --- */}
            <HomeHero featuredItems={recentProducts.slice(0, 5)} />
            
            {/* --- DYNAMIC FLASH DEALS COMPONENT --- */}
            <FlashDealsSection />

            {/* --- DYNAMIC FEATURED DEALS COMPONENT --- */}
            <FeaturedDealsSection />

            {/* Category Exploration Grid (Dynamic) */}
            <DynamicCategoriesSection />

            {/* === ÚLTIMOS PUBLICADOS === */}
            <section>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-green-600">En vivo</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight font-headline mb-1">Últimos Publicados</h2>
                  <p className="text-on-surface-variant">Productos recién subidos por la comunidad</p>
                </div>
                <Link className="text-secondary font-bold flex items-center gap-2 group" to="/search">
                  Ver Más <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 px-4 md:px-0">
                {loading ? (
                  Array(10).fill(0).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                  recentProducts.slice(0, 10).map((p, idx) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (idx % 5) * 0.08 }}
                      className="editorial-shadow rounded-xl overflow-hidden h-full bg-surface"
                    >
                      <ProductCard product={p} location={p.location} />
                    </motion.div>
                  ))
                )}
              </div>
            </section>

            {/* === BARRA DE CONFIANZA === */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: 'verified_user', title: 'Pagos Seguros', desc: 'Transacciones protegidas' },
                { icon: 'shield_person', title: 'Vendedores Verificados', desc: 'Identidad confirmada' },
                { icon: 'support_agent', title: 'Soporte 24/7', desc: 'Siempre disponibles' },
                { icon: 'inventory_2', title: 'Miles de Productos', desc: 'Catálogo en crecimiento' },
              ].map((item, i) => (
                <div key={i} className="bg-surface rounded-2xl p-6 border border-outline-variant/30 flex flex-col items-center text-center gap-3 hover:border-secondary/40 hover:shadow-lg hover:shadow-secondary/5 transition-all group">
                  <div className="bg-secondary-container/15 p-4 rounded-2xl group-hover:bg-secondary-container/30 transition-colors">
                    <span className="material-symbols-outlined text-3xl text-secondary">{item.icon}</span>
                  </div>
                  <h4 className="font-bold text-primary text-sm">{item.title}</h4>
                  <p className="text-on-surface-variant text-xs">{item.desc}</p>
                </div>
              ))}
            </section>

            {/* === CÓMO FUNCIONA === */}
            <section className="bg-surface rounded-3xl p-6 lg:p-10 border border-outline-variant/30 shadow-sm">
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary mb-4 font-bold text-[9px] tracking-widest uppercase border border-primary/10">
                  <span className="material-symbols-outlined text-xs">help</span>
                  Nuevo por aquí?
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight font-headline">¿Cómo Funciona?</h2>
                <p className="text-on-surface-variant mt-3 max-w-md mx-auto text-sm">Vendé o comprá en 3 simples pasos. Sin complicaciones.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8">
                {/* Step 01 */}
                <div className="relative group">
                  <div className="hidden md:block absolute top-16 -right-6 lg:-right-8 w-12 lg:w-16 border-t-2 border-dashed border-outline-variant/50 z-10"></div>
                  <div className="bg-background rounded-3xl p-8 border border-outline-variant/30 hover:border-secondary/40 hover:shadow-xl hover:shadow-secondary/5 transition-all h-full flex flex-col items-center text-center">
                    <span className="text-4xl font-black text-primary/10 font-headline mb-1">01</span>
                    <div className="bg-primary/20 p-5 rounded-2xl mb-6">
                      <span className="material-symbols-outlined text-4xl text-primary">add_photo_alternate</span>
                    </div>
                    <h3 className="text-xl font-bold text-primary font-headline mb-3">Publicá tu Producto</h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed">Sacale fotos, ponele precio y listo. Tu publicación estará visible en minutos.</p>
                  </div>
                </div>
                {/* Step 02 */}
                <div className="relative group">
                  <div className="hidden md:block absolute top-16 -right-6 lg:-right-8 w-12 lg:w-16 border-t-2 border-dashed border-outline-variant/50 z-10"></div>
                  <div className="bg-background rounded-3xl p-8 border border-outline-variant/30 hover:border-secondary/40 hover:shadow-xl hover:shadow-secondary/5 transition-all h-full flex flex-col items-center text-center">
                    <span className="text-4xl font-black text-primary/10 font-headline mb-1">02</span>
                    <div className="bg-secondary-container/20 p-5 rounded-2xl mb-6">
                      <span className="material-symbols-outlined text-4xl text-secondary">handshake</span>
                    </div>
                    <h3 className="text-xl font-bold text-primary font-headline mb-3">Conectá con Compradores</h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed">Recibí ofertas y mensajes de personas interesadas en tu zona.</p>
                  </div>
                </div>
                {/* Step 03 */}
                <div className="relative group">
                  <div className="bg-background rounded-3xl p-8 border border-outline-variant/30 hover:border-secondary/40 hover:shadow-xl hover:shadow-secondary/5 transition-all h-full flex flex-col items-center text-center">
                    <span className="text-6xl font-black text-primary/10 font-headline mb-2">03</span>
                    <div className="bg-tertiary-container/20 p-5 rounded-2xl mb-6">
                      <span className="material-symbols-outlined text-4xl text-tertiary">payments</span>
                    </div>
                    <h3 className="text-xl font-bold text-primary font-headline mb-3">Vendé y Cobrá</h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed">Cerrá el trato de forma segura. Podés coordinar retiro o envío.</p>
                  </div>
                </div>
              </div>
            </section>




            {/* === PRODUCTOS CERCA DE TI === */}
            <NearbyProductsSection products={recentProducts} loading={loading} />

            {/* === TESTIMONIOS === */}
            {/* <TestimonialsSection /> */}



            {/* === APP DOWNLOAD BANNER === */}
            {/* <AppDownloadSection /> */}

            {/* === NEWSLETTER === */}
            <NewsletterSection />

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Home;
