import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const stepVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.2, duration: 0.8, ease: "easeOut" }
    })
};

const Landing = () => {
    return (
        <div className="font-sans bg-white pb-32">
            {/* HEROS SECTION */}
            <section className="relative overflow-hidden bg-slate-900 text-white py-32 lg:py-48 px-6">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
                </div>

                <div className="max-w-[1200px] mx-auto relative z-10 text-center">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 mx-auto">
                        <span className="material-symbols-outlined text-primary-400 font-black">bolt</span>
                        <span className="text-sm font-bold uppercase tracking-[0.2em] text-white">Transacciones 100% Seguras</span>
                    </motion.div>

                    <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }} className="text-5xl md:text-7xl lg:text-8xl font-black font-display tracking-tighter mb-8 leading-[1.1]">
                        El Mercado Que <br />
                        <span className="text-primary-500">Siempre Funciona.</span>
                    </motion.h1>

                    <motion.p initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }} className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-12 font-medium">
                        Comprá y vendé sin vueltas. Nuestro sistema de Pago Protegido protege tu dinero hasta que tengas el producto en tus manos. Así de simple.
                    </motion.p>

                    <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/login?tab=register" className="w-full sm:w-auto px-4 md:px-10 py-5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary-600/30 transition-all hover:-translate-y-1 hover:shadow-primary-600/50 flex items-center justify-center gap-3">
                            Abrir Mi Cuenta
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </Link>
                        <Link to="/login" className="w-full sm:w-auto px-4 md:px-10 py-5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-2xl font-black uppercase tracking-[0.2em] backdrop-blur-md transition-all">
                            Ya tengo cuenta
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* 3 STEPS SECTION */}
            <section className="py-32 px-6 max-w-[1200px] mx-auto">
                <div className="text-center mb-24">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 font-display">
                        El proceso es <span className="text-primary-600">Dicho y Hecho.</span>
                    </h2>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Diseñamos el flujo perfecto para que no tengas que preocuparte por nada más que conseguir el mejor trato.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 lg:gap-8">
                    {/* STEP 1 */}
                    <motion.div custom={1} variants={stepVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="relative bg-slate-50 p-4 md:p-10 rounded-[40px] border border-slate-100 hover:border-primary-100 transition-colors group">
                        <div className="absolute -top-8 left-10 text-[120px] font-black leading-none text-slate-200/50 group-hover:text-primary-100/50 transition-colors pointer-events-none select-none -z-0">
                            1
                        </div>
                        <div className="relative z-10">
                            <div className="size-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-primary-50 group-hover:border-primary-100 group-hover:scale-110 transition-all">
                                <span className="material-symbols-outlined text-3xl text-slate-900 group-hover:text-primary-600">storefront</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Publicá gratis</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">Sacale un par de fotos, ponele precio y publicá tu artículo en segundos. Sin comisiones ocultas ni letra chica.</p>
                        </div>
                    </motion.div>

                    {/* STEP 2 */}
                    <motion.div custom={2} variants={stepVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="relative bg-slate-50 p-4 md:p-10 rounded-[40px] border border-slate-100 hover:border-primary-100 transition-colors group">
                        <div className="absolute -top-8 left-10 text-[120px] font-black leading-none text-slate-200/50 group-hover:text-primary-100/50 transition-colors pointer-events-none select-none -z-0">
                            2
                        </div>
                        <div className="relative z-10">
                            <div className="size-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-primary-50 group-hover:border-primary-100 group-hover:scale-110 transition-all">
                                <span className="material-symbols-outlined text-3xl text-slate-900 group-hover:text-primary-600">chat</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Chateá y acordá</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">Hablá directamente con el comprador. Negocien el precio, los detalles y el punto de encuentro por el chat integrado.</p>
                        </div>
                    </motion.div>

                    {/* STEP 3 */}
                    <motion.div custom={3} variants={stepVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="relative bg-slate-50 p-4 md:p-10 rounded-[40px] border border-slate-100 hover:border-primary-100 transition-colors group">
                        <div className="absolute -top-8 left-10 text-[120px] font-black leading-none text-slate-200/50 group-hover:text-primary-100/50 transition-colors pointer-events-none select-none -z-0">
                            3
                        </div>
                        <div className="relative z-10">
                            <div className="size-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-primary-50 group-hover:border-primary-100 group-hover:scale-110 transition-all">
                                <span className="material-symbols-outlined text-3xl text-slate-900 group-hover:text-primary-600">verified_user</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Cobrá seguro</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">El pago se retiene de forma segura hasta la entrega. Una vez confirmado, los fondos se liberan directo a tu billetera.</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* TRUST BANNER */}
            <section className="bg-slate-50 py-24 px-6 border-y border-slate-100">
                <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
                    <div className="md:w-1/2">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 font-display">
                            Protegemos lo que es tuyo.
                        </h2>
                        <ul className="space-y-6">
                            {[
                                { text: "Fondos en garantía (Pago Protegido)", icon: "lock" },
                                { text: "Sistema de reputación de 5 estrellas", icon: "star" },
                                { text: "Centro de resolución de disputas", icon: "gavel" },
                                { text: "Soporte de moderadores 24/7", icon: "support_agent" }
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-4">
                                    <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <span className="material-symbols-outlined">{item.icon}</span>
                                    </div>
                                    <span className="text-lg font-bold text-slate-700">{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="md:w-1/2 relative">
                        <div className="aspect-square bg-slate-200 rounded-full w-[80%] mx-auto overflow-hidden border-8 border-white shadow-2xl relative">
                            {/* Decorative glowing overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-transparent mix-blend-overlay z-10" />
                            <div className="absolute inset-0 bg-slate-300"></div>{/* Placeholder bg if img is absent */}
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                                <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white flex flex-col items-center animate-bounce">
                                    <span className="material-symbols-outlined text-5xl text-emerald-500 mb-2">shield</span>
                                    <span className="text-sm font-black uppercase tracking-widest text-slate-900">Compra Protegida</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
