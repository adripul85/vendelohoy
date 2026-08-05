import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { deleteUserAccount } from '../lib/users';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
    const { user, logout } = useAuth();
    const { notify } = useNotification();
    const navigate = useNavigate();
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !user) return null;

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();

        if (confirmText.toLowerCase() !== 'borrar') {
            notify({
                type: 'error',
                title: 'Confirmación Inválida',
                message: 'Debes escribir "borrar" para confirmar.',
                icon: 'error'
            });
            return;
        }

        setLoading(true);

        const result = await deleteUserAccount(user.uid);

        if (result.success) {
            notify({
                type: 'success',
                title: 'Cuenta Terminada',
                message: 'Tu cuenta ha sido eliminada permanentemente de nuestros registros.',
                icon: 'check_circle'
            });

            // Logout and redirect
            await logout();
            navigate('/');
        } else {
            setLoading(false);

            if ('requiresReauth' in result && result.requiresReauth) {
                notify({
                    type: 'warning',
                    title: 'Re-autenticación Requerida',
                    message: result.message || 'Por favor inicia sesión nuevamente para verificar tu identidad.',
                    icon: 'warning'
                });
                // Logout to force re-authentication
                await logout();
                navigate('/login');
            } else {
                notify({
                    type: 'error',
                    title: 'Error de Protocolo',
                    message: 'No pudimos procesar la terminación de la cuenta. Inténtalo de nuevo.',
                    icon: 'error'
                });
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-dark-900/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white max-w-md w-full rounded-[40px] shadow-premium overflow-hidden animate-in zoom-in duration-500 border border-light-200/50">
                <div className="p-4 md:p-12">
                    {/* Header with Warning Icon */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="size-24 bg-red-50 rounded-[32px] flex items-center justify-center mb-6 shadow-sm border border-red-100/50">
                            <span className="material-symbols-outlined text-5xl text-red-600 font-black">warning</span>
                        </div>
                        <h2 className="text-2xl font-black text-dark-800 uppercase tracking-tight text-center">
                            Terminar Cuenta
                        </h2>
                    </div>

                    {/* Warning Message */}
                    <div className="bg-red-50/50 border border-red-100/50 rounded-3xl p-8 mb-10">
                        <p className="text-[11px] font-black text-red-700 leading-relaxed mb-6 uppercase tracking-wider">
                            ⚠️ Este protocolo es permanente e irreversible
                        </p>
                        <ul className="text-[10px] text-red-600 space-y-3 font-bold uppercase tracking-tight leading-relaxed opacity-80">
                            <li className="flex gap-3">
                                <span className="material-symbols-outlined text-sm font-black">close</span>
                                Todos los datos personales serán purgados
                            </li>
                            <li className="flex gap-3">
                                <span className="material-symbols-outlined text-sm font-black">close</span>
                                Los registros de transacciones serán cerrados
                            </li>
                            <li className="flex gap-3">
                                <span className="material-symbols-outlined text-sm font-black">close</span>
                                Los registros del sistema de reputación serán borrados
                            </li>
                            <li className="flex gap-3">
                                <span className="material-symbols-outlined text-sm font-black">close</span>
                                La recuperación de la cuenta es imposible
                            </li>
                        </ul>
                    </div>

                    {/* Confirmation Form */}
                    <form onSubmit={handleDelete} className="space-y-8">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 ml-2">
                                Escribe "borrar" para confirmar
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className="w-full bg-light-50 border-2 border-red-100 focus:border-red-500 rounded-2xl py-5 px-8 focus:bg-white outline-none font-black text-sm transition-all text-center tracking-widest placeholder:text-gray-200"
                                placeholder="BORRAR"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="flex flex-col gap-4 pt-4 text-center">
                            <button
                                type="submit"
                                disabled={loading || confirmText.toLowerCase() !== 'borrar'}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-3xl transition-all uppercase tracking-[0.2em] text-[10px] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-red-600/20 active:scale-95"
                            >
                                {loading ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                        Purgando Registros...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-xl font-black">delete_forever</span>
                                        Forzar Terminación
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-dark-800 transition-colors py-2"
                            >
                                Abortar Procedimiento
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
