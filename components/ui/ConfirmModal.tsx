import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'success' | 'warning' | 'primary';
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'primary',
    isLoading = false
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const getVariantStyles = () => {
        switch (variant) {
            case 'danger':
                return {
                    bg: 'bg-red-50 text-red-600',
                    btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
                    icon: 'text-red-600'
                };
            case 'success':
                return {
                    bg: 'bg-emerald-50 text-emerald-600',
                    btn: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
                    icon: 'text-emerald-600'
                };
            case 'warning':
                return {
                    bg: 'bg-amber-50 text-amber-600',
                    btn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
                    icon: 'text-amber-600'
                };
            default:
                return {
                    bg: 'bg-indigo-50 text-indigo-600',
                    btn: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
                    icon: 'text-indigo-600'
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${styles.bg}`}>
                            <span className={`material-symbols-outlined ${styles.icon}`}>error</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100 flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-slate-600 text-sm leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2 ${styles.btn}`}
                    >
                        {isLoading && (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
