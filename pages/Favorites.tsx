import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useNotification } from '../context/NotificationContext';
import { triggerHaptic } from '../lib/haptics';
import { HeartIcon, StoreIcon, FolderIcon, TrashIcon, UserIcon } from '../components/animate-ui/icons';
import {
    getUserFavorites,
    getFavoriteLists,
    addFavoriteList,
    updateFavoriteLists,
    getFollowedSellers,
    toggleFollow,
    FavoriteItem,
    FollowedSeller
} from '../lib/interactions';

export const Favorites: React.FC = () => {
    const { user } = useAuth();
    const { notify } = useNotification();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const initialTab = searchParams.get('tab') === 'sellers' ? 'sellers' : 'products';
    const [activeTab, setActiveTab] = useState<'products' | 'sellers'>(initialTab);
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [lists, setLists] = useState<string[]>(['General']);
    const [selectedList, setSelectedList] = useState<string>('General');
    const [followedSellers, setFollowedSellers] = useState<FollowedSeller[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [newListName, setNewListName] = useState('');

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [favsData, listsData, sellersData] = await Promise.all([
                getUserFavorites(user.uid),
                getFavoriteLists(user.uid),
                getFollowedSellers(user.uid)
            ]);
            setFavorites(favsData);
            setLists(listsData);
            if (!listsData.includes(selectedList) && listsData.length > 0) {
                setSelectedList(listsData[0]);
            }
            setFollowedSellers(sellersData);
        } catch (err) {
            console.error('Error loading favorites data:', err);
            notify({ type: 'error', title: 'Error', message: 'No se pudieron cargar tus favoritos.', icon: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        fetchData();
    }, [user]);

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newListName.trim()) return;

        const cleanName = newListName.trim();
        try {
            const updatedLists = await addFavoriteList(user.uid, cleanName);
            setLists(updatedLists);
            setSelectedList(cleanName);
            setNewListName('');
            setIsCreatingList(false);
            triggerHaptic('medium');
            notify({ type: 'success', title: 'Lista creada', message: `Tu lista "${cleanName}" está lista.`, icon: 'playlist_add_check' });
        } catch (err) {
            notify({ type: 'error', title: 'Error', message: 'No se pudo crear la lista.', icon: 'error' });
        }
    };

    const handleRemoveFavorite = async (productId: string, title: string) => {
        if (!user) return;
        try {
            await updateFavoriteLists(user.uid, productId, []);
            setFavorites(prev => prev.filter(f => f.productId !== productId));
            triggerHaptic('light');
            notify({ type: 'info', title: 'Removido', message: `Se eliminó "${title}" de tus favoritos.`, icon: 'delete' });
        } catch (err) {
            notify({ type: 'error', title: 'Error', message: 'No se pudo eliminar el producto.', icon: 'error' });
        }
    };

    const handleMoveList = async (item: FavoriteItem, targetList: string) => {
        if (!user) return;
        try {
            const currentLists = item.lists || ['General'];
            let nextLists: string[];
            if (currentLists.includes(targetList)) {
                nextLists = currentLists.filter(l => l !== targetList);
                if (nextLists.length === 0) nextLists = ['General'];
            } else {
                nextLists = [...currentLists, targetList];
            }

            await updateFavoriteLists(user.uid, item.productId, nextLists, {
                title: item.title,
                price: item.price,
                image: item.image,
                sellerName: item.sellerName
            });

            setFavorites(prev => prev.map(f => f.productId === item.productId ? { ...f, lists: nextLists } : f));
            triggerHaptic('light');
            notify({ type: 'success', title: 'Lista actualizada', message: 'Se cambió la lista del producto.', icon: 'check_circle' });
        } catch (err) {
            notify({ type: 'error', title: 'Error', message: 'No se pudo mover el producto.', icon: 'error' });
        }
    };

    const handleUnfollowSeller = async (sellerId: string, sellerName: string) => {
        if (!user) return;
        try {
            await toggleFollow(user.uid, sellerId, user.displayName || 'Alguien');
            setFollowedSellers(prev => prev.filter(s => s.followedId !== sellerId));
            triggerHaptic('light');
            notify({ type: 'info', title: 'Dejaste de seguir', message: `Ya no sigues a ${sellerName}.`, icon: 'person_remove' });
        } catch (err) {
            notify({ type: 'error', title: 'Error', message: 'No se pudo procesar la acción.', icon: 'error' });
        }
    };

    const filteredFavorites = favorites.filter(f => (f.lists || ['General']).includes(selectedList));

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 py-16 px-4">
                <div className="max-w-[1280px] mx-auto animate-pulse space-y-8">
                    <div className="h-20 bg-slate-200 rounded-3xl max-w-md" />
                    <div className="h-12 bg-slate-200 rounded-2xl max-w-lg" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array(8).fill(0).map((_, i) => <div key={i} className="h-80 bg-slate-200 rounded-3xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8 font-body">
            <div className="max-w-[1280px] mx-auto space-y-10">

                {/* Header Title */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 sm:p-10 rounded-[36px] shadow-sm border border-slate-100">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest">
                                Espacio Guardado
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-headline">
                            Favoritos y Siguiendo
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
                            Organiza tus listas de compras y sigue de cerca a tus vendedores preferidos.
                        </p>
                    </div>

                    {/* Main Tabs */}
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
                        <button
                            onClick={() => { setActiveTab('products'); triggerHaptic('light'); }}
                            className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'products'
                                ? 'bg-white text-slate-900 shadow-md translate-y-[-1px]'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            <HeartIcon size={18} className="text-rose-500" filled />
                            Listas de Productos ({favorites.length})
                        </button>
                        <button
                            onClick={() => { setActiveTab('sellers'); triggerHaptic('light'); }}
                            className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'sellers'
                                ? 'bg-white text-slate-900 shadow-md translate-y-[-1px]'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            <StoreIcon size={18} className="text-sky-600" />
                            Vendedores Guardados ({followedSellers.length})
                        </button>
                    </div>
                </div>

                {/* CONTENT AREA: PRODUCTS & LISTS */}
                {activeTab === 'products' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
                        
                        {/* Sub-Tabs: List Selector */}
                        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2 pl-2">Mis Listas:</span>
                                {lists.map(list => (
                                    <button
                                        key={list}
                                        onClick={() => { setSelectedList(list); triggerHaptic('light'); }}
                                        className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${selectedList === list
                                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/25 scale-105'
                                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                                            }`}
                                    >
                                        <FolderIcon size={16} />
                                        {list}
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${selectedList === list ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                            {favorites.filter(f => (f.lists || ['General']).includes(list)).length}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Create List trigger */}
                            {!isCreatingList ? (
                                <button
                                    onClick={() => setIsCreatingList(true)}
                                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm ml-auto"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span> Nueva Lista
                                </button>
                            ) : (
                                <form onSubmit={handleCreateList} className="flex items-center gap-2 animate-in zoom-in-95 duration-200 ml-auto w-full sm:w-auto">
                                    <input
                                        type="text"
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        placeholder="Nombre de la lista..."
                                        autoFocus
                                        className="bg-slate-50 border border-rose-300 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-colors"
                                    >
                                        Crear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingList(false)}
                                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm leading-none">close</span>
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Products Grid */}
                        {filteredFavorites.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {filteredFavorites.map((item) => (
                                    <div
                                        key={item.productId}
                                        className="bg-white rounded-[32px] p-4 border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col group relative overflow-hidden"
                                    >
                                        {/* Image */}
                                        <Link to={`/product/${item.productId}`} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 relative mb-4 block">
                                            <img
                                                src={item.image || 'https://picsum.photos/400/400?tech'}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                                <span className="text-white text-[10px] font-black uppercase tracking-widest bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg">
                                                    Ver Producto
                                                </span>
                                            </div>
                                        </Link>

                                        {/* Content */}
                                        <div className="flex-1 flex flex-col justify-between px-1">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                                    {item.sellerName || 'Vendedor'}
                                                </p>
                                                <Link to={`/product/${item.productId}`} className="font-bold text-slate-800 text-sm hover:text-rose-600 transition-colors line-clamp-2 leading-snug mb-2">
                                                    {item.title}
                                                </Link>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                                <span className="text-lg font-black text-slate-900">
                                                    ${item.price?.toLocaleString()}
                                                </span>

                                                <div className="flex items-center gap-1">
                                                    {/* Move list dropdown / button */}
                                                    <div className="relative group/menu">
                                                        <button
                                                            title="Organizar en listas"
                                                            className="size-9 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-base">folder_special</span>
                                                        </button>
                                                        
                                                        {/* Mini Dropdown menu */}
                                                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 opacity-0 pointer-events-none group-hover/menu:opacity-100 group-hover/menu:pointer-events-auto transition-all z-30">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 p-2 border-b border-slate-50">
                                                                Mover o copiar a:
                                                            </p>
                                                            {lists.map(l => {
                                                                const inThisList = (item.lists || ['General']).includes(l);
                                                                return (
                                                                    <button
                                                                        key={l}
                                                                        onClick={() => handleMoveList(item, l)}
                                                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${inThisList ? 'bg-rose-50 text-rose-700' : 'hover:bg-slate-50 text-slate-700'}`}
                                                                    >
                                                                        <span className="truncate">{l}</span>
                                                                        {inThisList && <span className="material-symbols-outlined text-sm font-black">check</span>}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Remove Button */}
                                                    <button
                                                        onClick={() => handleRemoveFavorite(item.productId, item.title)}
                                                        title="Eliminar de favoritos"
                                                        className="size-9 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center transition-colors"
                                                    >
                                                        <TrashIcon size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
                                <div className="size-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-4xl font-fill">favorite</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">No hay productos en esta lista</h3>
                                <p className="text-sm font-bold text-slate-400 max-w-md mx-auto mb-8">
                                    Explora el marketplace y haz clic en el corazón <span className="text-rose-500 font-fill">♥</span> de cualquier producto para guardarlo en "{selectedList}".
                                </p>
                                <Link
                                    to="/"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-rose-500/25 transition-all hover:scale-105"
                                >
                                    <span className="material-symbols-outlined text-base">explore</span> Explora Productos
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* CONTENT AREA: FOLLOWED SELLERS */}
                {activeTab === 'sellers' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
                        {followedSellers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {followedSellers.map((seller) => (
                                    <div
                                        key={seller.followedId}
                                        className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all flex items-center justify-between gap-4 group"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="size-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-600 p-0.5 shrink-0 shadow-md">
                                                <img
                                                    src={seller.avatar || 'https://picsum.photos/100/100?avatar'}
                                                    alt={seller.name}
                                                    className="w-full h-full object-cover rounded-[14px] bg-white"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="material-symbols-outlined text-base text-amber-500 font-fill">star</span>
                                                    <span className="text-xs font-black text-slate-900">
                                                        {seller.reputation?.toFixed(1) || '5.0'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        Verificado
                                                    </span>
                                                </div>
                                                <h4 className="font-black text-slate-900 text-base truncate group-hover:text-sky-700 transition-colors">
                                                    {seller.name}
                                                </h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    Tienda Oficial
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 shrink-0">
                                            <Link
                                                to={`/shop/${seller.slug || seller.followedId}`}
                                                className="px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5"
                                            >
                                                <StoreIcon size={16} /> Tienda
                                            </Link>
                                            <button
                                                onClick={() => handleUnfollowSeller(seller.followedId, seller.name)}
                                                className="px-3 py-2 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <UserIcon remove size={16} /> Dejar de seguir
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
                                <div className="size-20 bg-sky-50 text-sky-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-4xl">storefront</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">Aún no sigues a ningún vendedor</h3>
                                <p className="text-sm font-bold text-slate-400 max-w-md mx-auto mb-8">
                                    Cuando encuentres tiendas que te gusten, haz clic en "Seguir Vendedor" para tener acceso rápido a sus nuevos productos y novedades.
                                </p>
                                <Link
                                    to="/"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-sky-700 hover:bg-sky-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-sky-600/25 transition-all hover:scale-105"
                                >
                                    <span className="material-symbols-outlined text-base">search</span> Buscar Tiendas
                                </Link>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default Favorites;
