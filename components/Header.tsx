import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useNotification } from '../context/NotificationContext';
import { useDialog } from '../context/DialogContext';
import { useFirestoreNotifications } from '../hooks/useFirestoreNotifications';
import { useCart } from '../context/CartContext';
import { subscribeToChats } from '../lib/chat';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getMarketingNotifications, MarketingNotification } from '../lib/marketing';
import { HeartIcon } from './animate-ui/icons';
import { getUserFavorites, FavoriteItem } from '../lib/interactions';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import { sendEmailVerification } from 'firebase/auth';
import { MobileHeader } from './ui/MobileHeader';

const dropdownMotion = {
    initial: { opacity: 0, y: -15, scale: 0.88, filter: 'blur(8px)' },
    animate: { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        filter: 'blur(0px)',
        transition: { type: 'spring', stiffness: 420, damping: 26, mass: 0.8 } 
    },
    exit: { 
        opacity: 0, 
        y: -10, 
        scale: 0.94, 
        filter: 'blur(4px)',
        transition: { duration: 0.15, ease: 'easeIn' } 
    }
};

// --- Voice Search Component (Internal for now) ---
const VoiceSearchModal = ({ isOpen, onClose, onResult }: { isOpen: boolean, onClose: () => void, onResult: (text: string) => void }) => {
    const [transcription, setTranscription] = useState('');
    const [isListening, setIsListening] = useState(false);
    const { showAlert } = useDialog();
    const recognitionRef = useRef<any>(null);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    }, []);

    const startListening = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            showAlert("No Soportado", "Su navegador no soporta búsqueda por voz.", "mic_off");
            onClose();
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.lang = 'es-AR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            let interimTranscription = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    onResult(event.results[i][0].transcript);
                    onClose();
                } else {
                    interimTranscription += event.results[i][0].transcript;
                }
            }
            setTranscription(interimTranscription);
        };
        recognition.onerror = () => stopListening();
        recognition.onend = () => setIsListening(false);

        recognition.start();
    }, [onResult, onClose, stopListening]);

    useEffect(() => {
        if (isOpen) {
            startListening();
        } else {
            stopListening();
        }
        return () => stopListening();
    }, [isOpen, startListening, stopListening]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-primary/20 backdrop-blur-md p-6 animate-in fade-in duration-300">
            <div className="bg-surface p-4 md:p-12 max-w-lg w-full text-center rounded-[40px] shadow-premium relative animate-in zoom-in-95 duration-500">
                <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors">
                    <span className="material-symbols-outlined font-black">close</span>
                </button>

                <div className="size-32 bg-slate-50 rounded-full mx-auto mb-10 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-20"></div>
                    <span className="material-symbols-outlined text-5xl text-primary-600 font-black animate-pulse">mic</span>
                </div>

                <h3 className="text-3xl font-black text-slate-900 mb-4 font-display">Escuchando...</h3>

                <div className="min-h-[140px] flex items-center justify-center p-8 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 mb-10">
                    <p className="text-xl font-bold text-slate-900 leading-tight italic opacity-60">
                        {transcription || 'Hable ahora...'}
                    </p>
                </div>

                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">CANCELAR</button>
                    <button
                        onClick={() => { if (transcription) { onResult(transcription); onClose(); } }}
                        className="flex-1 bg-slate-900 text-white rounded-full py-4 text-xs font-bold uppercase tracking-widest hover:bg-black transition-all"
                    >
                        BUSCAR AHORA
                    </button>
                </div>
            </div>
        </div>
    );
};

