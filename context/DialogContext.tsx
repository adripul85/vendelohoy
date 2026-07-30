import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DialogOptions {
    title: string;
    message: string;
    icon?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    hideCancel?: boolean;
}

interface DialogContextType {
    showAlert: (title: string, message: string, icon?: string) => Promise<void>;
    showConfirm: (title: string, message: string, confirmText?: string, cancelText?: string, icon?: string) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) throw new Error('useDialog must be used within DialogProvider');
    return context;
};

export const DialogProvider = ({ children }: { children: ReactNode }) => {
    const [dialog, setDialog] = useState<DialogOptions | null>(null);

    const showAlert = useCallback((title: string, message: string, icon: string = 'info') => {
        return new Promise<void>((resolve) => {
            setDialog({
                title,
                message,
                icon,
                confirmText: 'Aceptar',
                hideCancel: true,
                onConfirm: () => {
                    setDialog(null);
                    resolve();
                }
            });
        });
    }, []);

    const showConfirm = useCallback((title: string, message: string, confirmText = 'Confirmar', cancelText = 'Cancelar', icon = 'help') => {
        return new Promise<boolean>((resolve) => {
            setDialog({
                title,
                message,
                icon,
                confirmText,
                cancelText,
                hideCancel: false,
                onConfirm: () => {
                    setDialog(null);
                    resolve(true);
                },
                onCancel: () => {
                    setDialog(null);
                    resolve(false);
                }
            });
        });
    }, []);

    return (
        <DialogContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            <AnimatePresence>
                {dialog && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={dialog.onCancel || dialog.onConfirm}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative z-10 flex flex-col items-center text-center"
                        >
                            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mb-6 text-slate-900">
                                <span className="material-symbols-outlined text-3xl font-black">{dialog.icon}</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">{dialog.title}</h3>
                            <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">{dialog.message}</p>
                            
                            <div className="flex gap-3 w-full">
                                {!dialog.hideCancel && (
                                    <button
                                        onClick={dialog.onCancel}
                                        className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                    >
                                        {dialog.cancelText}
                                    </button>
                                )}
                                <button
                                    onClick={dialog.onConfirm}
                                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-colors shadow-lg shadow-slate-900/20"
                                >
                                    {dialog.confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DialogContext.Provider>
    );
};
