import React, { useState } from 'react';
import { Broadcast, updateGlobalBroadcast } from '../../lib/marketing';
import { useNotification } from '../../context/NotificationContext';

interface Props {
    broadcast: Broadcast | null;
    onUpdate: () => void;
}

export const MarketingBroadcastManager: React.FC<Props> = ({ broadcast, onUpdate }) => {
    const { notify } = useNotification();
    const [msg, setMsg] = useState(broadcast?.message || '');
    const [isActive, setIsActive] = useState(broadcast?.active || false);
    const [type, setType] = useState<Broadcast['type']>(broadcast?.type || 'info');
    const [btnText, setBtnText] = useState(broadcast?.btnText || '');
    const [btnLink, setBtnLink] = useState(broadcast?.btnLink || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateGlobalBroadcast({
                message: msg,
                active: isActive,
                type: type,
                btnText: btnText,
                btnLink: btnLink
            });
            notify({ type: 'success', title: 'Aviso Actualizado', message: 'La barra de comunicaciones ha sido configurada.', icon: 'campaign' });
            onUpdate();
        } catch (e) {
            console.error("Error updating global broadcast:", e);
            notify({ type: 'error', title: 'Error', message: 'No se pudo actualizar el aviso.', icon: 'error' });
        }
        setIsSaving(false);
    };

    return (
        <div className="max-w-4xl space-y-12">
            <div>
                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Barra de Comunicados Global</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-relaxed">Este mensaje se inyectará en el Nodo Superior de todas las páginas activas.</p>
            </div>

            <div className="bg-white p-4 md:p-10 rounded-[48px] border-2 border-slate-200/60 shadow-premium space-y-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-vibrant/5 rounded-full blur-3xl -z-10 group-hover:bg-primary-vibrant/10 transition-colors"></div>
                
                {/* Preview */}
                <div className="space-y-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Simulación de Interfaz (Desktop/Mobile)</p>
                    <div className={`w-full py-5 px-4 md:px-10 rounded-2xl flex items-center justify-between transition-all shadow-lg ${
                        type === 'info' ? 'bg-slate-900 text-white' : 
                        type === 'promo' ? 'bg-primary-vibrant text-white shadow-primary-500/20' : 
                        'bg-rose-600 text-white shadow-rose-600/20'
                    }`}>
                        <div className="flex items-center gap-5">
                            <span className="material-symbols-outlined text-sm animate-pulse">{type === 'warning' ? 'warning' : 'campaign'}</span>
                            <p className="text-xs font-black uppercase tracking-[0.1em]">{msg || 'Introduce una cadena de texto para previsualizar...'}</p>
                        </div>
                        {btnText && (
                            <div className="px-5 py-2 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10">
                                {btnText}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-10">
                    <div className="md:col-span-8 space-y-8">
                         <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Mensaje Dinámico</label>
                            <input type="text" value={msg} onChange={e => setMsg(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-primary-vibrant/20 focus:bg-white rounded-2xl p-5 font-bold text-sm transition-all" placeholder="EJ: ¡Envío Gratis este fin de semana!" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">CTA (Call to Action)</label>
                                <input type="text" value={btnText} onChange={e => setBtnText(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-primary-vibrant/20 focus:bg-white rounded-2xl p-5 font-black text-[10px] uppercase tracking-widest transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Punto de Anclaje (URL/PATH)</label>
                                <input type="text" value={btnLink} onChange={e => setBtnLink(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-primary-vibrant/20 focus:bg-white rounded-2xl p-5 font-bold text-xs transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-4 space-y-8">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Indicador de Prioridad</label>
                            <div className="flex flex-col gap-3">
                                {[
                                    {id: 'info', label: 'Estandar (Deep Ocean)', color: 'bg-slate-900'},
                                    {id: 'promo', label: 'Destacado (Indigo Hub)', color: 'bg-primary-vibrant'},
                                    {id: 'warning', label: 'Crítico (Rose Alert)', color: 'bg-rose-600'}
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setType(t.id as any)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group/btn ${type === t.id ? 'border-primary-vibrant bg-indigo-50/30' : 'border-slate-100 bg-slate-50 shadow-sm hover:border-slate-200'}`}
                                    >
                                        <div className={`size-5 rounded-lg shadow-md ${t.color} group-hover/btn:scale-110 transition-transform`}></div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${type === t.id ? 'text-primary-vibrant' : 'text-slate-500'}`}>{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div 
                            onClick={() => setIsActive(!isActive)}
                            className={`w-16 h-9 rounded-full transition-all flex items-center px-1 cursor-pointer shadow-inner ${isActive ? 'bg-primary-vibrant' : 'bg-slate-200'}`}
                        >
                            <div className={`size-7 bg-white rounded-full shadow-lg transition-all transform ${isActive ? 'translate-x-7' : 'translate-x-0'}`}></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Estado de Transmisión</span>
                            <span className={`text-xs font-black uppercase tracking-tighter ${isActive ? 'text-primary-vibrant' : 'text-slate-500'}`}>{isActive ? 'ACTIVO / EN VIVO' : 'PAUSADO / BORRADOR'}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-14 py-5 bg-slate-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-black active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                        {isSaving ? 'Sincronizando...' : 'Publicar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};
