import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]"></div>
                <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] bg-primary-vibrant/10 rounded-full blur-[100px]"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center z-10 max-w-lg"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                    className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-vibrant mb-6 drop-shadow-sm"
                >
                    404
                </motion.div>
                
                <h1 className="text-3xl font-black text-on-surface uppercase tracking-tight mb-4">
                    ¡Ups! Te perdiste
                </h1>
                
                <p className="text-sm font-medium text-on-surface-variant mb-10 leading-relaxed">
                    La página que estás buscando no existe, fue movida o temporalmente no está disponible. ¿Por qué no exploras las increíbles ofertas que tenemos para ti?
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                        to="/" 
                        className="px-8 py-4 bg-primary text-on-primary rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">home</span>
                        Ir al Inicio
                    </Link>
                    <Link 
                        to="/deals" 
                        className="px-8 py-4 bg-surface-container text-on-surface rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">local_offer</span>
                        Ver Ofertas
                    </Link>
                </div>
            </motion.div>

            {/* Decorative SVG / Graphic */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 1 }}
                className="absolute bottom-10 opacity-30 pointer-events-none"
            >
                <span className="material-symbols-outlined" style={{ fontSize: '120px' }}>
                    explore_off
                </span>
            </motion.div>
        </div>
    );
}
