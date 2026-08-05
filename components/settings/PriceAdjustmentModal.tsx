import React, { useState, useEffect } from 'react';
import { ItemData } from '../../lib/items';

interface PriceAdjustmentModalProps {
    item: ItemData & { id: string };
    isOpen: boolean;
    onClose: () => void;
    onSave: (newPrice: number) => Promise<void>;
}

export default function PriceAdjustmentModal({ item, isOpen, onClose, onSave }: PriceAdjustmentModalProps) {
    const [price, setPrice] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPrice(item.price.toString());
            setIsSaving(false);
        }
    }, [isOpen, item]);

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const numPrice = Number(price);
        if (isNaN(numPrice) || numPrice < 0) return;
        
        setIsSaving(true);
        await onSave(numPrice);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-black text-slate-800">Modificar Precio</h2>
                        <p className="text-xs text-slate-500 font-medium mt-1 truncate max-w-[200px]">{item.title}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="size-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6">
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nuevo Precio</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                            <input 
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-8 pr-4 font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg"
                                placeholder="0"
                                required
                                min="0"
                                step="1"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={isSaving || !price || isNaN(Number(price))}
                            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Precio'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
