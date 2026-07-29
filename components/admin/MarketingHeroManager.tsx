import React, { useState } from 'react';
import { HeroSlide, upsertHeroSlide, deleteHeroSlide } from '../../lib/marketing';
import { useNotification } from '../../context/NotificationContext';
import { uploadFile } from '../../lib/storage';
import ImageCropper from '../ui/ImageCropper';

interface Props {
    slides: HeroSlide[];
    onUpdate: () => void;
    isHeroEnabled: boolean;
    onToggleHero: () => void;
}

export const MarketingHeroManager: React.FC<Props> = ({ slides, onUpdate, isHeroEnabled, onToggleHero }) => {
    const { notify } = useNotification();
    const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide> | null>(null);
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
            const url = await uploadFile(croppedFile, `marketing/hero/${Date.now()}_${croppedFile.name}`);
            setEditingSlide(prev => prev ? { ...prev, image: url } : { image: url });
            notify({ type: 'success', title: 'Imagen Subida', message: 'La imagen se cargó y recortó correctamente.', icon: 'cloud_done' });
        } catch (e) {
            console.error('Error uploading slide image:', e);
            notify({ type: 'error', title: 'Error de Carga', message: 'No se pudo subir la imagen.', icon: 'cloud_off' });
        }
        setIsUploading(false);
    };

    const handleSave = async () => {
        if (!editingSlide?.title || !editingSlide?.image) {
            notify({ type: 'warning', title: 'Campos requeridos', message: 'El título y la imagen son obligatorios.', icon: 'warning' });
            return;
        }

        setIsSaving(true);
        try {
            await upsertHeroSlide({
                badge: editingSlide.badge || 'Novedad',
                title: editingSlide.title,
                description: editingSlide.description || '',
                image: editingSlide.image,
                bgColor: editingSlide.bgColor || '#F3F4F6',
                accentColor: editingSlide.accentColor || '#2222FF',
                btnText: editingSlide.btnText || 'Ver más',
                btnLink: editingSlide.btnLink || '/',
                active: editingSlide.active ?? true,
                order: editingSlide.order ?? (slides.length + 1),
                id: editingSlide.id
            });
            notify({ type: 'success', title: 'Slider Actualizado', message: 'Los cambios se aplicaron correctamente.', icon: 'done_all' });
            setEditingSlide(null);
            onUpdate();
        } catch (e) {
            console.error('Error saving slide:', e);
            notify({ type: 'error', title: 'Error', message: 'No se pudo guardar el slide.', icon: 'error' });
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar este slide permanentemente?')) {
            await deleteHeroSlide(id);
            notify({ type: 'success', title: 'Slide Eliminado', message: 'El slide ha sido removido.', icon: 'delete' });
            onUpdate();
        }
    };

    return (
        <div className="space-y-12">
            {/* Header / Toggle */}
            <div className="flex items-center justify-between bg-white p-8 rounded-[40px] border-2 border-slate-200/60 shadow-premium relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary-vibrant"></div>
                <div className="flex items-center gap-6">
                    <div className={`size-16 rounded-3xl flex items-center justify-center text-white shadow-xl transition-all ${isHeroEnabled ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-slate-300'}`}>
                        <span className="material-symbols-outlined text-3xl font-black">{isHeroEnabled ? 'visibility' : 'visibility_off'}</span>
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">Estado del Hero Principal</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                            {isHeroEnabled ? 'Protocolo Activo: Visible en el Nodo Home' : 'Protocolo Inactivo: Oculto para Usuarios'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onToggleHero}
                    className={`px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${isHeroEnabled ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' : 'bg-primary-vibrant text-white border-primary-vibrant shadow-xl shadow-primary-500/20 hover:scale-105 active:scale-95'}`}
                >
                    {isHeroEnabled ? 'Desactivar Módulo' : 'Activar Módulo'}
                </button>
            </div>

            {/* List / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div 
                    onClick={() => setEditingSlide({})}
                    className="aspect-video rounded-[40px] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary-vibrant hover:bg-indigo-50/30 transition-all group bg-white/40"
                >
                    <div className="size-20 bg-white rounded-[28px] flex items-center justify-center text-slate-300 group-hover:bg-primary-vibrant group-hover:text-white transition-all shadow-premium">
                        <span className="material-symbols-outlined text-4xl">add</span>
                    </div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-8">Implementar Nuevo Slide</p>
                </div>

                {slides.map(slide => (
                    <div key={slide.id} className="bg-white rounded-[40px] border border-light-200 overflow-hidden shadow-premium group relative">
                        <div className="aspect-video relative overflow-hidden">
                            <img src={slide.image} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-800/80 to-transparent p-8 flex flex-end items-end">
                                <div>
                                    <span className="px-3 py-1 bg-white rounded-full text-[8px] font-black uppercase mb-2 inline-block" style={{ color: slide.accentColor }}>{slide.badge}</span>
                                    <h5 className="text-white font-black text-sm uppercase leading-tight line-clamp-1">{slide.title}</h5>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 flex items-center justify-between">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingSlide(slide)}
                                    className="size-10 bg-light-50 rounded-xl flex items-center justify-center text-dark-800 hover:bg-dark-800 hover:text-white transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button
                                    onClick={() => handleDelete(slide.id!)}
                                    className="size-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">ORDEN: {slide.order}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Edición */}
            {editingSlide && (
                <div className="fixed inset-0 z-[250] bg-dark-800/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="p-10 border-b border-light-100 flex items-center justify-between">
                            <h3 className="text-xl font-black text-dark-800 uppercase tracking-tight">Configuración de Slide</h3>
                            <button onClick={() => setEditingSlide(null)} className="material-symbols-outlined text-gray-400">close</button>
                        </div>
                        
                        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block text-left">Badge (Tag)</label>
                                    <input type="text" value={editingSlide.badge || ''} onChange={e => setEditingSlide({...editingSlide, badge: e.target.value})} className="w-full bg-light-50 border-none rounded-2xl p-4 font-bold text-sm" placeholder="EJ: NAVIDAD 25%" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block text-left">Título Principal</label>
                                    <input type="text" value={editingSlide.title || ''} onChange={e => setEditingSlide({...editingSlide, title: e.target.value})} className="w-full bg-light-50 border-none rounded-2xl p-4 font-black text-lg" placeholder="¡Celebra con Nosotros!" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block text-left">Descripción corta</label>
                                    <textarea value={editingSlide.description || ''} onChange={e => setEditingSlide({...editingSlide, description: e.target.value})} className="w-full bg-light-50 border-none rounded-2xl p-4 font-bold text-sm resize-none" rows={3} placeholder="Detalles de la oferta o anuncio..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block text-left">Texto Botón</label>
                                        <input type="text" value={editingSlide.btnText || ''} onChange={e => setEditingSlide({...editingSlide, btnText: e.target.value})} className="w-full bg-light-50 border-none rounded-2xl p-4 font-bold text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block text-left">Link Botón</label>
                                        <input type="text" value={editingSlide.btnLink || ''} onChange={e => setEditingSlide({...editingSlide, btnLink: e.target.value})} className="w-full bg-light-50 border-none rounded-2xl p-4 font-bold text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block text-left">Imagen del Slide</label>
                                    <div className="flex gap-4">
                                        <input 
                                            type="text" 
                                            value={editingSlide.image || ''} 
                                            onChange={e => setEditingSlide({...editingSlide, image: e.target.value})} 
                                            className="flex-1 bg-light-50 border-none rounded-2xl p-4 font-bold text-sm" 
                                            placeholder="https://... o subir archivo" 
                                        />
                                        {editingSlide.image && editingSlide.image.startsWith('http') && (
                                            <button 
                                                onClick={() => setCropImageSrc(editingSlide.image!)} 
                                                className="bg-primary/10 text-primary rounded-2xl px-4 flex items-center justify-center hover:bg-primary/20 transition-all font-bold text-[10px] uppercase tracking-widest gap-1"
                                                title="Recortar imagen de URL"
                                                type="button"
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
                                    {editingSlide.image && <img src={editingSlide.image} className="w-full h-32 object-cover rounded-2xl mt-4 border shadow-sm" alt="Preview"/>}
                                    {isUploading && <p className="text-[9px] font-black text-primary-vibrant uppercase tracking-widest mt-2 animate-pulse">Subiendo imagen...</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block text-left">Fondo (HEX)</label>
                                        <div className="flex gap-3 items-center">
                                            <input type="color" value={editingSlide.bgColor || '#F3F4F6'} onChange={e => setEditingSlide({...editingSlide, bgColor: e.target.value})} className="size-12 rounded-xl overflow-hidden border-none p-0 cursor-pointer" />
                                            <input type="text" value={editingSlide.bgColor || '#F3F4F6'} onChange={e => setEditingSlide({...editingSlide, bgColor: e.target.value})} className="flex-1 bg-light-50 border-none rounded-xl p-3 font-mono text-xs" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block text-left">Acento (HEX)</label>
                                        <div className="flex gap-3 items-center">
                                            <input type="color" value={editingSlide.accentColor || '#2222FF'} onChange={e => setEditingSlide({...editingSlide, accentColor: e.target.value})} className="size-12 rounded-xl overflow-hidden border-none p-0 cursor-pointer" />
                                            <input type="text" value={editingSlide.accentColor || '#2222FF'} onChange={e => setEditingSlide({...editingSlide, accentColor: e.target.value})} className="flex-1 bg-light-50 border-none rounded-xl p-3 font-mono text-xs" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block text-left">Orden de Aparición</label>
                                    <input type="number" value={editingSlide.order || 0} onChange={e => setEditingSlide({...editingSlide, order: Number(e.target.value)})} className="w-24 bg-light-50 border-none rounded-2xl p-4 font-black text-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-light-50 border-t border-light-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    id="is_active" 
                                    checked={editingSlide.active ?? true} 
                                    onChange={e => setEditingSlide({...editingSlide, active: e.target.checked})}
                                    className="size-5 rounded-lg border-light-300 text-primary-vibrant focus:ring-primary-100"
                                />
                                <label htmlFor="is_active" className="text-[10px] font-black uppercase text-dark-800 cursor-pointer">Activo / Visible</label>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setEditingSlide(null)} className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase text-gray-400 hover:text-dark-800 transition-colors">Cancelar</button>
                                <button 
                                    onClick={handleSave} 
                                    disabled={isSaving}
                                    className="px-12 py-4 bg-primary-vibrant text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? 'Guardando...' : 'Confirmar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {cropImageSrc && (
                <ImageCropper
                    imageSrc={cropImageSrc}
                    aspectRatio={2.5 / 1}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setCropImageSrc(null)}
                />
            )}
        </div>
    );
};
