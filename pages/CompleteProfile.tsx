import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { completeUserProfile } from '../lib/users';
import { useNotification } from '../context/NotificationContext';

export default function CompleteProfile() {
    const navigate = useNavigate();
    const { user, refreshProfile } = useAuth();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        displayName: user?.displayName || '',
        phone: '',
        city: '',
        state: '',
        dni: '',
        bio: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            notify({ type: 'error', title: 'Error', message: 'No se encontró una sesión activa.', icon: 'error' });
            return;
        }

        if (!form.displayName || !form.phone || !form.city || !form.state || !form.dni) {
            notify({ type: 'warning', title: 'Campos Incompletos', message: 'Por favor completa toda la información requerida.', icon: 'warning' });
            return;
        }

        setLoading(true);

        const result = await completeUserProfile(user.uid, {
            displayName: form.displayName,
            dni: form.dni,
            email: user.email || '',
            phone: form.phone,
            location: {
                city: form.city,
                state: form.state
            },
            bio: form.bio,
            avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.displayName)}&background=random`
        });

        setLoading(false);

        if (result.success) {
            await refreshProfile();
            notify({ type: 'success', title: '¡Perfil Completado!', message: 'Tu identidad ha sido inicializada exitosamente.', icon: 'check_circle' });
            navigate('/dashboard');
        } else {
            notify({ type: 'error', title: 'Error de Procesamiento', message: 'No se pudo finalizar la configuración de tu perfil. Inténtalo de nuevo.', icon: 'error' });
        }
    };

    return (
        <div className="min-h-screen bg-light-50 flex items-center justify-center px-6 py-20">
            <div className="max-w-lg w-full animate-in fade-in zoom-in-95 duration-700">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center size-16 bg-primary-50 rounded-[28px] mb-6 shadow-sm">
                        <span className="material-symbols-outlined text-3xl text-primary-vibrant font-black">person_add</span>
                    </div>
                    <h1 className="text-3xl font-black text-dark-800 mb-2 tracking-tight uppercase">Inicializar Perfil</h1>
                    <p className="text-[11px] font-bold text-gray-400">Asegura tu identidad en el mercado para comenzar a operar.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white p-4 md:p-10 rounded-[40px] shadow-premium border border-light-200 space-y-6">

                    {/* Display Name */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">
                            Nombre Legal Completo *
                        </label>
                        <input
                            type="text"
                            name="displayName"
                            value={form.displayName}
                            onChange={handleChange}
                            placeholder="ej. Juan Pérez"
                            className="w-full p-5 rounded-2xl border-2 border-transparent bg-light-50 focus:bg-white focus:border-primary-100 outline-none transition-all font-bold text-dark-800 placeholder:text-gray-200"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">
                            Número de Móvil *
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="ej. +1 (555) 000-0000"
                            className="w-full p-5 rounded-2xl border-2 border-transparent bg-light-50 focus:bg-white focus:border-primary-100 outline-none transition-all font-bold text-dark-800 placeholder:text-gray-200"
                            required
                        />
                    </div>

                    {/* DNI */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">
                            Número de DNI *
                        </label>
                        <input
                            type="text"
                            name="dni"
                            value={form.dni}
                            onChange={handleChange}
                            placeholder="ej. 12.345.678"
                            className="w-full p-5 rounded-2xl border-2 border-transparent bg-light-50 focus:bg-white focus:border-primary-100 outline-none transition-all font-bold text-dark-800 placeholder:text-gray-200"
                            required
                        />
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">
                                Ciudad *
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={form.city}
                                onChange={handleChange}
                                placeholder="ej. Nueva York"
                                className="w-full p-5 rounded-2xl border-2 border-transparent bg-light-50 focus:bg-white focus:border-primary-100 outline-none transition-all font-bold text-dark-800 placeholder:text-gray-200"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">
                                Provincia/Estado *
                            </label>
                            <input
                                type="text"
                                name="state"
                                value={form.state}
                                onChange={handleChange}
                                placeholder="ej. NY"
                                className="w-full p-5 rounded-2xl border-2 border-transparent bg-light-50 focus:bg-white focus:border-primary-100 outline-none transition-all font-bold text-dark-800 placeholder:text-gray-200"
                                required
                            />
                        </div>
                    </div>

                    {/* Bio (Optional) */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">
                            Bio Profesional (Opcional)
                        </label>
                        <textarea
                            name="bio"
                            value={form.bio}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Cuéntanos sobre ti o tu negocio..."
                            className="w-full p-5 rounded-2xl border-2 border-transparent bg-light-50 focus:bg-white focus:border-primary-100 outline-none transition-all font-bold text-dark-800 placeholder:text-gray-200 resize-none"
                        />
                    </div>

                    {/* Trust Badge */}
                    <div className="bg-primary-50 border border-primary-100/50 p-6 rounded-3xl flex gap-5 items-center">
                        <div className="size-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-primary-vibrant font-black">shield_person</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-primary-900 uppercase tracking-widest mb-1">Protocolo de Privacidad Activo</p>
                            <p className="text-[9px] font-bold text-primary-600/70 uppercase leading-relaxed">
                                Tu información sensible solo se comparte con contrapartes verificadas durante transacciones activas.
                            </p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-vibrant text-white font-black py-6 rounded-3xl hover:opacity-95 transition-all shadow-2xl shadow-primary-500/10 disabled:opacity-50 flex justify-center items-center gap-4 active:scale-[0.98]"
                    >
                        {loading ? (
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                <span className="uppercase tracking-[0.2em] text-xs">Procesando...</span>
                            </div>
                        ) : (
                            <>
                                <span className="material-symbols-outlined font-black text-lg">verified</span>
                                <span className="uppercase tracking-[0.2em] text-xs">Finalizar Configuración de Identidad</span>
                            </>
                        )}
                    </button>

                    <p className="text-center text-[9px] font-black text-gray-200 uppercase tracking-widest">
                        * Campos requeridos para acceso al mercado
                    </p>
                </form>
            </div>
        </div>
    );
}
