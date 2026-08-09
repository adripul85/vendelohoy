import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { completeUserProfile } from '../lib/users';
import { useNotification } from '../context/NotificationContext';
import { mapAuthError } from '../lib/error-map';
import Logo from '../components/Logo';

const RegisterWizard = () => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const { register, refreshProfile, user } = useAuth();
    const { notify } = useNotification();
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        dni: '',
        phone: '',
        city: '',
        state: '',
        acceptedTerms: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 8) val = val.slice(0, 8);
        let formatted = val;
        if (val.length > 5) {
            formatted = val.replace(/^(\d{1,2})(\d{3})(\d{3})$/, '$1.$2.$3');
        } else if (val.length > 2) {
            formatted = val.replace(/^(\d{1,2})(\d{1,3})$/, '$1.$2');
        }
        setFormData({ ...formData, dni: formatted });
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.startsWith('54')) val = val.slice(2);
        if (val.startsWith('9')) val = val.slice(1);
        
        let formatted = '+54 9 ';
        if (val.length > 0) {
            if (val.length <= 2) {
                formatted += val;
            } else if (val.length <= 6) {
                formatted += val.slice(0, 2) + ' ' + val.slice(2);
            } else {
                formatted += val.slice(0, 2) + ' ' + val.slice(2, 6) + '-' + val.slice(6, 10);
            }
            setFormData({ ...formData, phone: formatted });
        } else {
            setFormData({ ...formData, phone: '' });
        }
    };

    const getPasswordStrength = (pass: string) => {
        let score = 0;
        if (pass.length > 5) score += 1;
        if (pass.length >= 8) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        return score; // 0 to 5
    };

    const passwordScore = getPasswordStrength(formData.password);

    const handleNext = async () => {
        if (step === 1) {
            if (!formData.email || !formData.password) {
                notify({ type: 'error', title: 'Faltan datos', message: 'Email y contraseña son obligatorios.', icon: 'error' });
                return;
            }
            if (passwordScore < 2) {
                notify({ type: 'error', title: 'Contraseña débil', message: 'Por favor, usa una contraseña más segura (mínimo 8 caracteres, números y letras).', icon: 'shield' });
                return;
            }
            if (!formData.acceptedTerms) {
                notify({ type: 'error', title: 'Términos y Condiciones', message: 'Debes aceptar los términos legales y políticas para crear tu cuenta.', icon: 'warning' });
                return;
            }
            setIsLoading(true);
            try {
                await register(formData.email, formData.password);
                setStep(2);
            } catch (error: any) {
                const friendlyMessage = mapAuthError(error.code);
                notify({ type: 'error', title: 'Error de Registro', message: friendlyMessage, icon: 'error' });
            } finally {
                setIsLoading(false);
            }
        } else if (step === 2) {
            if (!formData.displayName || !formData.dni) {
                notify({ type: 'error', title: 'Faltan datos', message: 'Nombre y DNI son obligatorios.', icon: 'error' });
                return;
            }
            
            const cleanDni = formData.dni.replace(/\./g, '');
            if (!/^\d{7,8}$/.test(cleanDni)) {
                notify({ type: 'error', title: 'DNI Inválido', message: 'El documento debe contener 7 u 8 números válidos.', icon: 'badge' });
                return;
            }

            setStep(3);
        } else if (step === 3) {
            if (!formData.phone || !formData.city || !formData.state) {
                notify({ type: 'error', title: 'Faltan datos', message: 'Completa tu ubicación y contacto.', icon: 'error' });
                return;
            }

            setIsLoading(true);
            try {
                if (!user) throw new Error("Sesión no detectada.");

                await completeUserProfile(user.uid, {
                    displayName: formData.displayName,
                    dni: formData.dni,
                    email: user.email || formData.email,
                    phone: formData.phone,
                    location: {
                        city: formData.city,
                        state: formData.state
                    },
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName)}&background=random`,
                    termsAccepted: formData.acceptedTerms,
                    termsAcceptedAt: new Date().toISOString()
                });

                await refreshProfile();
                notify({ type: 'success', title: '¡Bienvenido!', message: 'Cuenta configurada con éxito. Verifica tu email para comenzar.', icon: 'mark_email_read' });
                navigate('/verify-email');
            } catch (error: any) {
                notify({ type: 'error', title: 'Error Final', message: error.message || 'No se pudo completar el perfil.', icon: 'error' });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const steps = [
        { id: 1, title: 'Cuenta', icon: 'account_circle' },
        { id: 2, title: 'Identidad', icon: 'badge' },
        { id: 3, title: 'Contacto', icon: 'location_on' },
    ];

    return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-primary-500/30">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-primary/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-secondary/10 rounded-full blur-[120px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Brand Logo */}
                <div className="flex justify-center mb-8">
                    <Logo size="lg" />
                </div>

                {/* Progress Bar */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-4">
                        {steps.map((s) => (
                            <div key={s.id} className="flex flex-col items-center gap-2">
                                <div className={`size-10 rounded-xl flex items-center justify-center transition-all duration-500 ${step >= s.id ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30'}`}>
                                    <span className="material-symbols-outlined text-xl">{s.icon}</span>
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest ${step >= s.id ? 'text-primary' : 'text-outline-variant'}`}>{s.title}</span>
                            </div>
                        ))}
                    </div>
                    <div className="h-1 bg-surface-container-lowest rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: `${(step / steps.length) * 100}%` }}
                            className="h-full bg-gradient-to-r from-sky-700 to-cyan-600"
                        />
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-surface/80 backdrop-blur-3xl rounded-[40px] p-8 md:p-12 border border-outline-variant/30 shadow-2xl">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-on-surface uppercase tracking-tight mb-2">Crear Cuenta</h2>
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Paso 1: Tus datos de acceso</p>
                                </div>
                                <div className="space-y-5">
                                    <div className="group">
                                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-2 ml-2">Email Corporativo / Personal</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="MAIL@EJEMPLO.COM"
                                            className="w-full px-6 py-4 rounded-2xl border-2 border-outline-variant/30 bg-surface-container text-on-surface text-[11px] font-black tracking-widest outline-none focus:border-primary/50 transition-all placeholder:text-outline-variant"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-2 ml-2">Contraseña</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className="w-full px-6 py-4 rounded-2xl border-2 border-outline-variant/30 bg-surface-container text-on-surface text-[11px] font-black tracking-widest outline-none focus:border-primary/50 transition-all placeholder:text-outline-variant"
                                        />
                                        {/* Password Strength Meter */}
                                        {formData.password && (
                                            <div className="mt-3 animate-in fade-in duration-300">
                                                <div className="flex gap-1 h-1.5 mb-1.5">
                                                    {[1, 2, 3, 4, 5].map((lvl) => (
                                                        <div 
                                                            key={lvl} 
                                                            className={`flex-1 rounded-full transition-all duration-300 ${
                                                                passwordScore >= lvl 
                                                                    ? passwordScore < 2 ? 'bg-error' : passwordScore < 4 ? 'bg-amber-500' : 'bg-emerald-500' 
                                                                    : 'bg-outline-variant/20'
                                                            }`}
                                                        ></div>
                                                    ))}
                                                </div>
                                                <p className={`text-[9px] font-black uppercase tracking-widest text-right ${
                                                    passwordScore < 2 ? 'text-error' : passwordScore < 4 ? 'text-amber-500' : 'text-emerald-500'
                                                }`}>
                                                    {passwordScore < 2 ? 'Débil' : passwordScore < 4 ? 'Aceptable' : 'Fuerte'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Terms Checkbox */}
                                    <div className="mt-5 flex items-start gap-3">
                                        <div className="flex h-6 items-center">
                                            <input
                                                id="terms"
                                                name="acceptedTerms"
                                                type="checkbox"
                                                checked={formData.acceptedTerms}
                                                onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                                                className="h-4 w-4 rounded border-outline-variant/30 text-primary focus:ring-primary/50 bg-surface-container"
                                            />
                                        </div>
                                        <div className="text-[10px] leading-tight text-on-surface-variant">
                                            <label htmlFor="terms" className="font-medium">
                                                He leído y acepto los{' '}
                                                <a href="/legal/terms" target="_blank" className="text-primary hover:underline font-bold">Términos y Condiciones</a>,{' '}
                                                la <a href="/legal/privacy" target="_blank" className="text-primary hover:underline font-bold">Política de Privacidad</a> y comprendo los{' '}
                                                <a href="/legal/prohibited" target="_blank" className="text-primary hover:underline font-bold">Elementos Prohibidos</a> para la venta.
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-on-surface uppercase tracking-tight mb-2">Sobre Ti</h2>
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Paso 2: Necesitamos estos datos para tu seguridad</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="group">
                                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-2 ml-2">Nombre Completo</label>
                                        <input
                                            type="text"
                                            name="displayName"
                                            value={formData.displayName}
                                            onChange={handleChange}
                                            placeholder="JUAN PEREZ"
                                            className="w-full px-6 py-4 rounded-2xl border-2 border-outline-variant/30 bg-surface-container text-on-surface text-[11px] font-black tracking-widest outline-none focus:border-primary/50 transition-all placeholder:text-outline-variant uppercase"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-2 ml-2">Documento Nacional de Identidad</label>
                                        <input
                                            type="text"
                                            name="dni"
                                            value={formData.dni}
                                            onChange={handleDniChange}
                                            placeholder="12.345.678"
                                            className="w-full px-6 py-4 rounded-2xl border-2 border-outline-variant/30 bg-surface-container text-on-surface text-[11px] font-black tracking-widest outline-none focus:border-primary/50 transition-all placeholder:text-outline-variant"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-on-surface uppercase tracking-tight mb-2">Contacto</h2>
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Paso 3: Datos de contacto y entrega</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="group">
                                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-2 ml-2">Teléfono de Contacto</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handlePhoneChange}
                                            placeholder="+54 9 11 0000-0000"
                                            className="w-full px-6 py-4 rounded-2xl border-2 border-outline-variant/30 bg-surface-container text-on-surface text-[11px] font-black tracking-widest outline-none focus:border-primary/50 transition-all placeholder:text-outline-variant"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group">
                                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-2 ml-2">Ciudad</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                placeholder="EJ: CABA"
                                                className="w-full px-6 py-4 rounded-2xl border-2 border-outline-variant/30 bg-surface-container text-on-surface text-[11px] font-black tracking-widest outline-none focus:border-primary/50 transition-all placeholder:text-outline-variant uppercase"
                                            />
                                        </div>
                                        <div className="group relative">
                                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-2 ml-2">Provincia</label>
                                            <select
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange as any}
                                                className="w-full px-6 py-4 rounded-2xl border-2 border-outline-variant/30 bg-surface-container text-on-surface text-[11px] font-black tracking-widest outline-none focus:border-primary/50 transition-all uppercase appearance-none"
                                            >
                                                <option value="" disabled>Seleccionar Provincia</option>
                                                {["Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"].map(prov => (
                                                    <option key={prov} value={prov}>{prov}</option>
                                                ))}
                                            </select>
                                            <span className="material-symbols-outlined absolute right-4 top-[38px] text-on-surface-variant pointer-events-none">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-12 flex items-center justify-between gap-4">
                        {step > 1 && step < 4 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-8 py-4 text-[9px] font-black text-on-surface-variant uppercase tracking-widest hover:text-on-surface transition-all"
                            >
                                Volver
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            disabled={isLoading}
                            className={`flex-grow py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 ${isLoading ? 'bg-surface-container-lowest text-outline-variant' : 'bg-primary text-on-surface shadow-xl shadow-primary/20 hover:bg-primary/90'}`}
                        >
                            {isLoading ? (
                                <span className="material-symbols-outlined animate-spin">sync</span>
                            ) : (
                                <>
                                    <span>{step === 3 ? 'Finalizar Registro' : 'Siguiente Paso'}</span>
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <Link
                        to="/login"
                        className="text-[9px] font-black text-outline-variant uppercase tracking-[0.3em] hover:text-primary transition-all border-b border-transparent hover:border-primary-500/30 pb-1"
                    >
                        ¿Ya tienes una identidad? Acceder aquí
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterWizard;
