import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { sendEmailVerification, reload } from 'firebase/auth';
import { useNotification } from '../context/NotificationContext';
import Logo from '../components/Logo';

export default function VerifyEmail() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [sending, setSending] = useState(false);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        // If user is already verified or null, redirect
        if (!user) {
            navigate('/login');
        } else if (user.emailVerified) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleResend = async () => {
        if (!user) return;
        setSending(true);
        try {
            await sendEmailVerification(user);
            notify({ type: 'success', title: 'Email enviado', message: 'Revisa tu bandeja de entrada o spam.', icon: 'forward_to_inbox' });
        } catch (error: any) {
            if (error.code === 'auth/too-many-requests') {
                notify({ type: 'error', title: 'Espera un momento', message: 'Has enviado demasiados correos. Intenta más tarde.', icon: 'timer' });
            } else {
                notify({ type: 'error', title: 'Error', message: 'No se pudo enviar el correo.', icon: 'error' });
            }
        } finally {
            setSending(false);
        }
    };

    const handleCheckVerification = async () => {
        if (!user) return;
        setChecking(true);
        try {
            await reload(user);
            if (user.emailVerified) {
                notify({ type: 'success', title: 'Cuenta verificada', message: '¡Gracias por verificar tu correo!', icon: 'verified' });
                navigate('/dashboard');
            } else {
                notify({ type: 'warning', title: 'Aún no verificado', message: 'Parece que todavía no has hecho clic en el enlace.', icon: 'pending' });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setChecking(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-amber-500/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md relative z-10 text-center">
                <div className="flex justify-center mb-8">
                    <Logo size="lg" />
                </div>

                <div className="bg-surface/80 backdrop-blur-3xl rounded-[40px] p-8 md:p-12 border border-outline-variant/30 shadow-2xl">
                    <div className="size-20 bg-amber-500/10 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20 shadow-sm">
                        <span className="material-symbols-outlined text-4xl">mark_email_unread</span>
                    </div>
                    
                    <h1 className="text-2xl font-black text-on-surface uppercase tracking-tight mb-4">Verifica tu Correo</h1>
                    
                    <p className="text-sm font-bold text-on-surface-variant mb-6 leading-relaxed">
                        Para proteger tu cuenta y la de los demás, necesitamos verificar que 
                        <span className="text-on-surface bg-surface-container-high px-2 py-0.5 rounded-md mx-1 select-all">{user.email}</span> 
                        te pertenece.
                    </p>

                    <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 mb-8 text-left">
                        <p className="text-[10px] font-black text-on-surface uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-primary">info</span>
                            Instrucciones
                        </p>
                        <ol className="text-[11px] font-bold text-on-surface-variant space-y-2 pl-4 list-decimal">
                            <li>Revisa tu bandeja de entrada.</li>
                            <li>Busca el correo de <strong>De Oportunidades</strong>.</li>
                            <li>Haz clic en el enlace de verificación.</li>
                            <li>Vuelve aquí y presiona "Ya lo verifiqué".</li>
                        </ol>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleCheckVerification} 
                            disabled={checking}
                            className="w-full py-4 rounded-xl bg-primary text-on-primary text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {checking ? (
                                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-sm">refresh</span>
                            )}
                            Ya lo verifiqué
                        </button>
                        
                        <button 
                            onClick={handleResend} 
                            disabled={sending}
                            className="w-full py-4 rounded-xl bg-surface-container-high text-on-surface-variant text-xs font-black uppercase tracking-widest transition-all hover:bg-outline-variant/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            {sending ? (
                                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-sm">send</span>
                            )}
                            Reenviar correo
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-outline-variant/20">
                        <button onClick={handleLogout} className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest hover:text-error transition-colors">
                            Cerrar Sesión o Cambiar Cuenta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
