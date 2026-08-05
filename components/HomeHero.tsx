import React from 'react';
import { Link } from 'react-router-dom';
import { ItemData } from '../lib/items';
import { CATEGORIES } from '../lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const CATEGORY_IMAGE_MAP: Record<string, string> = {
    'Tecnología': '1460925895917-afdab827c52f',
    'Hogar y Muebles': '1586023434215-84af6eb08b56',
    'Electrodomésticos': '1556910103-1c02745aae4d',
    'Herramientas': '1581092115919-093a8d467727',
    'Construcción': '1503387762-592deb58ef4e',
    'Moda': '1483985988355-763728e1935b',
    'Deportes y Fitness': '1517836357463-d25dfeac3438',
    'Vehículos': '1533473359331-013f956ce11c',
    'Accesorios Vehículos': '1592853625511-df73cfcb4006',
    'Bebés': '1519689680058-324335c77eba',
    'Belleza y Cuidado': '1596462502278-27bf850333ce',
    'Juegos y Juguetes': '1566576912321-7053e1eb4d3f',
    'Alimentos y Bebidas': '1542838132-92c53300491e',
    'default': '1472851294608-062e24dadaea' // generic shop
};

interface HomeHeroProps {
    featuredItems?: (ItemData & { id: string })[];
}

import { getHeroSlides, HeroSlide } from '../lib/marketing';

export default function HomeHero({ featuredItems }: HomeHeroProps) {
    const [slides, setSlides] = useState<any[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSlides = async () => {
            const data = await getHeroSlides();
            const activeSlides = data.filter(s => s.active);
            
            const defaultSlide = {
                id: 'default_original_hero',
                badge: '⚡ TENDENCIAS EN VIVO',
                title: (
                    <>
                        <span className="text-white block">Comprá.</span>
                        <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent block">Vendé.</span>
                        <span className="bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text text-transparent block">Ahorrá.</span>
                    </>
                ),
                description: 'Las mejores oportunidades de Argentina están acá. Comprá seguro o convertí lo que no usás en plata hoy mismo.',
                btn1: { label: 'Explorar Todo', to: '/search' },
                btn2: { label: 'Comenzar a Vender', to: '/publish' },
                image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2831&auto=format&fit=crop',
                bgColorFrom: 'from-slate-950',
                bgColorTo: 'to-slate-900',
                bgStyle: { backgroundColor: '#0f172a' },
                textAccent: '#a3e635',
                icon: 'bolt'
            };

            if (activeSlides.length > 0) {
                const mappedActive = activeSlides.map(s => ({
                    ...s,
                    btn1: { label: s.btnText || 'Ver Más', to: s.btnLink || '/search' },
                    bgStyle: { backgroundColor: s.bgColor || '#004d40' },
                    textAccent: s.accentColor || '#a3e635'
                }));
                setSlides([defaultSlide, ...mappedActive]);
            } else {
                setSlides([defaultSlide]);
            }
            setLoading(false);
        };
        fetchSlides();
    }, []);

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    if (loading || slides.length === 0) return null;
    const slide = slides[currentSlide];

    return (
        <section className="relative overflow-hidden font-sans mb-16 pt-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative w-full"
                >
                    {/* Background Gradient & Mesh Layer - COMPACT & CONTAINED */}
                    <div className="absolute inset-0 rounded-[40px] -z-10 overflow-hidden transition-colors duration-1000 shadow-xl" style={slide.bgStyle || { backgroundColor: '#2222FF' }}>
                        {/* If it's a fallback or has specific classes, we can still use them */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgColorFrom || ''} ${slide.bgColorTo || ''} opacity-60`}></div>
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-surface/5 backdrop-blur-3xl"></div>
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-[80px] animate-pulse"></div>
                    </div>

                    <div className="px-6 sm:px-10 py-12 md:py-16">
                        <div className="grid lg:grid-cols-2 gap-4 md:gap-10 items-center">

                            {/* TEXT CONTENT */}
                            <div className="relative z-20 space-y-6">
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="space-y-3"
                                >
                                    <span className="inline-block font-black text-[9px] uppercase tracking-[0.4em] mb-2" style={{ color: slide.textAccent || '#FFFFFF' }}>
                                        {slide.badge}
                                    </span>
                                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter">
                                        {slide.title}
                                    </h1>
                                </motion.div>

                                <motion.p 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-base text-white/70 max-w-sm leading-relaxed font-medium"
                                >
                                    {slide.description}
                                </motion.p>

                                <motion.div 
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex flex-wrap gap-4 pt-2"
                                >
                                    {slide.btn1 && (
                                        <Link
                                            to={slide.btn1.to}
                                            className="btn-secondary group px-6 py-3.5 text-xs font-black uppercase tracking-widest"
                                        >
                                            {slide.btn1.label}
                                            <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform ml-2">arrow_right_alt</span>
                                        </Link>
                                    )}
                                    {slide.btn2 && (
                                        <Link
                                            to={slide.btn2.to}
                                            className="btn-tertiary text-white hover:bg-white/10 px-6 py-3.5 text-xs font-black uppercase tracking-widest"
                                        >
                                            {slide.btn2.label}
                                        </Link>
                                    )}
                                </motion.div>
                            </div>

                            {/* VISUAL COMPONENT */}
                            <div className="relative lg:h-[350px] mt-8 lg:mt-0">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2, duration: 0.8 }}
                                    className="relative w-full h-full rounded-[32px] overflow-hidden shadow-2xl z-10"
                                >
                                    <img
                                        src={slide.image}
                                        alt={slide.badge}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-primary/10 mix-blend-multiply border border-white/5 border-dashed rounded-[32px]"></div>
                                </motion.div>

                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="absolute -bottom-6 -left-4 bg-slate-900/95 text-white backdrop-blur-xl px-5 py-4 rounded-[24px] shadow-2xl z-20 hidden sm:block border border-white/20 hover:scale-105 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 bg-gradient-to-br from-lime-400 to-green-500 text-slate-950 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-lime-500/20">
                                            <span className="material-symbols-outlined text-2xl font-black">{slide.icon || 'campaign'}</span>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-lime-400 uppercase tracking-[0.3em] mb-0.5">Destaque</p>
                                            <h3 className="text-sm font-black text-white tracking-tighter uppercase">{slide.badge}</h3>
                                        </div>
                                    </div>
                                </motion.div>

                                <div className="absolute bottom-6 right-6 z-30 text-white/30 text-[8px] font-bold uppercase tracking-[0.5em] rotate-90 origin-right">
                                    Vendelo Hoy! / 2026
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Slider Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`size-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'bg-white w-6' : 'bg-white/20'}`}
                    />
                ))}
            </div>
        </section>
    );
}
