import React, { useState, useEffect } from 'react';
import { ItemData } from '../../lib/items';

interface StockAdjustmentModalProps {
    item: ItemData & { id: string };
    isOpen: boolean;
    onClose: () => void;
    onSave: (newStock: number, isInfinite: boolean, reason: string, type: 'add' | 'subtract' | 'replace', adjustment: number) => Promise<void>;
}

export default function StockAdjustmentModal({ item, isOpen, onClose, onSave }: StockAdjustmentModalProps) {
    const [isInfinite, setIsInfinite] = useState(item.hasInfiniteStock || false);
    const [activeTab, setActiveTab] = useState<'add' | 'subtract' | 'replace'>('add');
    const [inputValue, setInputValue] = useState<string>('');
    const [reason, setReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Reset state when opening different item
    useEffect(() => {
        if (isOpen) {
            setIsInfinite(item.hasInfiniteStock || false);
            setActiveTab('add');
            setInputValue('');
            setReason('');
            setIsSaving(false);
        }
    }, [isOpen, item]);

    if (!isOpen) return null;

    const currentStock = item.quantity || 0;
    
    // Calculate new stock based on mode and input
    const getNewStock = () => {
        const inputNum = parseInt(inputValue) || 0;
        if (activeTab === 'add') return currentStock + inputNum;
        if (activeTab === 'subtract') return Math.max(0, currentStock - inputNum);
        return inputNum; // replace
    };

    const newStock = getNewStock();

    const handleSave = async () => {
        setIsSaving(true);
        const adjustmentNum = parseInt(inputValue) || 0;
        
        await onSave(
            newStock, 
            isInfinite, 
            reason, 
            activeTab, 
            adjustmentNum
        );
        
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    {/* Header with Title and Close button */}
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-slate-900">Ajustar cantidad</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>

                    {/* Infinite / Limited Toggle */}
                    <div className="flex items-center gap-4 mb-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="stockType"
                                checked={isInfinite}
                                onChange={() => setIsInfinite(true)}
                                className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                            />
                            <span className="text-sm font-bold text-slate-700">Infinito</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="stockType"
                                checked={!isInfinite}
                                onChange={() => setIsInfinite(false)}
                                className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                            />
                            <span className="text-sm font-bold text-slate-700">Limitado</span>
                        </label>
                    </div>

                    {!isInfinite && (
                        <div className="space-y-6">
                            {/* Tabs */}
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('add')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'add' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
                                >
                                    Agregar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('subtract')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'subtract' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
                                >
                                    Descontar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('replace')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'replace' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
                                >
                                    Reemplazar
                                </button>
                            </div>

                            {/* Calculator */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Stock actual</label>
                                    <input 
                                        type="text" 
                                        readOnly
                                        value={currentStock} 
                                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-500 outline-none cursor-not-allowed"
                                    />
                                </div>
                                <div className="text-slate-400 font-bold mt-4">
                                    {activeTab === 'add' ? '+' : activeTab === 'subtract' ? '-' : '='}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                        {activeTab === 'add' ? 'Agregar' : activeTab === 'subtract' ? 'Descontar' : 'Nuevo stock'}
                                    </label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
                                    />
                                </div>
                                <div className="text-slate-400 font-bold mt-4">=</div>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Nuevo stock</label>
                                    <input 
                                        type="text" 
                                        readOnly
                                        value={newStock} 
                                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-500 outline-none cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Motivo (opcional)</label>
                                <textarea 
                                    rows={2}
                                    maxLength={40}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Indicá por qué se realizó el cambio."
                                    className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow resize-none"
                                />
                                <div className="text-right mt-1 text-[10px] text-slate-400">
                                    {reason.length}/40 caracteres
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer buttons */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || (!isInfinite && !inputValue)}
                        className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}
