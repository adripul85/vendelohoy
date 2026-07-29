import React, { useState } from 'react';
import { MarketingNotification, upsertMarketingNotification, deleteMarketingNotification } from '../../lib/marketing';
import { useNotification } from '../../context/NotificationContext';

interface Props {
    notifications: MarketingNotification[];
    onUpdate: () => void;
}

export const MarketingNotificationManager: React.FC<Props> = ({ notifications, onUpdate }) => {
    const { notify } = useNotification();
    const [editingNotif, setEditingNotif] = useState<Partial<MarketingNotification> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!editingNotif?.title || !editingNotif?.message) {
            notify({ type: 'warning', title: 'Faltan datos', message: 'El título y el mensaje son obligatorios.', icon: 'warning' });
            return;
        }

        setIsSaving(true);
        try {
            await upsertMarketingNotification({
                title: editingNotif.title,
                message: editingNotif.message,
                icon: editingNotif.icon || 'notifications',
                type: editingNotif.type || 'promo',
                active: editingNotif.active ?? true,
                link: editingNotif.link || '',
                createdAt: editingNotif.createdAt || null,
                id: editingNotif.id
            });
            notify({ type: 'success', title: 'Notificación Guardada', message: 'La notificación está activa.', icon: 'done_all' });
            setEditingNotif(null);
            onUpdate();
        } catch (e) {
            console.error("Error saving marketing notification:", e);
            notify({ type: 'error', title: 'Error', message: 'No se pudo guardar la notificación.', icon: 'error' });
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar esta notificación?')) {
            await deleteMarketingNotification(id);
            onUpdate();
        }
    };

    return (
        <div className="space-y-12">
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight text-left">Notificaciones de Plataforma</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 text-left leading-relaxed">Envía alertas y novedades directamente al feed global.</p>
                </div>
                <button
                    onClick={() => setEditingNotif({ type: 'promo', active: true, icon: 'campaign' })}
                    className="bg-primary-vibrant text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary-500/20"
                >
                    <span className="material-symbols-outlined text-sm">add_alert</span>
                    Nueva Notificación
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {notifications.map(notif => (
                    <div key={notif.id} className="bg-white border-2 border-slate-200/60 rounded-[32px] p-8 hover:shadow-premium transition-all group flex items-start gap-6 relative hover:border-primary-vibrant/40">
                        <div className={`size-16 rounded-[24px] flex items-center justify-center text-white shrink-0 shadow-lg ${notif.type === 'alert' ? 'bg-rose-500 shadow-rose-500/20' : notif.type === 'event' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-primary-vibrant shadow-primary-500/20'}`}>
                            <span className="material-symbols-outlined text-3xl font-black">{notif.icon}</span>
                        </div>
                        <div className="flex-1 text-left">
                            <div className="flex items-center gap-3 mb-2">
                                <h5 className="font-black text-slate-900 uppercase text-sm tracking-tight">{notif.title}</h5>
                                {!notif.active && <span className="text-[8px] bg-slate-100 text-slate-400 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-slate-200">Inactivo</span>}
                            </div>
                            <p className="text-[12px] font-bold text-slate-500 leading-relaxed line-clamp-2">{notif.message}</p>
                            {notif.link && (
                                <p className="text-[9px] font-black text-primary-vibrant mt-4 uppercase tracking-[0.2em] flex items-center gap-2 bg-indigo-50/50 w-fit px-3 py-1 rounded-lg">
                                    <span className="material-symbols-outlined text-xs">link</span>
                                    {notif.link}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => setEditingNotif(notif)} className="size-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm">
                                <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button onClick={() => handleDelete(notif.id!)} className="size-11 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm">
                                <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {editingNotif && (
                <div className="fixed inset-0 z-[250] bg-dark-800/60 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                         <div className="p-10 border-b border-light-100 flex items-center justify-between">
                            <h3 className="text-xl font-black text-dark-800 uppercase tracking-tight">Configurar Notificación</h3>
                            <button onClick={() => setEditingNotif(null)} className="material-symbols-outlined text-gray-400">close</button>
                        </div>
                        
                        <div className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block text-left">Tipo</label>
                                    <select 
                                        value={editingNotif.type} 
                                        onChange={e => setEditingNotif({...editingNotif, type: e.target.value as any})}
                                        className="w-full bg-light-50 border-none rounded-2xl p-4 font-bold text-sm"
                                    >
                                        <option value="promo">Promocional</option>
                                        <option value="alert">Alerta Crítica</option>
                                        <option value="event">Evento / Día Especial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block text-left">Icono (Material Symbol)</label>
                                    <input type="text" value={editingNotif.icon} onChange={e => setEditingNotif({...editingNotif, icon: e.target.value})} className="w-full bg-light-50 border-none rounded-2xl p-4 font-bold text-sm" placeholder="EJ: campaign, star, local_offer..." />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block text-left">Título</label>
                                <input type="text" value={editingNotif.title} onChange={e => setEditingNotif({...editingNotif, title: e.target.value})} className="w-full bg-light-50 border-none rounded-2xl p-4 font-black text-sm uppercase tracking-widest" placeholder="EJ: ¡Nuevas Ofertas de Verano!" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block text-left">Mensaje</label>
                                <textarea value={editingNotif.message} onChange={e => setEditingNotif({...editingNotif, message: e.target.value})} className="w-full bg-light-50 border-none rounded-2xl p-4 font-bold text-sm resize-none" rows={3} placeholder="Describe el anuncio para los usuarios..." />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block text-left">Link (Opcional)</label>
                                <input type="text" value={editingNotif.link} onChange={e => setEditingNotif({...editingNotif, link: e.target.value})} className="w-full bg-light-50 border-none rounded-2xl p-4 font-bold text-sm" placeholder="/search, /deals, or external URL" />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <input 
                                    type="checkbox" 
                                    id="notif_active" 
                                    checked={editingNotif.active ?? true} 
                                    onChange={e => setEditingNotif({...editingNotif, active: e.target.checked})}
                                    className="size-5 rounded-lg border-light-300 text-primary-vibrant focus:ring-primary-100"
                                />
                                <label htmlFor="notif_active" className="text-[10px] font-black uppercase text-dark-800 cursor-pointer">Activar Notificación</label>
                            </div>
                        </div>

                        <div className="p-10 bg-light-50 flex justify-end gap-4">
                            <button onClick={() => setEditingNotif(null)} className="text-[10px] font-black uppercase text-gray-400 px-6">Cancelar</button>
                            <button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className="bg-primary-vibrant text-white px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'Enviando...' : 'Lanzar Notificación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
