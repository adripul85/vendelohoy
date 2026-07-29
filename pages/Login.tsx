import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../lib/auth';
import { mapAuthError } from '../lib/error-map';
import Logo from '../components/Logo';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showVerificationSent, setShowVerificationSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const navigate = useNavigate();
  const { notify } = useNotification();
  const { login, register, loginWithGoogle, resetPassword } = useAuth();

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      notify({ type: 'error', title: 'Entrada Inválida', message: 'Por favor ingresa tus credenciales.', icon: 'error' });
      triggerShake();
      return;
    }

    if (!isLogin && password.length < 8) {
      notify({ type: 'error', title: 'Contraseña débil', message: 'La contraseña debe tener al menos 8 caracteres.', icon: 'error' });
      triggerShake();
      return;
    }

    setIsLoadingAuth(true);
    try {
      if (isLogin) {
        await login(email, password);
        notify({ type: 'success', title: 'Sesión Iniciada', message: 'Accediendo a tu panel seguro.', icon: 'verified_user' });
        navigate('/dashboard');
      } else {
        await register(email, password);
        notify({ type: 'info', title: 'Cuenta Creada', message: 'Se ha enviado un correo electrónico de verificación.', icon: 'mail' });
        setShowVerificationSent(true);
      }
    } catch (err: any) {
      triggerShake();
      const friendlyMessage = mapAuthError(err.code);
      notify({ type: 'error', title: 'Acceso Incorrecto', message: friendlyMessage, icon: 'security' });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      notify({ type: 'info', title: 'Correo Requerido', message: 'Por favor, ingresa tu correo para reestablecer la contraseña.', icon: 'mail' });
      triggerShake();
      return;
    }

    setIsLoadingAuth(true);
    try {
      await resetPassword(email);
      notify({
        type: 'success',
        title: 'Correo Enviado',
        message: 'Revisa tu bandeja de entrada para reestablecer tu contraseña.',
        icon: 'mark_email_read'
      });
    } catch (err: any) {
      triggerShake();
      const friendlyMessage = mapAuthError(err.code);
      notify({ type: 'error', title: 'Error de Envío', message: friendlyMessage, icon: 'security' });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      notify({ type: 'success', title: 'Autenticación Exitosa', message: 'Identidad validada vía Google.', icon: 'verified_user' });
      navigate('/dashboard');
    } catch (err: any) {
      notify({ type: 'error', title: 'Error de Inicio de Sesión Social', message: err.message || 'No se pudo completar la autenticación.', icon: 'error' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-surface selection:bg-primary/30 selection:text-primary">

      {/* --- PREMIUM AMBIENT BACKGROUND --- */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-primary/10 rounded-full blur-[120px] animate-mesh-1"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-secondary/10 rounded-full blur-[120px] animate-mesh-2"></div>
        <div className="absolute top-[30%] left-[50%] w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[100px] animate-mesh-3"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >

        {/* --- GLASS CARD --- */}
        <div className={`bg-surface/80 backdrop-blur-3xl rounded-[40px] p-8 md:p-10 border border-outline-variant/30 shadow-2xl relative transition-all duration-300 ${isShaking ? 'animate-shake ring-4 ring-error/30' : 'hover:border-primary/20 hover:shadow-primary/10'}`}>

          <AnimatePresence mode="wait">
            {showVerificationSent ? (
              <motion.div
                key="verification"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="size-24 bg-green-500/10 rounded-[40px] flex items-center justify-center mx-auto mb-12 border border-green-500/20 shadow-sm animate-float">
                  <span className="material-symbols-outlined text-5xl text-green-600">mark_as_unread</span>
                </div>
                <h1 className="text-3xl font-black text-primary mb-6 tracking-tight font-headline">Verifica tu correo</h1>
                <p className="text-sm font-medium text-on-surface-variant mb-10 leading-relaxed px-4">
                  Te enviamos un enlace de confirmación a:<br />
                  <span className="text-primary font-bold border-b-2 border-primary/30 pb-0.5 mt-4 block">{email}</span>
                </p>

                <div className="space-y-6">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-5 bg-primary text-on-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-lg hover:opacity-90 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <span className="material-symbols-outlined text-xl">verified</span>
                    <span>Ir al panel principal</span>
                  </button>
                  <div className="pt-8 border-t border-outline-variant/30">
                    <button
                      onClick={() => { setShowVerificationSent(false); setIsLogin(true); }}
                      className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] hover:text-primary transition-all"
                    >
                      Volver al inicio de sesión
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-10">
                  <div className="flex justify-center mb-6">
                    <Logo size="lg" />
                  </div>
                  <h1 className="text-3xl font-black text-primary mb-2 tracking-tight font-headline">
                    {isLogin ? 'Bienvenido' : 'Crear Cuenta'}
                  </h1>
                  <div className="flex items-center justify-center gap-2">
                    <div className="size-1.5 bg-secondary rounded-full animate-pulse"></div>
                    <p className="text-sm font-medium text-on-surface-variant">
                      {isLogin ? 'Ingresa tus credenciales' : 'Únete al mercado'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="group">
                    <label className="block text-sm font-semibold text-on-surface-variant mb-2 ml-1 group-focus-within:text-primary transition-colors">Correo Electrónico</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full px-5 py-4 rounded-xl border-2 border-outline-variant/50 bg-surface text-base text-on-surface focus:bg-surface focus:border-primary outline-none transition-all placeholder:text-outline shadow-sm"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-sm font-semibold text-on-surface-variant mb-2 ml-1 group-focus-within:text-primary transition-colors">Contraseña</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-5 py-4 rounded-xl border-2 border-outline-variant/50 bg-surface text-base text-on-surface focus:bg-surface focus:border-primary outline-none transition-all placeholder:text-outline shadow-sm"
                    />
                  </div>

                  {isLogin && (
                    <div className="text-right px-2">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={isLoadingAuth}
                        className="text-sm font-medium text-secondary hover:underline transition-colors disabled:opacity-50"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoadingAuth}
                    className={`w-full py-4 mt-2 text-sm font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-4 shadow-lg ${isLoadingAuth
                      ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed border border-outline-variant/50'
                      : 'bg-primary text-on-primary hover:shadow-primary/40 hover:opacity-95 hover:-translate-y-0.5'
                      }`}
                  >
                    <span>{isLoadingAuth ? 'Procesando...' : isLogin ? 'Entrar' : 'Crear Cuenta'}</span>
                    {!isLoadingAuth && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
                  </motion.button>
                </form>

                <div className="mt-8">
                  <div className="relative flex items-center justify-center mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-outline-variant/50"></div>
                    </div>
                    <span className="relative px-4 bg-surface/80 text-[9px] font-black uppercase text-on-surface-variant tracking-[0.3em]">O ingresa con</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleLogin}
                    disabled={isLoadingAuth}
                    className="w-full flex items-center justify-center gap-4 py-4 px-6 bg-surface border-2 border-outline-variant/30 rounded-xl transition-all font-black text-[10px] uppercase tracking-[0.3em] text-on-surface shadow-sm hover:bg-surface-container-low group"
                  >
                    <svg className="size-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </motion.button>
                </div>

                <div className="mt-8 text-center">
                  <button
                    onClick={() => {
                      if (isLogin) {
                        navigate('/register');
                      } else {
                        setIsLogin(true);
                      }
                    }}
                    className="text-on-surface-variant font-black text-[9px] uppercase tracking-[0.3em] hover:text-primary transition-all border-b-2 border-transparent hover:border-primary pb-1"
                  >
                    {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya estás registrado? Inicia sesión"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-10 text-[9px] font-black text-on-surface-variant uppercase tracking-[0.4em] px-8 leading-relaxed opacity-60">
          Tus datos están protegidos por <span className="text-primary underline decoration-primary/40 hover:text-secondary cursor-pointer">Seguridad Avanzada</span>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
