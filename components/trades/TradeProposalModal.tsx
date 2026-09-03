import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useNotification } from '../../context/NotificationContext';
import { ItemData, getItemsBySeller } from '../../lib/items';
import { createTradeProposal, TRADE_PROTECTION_FEE } from '../../lib/trades';

interface TradeProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetProduct: ItemData & { id: string };
}

export const TradeProposalModal: React.FC<TradeProposalModalProps> = ({ isOpen, onClose, targetProduct }) => {
    const { user } = useAuth();
    const { notify } = useNotification();
    const navigate = useNavigate();

    const [userInventory, setUserInventory] = useState<(ItemData & { id: string })[]>([]);
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    
    const [differenceType, setDifferenceType] = useState<'none' | 'pay' | 'receive'>('none');
    const [differenceAmount, setDifferenceAmount] = useState<string>('');
    const [deliveryMethod, setDeliveryMethod] = useState<'en_mano' | 'correo_argentino'>('en_mano');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setLoadingInventory(true);
            getItemsBySeller(user.uid).then(items => {
                const available = items.filter(i => i.id !== targetProduct.id && i.status !== 'SOLD');
                setUserInventory(available);
                setLoadingInventory(false);
            }).catch(() => setLoadingInventory(false));
        }
    }, [isOpen, user, targetProduct.id]);

    if (!isOpen) return null;

    const handleToggleItem = (itemId: string) => {
        setSelectedItemIds(prev => 
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            notify({ type: 'warning', title: 'Iniciar Sesion', message: 'Debes iniciar sesion para enviar una propuesta de canje.', icon: 'lock' });
            navigate('/login');
            return;
        }

        if (selectedItemIds.length === 0 && differenceType === 'none') {
            notify({ type: 'error', title: 'Oferta Vacia', message: 'Selecciona al menos un producto de tu inventario o una diferencia en dinero.', icon: 'warning' });
            return;
        }

        const rawDiff = parseFloat(differenceAmount.replace(/[^0-9.]/g, '')) || 0;
        let finalCashDiff = 0;
        if (differenceType === 'pay') finalCashDiff = rawDiff;
        if (differenceType === 'receive') finalCashDiff = -rawDiff;

        setSubmitting(true);
        const result = await createTradeProposal({
            targetItemId: targetProduct.id,
            receiverId: targetProduct.sellerId,
            offeredItemIds: selectedItemIds,
            cashDifference: finalCashDiff,
            notes,
            deliveryMethod
        });

        setSubmitting(false);

        if (result.success && result.id) {
            notify({ 
                type: 'success', 
                title: '¡Propuesta Enviada!', 
                message: 'Tu propuesta de canje fue enviada al vendedor. Te notificaremos cuando responda.', 
                icon: 'sync_alt' 
            });
            onClose();
            navigate(`/trade/${result.id}`);
        } else {
            notify({ type: 'error', title: 'Error', message: result.error || 'No se pudo enviar la propuesta.', icon: 'error' });
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-[32px] max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="size-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-black">
                                <span className="material-symbols-outlined text-2xl">sync_alt</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Proponer Canje Protegido</h3>
                                <p className="text-xs font-bold text-slate-400">Intercambio respaldado con garantia de plataforma</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="size-9 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>

                    {/* Target Product Summary */}
                    <div className="bg-slate-50 p-4 rounded-2xl my-6 flex items-center gap-4 border border-slate-200">
                        <img 
                            src={targetProduct.images?.[0] || 'https://picsum.photos/100/100'} 
                            alt={targetProduct.title} 
                            className="size-16 rounded-xl object-cover border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Queres conseguir:</span>
                            <h4 className="text-sm font-black text-slate-900 truncate">{targetProduct.title}</h4>
                            <p className="text-xs font-black text-slate-600">${targetProduct.price.toLocaleString()}</p>
                        </div>
                    </div>

                    {targetProduct.tradePreferences && (
                        <div className="bg-purple-50/70 border border-purple-200/70 p-4 rounded-2xl mb-6">
                            <div className="flex items-start gap-2.5">
                                <span className="material-symbols-outlined text-purple-600 text-lg mt-0.5">help_outline</span>
                                <div>
                                    <p className="text-[10px] font-black text-purple-900 uppercase tracking-wider">Preferencia del vendedor:</p>
                                    <p className="text-xs font-bold text-purple-800 mt-0.5">"{targetProduct.tradePreferences}"</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 1. Seleccionar productos del inventario */}
                        <div>
                            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                                1. Selecciona que ofreces a cambio (de tus publicaciones)
                            </label>

                            {loadingInventory ? (
                                <div className="p-8 text-center bg-slate-50 rounded-2xl">
                                    <span className="material-symbols-outlined animate-spin text-purple-600 text-2xl">sync</span>
                                    <p className="text-xs font-bold text-slate-400 mt-2">Cargando tus productos...</p>
                                </div>
                            ) : userInventory.length === 0 ? (
                                <div className="p-6 text-center bg-amber-50 rounded-2xl border border-amber-200">
                                    <span className="material-symbols-outlined text-amber-500 text-3xl mb-1">inventory_2</span>
                                    <p className="text-xs font-bold text-amber-900">No tienes productos publicados para ofrecer.</p>
                                    <p className="text-[11px] text-amber-700 mt-1">Puedes publicar un articulo primero o proponer un ajuste en dinero.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                                    {userInventory.map(item => {
                                        const isSelected = selectedItemIds.includes(item.id);
                                        return (
                                            <div 
                                                key={item.id}
                                                onClick={() => handleToggleItem(item.id)}
                                                className={`p-3 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all ${isSelected ? 'border-purple-600 bg-purple-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
                                            >
                                                <img src={item.images?.[0] || 'https://picsum.photos/60/60'} alt={item.title} className="size-12 rounded-xl object-cover" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-slate-900 truncate">{item.title}</p>
                                                    <p className="text-[11px] font-bold text-slate-500">${item.price.toLocaleString()}</p>
                                                </div>
                                                <div className={`size-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'}`}>
                                                    {isSelected && <span className="material-symbols-outlined text-xs font-black">check</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 2. Ajuste de Dinero */}
                        <div className="pt-4 border-t border-slate-100">
                            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                                2. Diferencia en Dinero (Opcional)
                            </label>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                <button
                                    type="button"
                                    onClick={() => setDifferenceType('none')}
                                    className={`py-3 px-2 rounded-xl text-[11px] font-black uppercase transition-all ${differenceType === 'none' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Mano a Mano ($0)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDifferenceType('pay')}
                                    className={`py-3 px-2 rounded-xl text-[11px] font-black uppercase transition-all ${differenceType === 'pay' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    + Pongo Dinero
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDifferenceType('receive')}
                                    className={`py-3 px-2 rounded-xl text-[11px] font-black uppercase transition-all ${differenceType === 'receive' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    + Pido Dinero
                                </button>
                            </div>

                            {differenceType !== 'none' && (
                                <div className="relative animate-in fade-in duration-200">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                                    <input 
                                        type="number"
                                        value={differenceAmount}
                                        onChange={(e) => setDifferenceAmount(e.target.value)}
                                        placeholder="Monto de la diferencia (ARS)"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 pl-8 pr-4 font-black text-slate-900 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* 3. Modalidad de Entrega */}
                        <div className="pt-4 border-t border-slate-100">
                            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                                3. Modalidad de Intercambio
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div 
                                    onClick={() => setDeliveryMethod('en_mano')}
                                    className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all ${deliveryMethod === 'en_mano' ? 'border-purple-600 bg-purple-50/50' : 'border-slate-200'}`}
                                >
                                    <span className="material-symbols-outlined text-purple-600 text-2xl">handshake</span>
                                    <div>
                                        <p className="text-xs font-black text-slate-900">En Persona</p>
                                        <p className="text-[10px] text-slate-500">Con Doble Escaneo QR</p>
                                    </div>
                                </div>
                                <div 
                                    onClick={() => setDeliveryMethod('correo_argentino')}
                                    className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all ${deliveryMethod === 'correo_argentino' ? 'border-purple-600 bg-purple-50/50' : 'border-slate-200'}`}
                                >
                                    <span className="material-symbols-outlined text-purple-600 text-2xl">local_shipping</span>
                                    <div>
                                        <p className="text-xs font-black text-slate-900">Por Envio</p>
                                        <p className="text-[10px] text-slate-500">Correo Argentino</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Mensaje / Aclaracion */}
                        <div className="pt-4 border-t border-slate-100">
                            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                                4. Mensaje o detalles de tu oferta
                            </label>
                            <textarea 
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ej: Mi celular esta en caja con cargador y funda. ¿Te sirve?"
                                rows={2}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
                            />
                        </div>

                        {/* Aviso de Fee y Seguridad */}
                        <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-purple-400">verified_user</span>
                                <div>
                                    <p className="font-black">Fee de Intermediacion y Garantia</p>
                                    <p className="text-[10px] text-slate-400">Solo se paga (${TRADE_PROTECTION_FEE.toLocaleString()}) si ambos aceptan el trato.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button" 
                                onClick={onClose}
                                className="flex-1 py-4 rounded-2xl border border-slate-200 font-black text-xs uppercase text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">send</span>}
                                Enviar Propuesta
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
