import React from 'react';
import { motion } from 'framer-motion';

export default function About() {
    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <div className="relative py-20 lg:py-32 overflow-hidden bg-dark-900 text-white">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-primary-vibrant rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-vibrant rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
                </div>

                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-1.5 rounded-full border border-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-6"
                    >
                        Nuestra Historia
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl lg:text-7xl font-black tracking-tighter uppercase mb-8"
                    >
                        Vender sin abusos, <br />
                        <span className="text-primary-vibrant">comprar con confianza.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-400 font-bold leading-relaxed max-w-2xl mx-auto"
                    >
                        Vendelo Hoy! nació de una frustración compartida: ver cómo las grandes plataformas se quedaban con el esfuerzo de los argentinos.
                    </motion.p>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-4xl mx-auto px-6 py-20 lg:py-32">
                <div className="grid grid-cols-1 gap-8 md:gap-16 lg:gap-32">

                    {/* El Problema */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="size-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
                                <span className="material-symbols-outlined font-black">trending_down</span>
                            </div>
                            <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight">El problema con las comisiones</h2>
                        </div>
                        <div className="text-gray-600 font-bold text-lg leading-relaxed space-y-6">
                            <p>
                                Durante años, las plataformas tradicionales de venta online dominaron el mercado. Pero con el tiempo, sus comisiones se volvieron imposibles de sostener. Vender un artículo hoy significa perder entre un 15% y un 30% del valor solo en "costos de plataforma".
                            </p>
                            <p>
                                Si a eso le sumamos los costos de envío y las retenciones impositivas, el pequeño vendedor o quien solo quiere vender lo que no usa, termina regalando su trabajo. <strong>Eso nos pareció injusto.</strong>
                            </p>
                        </div>
                    </section>

                    {/* Por qué Vendelo Hoy */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="size-12 rounded-2xl bg-primary-50 text-primary-vibrant flex items-center justify-center">
                                <span className="material-symbols-outlined font-black">rocket_launch</span>
                            </div>
                            <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight">Por qué creamos Vendelo Hoy!</h2>
                        </div>
                        <div className="text-gray-600 font-bold text-lg leading-relaxed space-y-6">
                            <p>
                                Queríamos crear un lugar donde la tecnología esté al servicio de la gente, no al revés. Una plataforma pensada para el mercado argentino actual: ágil, segura y, sobre todo, transparente.
                            </p>
                            <p>
                                Vendelo Hoy! es un punto de encuentro. Eliminamos las capas de burocracia y las comisiones abusivas para que el dinero circule entre quienes producen y quienes consumen, sin intermediarios que se queden con "la parte del león".
                            </p>
                        </div>
                    </section>

                    {/* La Misión */}
                    <section className="relative p-4 md:p-12 lg:p-20 bg-light-50 rounded-[40px] border border-light-200 overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <span className="material-symbols-outlined text-[120px] font-black text-primary-vibrant">handshake</span>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter mb-8 text-dark-900">Nuestra Misión</h2>
                        <ul className="space-y-6 text-gray-500 font-black uppercase text-sm tracking-widest">
                            <li className="flex items-start gap-4">
                                <span className="material-symbols-outlined text-primary-vibrant">check_circle</span>
                                <span>Democratizar el acceso al comercio electrónico sin penalizar al vendedor.</span>
                            </li>
                            <li className="flex items-start gap-4">
                                <span className="material-symbols-outlined text-primary-vibrant">check_circle</span>
                                <span>Garantizar transacciones seguras mediante nuestro sistema de Pago Protegido.</span>
                            </li>
                            <li className="flex items-start gap-4">
                                <span className="material-symbols-outlined text-primary-vibrant">check_circle</span>
                                <span>Humanizar la tecnología: detrás de cada producto hay una persona, no un número.</span>
                            </li>
                        </ul>
                    </section>
                </div>
            </div>

            {/* CTA Final */}
            <div className="py-20 lg:py-32 bg-primary-vibrant text-white text-center">
                <div className="max-w-2xl mx-auto px-6">
                    <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tighter mb-8">¿Te sumas a la revolución del comercio justo?</h2>
                    <a href="/publish" className="inline-block bg-white text-primary-vibrant px-4 md:px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-2xl">
                        Empezar a Vender Ahora
                    </a>
                </div>
            </div>
        </div>
    );
}
