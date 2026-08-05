import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface StockHistoryModalProps {
    itemId: string;
    itemTitle: string;
    isOpen: boolean;
    onClose: () => void;
}

interface HistoryItem {
    id: string;
    date: any;
    type: string;
    adjustment: number;
    newStock: number | 'infinite';
    reason: string;
    userId: string;
}

export default function StockHistoryModal({ itemId, itemTitle, isOpen, onClose }: StockHistoryModalProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;
        
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const historyRef = collection(db, 'items', itemId, 'stock_history');
                const q = query(historyRef, orderBy('date', 'desc'));
                const snapshot = await getDocs(q);
                
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as HistoryItem[];
                
                setHistory(data);
            } catch (err) {
                console.error("Error fetching history", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [isOpen, itemId]);

    if (!isOpen) return null;

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'add': return { label: 'Agregado', color: 'text-emerald-600 bg-emerald-50' };
            case 'subtract': return { label: 'Descontado', color: 'text-orange-600 bg-orange-50' };
            case 'replace': return { label: 'Reemplazado', color: 'text-indigo-600 bg-indigo-50' };
            case 'sale': return { label: 'Venta', color: 'text-purple-600 bg-purple-50' };
            case 'cancel': return { label: 'Cancelación', color: 'text-slate-600 bg-slate-100' };
            default: return { label: type, color: 'text-slate-600 bg-slate-100' };
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="font-black text-slate-900">Historial de Stock</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1 truncate max-w-md">{itemTitle}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 size-8 rounded-full flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <span className="material-symbols-outlined animate-spin text-indigo-500 text-3xl mb-2">progress_activity</span>
                            <p className="text-sm font-bold text-slate-500">Cargando historial...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-slate-300 text-3xl">history</span>
                            </div>
                            <p className="text-sm font-bold text-slate-500">No hay movimientos registrados.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map(entry => {
                                const typeInfo = getTypeLabel(entry.type);
                                return (
                                    <div key={entry.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors bg-slate-50/50 group">
                                        <div className="mt-1">
                                            <div className={`size-10 rounded-xl flex items-center justify-center ${typeInfo.color}`}>
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {entry.type === 'add' ? 'add' : entry.type === 'subtract' ? 'remove' : entry.type === 'sale' ? 'shopping_cart' : entry.type === 'replace' ? 'edit' : 'history'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${typeInfo.color}`}>
                                                    {typeInfo.label}
                                                </span>
                                                <span className="text-[11px] font-bold text-slate-400">
                                                    {entry.date ? format(entry.date.toDate(), "d 'de' MMMM, HH:mm", { locale: es }) : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex items-end gap-3 mt-2">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Ajuste</p>
                                                    <p className="text-sm font-black text-slate-900">
                                                        {entry.adjustment > 0 ? '+' : ''}{entry.adjustment}
                                                    </p>
                                                </div>
                                                <span className="text-slate-300 material-symbols-outlined text-sm mb-0.5">arrow_forward</span>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Stock final</p>
                                                    <p className="text-sm font-black text-slate-900">
                                                        {entry.newStock === 'infinite' ? 'Infinito' : entry.newStock}
                                                    </p>
                                                </div>
                                            </div>
                                            {entry.reason && (
                                                <div className="mt-3 p-2.5 bg-white rounded-lg border border-slate-100">
                                                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                                                        "{entry.reason}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
