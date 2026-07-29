import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useNotification } from '../context/NotificationContext';
import { triggerHaptic } from '../lib/haptics';
import {
    checkIsFavorite,
    toggleFavorite,
    updateFavoriteLists,
    getFavoriteLists,
    addFavoriteList
} from '../lib/interactions';

interface FavoriteButtonProps {
    product: {
        id: string;
        title: string;
        price: number;
        image?: string;
        sellerName?: string;
    };
    className?: string;
    showText?: boolean;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ product, className = '', showText = false }) => {
    const { user } = useAuth();
    const { notify } = useNotification();

    const [isFav, setIsFav] = useState(false);
    const [selectedLists, setSelectedLists] = useState<string[]>([]);
    const [allLists, setAllLists] = useState<string[]>(['General']);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && product?.id) {
            checkIsFavorite(user.uid, product.id).then(res => {
                setIsFav(res.isFavorite);
                setSelectedLists(res.lists || ['General']);
            });
            getFavoriteLists(user.uid).then(lists => {
                setAllLists(lists);
            });
        }
    }, [user, product?.id]);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            notify({
                type: 'error',
                title: 'Acceso requerido',
                message: 'Inicia sesión para guardar productos en favoritos y armar listas.',
                icon: 'lock'
            });
            return;
        }

        triggerHaptic('medium');

        // Refresh available lists
        const lists = await getFavoriteLists(user.uid);
        setAllLists(lists);

        if (!isFav) {
            // Instantly add to General list
            setLoading(true);
            try {
                const res = await toggleFavorite(user.uid, product.id, {
                    title: product.title,
                    price: product.price,
                    image: product.image || '',
                    sellerName: product.sellerName || 'Vendedor'
                }, 'General');
                setIsFav(res.isFavorite);
                setSelectedLists(res.lists);
                notify({
                    type: 'success',
                    title: '¡Guardado en Favoritos!',
                    message: 'Se agregó a tu lista General. Puedes organizar tus listas.',
                    icon: 'favorite'
                });
                setIsModalOpen(true); // Open modal for list management
            } catch (err) {
                notify({ type: 'error', title: 'Error', message: 'No se pudo guardar el favorito.', icon: 'error' });
            } finally {
                setLoading(false);
            }
        } else {
            // Already a fav, open modal to manage lists or remove
            setIsModalOpen(true);
        }
    };

    const handleToggleList = async (listName: string) => {
        if (!user) return;
        setLoading(true);
        try {
            let nextLists: string[];
            if (selectedLists.includes(listName)) {
                nextLists = selectedLists.filter(l => l !== listName);
            } else {
                nextLists = [...selectedLists, listName];
            }

            const res = await updateFavoriteLists(user.uid, product.id, nextLists, {
                title: product.title,
                price: product.price,
                image: product.image || '',
                sellerName: product.sellerName || 'Vendedor'
            });

            setIsFav(res.isFavorite);
            setSelectedLists(res.lists);

            if (!res.isFavorite) {
                notify({ type: 'info', title: 'Eliminado', message: 'Producto removido de tus favoritos.', icon: 'favorite_border' });
                setIsModalOpen(false);
            } else {
                triggerHaptic('light');
            }
        } catch (err) {
            notify({ type: 'error', title: 'Error', message: 'No se pudieron actualizar tus listas.', icon: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newListName.trim()) return;

        const cleanName = newListName.trim();
        setLoading(true);
        try {
            const updatedAll = await addFavoriteList(user.uid, cleanName);
            setAllLists(updatedAll);
            setNewListName('');

            // Add product to this new list automatically
            const nextLists = Array.from(new Set([...selectedLists, cleanName]));
            const res = await updateFavoriteLists(user.uid, product.id, nextLists, {
                title: product.title,
                price: product.price,
                image: product.image || '',
                sellerName: product.sellerName || 'Vendedor'
            });

            setIsFav(res.isFavorite);
            setSelectedLists(res.lists);
            triggerHaptic('medium');
            notify({
                type: 'success',
                title: 'Lista creada',
                message: `Se creó la lista "${cleanName}" y se agregó este producto.`,
                icon: 'playlist_add_check'
            });
        } catch (err) {
            notify({ type: 'error', title: 'Error', message: 'No se pudo crear la lista.', icon: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAll = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await updateFavoriteLists(user.uid, product.id, []);
            setIsFav(false);
            setSelectedLists([]);
            setIsModalOpen(false);
            notify({ type: 'info', title: 'Eliminado', message: 'Producto removido de todos tus favoritos.', icon: 'delete' });
        } catch (err) {
            notify({ type: 'error', title: 'Error', message: 'No se pudo eliminar de favoritos.', icon: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={handleClick}
                className={`flex items-center justify-center transition-all ${className ? className : 'size-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:scale-110 active:scale-95 text-primary'}`}
                title={isFav ? "En tus favoritos (click para organizar listas)" : "Guardar en favoritos"}
            >
                <span className={`material-symbols-outlined text-xl transition-transform ${isFav ? 'text-rose-600 font-fill scale-110' : 'text-slate-700'}`}>
                    favorite
                </span>
                {showText && (
                    <span className="ml-2 text-xs font-bold uppercase tracking-wider">
                        {isFav ? 'Guardado' : 'Favorito'}
                    </span>
                )}
            </button>

            {/* List Management Modal */}
            {isModalOpen && (
                <div
                    onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 text-left relative"
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-6 right-6 size-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-600 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm font-black">close</span>
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-2xl font-fill">favorite</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 leading-tight">Guardar en Favoritos</h3>
                                <p className="text-xs font-bold text-slate-500 line-clamp-1">{product.title}</p>
                            </div>
                        </div>

                        {/* List of checkboxes */}
                        <div className="space-y-2 mb-6 max-h-[220px] overflow-y-auto pr-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Selecciona tus listas</p>
                            {allLists.map((list) => {
                                const isChecked = selectedLists.includes(list);
                                return (
                                    <div
                                        key={list}
                                        onClick={() => !loading && handleToggleList(list)}
                                        className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${isChecked ? 'border-rose-500 bg-rose-50/50 text-rose-950 font-bold' : 'border-slate-100 hover:border-slate-300 text-slate-700'}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className={`material-symbols-outlined text-lg ${isChecked ? 'text-rose-600 font-fill' : 'text-slate-400'}`}>
                                                {list === 'General' ? 'bookmark' : 'folder_special'}
                                            </span>
                                            <span className="text-sm truncate">{list}</span>
                                        </div>
                                        <div className={`size-6 rounded-lg flex items-center justify-center transition-colors ${isChecked ? 'bg-rose-600 text-white shadow-sm' : 'border border-slate-300 bg-white'}`}>
                                            {isChecked && <span className="material-symbols-outlined text-sm font-black">check</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Create new list form */}
                        <form onSubmit={handleCreateList} className="pt-4 border-t border-slate-100 mb-6">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Crear nueva lista</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    placeholder="Ej: Regalos, Para mi PC, etc."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition-colors"
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !newListName.trim()}
                                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1 shrink-0 shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span> Crear
                                </button>
                            </div>
                        </form>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={handleRemoveAll}
                                disabled={loading}
                                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span> Quitar de favoritos
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all"
                            >
                                Listo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FavoriteButton;
