import React from 'react';
import { motion } from 'framer-motion';

export default function GamificationRules() {
    const levels = [
        { name: 'Bronce', min: 0, max: 999, icon: 'military_tech', color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/20' },
        { name: 'Plata', min: 1000, max: 2499, icon: 'military_tech', color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' },
        { name: 'Oro', min: 2500, max: 4999, icon: 'workspace_premium', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
        { name: 'Diamante', min: 5000, max: '∞', icon: 'diamond', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' }
    ];

    const actions = [
        { action: 'Verificar Identidad (DNI)', points: '+500 XP', frequency: 'Única vez' },
        { action: 'Vincular Cuenta de Cobro (CBU)', points: '+300 XP', frequency: 'Única vez' },
        { action: 'Completar Perfil (Foto, Bio)', points: '+200 XP', frequency: 'Única vez' },
        { action: 'Venta Exitosa (Sin reclamos)', points: '+25 XP', frequency: 'Ilimitado' },
        { action: 'Recibir recomendación de 5 estrellas', points: '+5 XP', frequency: 'Ilimitado' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-24 font-['Inter']">
            <div className="max-w-4xl mx-auto px-6">
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <span className="text-primary-vibrant font-black uppercase tracking-[0.3em] text-sm bg-primary-50 px-4 py-2 rounded-xl inline-block mb-4">SISTEMA DE REPUTACIÓN</span>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">Niveles y Recompensas</h1>
                    <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
                        En Vendelo Hoy! premiamos a los vendedores confiables. Gana puntos de experiencia (XP) completando misiones y realizando ventas para desbloquear niveles con beneficios exclusivos.
                    </p>
                </motion.div>

                <div className="space-y-16">
                    {/* Niveles Section */}
                    <section>
                        <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary-vibrant">auto_awesome</span>
                            Niveles de Confianza
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {levels.map((level, i) => (
                                <motion.div 
                                    key={level.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`bg-white rounded-[32px] p-8 border-2 ${level.border} shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden`}
                                >
                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className={`size-16 rounded-2xl ${level.bg} flex items-center justify-center shrink-0`}>
                                            <span className={`material-symbols-outlined text-4xl font-black ${level.color}`}>
                                                {level.icon}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className={`text-2xl font-black ${level.color}`}>{level.name}</h3>
                                            <p className="text-slate-500 font-bold mt-1 text-sm">{level.min} - {level.max} XP</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-8 space-y-3 relative z-10">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Beneficios</h4>
                                        <ul className="space-y-2">
                                            {i >= 1 && (
                                                <li className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                    <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                                                    Badge de Verificado
                                                </li>
                                            )}
                                            {i >= 2 && (
                                                <li className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                    <span className="material-symbols-outlined text-primary-vibrant text-lg">star</span>
                                                    Publicaciones Destacadas Gratis
                                                </li>
                                            )}
                                            {i >= 3 && (
                                                <li className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                    <span className="material-symbols-outlined text-cyan-500 text-lg">support_agent</span>
                                                    Soporte Prioritario VIP
                                                </li>
                                            )}
                                            {i === 0 && (
                                                <li className="text-sm font-medium text-slate-500">Beneficios básicos de la plataforma.</li>
                                            )}
                                        </ul>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Acciones Section */}
                    <section>
                        <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary-vibrant">add_circle</span>
                            ¿Cómo ganar XP?
                        </h2>
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Misión / Acción</th>
                                            <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">XP Otorgada</th>
                                            <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Frecuencia</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {actions.map((act, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6 text-sm font-bold text-slate-900">{act.action}</td>
                                                <td className="px-8 py-6 text-sm font-black text-primary-600">{act.points}</td>
                                                <td className="px-8 py-6 text-xs font-medium text-slate-500">{act.frequency}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
