import React, { useState } from 'react';
import { Coupon, getCoupons } from '../../lib/marketing';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useNotification } from '../../context/NotificationContext';

interface Props {
    coupons: Coupon[];
    onUpdate: () => void;
}

export const MarketingCouponManager: React.FC<Props> = ({ coupons, onUpdate }) => {
    const { notify } = useNotification();
    const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!editingCoupon?.code || !editingCoupon?.value) {
            notify({ type: 'warning', title: 'Campos faltantes', message: 'Código y valor son obligatorios.', icon: 'warning' });
            return;
        }

        setIsSaving(true);
        try {
            const data = {
                code: editingCoupon.code.toUpperCase().trim(),
                type: editingCoupon.type || 'percentage',
                value: Number(editingCoupon.value),
                minAmount: Number(editingCoupon.minAmount || 0),
                limit: Number(editingCoupon.limit || 0),
                used: editingCoupon.used || 0,
                active: editingCoupon.active ?? true,
                expiryDate: editingCoupon.expiryDate ? Timestamp.fromDate(new Date(editingCoupon.expiryDate)) : null,
                createdAt: editingCoupon.createdAt || Timestamp.now()
            };

            if (editingCoupon.id) {
                await updateDoc(doc(db, 'coupons', editingCoupon.id), data);
            } else {
                await addDoc(collection(db, 'coupons'), data);
            }

            notify({ type: 'success', title: 'Cupón Guardado', message: 'El cupón está listo para usarse.', icon: 'confirmation_number' });
            setEditingCoupon(null);
            onUpdate();
        } catch (e) {
            notify({ type: 'error', title: 'Error', message: 'No se pudo procesar el cupón.', icon: 'error' });
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar cupón?')) {
            await deleteDoc(doc(db, 'coupons', id));
            onUpdate();
        }
    };

    return (
        <div className="space-y-12">
            <div className="flex justify-between items-center">
                <div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Listado de Cupones</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-relaxed">Configura descuentos estratégicos para tus usuarios.</p>
                </div>
                <button
                    onClick={() => setEditingCoupon({ type: 'percentage', active: true, value: 0, minAmount: 0, limit: 0 })}
                    className="bg-primary-vibrant text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-sm">confirmation_number</span>
                    Generar Cupón
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map(coupon => (
                    <div key={coupon.id} className="bg-white p-8 rounded-[40px] border-2 border-slate-200/60 shadow-premium relative group overflow-hidden transition-all hover:border-primary-vibrant/40">
                        <div className="flex justify-between items-start mb-8">
                            <div className="bg-indigo-50 px-5 py-2.5 rounded-xl border-2 border-indigo-100/50">
                                <span className="text-sm font-black text-indigo-700 font-mono tracking-widest">{coupon.code}</span>
                            </div>
                            <span className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${coupon.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                {coupon.active ? 'Activo' : 'Pausado'}
                            </span>
                        </div>
                        
                        <div className="space-y-5 mb-8">
                            <div className="flex justify-between items-end border-b border-light-100 pb-4">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Beneficio</span>
                                <span className="text-3xl font-black text-slate-900">
                                    {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Usos / Límite</span>
                                <span className="text-xs font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">{coupon.used} / {coupon.limit === 0 ? '∞' : coupon.limit}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setEditingCoupon(coupon)} className="py-3.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">Configurar</button>
                            <button onClick={() => handleDelete(coupon.id!)} className="py-3.5 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 hover:bg-rose-500 hover:text-white transition-all"><span className="material-symbols-outlined text-sm">delete</span></button>
                        </div>
                    </div>
                ))}
            </div>

            {editingCoupon && (
                <div className="fixed inset-0 z-[250] bg-dark-800/60 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="p-10 border-b border-light-100 flex items-center justify-between">
                            <h3 className="text-xl font-black text-dark-800 uppercase tracking-tight">Configuración de Cupón</h3>
                            <button onClick={() => setEditingCoupon(null)} className="material-symbols-outlined text-gray-400">close</button>
                        </div>
                        
                        <div className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Código del Cupón</label>
                                    <input type="text" value={editingCoupon.code} onChange={e => setEditingCoupon({...editingCoupon, code: e.target.value.toUpperCase()})} className="w-full bg-light-50 border-none rounded-2xl p-4 font-black text-lg tracking-widest" placeholder="PROMO20" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Tipo de Descuento</label>
                                    <select value={editingCoupon.type} onChange={e => setEditingCoupon({...editingCoupon, type: e.target.value as any})} className="w-full bg-light-50 border-none rounded-2xl p-4 font-bold text-sm">
                                        <option value="percentage">Porcentaje (%)</option>
                                        <option value="fixed">Monto Fijo ($)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Valor Descuento</label>
                                    <input type="number" value={editingCoupon.value} onChange={e => setEditingCoupon({...editingCoupon, value: Number(e.target.value)})} className="w-full bg-light-50 border-none rounded-2xl p-4 font-black text-lg" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Mínimo Compra</label>
                                    <input type="number" value={editingCoupon.minAmount} onChange={e => setEditingCoupon({...editingCoupon, minAmount: Number(e.target.value)})} className="w-full bg-light-50 border-none rounded-2xl p-4 font-bold text-sm" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Límite de usos (0 = ∞)</label>
                                    <input type="number" value={editingCoupon.limit} onChange={e => setEditingCoupon({...editingCoupon, limit: Number(e.target.value)})} className="w-full bg-light-50 border-none rounded-2xl p-4 font-bold text-sm" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Vencimiento</label>
                                    <input type="date" onChange={e => setEditingCoupon({...editingCoupon, expiryDate: e.target.value})} className="w-full bg-light-50 border-none rounded-2xl p-4 font-bold text-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-light-50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="coupon_active" checked={editingCoupon.active} onChange={e => setEditingCoupon({...editingCoupon, active: e.target.checked})} className="size-5 rounded-lg text-indigo-600" />
                                <label htmlFor="coupon_active" className="text-[10px] font-black uppercase text-dark-800 cursor-pointer">Activar Cupón</label>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setEditingCoupon(null)} className="text-[10px] font-black uppercase text-gray-400">Cancelar</button>
                                <button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">
                                    {isSaving ? 'Guardando...' : 'Guardar Cupón'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
