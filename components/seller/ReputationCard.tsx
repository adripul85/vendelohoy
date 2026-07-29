import React from 'react';
import { UserProfile } from '../../lib/users';
import { motion } from 'framer-motion';

interface Props {
    seller: UserProfile;
    onViewShop?: () => void;
}

export default function ReputationCard({ seller, onViewShop }: Props) {
    const rating = seller.reputation?.averageRating || 0;
    const salesCount = seller.successfulSales || 0;
    const trustLevel = seller.trustLevel || 'Bajo';
    const status = seller.sellerStatus || 'Socio en Prueba';
    const responseTime = seller.responseTime || 'Sincronización: < 24h';

    const trustColors = {
        'Bajo': 'text-red-500 bg-red-50/50 border-red-100/50',
        'Medio': 'text-amber-500 bg-amber-50/50 border-amber-100/50',
        'Alto': 'text-blue-500 bg-blue-50/50 border-blue-100/50',
        'Premium': 'text-emerald-500 bg-emerald-50/50 border-emerald-100/50'
    };

    let lastSaleText = 'Reciente';
    if (seller.lastSaleDate) {
        const date = typeof seller.lastSaleDate.toDate === 'function' 
            ? seller.lastSaleDate.toDate() 
            : new Date(seller.lastSaleDate);
        const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) lastSaleText = 'Hoy';
        else if (diffDays === 1) lastSaleText = 'Ayer';
        else lastSaleText = `Hace ${diffDays} días`;
    }

    const displayName = seller.store?.name || seller.displayName || 'Vendedor';
    const initials = displayName
        ? displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : '??';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-white rounded-[48px] p-8 shadow-2xl shadow-slate-200/60 border border-slate-100 relative overflow-hidden group"
        >
            {/* Decorative Blur */}
            <div className="absolute top-0 right-0 size-40 bg-primary-100/20 blur-[80px] -mr-10 -mt-10 rounded-full group-hover:bg-primary-200/30 transition-colors duration-700" />

            {/* Header: Avatar y Status */}
            <div className="flex items-center gap-5 mb-8 relative z-10">
                <div className="size-20 bg-dark-800 rounded-[32px] flex items-center justify-center text-white text-3xl font-black shadow-xl shrink-0">
                    {seller.avatar ? (
                        <img src={seller.avatar} alt={displayName} className="size-full object-cover rounded-[32px]" />
                    ) : (
                        <span>{initials}</span>
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3">
                        {displayName}
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Socio</span>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{status}</span>
                        </div>
                        <div className="flex flex-col border-l border-slate-100 pl-4">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Confianza</span>
                            <span className={`text-[10px] font-black uppercase tracking-tighter ${trustLevel === 'Bajo' ? 'text-red-500' : trustLevel === 'Medio' ? 'text-amber-500' : 'text-blue-500'}`}>
                                Nivel {trustLevel}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card de Estrellas y Botón */}
            <div className="bg-slate-50/80 rounded-[40px] p-6 mb-6 relative border border-slate-100/50 shadow-inner group/card">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex gap-0.5 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    className={`material-symbols-outlined text-xl transition-all duration-500 ${star <= Math.round(rating) ? 'text-amber-400 font-fill' : 'text-slate-200'}`}
                                    style={{ transitionDelay: `${star * 100}ms` }}
                                >
                                    star
                                </span>
                            ))}
                            <span className="ml-2 text-sm font-black text-slate-900">{rating.toFixed(1)}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative group/tooltip cursor-help w-fit">
                            {salesCount} Ventas Realizadas
                            {salesCount > 0 && (
                                <span className="absolute bottom-full left-0 mb-2 w-max px-3 py-2 bg-slate-800 text-white text-[10px] rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 shadow-lg pointer-events-none after:content-[''] after:absolute after:top-full after:left-4 after:border-4 after:border-transparent after:border-t-slate-800">
                                    Última venta: {lastSaleText}
                                </span>
                            )}
                        </p>
                    </div>

                    {onViewShop && (
                        <button
                            onClick={onViewShop}
                            className="bg-red-600 text-white size-14 rounded-2xl flex items-center justify-center shadow-xl shadow-red-200 hover:scale-110 active:scale-95 transition-all group-hover/card:rotate-6"
                        >
                            <span className="material-symbols-outlined font-black">storefront</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Nodo de Respuesta (UX Crucial para Vendelo Hoy) */}
            <div className="bg-primary-50/30 rounded-[32px] p-5 flex items-center gap-4 border border-primary-50/50 group/nodo hover:bg-primary-50/50 transition-colors duration-500">
                <div className="size-12 bg-white rounded-2xl shadow-premium border border-primary-100 flex items-center justify-center text-primary-vibrant group-hover/nodo:scale-110 transition-transform">
                    <span className="material-symbols-outlined font-fill text-2xl">bolt</span>
                </div>
                <div>
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        Atención al Cliente
                        <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    </h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter italic mt-0.5">
                        Suele responder en menos de 24h
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
