import React from 'react';
import { motion } from 'framer-motion';

export default function SecurityInfo() {
    const features = [
        {
            icon: 'shield_lock',
            title: 'Pago Protegido',
            description: 'Tu dinero no va directo al vendedor. Vendelo Hoy! lo retiene de forma segura hasta que confirmas que recibiste el producto tal cual lo esperabas.'
        },
        {
            icon: 'verified_user',
            title: 'Vendedores Verificados',
            description: 'Validamos la identidad de nuestros vendedores frecuentes para asegurar que estás tratando con personas reales y honestas.'
        },
        {
            icon: 'payments',
            title: 'Mercado Pago',
            description: 'Usamos la infraestructura más robusta de Latinoamérica. Tus datos de tarjeta y cuenta nunca son compartidos con el vendedor.'
        },
        {
            icon: 'support_agent',
            title: 'Mediación Express',
            description: 'Si algo sale mal, nuestro equipo de soporte interviene en menos de 24hs para resolver la disputa y proteger tu inversión.'
        }
    ];

    return (
        <div className="bg-light-50 min-h-screen py-20 lg:py-32">
            <div className="max-w-4xl mx-auto px-6">

                <div className="text-center mb-20 lg:mb-32">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="size-20 bg-primary-vibrant text-white rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary-vibrant/40"
                    >
                        <span className="material-symbols-outlined text-4xl font-black">gpp_good</span>
                    </motion.div>
                    <h1 className="text-4xl lg:text-6xl font-black text-dark-900 uppercase tracking-tighter mb-6">Tu seguridad es <br /> nuestro compromiso</h1>
                    <p className="text-lg text-gray-500 font-bold max-w-2xl mx-auto">En Vendelo Hoy!, comprar usado es tan seguro como comprar nuevo. Así es como protegemos tu dinero y tu confianza con nuestro sistema de Pago Protegido.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-8 lg:p-12 rounded-[40px] border border-light-200 shadow-premium hover:border-primary-200 transition-colors group"
                        >
                            <span className="material-symbols-outlined text-4xl text-primary-vibrant mb-6 block group-hover:scale-110 transition-transform">{f.icon}</span>
                            <h3 className="text-xl font-black uppercase tracking-tight text-dark-900 mb-4">{f.title}</h3>
                            <p className="text-gray-500 font-bold leading-relaxed">{f.description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Sección Pago Protegido */}
                <div className="mt-20 lg:mt-32 bg-dark-900 rounded-[40px] p-8 lg:p-20 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <span className="material-symbols-outlined text-[160px] font-black">lock_clock</span>
                    </div>

                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter mb-8">¿Cómo funciona el Pago Protegido?</h2>
                        <div className="space-y-8">
                            <div className="flex gap-6">
                                <span className="size-8 rounded-full bg-primary-vibrant flex-shrink-0 flex items-center justify-center font-black text-xs">1</span>
                                <p className="font-bold text-gray-300">Pagás el producto. El dinero queda guardado en una cuenta segura de Vendelo Hoy!</p>
                            </div>
                            <div className="flex gap-6">
                                <span className="size-8 rounded-full bg-primary-vibrant flex-shrink-0 flex items-center justify-center font-black text-xs">2</span>
                                <p className="font-bold text-gray-300">El vendedor te entrega el producto (en mano o por envío).</p>
                            </div>
                            <div className="flex gap-6">
                                <span className="size-8 rounded-full bg-primary-vibrant flex-shrink-0 flex items-center justify-center font-black text-xs">3</span>
                                <p className="font-bold text-gray-300">Confirmas en la app que todo está OK. Recién ahí le liberamos el dinero al vendedor.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-20 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8">Respaldado técnicamente por</p>
                    <div className="flex justify-center items-center gap-8 grayscale opacity-50">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Mercado_Libre_logo.svg/1200px-Mercado_Libre_logo.svg.png" className="h-8 object-contain" alt="Mercado Pago" />
                        <span className="text-2xl font-black tracking-tighter text-dark-800">FIREBASE</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
