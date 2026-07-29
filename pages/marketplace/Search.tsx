import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getItems, ItemData } from '../../lib/items';
import { CATEGORIES } from '../../lib/constants';
import { trackUserSearch } from '../../lib/users';
import { useAuth } from '../../lib/auth';
import SkeletonCard from '../../components/SkeletonCard';
import ProductCard from '../../components/ProductCard';
import { useNotification } from '../../context/NotificationContext';

const Search = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState('');
  const [allProducts, setAllProducts] = useState<(ItemData & { id: string, img: string, trust: number })[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000000]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [activeMasterCategory, setActiveMasterCategory] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const items = await getItems();
      const mappedItems = items.map(item => ({
        ...item,
        img: item.images?.[0] || 'https://picsum.photos/400/400?tech',
        trust: 9.5 + (Math.random() * 0.4) // Mock trust for now
      }));
      setAllProducts(mappedItems);
      setLoading(false);
    };
    fetchItems();

    const fetchBanners = async () => {
      const { getCategoryBanners } = await import('../../lib/marketing');
      const data = await getCategoryBanners();
      setBanners(data.filter(b => b.active));
    };
    fetchBanners();
  }, []);

  const query = useMemo(() => {
    const params = new URLSearchParams(location.search);
    let q = params.get('q');
    if (!q && location.hash.includes('?')) {
      const parts = location.hash.split('?');
      if (parts[1]) {
        const hashParams = new URLSearchParams(parts[1]);
        q = hashParams.get('q');
      }
    }
    return q || '';
  }, [location.search, location.hash]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catParam = params.get('category') || params.get('cat');
    if (catParam) {
      const found = CATEGORIES.find(c => c.id.toLowerCase() === catParam.toLowerCase() || c.name.toLowerCase() === catParam.toLowerCase());
      if (found) {
        setActiveCategory(found.name);
      } else {
        setActiveCategory(catParam);
      }
    }
  }, [location.search]);

  // Track search behavior
  useEffect(() => {
    if (user && query) {
      trackUserSearch(user.uid, query);
    }
  }, [user, query]);

  const results = useMemo(() => {
    let filtered = allProducts;

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        (Array.isArray(p.tags) ? p.tags.some((t: string) => t.toLowerCase().includes(q)) : typeof p.tags === 'string' && p.tags.toLowerCase().includes(q)) ||
        p.seoTitle?.toLowerCase().includes(q) ||
        p.seoDescription?.toLowerCase().includes(q)
      );
    }

    if (priceRange[0] > 0 || priceRange[1] < 2000000) {
      filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    }

    if (selectedConditions.length > 0) {
      const mappedConditions: Record<string, string> = {
        'Nuevo': 'new',
        'Como Nuevo': 'like_new',
        'Usado': 'good',
        'Desgastado': 'fair'
      };
      filtered = filtered.filter(p => {
        const readableCondition = Object.keys(mappedConditions).find(key => mappedConditions[key] === p.condition);
        return selectedConditions.includes(readableCondition || p.condition || '');
      });
    }

    if (activeCategory) {
      const catObj = CATEGORIES.find(c => c.name === activeCategory || c.id === activeCategory);
      filtered = filtered.filter(p => {
        const matchExact = p.category === activeCategory || (catObj && (p.category === catObj.id || p.category === catObj.name));
        const matchFuzzy = p.category && (
          p.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
          (activeCategory === 'Moda' && (p.category.toLowerCase().includes('ropa') || p.category.toLowerCase().includes('moda') || p.category.toLowerCase().includes('calzado') || p.category.toLowerCase().includes('fashion'))) ||
          (activeCategory === 'Tecnología' && (p.category.toLowerCase().includes('tecnolog') || p.category.toLowerCase().includes('comput') || p.category.toLowerCase().includes('celular') || p.category.toLowerCase().includes('laptop') || p.category.toLowerCase().includes('audio'))) ||
          (activeCategory === 'Hogar, Muebles y Jardín' && (p.category.toLowerCase().includes('hogar') || p.category.toLowerCase().includes('mueble') || p.category.toLowerCase().includes('espacio') || p.category.toLowerCase().includes('jardin'))) ||
          (activeCategory === 'Herramientas' && (p.category.toLowerCase().includes('herramienta') || p.category.toLowerCase().includes('taller') || p.category.toLowerCase().includes('accesorio')))
        );
        return matchExact || matchFuzzy;
      });
    }

    if (activeSubcategory) {
      filtered = filtered.filter(p => p.subcategory === activeSubcategory || p.category === activeSubcategory);
    }

    return filtered;
  }, [query, priceRange, selectedConditions, allProducts, activeCategory, activeSubcategory]);

  const activeBanner = useMemo(() => {
    const term = (activeCategory || query || '').toLowerCase().trim();
    if (!term) return null;

    // First try to find category match
    const catObj = CATEGORIES.find(c => 
      c.name.toLowerCase() === term || 
      c.id.toLowerCase() === term ||
      term.includes(c.name.toLowerCase()) ||
      term.includes(c.id.toLowerCase())
    );

    if (catObj) {
      const foundByCat = banners.find(b => b.categoryId === catObj.id || b.categoryId === catObj.name || b.categoryId.toLowerCase() === catObj.name.toLowerCase());
      if (foundByCat) return foundByCat;
    }

    // Direct match against banner title or categoryId
    return banners.find(b => 
      (b.title && b.title.toLowerCase().includes(term)) ||
      (b.categoryId && term.includes(b.categoryId.toLowerCase())) ||
      (term === 'zapatos' || term === 'ropa' || term === 'moda' ? b.categoryId === 'fashion' : false)
    ) || null;
  }, [activeCategory, query, banners]);

  const toggleCondition = (c: string) => {
    setSelectedConditions(prev => prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 min-h-screen bg-background font-body">
      {/* Header & Search Bar */}
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-surface p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="size-12 rounded-2xl bg-surface-container-low border border-outline-variant/50 flex items-center justify-center hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-xl text-on-surface">arrow_back</span>
          </button>
          <div>
            <p className="text-[9px] font-black uppercase text-on-surface-variant tracking-widest mb-0.5">Búsqueda</p>
            <h1 className="text-xl font-black text-primary tracking-tight font-headline">{query ? `Resultados: ${query}` : 'Todos los productos'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <form onSubmit={(e) => { e.preventDefault(); if (localSearch) navigate(`/search?q=${localSearch}`); }} className="relative flex-1 md:w-80 group">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full py-3 pl-6 pr-14 bg-surface-container-low border border-outline-variant/50 rounded-xl font-bold text-xs text-on-surface focus:bg-surface focus:border-primary/50 outline-none transition-all placeholder:text-on-surface-variant/50"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined">search</span>
            </button>
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`lg:hidden size-14 rounded-2xl flex items-center justify-center border transition-all ${showFilters ? 'bg-primary text-on-primary border-primary' : 'bg-surface text-on-surface border-outline-variant/50 shadow-sm'}`}
          >
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Filters Sidebar */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block lg:col-span-3 space-y-10 animate-in fade-in duration-500`}>
          <div className="bg-surface p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-8 pb-4 border-b border-outline-variant/30 flex items-center justify-between">
              Filtros
              <span className="material-symbols-outlined text-sm">filter_alt</span>
            </h3>

            {/* Price Filter */}
            <div className="mb-10">
              <p className="text-xs font-black text-on-surface uppercase tracking-tighter mb-6">Precio (ARS)</p>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="2000000"
                  step="10000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-on-surface-variant">Desde $0</span>
                  <span className="text-[10px] font-black text-on-surface bg-surface-container-low px-2 py-1 rounded">Hasta ${priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Condition Filter */}
            <div className="mb-10">
              <p className="text-xs font-black text-on-surface uppercase tracking-tighter mb-6">Condición</p>
              <div className="space-y-3">
                {['Nuevo', 'Como Nuevo', 'Usado'].map(c => (
                  <label key={c} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedConditions.includes(c)}
                      onChange={() => toggleCondition(c)}
                    />
                    <div className={`size-5 rounded-md border-2 transition-all flex items-center justify-center ${selectedConditions.includes(c) ? 'bg-primary border-primary' : 'border-outline-variant/50 group-hover:border-primary/50'}`}>
                      {selectedConditions.includes(c) && <span className="material-symbols-outlined text-on-primary text-xs font-black">check</span>}
                    </div>
                    <span className={`text-[11px] font-bold transition-colors ${selectedConditions.includes(c) ? 'text-on-surface' : 'text-on-surface-variant'}`}>{c}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-10">
              <p className="text-xs font-black text-on-surface uppercase tracking-tighter mb-6">Categoría Principal</p>
              <div className="space-y-4">
                <select
                  value={activeCategory}
                  className="w-full p-3 bg-surface-container-low border border-outline-variant/50 rounded-xl text-xs font-bold text-on-surface outline-none focus:border-primary/50"
                  onChange={(e) => {
                    setActiveCategory(e.target.value);
                    setActiveSubcategory('');
                  }}
                >
                  <option value="">Todas las categorías</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>

                {activeCategory && CATEGORIES.find(c => c.name === activeCategory)?.categories && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-2 ml-1">Específicamente en</p>
                    <select
                      value={activeSubcategory}
                      className="w-full p-3 bg-surface-container border border-outline-variant/50 rounded-xl text-[10px] font-black uppercase text-on-surface outline-none focus:border-primary/50"
                      onChange={(e) => setActiveSubcategory(e.target.value)}
                    >
                      <option value="">Cualquier subcategoría</option>
                      {CATEGORIES.find(c => c.name === activeCategory)?.categories.map(sub => (
                        <option key={sub.name} value={sub.name}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Institutional Meta */}
            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="flex items-center gap-2 text-primary mb-3">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <p className="text-[9px] font-black uppercase tracking-widest leading-none">Compra Segura</p>
              </div>
              <p className="text-[9px] text-on-surface-variant font-medium leading-relaxed">Tu dinero está protegido. Solo liberamos el pago cuando recibís tu producto.</p>
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="lg:col-span-9 space-y-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">{results.length} resultados</p>
            <select className="bg-transparent text-[10px] font-black uppercase tracking-widest text-on-surface outline-none cursor-pointer">
              <option>Más Relevantes</option>
              <option>Menor Precio</option>
              <option>Mayor Precio</option>
            </select>
          </div>

          {activeBanner && (
            <div className="w-full h-48 md:h-64 rounded-[2.5rem] overflow-hidden relative shadow-premium animate-in zoom-in-95 duration-500 mb-8">
              <img src={activeBanner.image} className="size-full object-cover" alt={activeBanner.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-800/80 via-dark-800/20 to-transparent flex flex-col justify-end p-10">
                <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white w-fit mb-4 border border-white/10">
                  Sección Destacada
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none">{activeBanner.title}</h2>
              </div>
            </div>
          )}

          {loading ? (
            // Show skeleton cards while loading
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="bg-surface py-32 text-center rounded-3xl border border-outline-variant/30 shadow-sm">
              <div className="size-20 bg-surface-container-low rounded-2xl flex items-center justify-center mx-auto mb-8">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">search_off</span>
              </div>
              <h2 className="text-xl font-black text-primary mb-4 uppercase tracking-widest font-headline">No hay resultados</h2>
              <p className="text-sm text-on-surface-variant max-w-xs mx-auto font-medium">Intentá ajustar los filtros o buscar con otras palabras.</p>
              <button
                onClick={() => {
                  setPriceRange([0, 2000000]);
                  setSelectedConditions([]);
                  setActiveCategory('');
                  setActiveSubcategory('');
                }}
                className="mt-10 bg-secondary text-on-secondary px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Limpiar Filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
