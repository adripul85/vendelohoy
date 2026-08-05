import React, { useEffect, useState } from 'react';
import { getFeaturedItems } from '../lib/items';
import { getPlatformSettings } from '../lib/settings';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import CountdownTimer from '../components/product/CountdownTimer';

const Deals = () => {
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalTimer, setGlobalTimer] = useState<Date | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const [featuredItems, settings] = await Promise.all([
                getFeaturedItems(),
                getPlatformSettings()
            ]);

            setDeals(featuredItems);

            // Calculamos la próxima rotación de manera global y determinística usando el Unix Epoch
            const hours = settings?.featuredDurationHours || 48;
            const currentMs = Date.now();
            const rotationMs = hours * 60 * 60 * 1000;
            const nextRotationMs = Math.ceil(currentMs / rotationMs) * rotationMs;

            setGlobalTimer(new Date(nextRotationMs));

            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="bg-light-50 min-h-screen">
            <div className="bg-white border-b border-light-200">
                <div className="max-w-[1440px] mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center">
                    <div className="flex items-center gap-3 bg-red-50 border border-red-100 px-6 py-2.5 rounded-full mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                        </span>
                        <span className="text-red-600 text-[11px] font-black uppercase tracking-[0.2em]">Ofertas Relámpago</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-dark-800 mb-6 tracking-tighter max-w-4xl">
                        Oportunidades <span className="text-red-600">Únicas</span> en Tiempo Real
                    </h1>

                    <p className="text-gray-400 font-bold max-w-xl mx-auto text-sm md:text-base mb-12 uppercase tracking-wide leading-relaxed">
                        Seleccionamos los mejores precios de la red. Si lo piensas demasiado, alguien más se lo llevará.
                    </p>

                    <div className="bg-light-50 p-8 rounded-[40px] border border-light-200 flex flex-col md:flex-row items-center gap-8 shadow-premium animate-in zoom-in-95 duration-1000">
                        <p className="text-[10px] font-black text-dark-800 uppercase tracking-[0.3em]">PRÓXIMA ROTACIÓN EN:</p>
                        {globalTimer && <CountdownTimer targetDate={globalTimer} className="scale-150" />}
                    </div>
                </div>
            </div>

            <div className="max-w-[1440px] mx-auto px-6 py-20">
                {deals.length === 0 ? (
                    <div className="bg-white p-6 md:p-20 rounded-[40px] border border-light-200 text-center shadow-sm">
                        <div className="size-24 bg-light-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl text-gray-300">inventory_2</span>
                        </div>
                        <h3 className="text-2xl font-black text-dark-800 mb-2">No hay ofertas activas</h3>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Vuelve en unas horas para ver nuevas oportunidades.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
                        {deals.map((product, index) => (
                            <div key={product.id} className="animate-in fade-in slide-in-from-bottom-6 duration-1000" style={{ animationDelay: `${index * 150}ms` }}>
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Deals;
