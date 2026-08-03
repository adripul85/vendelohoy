import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MobileHeaderProps {
    variant: 'home' | 'product';
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ variant }) => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    // Listen for custom event if triggered from elsewhere
    React.useEffect(() => {
        const handleOpen = () => setIsMenuOpen(true);
        window.addEventListener('open-mobile-menu', handleOpen);
        return () => window.removeEventListener('open-mobile-menu', handleOpen);
    }, []);

    return (
        <>
            <div className="md:hidden sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 px-4 h-16 flex items-center justify-between">
                {variant === 'home' ? (
                    <>
                        <button 
                            onClick={() => setIsMenuOpen(true)}
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

            {/* Mobile Slide-out Menu */}
            <div className={`fixed inset-0 z-[100] md:hidden transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsMenuOpen(false)}
                />
                
                {/* Drawer */}
                <div className={`absolute top-0 left-0 bottom-0 w-[280px] bg-surface shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {/* Drawer Header */}
                    <div className="p-6 pb-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
                        <h2 className="text-xl font-black text-on-surface tracking-tighter font-headline flex gap-1 items-center">
                            Vendelo <span className="text-secondary">Hoy</span>
                        </h2>
                        <button 
                            onClick={() => setIsMenuOpen(false)}
                            className="size-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>

                    {/* Drawer Content */}
                    <div className="flex-1 overflow-y-auto py-4">
                        <nav className="px-4 space-y-1">
                            <button onClick={() => { setIsMenuOpen(false); navigate('/'); }} className="w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-on-surface rounded-xl hover:bg-surface-container-low transition-colors text-left">
                                <span className="material-symbols-outlined text-on-surface-variant">home</span>
                                Inicio
                            </button>
                            <button onClick={() => { setIsMenuOpen(false); navigate('/search'); }} className="w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-on-surface rounded-xl hover:bg-surface-container-low transition-colors text-left">
                                <span className="material-symbols-outlined text-on-surface-variant">search</span>
                                Explorar Productos
                            </button>
                            <button onClick={() => { setIsMenuOpen(false); navigate('/publish'); }} className="w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-primary rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors text-left mt-2">
                                <span className="material-symbols-outlined">add_circle</span>
                                Vender Gratis
                            </button>
                        </nav>

                        <div className="px-8 my-6 h-px bg-outline-variant/30" />

                        <nav className="px-4 space-y-1">
                            <p className="px-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3">Mi Cuenta</p>
                            <button onClick={() => { setIsMenuOpen(false); navigate('/dashboard'); }} className="w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-on-surface rounded-xl hover:bg-surface-container-low transition-colors text-left">
                                <span className="material-symbols-outlined text-on-surface-variant">dashboard</span>
                                Mi Panel
                            </button>
                            <button onClick={() => { setIsMenuOpen(false); navigate('/messages'); }} className="w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-on-surface rounded-xl hover:bg-surface-container-low transition-colors text-left">
                                <span className="material-symbols-outlined text-on-surface-variant">mail</span>
                                Mensajes
                            </button>
                            <button onClick={() => { setIsMenuOpen(false); navigate('/wallet'); }} className="w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-on-surface rounded-xl hover:bg-surface-container-low transition-colors text-left">
                                <span className="material-symbols-outlined text-on-surface-variant">account_balance_wallet</span>
                                Billetera
                            </button>
                        </nav>
                        
                        <div className="px-8 my-6 h-px bg-outline-variant/30" />
                        
                        <nav className="px-4 space-y-1">
                            <p className="px-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3">Soporte</p>
                            <button className="w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-on-surface rounded-xl hover:bg-surface-container-low transition-colors text-left">
                                <span className="material-symbols-outlined text-on-surface-variant">help</span>
                                Ayuda
                            </button>
                            <button className="w-full flex items-center gap-4 px-4 py-3 text-sm font-bold text-on-surface rounded-xl hover:bg-surface-container-low transition-colors text-left">
                                <span className="material-symbols-outlined text-on-surface-variant">policy</span>
                                Políticas y Privacidad
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </>
    );
};
