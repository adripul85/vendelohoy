import React, { useState } from 'react';
import { SeasonalCollection, upsertSeasonalCollection, deleteSeasonalCollection } from '../../lib/marketing';
import { useNotification } from '../../context/NotificationContext';
import { uploadFile } from '../../lib/storage';
import ImageCropper from '../ui/ImageCropper';

interface Props {
    collections: SeasonalCollection[];
    onUpdate: () => void;
}

export const MarketingCollectionManager: React.FC<Props> = ({ collections, onUpdate }) => {
    const { notify } = useNotification();
    const [editingItem, setEditingItem] = useState<Partial<SeasonalCollection> | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.addEventListener('load', () => setCropImageSrc(reader.result?.toString() || null));
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedFile: File) => {
        setIsUploading(true);
        setCropImageSrc(null);
        try {
            const url = await uploadFile(croppedFile, `marketing/collections/${Date.now()}_${croppedFile.name}`);
            setEditingItem(prev => prev ? { ...prev, image: url } : { image: url });
            notify({ type: 'success', title: 'Imagen Subida', message: 'La imagen de colección se cargó y recortó correctamente.', icon: 'cloud_done' });
        } catch (e) {
            console.error('Error uploading collection image:', e);
            notify({ type: 'error', title: 'Error de Carga', message: 'No se pudo subir la imagen.', icon: 'cloud_off' });
        }
        setIsUploading(false);
    };

    const handleSave = async () => {
        if (!editingItem?.title || !editingItem?.link || !editingItem?.size) {
            notify({ type: 'warning', title: 'Faltan datos', message: 'Completa el título, enlace y tamaño.', icon: 'warning' });
            return;
        }

        setIsSaving(true);
        try {
            await upsertSeasonalCollection({
                title: editingItem.title,
                subtitle: editingItem.subtitle || '',
                image: editingItem.image || '',
                link: editingItem.link,
                size: editingItem.size,
                bgColor: editingItem.bgColor || '#00668c',
                icon: editingItem.icon || 'local_fire_department',
                active: editingItem.active ?? true,
                order: editingItem.order || collections.length + 1,
                id: editingItem.id
            });
            notify({ type: 'success', title: 'Colección Guardada', message: 'La colección de temporada fue actualizada.', icon: 'auto_awesome_mosaic' });
            setEditingItem(null);
            onUpdate();
        } catch (e) {
            console.error('Error saving collection:', e);
            notify({ type: 'error', title: 'Error', message: 'No se pudo guardar la colección.', icon: 'error' });
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar esta colección?')) {
            await deleteSeasonalCollection(id);
            onUpdate();
        }
    };

    const handleSeedDefaults = async () => {
        if (!confirm('¿Cargar las 4 colecciones base de la plantilla (Imagen 1)?')) return;
        setIsSaving(true);
        try {
            const defaults: SeasonalCollection[] = [
                { title: 'Armá tu Oficina en Casa', subtitle: 'Notebooks, sillas ergonómicas y monitores', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop', link: '/search?q=oficina', size: 'large', active: true, order: 1 },
                { title: 'Renová tu Placard', image: 'https://images.unsplash.com/photo-1489987707023-af0825ae1eeb?q=80&w=800&auto=format&fit=crop', link: '/search?q=ropa', size: 'small', active: true, order: 2 },
                { title: 'Para Emprendedores', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800&auto=format&fit=crop', link: '/search?q=herramientas', size: 'small', active: true, order: 3 },
                { title: 'Ofertas Relámpago', subtitle: 'Precios que no vas a creer', link: '/deals', size: 'banner', bgColor: '#00668c', icon: 'local_fire_department', active: true, order: 4 }
            ];
            for (const item of defaults) {
                await upsertSeasonalCollection(item);
            }
            notify({ type: 'success', title: 'Plantilla Cargada', message: 'Las colecciones de temporada iniciales se crearon con éxito.', icon: 'check_circle' });
            onUpdate();
        } catch (e) {
            console.error('Error seeding collections:', e);
            notify({ type: 'error', title: 'Error', message: 'No se pudo cargar la plantilla base.', icon: 'error' });
        }
        setIsSaving(false);
    };

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Colecciones de Temporada</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-relaxed">Configura la grilla promocional de colecciones pensadas para tus usuarios (Imagen 1).</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {collections.length === 0 && (
                        <button
                            onClick={handleSeedDefaults}
                            disabled={isSaving}
                            className="bg-slate-800 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-md"
                        >
                            <span className="material-symbols-outlined text-sm">auto_fix</span>
                            Cargar Plantilla Base
                        </button>
                    )}
                    <button
                        onClick={() => setEditingItem({ active: true, size: 'large', order: collections.length + 1 })}
                        className="bg-primary-vibrant text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary-500/20"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Nueva Colección
                    </button>
                </div>
            </div>

            {/* Grid Preview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {collections.map(item => {
                    const isLarge = item.size === 'large';
                    const isBanner = item.size === 'banner';
                    return (
                        <div 
                            key={item.id} 
                            className={`bg-white rounded-[32px] border-2 border-slate-200/60 overflow-hidden shadow-premium group relative flex flex-col justify-between ${isLarge ? 'md:col-span-2 md:row-span-2 min-h-[300px]' : isBanner ? 'md:col-span-2 min-h-[200px]' : 'md:col-span-1 min-h-[200px]'}`}
                            style={isBanner && item.bgColor ? { backgroundColor: item.bgColor } : {}}
                        >
                            {item.image ? (
                                <img src={item.image} className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                            ) : null}
                            <div className={`absolute inset-0 ${item.image ? 'bg-gradient-to-t from-black/80 via-black/30 to-transparent' : 'bg-primary/90'} flex flex-col justify-end p-6 z-10`}>
                                {item.icon && !item.image && (
                                    <span className="material-symbols-outlined text-3xl text-white/80 mb-2">{item.icon}</span>
                                )}
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-lime-400 mb-1">
                                    {item.size === 'large' ? 'Destacado 2x2' : item.size === 'banner' ? 'Banner Ancho 2x1' : 'Tarjeta 1x1'}
                                </span>
                                <h3 className={`font-black text-white font-headline ${isLarge ? 'text-2xl md:text-3xl' : 'text-lg'}`}>{item.title}</h3>
                                {item.subtitle && <p className="text-xs text-white/80 mt-1 font-medium">{item.subtitle}</p>}
                                <p className="text-[9px] font-mono text-white/50 mt-2 truncate">🔗 {item.link}</p>
                            </div>

                            {/* Actions Overlay */}
                            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
                                <button
                                    onClick={() => setEditingItem(item)}
                                    className="size-8 rounded-xl bg-white/10 text-white hover:bg-white hover:text-black flex items-center justify-center transition-all"
                                    title="Editar"
                                >
                                    <span className="material-symbols-outlined text-sm font-black">edit</span>
                                </button>
                                <button
                                    onClick={() => item.id && handleDelete(item.id)}
                                    className="size-8 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all"
                                    title="Eliminar"
                                >
                                    <span className="material-symbols-outlined text-sm font-black">delete</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal / Form */}
            {editingItem && (
                <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-[40px] max-w-2xl w-full p-8 md:p-10 shadow-2xl max-h-[90vh] overflow-y-auto border border-light-200">
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-xl font-black text-dark-800 uppercase tracking-tight">
                                    {editingItem.id ? 'Editar Colección' : 'Nueva Colección'}
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Configuración visual y destino de enlace</p>
                            </div>
                            <button onClick={() => setEditingItem(null)} className="size-10 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Título de Colección</label>
                                    <input 
                                        type="text" 
                                        value={editingItem.title || ''} 
                                        onChange={e => setEditingItem({...editingItem, title: e.target.value})} 
                                        className="w-full bg-light-50 border-none rounded-2xl p-4 font-black text-sm uppercase tracking-wider" 
                                        placeholder="EJ: ARMÁ TU OFICINA EN CASA" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Formato / Tamaño en Grilla</label>
                                    <select 
                                        value={editingItem.size || 'large'} 
                                        onChange={e => setEditingItem({...editingItem, size: e.target.value as any})}
                                        className="w-full bg-light-50 border-none rounded-2xl p-4 font-bold text-sm"
                                    >
                                        <option value="large">Destacado Grande (2x2 Columnas)</option>
                                        <option value="small">Tarjeta Estándar (1x1 Columna)</option>
                                        <option value="banner">Banner Horizontal (2x1 Columnas)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Subtítulo / Descripción (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={editingItem.subtitle || ''} 
                                    onChange={e => setEditingItem({...editingItem, subtitle: e.target.value})} 
                                    className="w-full bg-light-50 border-none rounded-2xl p-4 font-medium text-sm" 
                                    placeholder="EJ: Notebooks, sillas ergonómicas y monitores" 
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Enlace de Destino (URL o ruta)</label>
                                <input 
                                    type="text" 
                                    value={editingItem.link || ''} 
                                    onChange={e => setEditingItem({...editingItem, link: e.target.value})} 
                                    className="w-full bg-light-50 border-none rounded-2xl p-4 font-bold text-sm text-primary" 
                                    placeholder="EJ: /search?q=oficina o /deals" 
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Imagen de Fondo (Recomendado)</label>
                                <div className="flex gap-4">
                                    <input 
                                        type="text" 
                                        value={editingItem.image || ''} 
                                        onChange={e => setEditingItem({...editingItem, image: e.target.value})} 
                                        className="flex-1 bg-light-50 border-none rounded-2xl p-4 font-bold text-sm" 
                                        placeholder="https://... o subir imagen desde PC" 
                                    />
                                    {editingItem.image && editingItem.image.startsWith('http') && (
                                        <button 
                                            onClick={() => setCropImageSrc(editingItem.image!)} 
                                            className="bg-primary/10 text-primary rounded-2xl px-4 flex items-center justify-center hover:bg-primary/20 transition-all font-bold text-[10px] uppercase tracking-widest gap-1"
                                            title="Recortar imagen de URL"
                                            type="button"
                                        >
                                            <span className="material-symbols-outlined text-sm">crop</span>
                                            Recortar
                                        </button>
                                    )}
                                    <label className="cursor-pointer bg-dark-800 text-white rounded-2xl px-6 flex items-center justify-center hover:bg-black transition-all font-black text-xs uppercase tracking-wider">
                                        <span className="material-symbols-outlined text-sm mr-2">{isUploading ? 'sync' : 'cloud_upload'}</span>
                                        {isUploading ? 'Subiendo' : 'Subir'}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Color de Fondo (Si no hay imagen)</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="color" 
                                            value={editingItem.bgColor || '#00668c'} 
                                            onChange={e => setEditingItem({...editingItem, bgColor: e.target.value})} 
                                            className="size-12 rounded-xl border-none cursor-pointer bg-transparent"
                                        />
                                        <input 
                                            type="text" 
                                            value={editingItem.bgColor || '#00668c'} 
                                            onChange={e => setEditingItem({...editingItem, bgColor: e.target.value})} 
                                            className="flex-1 bg-light-50 border-none rounded-2xl p-4 font-mono text-sm uppercase font-bold" 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Icono Google Fonts (Opcional)</label>
                                    <input 
                                        type="text" 
                                        value={editingItem.icon || ''} 
                                        onChange={e => setEditingItem({...editingItem, icon: e.target.value})} 
                                        className="w-full bg-light-50 border-none rounded-2xl p-4 font-mono text-sm" 
                                        placeholder="EJ: local_fire_department, storefront..." 
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingItem(null)}
                                    className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving || isUploading}
                                    className="bg-primary-vibrant text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary-500/20"
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar Colección'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {cropImageSrc && (
                <ImageCropper
                    imageSrc={cropImageSrc}
                    aspectRatio={editingItem?.size === 'large' ? 2 / 1 : 1 / 1}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setCropImageSrc(null)}
                />
            )}
        </div>
    );
};