const Header = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isFavMenuOpen, setIsFavMenuOpen] = useState(false);
    const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [marketingNotifications, setMarketingNotifications] = useState<MarketingNotification[]>([]);

    const { user, userProfile, logout } = useAuth();
    const { notifications, unreadCount, markAsRead, clearAllNotifications } = useFirestoreNotifications();
    const navigate = useNavigate();
    const location = useLocation();
    const { notify } = useNotification();
    const { cart } = useCart();
    const prevUnreadCountRef = useRef(0);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToChats(user.uid, (chats) => {
            const count = chats.reduce((acc, chat) => acc + (chat.unreadCount?.[user.uid] || 0), 0);
            setUnreadChatCount(count);

            if (count > prevUnreadCountRef.current && !window.location.pathname.startsWith('/messages')) {
                notify({
                    type: 'info',
                    title: 'Nuevo Mensaje',
                    message: 'Tenés un nuevo mensaje sin leer.',
                    icon: 'chat'
                });
            }
            prevUnreadCountRef.current = count;
        });
        return () => unsubscribe();
    }, [user, notify]);

    useEffect(() => {
        getMarketingNotifications().then(setMarketingNotifications);
    }, []);

    useEffect(() => {
        if (user && isFavMenuOpen) {
            getUserFavorites(user.uid).then(setFavoriteItems);
        }
    }, [user, isFavMenuOpen]);

    // Close all dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-dropdown]')) {
                setIsFavMenuOpen(false);
                setIsNotifOpen(false);
                setIsUserMenuOpen(false);
            }
        };
        if (isFavMenuOpen || isNotifOpen || isUserMenuOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isFavMenuOpen, isNotifOpen, isUserMenuOpen]);

    useEffect(() => {
        const handleOpenMenu = () => setIsMobileMenuOpen(true);
        window.addEventListener('open-mobile-menu', handleOpenMenu);
        return () => window.removeEventListener('open-mobile-menu', handleOpenMenu);
    }, []);

    const handleSearch = (e?: React.FormEvent, term?: string) => {
        if (e) e.preventDefault();
        const finalTerm = (term || searchTerm).trim();
        if (finalTerm) {
            navigate(`/search?q=${encodeURIComponent(finalTerm)}`);
            setSearchTerm('');
            setIsMobileMenuOpen(false);
        }
    };

    return (
        <>
            <MobileHeader variant={location.pathname.startsWith('/product/') ? 'product' : 'home'} />
            <header className="hidden md:block sticky top-0 z-50 w-full glass font-sans">
            {user && !user.emailVerified && (
                <div className="bg-amber-100 text-amber-900 px-4 py-2 text-center text-xs font-bold border-b border-amber-200 flex items-center justify-center gap-4 flex-wrap">
                    <span className="material-symbols-outlined text-sm">mark_email_unread</span>
                    <span>Por favor, verifica tu correo electrónico para poder usar todas las funciones de la plataforma.</span>
                    <button 
                        onClick={async () => {
                            try {
                                await sendEmailVerification(user);
                                notify({ type: 'success', title: 'Correo Enviado', message: 'Revisa tu bandeja de entrada o spam.', icon: 'forward_to_inbox' });
                            } catch (error: any) {
                                notify({ type: 'error', title: 'Error', message: error.message || 'No se pudo enviar el correo.', icon: 'error' });
                            }
                        }}
                        className="bg-amber-900 text-white px-3 py-1 rounded-md text-[10px] uppercase tracking-wider hover:bg-amber-800 transition-colors"
                    >
                        Reenviar Link
                    </button>
                </div>
            )}
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4 md:gap-8">

                {/* LOGO */}
                <Logo size="md" className="shrink-0" />

                {/* NAV LINKS DESKTOP */}
                <nav className="hidden lg:flex items-center gap-6 text-sm font-bold ml-4">
                    <Link to="/" className="text-on-surface-variant hover:text-primary transition-colors" onClick={(e) => {
                        if (window.location.pathname === '/') {
                            window.dispatchEvent(new Event('reset-home-filters'));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }}>Inicio</Link>
                    <Link to="/search" className="text-on-surface-variant hover:text-primary transition-colors">Explorar Market</Link>
                    <Link to="/deals" className="text-on-surface-variant hover:text-primary transition-colors">Ofertas Relámpago</Link>
                </nav>

                {/* BUSCADOR */}
                <form onSubmit={(e) => handleSearch(e)} className="hidden md:flex flex-1 max-w-md group relative">
                    <div className="relative w-full">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 text-lg pointer-events-none group-focus-within:text-primary transition-colors">
                            search
                        </span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Busca oportunidades..."
                            className="w-full bg-surface-container-low border-none rounded-xl py-3 pl-12 pr-10 focus:ring-2 focus:ring-primary/10 focus:bg-surface-bright transition-all text-sm outline-none text-on-surface font-semibold placeholder:text-primary/30"
                        />
                        <button
                            type="button"
                            onClick={() => setIsVoiceSearchOpen(true)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-primary/40 hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">mic</span>
                        </button>
                    </div>
                </form>

                {/* ACCIONES */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Favorites Dropdown */}
                    <div className="relative hidden md:flex" data-dropdown>
                        <button
                            onClick={() => {
                                setIsFavMenuOpen(!isFavMenuOpen);
                                setIsNotifOpen(false);
                                setIsUserMenuOpen(false);
                            }}
                            title="Mis Favoritos"
                            className={`size-12 rounded-xl flex items-center justify-center transition-all group ${isFavMenuOpen ? 'bg-rose-50 text-rose-600' : 'bg-surface-container-low text-primary/60 hover:bg-rose-50 hover:text-rose-600'}`}
                        >
                            <HeartIcon size={24} className="group-hover:scale-110 transition-transform text-rose-500" filled={isFavMenuOpen || favoriteItems.length > 0} />
                            {favoriteItems.length > 0 && (
                                <div className="absolute -top-1 -right-1 size-5 bg-rose-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center shadow-lg border-2 border-white">
                                    {favoriteItems.length}
                                </div>
                            )}
                        </button>

                        <AnimatePresence>
                            {isFavMenuOpen && (
                                <motion.div
                                    variants={dropdownMotion}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className="absolute top-14 right-0 w-80 sm:w-96 bg-white border border-slate-100 rounded-[28px] shadow-premium p-4 z-[100] max-h-[420px] flex flex-col origin-top-right"
                                >
                                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-rose-500 text-lg font-fill">favorite</span>
                                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Productos Favoritos</h4>
                                    </div>
                                    <Link
                                        to="/favorites"
                                        onClick={() => setIsFavMenuOpen(false)}
                                        className="text-[10px] font-black text-sky-700 hover:underline uppercase tracking-wider flex items-center gap-1"
                                    >
                                        Ver Todos <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                    </Link>
                                </div>

                                <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar flex-1">
                                    {!user ? (
                                        <div className="text-center py-8">
                                            <div className="size-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                                <span className="material-symbols-outlined text-2xl">lock</span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-500 mb-3">Inicia sesión para ver tus favoritos</p>
                                            <Link to="/login" onClick={() => setIsFavMenuOpen(false)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider">Iniciar Sesión</Link>
                                        </div>
                                    ) : favoriteItems.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400">
                                            <div className="size-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                                <span className="material-symbols-outlined text-2xl">heart_broken</span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-500">Aún no tienes favoritos</p>
                                            <p className="text-[10px] font-medium text-slate-400 mt-1">Explora productos y pulsa el corazón para guardarlos.</p>
                                        </div>
                                    ) : (
                                        favoriteItems.slice(0, 6).map(item => (
                                            <Link
                                                key={item.productId}
                                                to={`/product/${item.productId}`}
                                                onClick={() => setIsFavMenuOpen(false)}
                                                className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                                            >
                                                <img
                                                    src={item.image || 'https://picsum.photos/100/100'}
                                                    alt={item.title}
                                                    className="size-14 rounded-xl object-cover bg-slate-100 shrink-0 shadow-sm"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <h5 className="text-xs font-black text-slate-800 truncate group-hover:text-sky-700 transition-colors mb-0.5">{item.title}</h5>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-black text-emerald-600">${item.price?.toLocaleString() || '0'}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[100px]">{item.sellerName || 'Vendedor'}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>

                                {user && (
                                    <div className="mt-3 pt-3 border-t border-slate-100 shrink-0 flex gap-2">
                                        <Link
                                            to="/favorites"
                                            onClick={() => setIsFavMenuOpen(false)}
                                            className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-wider text-center flex items-center justify-center gap-1 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-sm">folder_special</span> Gestionar Listas
                                        </Link>
                                        <Link
                                            to="/favorites?tab=sellers"
                                            onClick={() => setIsFavMenuOpen(false)}
                                            className="flex-1 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl font-black text-[10px] uppercase tracking-wider text-center flex items-center justify-center gap-1 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-sm">storefront</span> Vendedores
                                        </Link>
                                    </div>
                                )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <Link
                        to="/cart"
                        className="hidden md:flex relative size-12 rounded-xl bg-surface-container-low items-center justify-center text-primary/60 hover:bg-surface-container-high transition-all group"
                    >
                        <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">shopping_cart</span>
                        {cart.length > 0 && (
                            <div className="absolute -top-1 -right-1 size-5 bg-secondary-container text-on-surface text-[10px] font-black rounded-lg flex items-center justify-center shadow-lg border-2 border-surface-bright">
                                {cart.length}
                            </div>
                        )}
                    </Link>

                    {/* Mobile Search Button (Lupa) */}
                    <button
                        onClick={() => navigate('/search')}
                        className="md:hidden size-10 rounded-xl bg-surface-container-low text-primary/80 flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all shadow-sm"
                        title="Buscar en el marketplace"
                    >
                        <span className="material-symbols-outlined text-2xl font-black">search</span>
                    </button>

                    {/* Notifications Bell */}
                    <div className="relative" data-dropdown>
                        <button
                            onClick={() => {
                                setIsNotifOpen(!isNotifOpen);
                                setIsFavMenuOpen(false);
                                setIsUserMenuOpen(false);
                            }}
                            className={`size-10 md:size-12 rounded-xl flex items-center justify-center transition-all group ${(marketingNotifications.length + unreadCount) > 0 ? 'bg-primary-50 text-primary-vibrant' : 'bg-surface-container-low text-primary/60'}`}
                        >
                            <span className={`material-symbols-outlined text-2xl ${(marketingNotifications.length + unreadCount) > 0 ? 'animate-swing' : ''}`}>notifications</span>
                            {(marketingNotifications.length + unreadCount) > 0 && (
                                <div className="absolute top-2 right-2 size-4 bg-rose-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[8px] font-black text-white">
                                    {marketingNotifications.length + unreadCount}
                                </div>
                            )}
                        </button>

                        <AnimatePresence>
                            {isNotifOpen && (
                                <motion.div
                                    variants={dropdownMotion}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    className="fixed md:absolute top-6 md:p-20 md:top-14 left-2 right-2 md:left-auto md:right-0 w-auto md:w-[320px] bg-white border border-light-200 rounded-[28px] md:rounded-[32px] shadow-premium p-4 z-[100] max-h-[70vh] md:max-h-[400px] overflow-y-auto origin-top md:origin-top-right"
                                >
                                    <div className="flex items-center justify-between mb-4 px-2">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Notificaciones</h4>
                                        {notifications.length > 0 && (
                                            <button 
                                                onClick={() => clearAllNotifications()} 
                                                className="text-[10px] text-primary-600 hover:text-primary-800 font-bold flex items-center gap-1 bg-primary-50 px-2 py-0.5 rounded-full"
                                                title="Limpiar todas"
                                            >
                                                <span className="material-symbols-outlined text-[12px]">clear_all</span>
                                                Limpiar
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-[8px] font-black bg-primary-50 text-primary-vibrant px-2 py-0.5 rounded-full uppercase">Vendelo Hoy!</span>
                                </div>
                                
                                <div className="space-y-2">
                                    {marketingNotifications.length === 0 && notifications.length === 0 ? (
                                        <div className="py-12 text-center opacity-40">
                                            <span className="material-symbols-outlined text-3xl mb-2">notifications_off</span>
                                            <p className="text-[10px] font-black uppercase tracking-widest">No hay nuevas noticias</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* User Notifications */}
                                            {notifications.map(notif => (
                                                <div 
                                                    key={notif.id} 
                                                    onClick={() => {
                                                        markAsRead(notif.id);
                                                        const targetLink = notif.link || '/dashboard';
                                                        if (targetLink.startsWith('http')) window.open(targetLink, '_blank');
                                                        else navigate(targetLink);
                                                        setIsNotifOpen(false);
                                                    }}
                                                    className={`p-4 rounded-2xl flex items-start gap-4 transition-all cursor-pointer hover:bg-light-50 ${!notif.read ? 'bg-primary-50/50' : ''}`}
                                                >
                                                    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${notif.type === 'error' ? 'bg-rose-500 text-white' : notif.type === 'warning' ? 'bg-amber-500 text-white' : notif.type === 'success' ? 'bg-green-500 text-white' : 'bg-primary-vibrant text-white'}`}>
                                                        <span className="material-symbols-outlined text-xl">
                                                            {notif.type === 'error' ? 'error' : notif.type === 'warning' ? 'warning' : notif.type === 'success' ? 'check_circle' : 'info'}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <h5 className={`font-black uppercase text-[10px] truncate leading-none mb-1 ${notif.read ? 'text-gray-500' : 'text-dark-800'}`}>{notif.title}</h5>
                                                        <p className={`text-[10px] leading-tight line-clamp-2 ${notif.read ? 'text-gray-400 font-medium' : 'text-gray-600 font-bold'}`}>{notif.message}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {/* Marketing Notifications */}
                                            {marketingNotifications.map(notif => (
                                                <div 
                                                    key={notif.id} 
                                                    onClick={() => {
                                                        const targetLink = notif.link || '/dashboard';
                                                        if (targetLink.startsWith('http')) window.open(targetLink, '_blank');
                                                        else navigate(targetLink);
                                                        setIsNotifOpen(false);
                                                    }}
                                                    className={`p-4 rounded-2xl flex items-start gap-4 transition-all cursor-pointer hover:bg-light-50 ${notif.type === 'alert' ? 'bg-rose-50/30' : ''}`}
                                                >
                                                    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${notif.type === 'alert' ? 'bg-rose-500 text-white' : notif.type === 'event' ? 'bg-amber-500 text-white' : 'bg-primary-vibrant text-white'}`}>
                                                        <span className="material-symbols-outlined text-xl">{notif.icon}</span>
                                                    </div>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <h5 className="font-black text-dark-800 uppercase text-[10px] truncate leading-none mb-1">{notif.title}</h5>
                                                        <p className="text-[10px] font-bold text-gray-400 leading-tight line-clamp-2">{notif.message}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {user ? (
                        <div className="hidden md:flex items-center gap-3">
                            <Link
                                to="/publish"
                                className="hidden lg:flex items-center gap-2 bg-primary-vibrant text-surface px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined text-sm">add_circle</span>
                                Vender
                            </Link>

                            <div className="relative" data-dropdown>
                                <button
                                    onClick={() => {
                                        setIsUserMenuOpen(!isUserMenuOpen);
                                        setIsFavMenuOpen(false);
                                        setIsNotifOpen(false);
                                    }}
                                    className="size-10 rounded-full border-2 border-slate-100 p-0.5 overflow-hidden hover:border-primary-600 transition-all shadow-sm"
                                >
                                    <img
                                        className="w-full h-full rounded-full object-cover"
                                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.displayName || user?.displayName || user.email?.split('@')[0] || 'U')}&background=random`}
                                        alt="Profile"
                                    />
                                </button>

                                <AnimatePresence>
                                    {isUserMenuOpen && (
                                        <motion.div
                                            variants={dropdownMotion}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            className="absolute top-14 right-0 w-64 bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-premium p-2 z-[100] origin-top-right"
                                        >
                                            <div className="p-3 bg-slate-50/50 rounded-xl mb-1 flex items-center gap-3">
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-sm truncate">{userProfile?.displayName || user.displayName}</p>
                                                <p className="text-[10px] font-medium text-slate-500 truncate">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="py-1">
                                            {[
                                                { to: '/dashboard', label: 'Mi Panel', icon: 'grid_view' },
                                                { to: '/favorites', label: 'Mis Favoritos', icon: 'favorite' },
                                                { to: '/favorites?tab=sellers', label: 'Perfiles Seguidos', icon: 'group' },
                                                { to: '/settings?tab=shop', label: 'Mi Tienda', icon: 'storefront' },
                                                { to: `/shop/${userProfile?.store?.slug || user.uid}`, label: 'Ver Mi Tienda', icon: 'visibility' },
                                                ...(userProfile?.role === 'admin' ? [{ to: '/admin', label: 'Panel Admin', icon: 'admin_panel_settings' }] : []),
                                                { to: '/messages', label: 'Mensajes', icon: 'chat_bubble', count: unreadChatCount },
                                                { to: '/settings', label: 'Configuración', icon: 'settings' },
                                                { to: '/wallet', label: 'Mi Billetera', icon: 'account_balance_wallet' },
                                            ].map(item => (
                                                <Link
                                                    key={item.to}
                                                    to={item.to}
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-900/5 text-slate-700 hover:text-primary transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-symbols-outlined text-xl text-slate-400 group-hover:text-primary transition-colors">{item.icon}</span>
                                                        <span className="text-sm font-medium">{item.label}</span>
                                                    </div>
                                                    {item.count ? (
                                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                                            {item.count}
                                                        </span>
                                                    ) : null}
                                                </Link>
                                            ))}
                                            <div className="h-px bg-slate-200/50 my-1"></div>
                                            <button
                                                onClick={() => { logout(); setIsUserMenuOpen(false); navigate('/'); }}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50/80 text-red-500 transition-all text-left"
                                            >
                                                <span className="material-symbols-outlined text-xl">logout</span>
                                                <span className="text-sm font-medium">Cerrar Sesión</span>
                                            </button>
                                        </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center gap-3">
                            <Link to="/login" className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">
                                Ingresar
                            </Link>
                            <Link
                                to="/register"
                                className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-container transition-all shadow-md"
                            >
                                Crear cuenta
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            <VoiceSearchModal
                isOpen={isVoiceSearchOpen}
                onClose={() => setIsVoiceSearchOpen(false)}
                onResult={(text) => handleSearch(undefined, text)}
            />
            </header>
        </>
    );
};

export default Header;
