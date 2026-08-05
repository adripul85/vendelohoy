import React, { useState } from 'react';
import { CategoryBanner, upsertCategoryBanner } from '../../lib/marketing';
import { CATEGORIES } from '../../lib/constants';
import { useNotification } from '../../context/NotificationContext';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { uploadFile } from '../../lib/storage';
import ImageCropper from '../ui/ImageCropper';

interface Props {
    banners: CategoryBanner[];
    onUpdate: () => void;
}

export const MarketingBannerManager: React.FC<Props> = ({ banners, onUpdate }) => {
    const { notify } = useNotification();
    const [editingBanner, setEditingBanner] = useState<Partial<CategoryBanner> | null>(null);
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
            const url = await uploadFile(croppedFile, `marketing/banners/${Date.now()}_${croppedFile.name}`);
            setEditingBanner(prev => prev ? { ...prev, image: url } : { image: url });
            notify({ type: 'success', title: 'Imagen Subida', message: 'El banner se cargó y recortó correctamente.', icon: 'cloud_done' });
        } catch (e) {
            console.error('Error uploading banner image:', e);
            notify({ type: 'error', title: 'Error de Carga', message: 'No se pudo subir la imagen.', icon: 'cloud_off' });
        }
        setIsUploading(false);
    };

    const handleSave = async () => {
        if (!editingBanner?.categoryId || !editingBanner?.image) {
            notify({ type: 'warning', title: 'Faltan datos', message: 'Selecciona una categoría e imagen.', icon: 'warning' });
            return;
        }

        setIsSaving(true);
        try {
            await upsertCategoryBanner({
                categoryId: editingBanner.categoryId,
                image: editingBanner.image,
                title: editingBanner.title || '',
                active: editingBanner.active ?? true,
                id: editingBanner.id
            });
            notify({ type: 'success', title: 'Banner Guardado', message: 'El banner de categoría está listo.', icon: 'branding_watermark' });
            setEditingBanner(null);
            onUpdate();
        } catch (e) {
            console.error('Error saving banner:', e);
            notify({ type: 'error', title: 'Error', message: 'No se pudo guardar el banner.', icon: 'error' });
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar banner?')) {
            await deleteDoc(doc(db, 'category_banners', id));
            onUpdate();
        }
    };

    return (
        <div className="space-y-12">
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Banners por Categoría</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-relaxed">Personaliza el Nodo de Búsqueda por rubro específico.</p>
                </div>
                <button
                    onClick={() => setEditingBanner({ active: true })}
                    className="bg-primary-vibrant text-white px-4 md:px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary-500/20"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Implementar Banner
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {banners.map(banner => {
                    const cat = CATEGORIES.find(c => c.id === banner.categoryId);
                    return (
                        <div key={banner.id} className="bg-white rounded-[40px] border-2 border-slate-200/60 overflow-hidden shadow-premium group relative hover:border-primary-vibrant/40 transition-all">
                            <div className="aspect-[4/1] relative overflow-hidden">
                                <img src={banner.image} className="size-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                                    <h5 className="text-white text-xl font-black uppercase tracking-tight drop-shadow-lg">{banner.title}</h5>
                                </div>
                            </div>
                            <div className="p-6 flex items-center justify-between border-t border-slate-100 bg-slate-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                                        <span className="material-symbols-outlined text-lg text-primary-vibrant">{cat?.icon || 'category'}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sección: <span className="text-slate-900">{cat?.name}</span></span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingBanner(banner)} className="size-10 bg-light-50 rounded-xl flex items-center justify-center text-dark-800 hover:bg-dark-800 hover:text-white transition-all">
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(banner.id!)} className="size-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {editingBanner && (
                <div className="fixed inset-0 z-[250] bg-dark-800/60 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                         <div className="p-4 md:p-10 border-b border-light-100 flex items-center justify-between">
                            <h3 className="text-xl font-black text-dark-800 uppercase tracking-tight">Configurar Banner de Seccion</h3>
                            <button onClick={() => setEditingBanner(null)} className="material-symbols-outlined text-gray-400">close</button>
                        </div>
                        
                        <div className="p-4 md:p-10 space-y-6">
                             <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Categoría Destino</label>
                                <select 
                                    value={editingBanner.categoryId} 
                                    onChange={e => setEditingBanner({...editingBanner, categoryId: e.target.value})}
                                    className="w-full bg-light-50 border-none rounded-2xl p-4 font-bold text-sm"
                                >
                                    <option value="">Seleccionar Categoría...</option>
                                    {CATEGORIES.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                             <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Título del Banner (Opcional)</label>
                                <input type="text" value={editingBanner.title} onChange={e => setEditingBanner({...editingBanner, title: e.target.value})} className="w-full bg-light-50 border-none rounded-2xl p-4 font-black text-sm uppercase tracking-widest" placeholder="EJ: EQUIPAMIENTO PRO" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Imagen del Banner (Recomendado: 1200x300)</label>
                                <div className="flex gap-4">
                                    <input 
                                        type="text" 
                                        value={editingBanner.image} 
                                        onChange={e => setEditingBanner({...editingBanner, image: e.target.value})} 
                                        className="flex-1 bg-light-50 border-none rounded-2xl p-4 font-bold text-sm" 
                                        placeholder="https://... o subir archivo" 
                                    />
                                    {editingBanner.image && editingBanner.image.startsWith('http') && (
                                        <button 
                                            onClick={() => setCropImageSrc(editingBanner.image!)} 
                                            className="bg-primary/10 text-primary rounded-2xl px-4 flex items-center justify-center hover:bg-primary/20 transition-all font-bold text-[10px] uppercase tracking-widest gap-1"
                                            title="Recortar imagen de URL"
                                        >
                                            <span className="material-symbols-outlined text-sm">crop</span>
                                            Recortar
                                        </button>
                                    )}
                                    <label className="cursor-pointer bg-dark-800 text-white rounded-2xl px-6 flex items-center justify-center hover:bg-black transition-all">
                                        <span className="material-symbols-outlined text-sm">{isUploading ? 'sync' : 'cloud_upload'}</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                    </label>
                                </div>
                                {isUploading && <p className="text-[9px] font-black text-primary-vibrant uppercase tracking-widest mt-2 animate-pulse">Subiendo...</p>}
                            </div>
                        </div>

                        <div className="p-4 md:p-10 bg-light-50 flex justify-end gap-4">
                            <button onClick={() => setEditingBanner(null)} className="text-[10px] font-black uppercase text-gray-400 px-6">Cancelar</button>
                            <button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className="bg-dark-800 text-white px-4 md:px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'Guardando...' : 'Confirmar Banner'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {cropImageSrc && (
                <ImageCropper
                    imageSrc={cropImageSrc}
                    aspectRatio={4 / 1}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setCropImageSrc(null)}
                />
            )}
        </div>
    );
};
