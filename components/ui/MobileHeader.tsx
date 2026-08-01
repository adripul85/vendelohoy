import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MobileHeaderProps {
    variant: 'home' | 'product';
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ variant }) => {
    const navigate = useNavigate();

    return (
        <div className="md:hidden sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 px-4 h-16 flex items-center justify-between">
            {variant === 'home' ? (
                <>
                    <button 
                        onClick={() => window.dispatchEvent(new Event('open-mobile-menu'))}
                        className="text-on-surface p-2 -ml-2 active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined font-black">menu</span>
                    </button>
                    
                    <h1 className="text-xl font-black text-on-surface tracking-tighter font-headline flex gap-1 items-center">
                        Vendelo <span className="text-secondary">Hoy</span>
                    </h1>
                    
                    <button 
                        onClick={() => navigate('/search')}
                        className="text-on-surface p-2 -mr-2 active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined font-black">search</span>
                    </button>
                </>
            ) : (
                <>
                    <button 
                        onClick={() => navigate(-1)}
                        className="text-on-surface p-2 -ml-2 active:scale-95 transition-transform"
                    >
                        <span className="material-symbols-outlined font-black">arrow_back</span>
                    </button>
                    
                    <h1 className="text-xl font-black text-on-surface tracking-tighter font-headline flex gap-1 items-center">
                        Vendelo <span className="text-secondary">Hoy</span>
                    </h1>
                    
                    <div className="flex items-center gap-2 -mr-2">
                        <button className="text-on-surface p-2 active:scale-95 transition-transform">
                            <span className="material-symbols-outlined font-black">share</span>
                        </button>
                        <button className="text-on-surface p-2 active:scale-95 transition-transform">
                            <span className="material-symbols-outlined font-black">favorite_border</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
