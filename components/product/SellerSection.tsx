import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useNotification } from '../../context/NotificationContext';

interface Seller {
    uid: string;
    displayName: string;
    avatar: string;
    reputation?: {
        averageRating: number;
        totalReviews: number;
    };
    profileComplete: boolean;
    verificationBadges?: {
        identityVerified: boolean;
    };
    trustLevel?: 'Bajo' | 'Medio' | 'Alto' | 'Premium';
    sellerStatus?: 'Socio Activo' | 'Socio en Prueba' | 'Socio Elite';
    responseTime?: string;
    successfulSales?: number;
    store?: {
        slug?: string;
        name?: string;
        isActive?: boolean;
        paidOfficialTick?: boolean;
        logo?: string;
    };
}

interface Props {
    seller: Seller;
    onContactSeller?: () => void;
}

const SellerSection: React.FC<Props> = ({ seller, onContactSeller }) => {
    const { user } = useAuth(); // Assuming useAuth is available/imported
    const { notify } = useNotification(); // Assuming useNotification is available/imported
    const [isFollowing, setIsFollowing] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const isVerified = seller.verificationBadges?.identityVerified;
    const isOfficialStore = seller.store?.isActive && 
                            (seller.successfulSales || 0) >= 500 && 
                            seller.store.paidOfficialTick;

    React.useEffect(() => {
        if (user && seller.uid) {
            import('../../lib/interactions').then(({ checkIsFollowing }) => {
                checkIsFollowing(user.uid, seller.uid).then(setIsFollowing);
            });
        }
    }, [user, seller.uid]);

    const handleFollow = async () => {
        if (!user) {
            notify({ type: 'error', title: 'Acceso Denegado', message: 'Inicia sesión para seguir a este vendedor.', icon: 'lock' });
            return;
        }
        if (user.uid === seller.uid) return;

        setLoading(true);
        try {
            const { toggleFollow } = await import('../../lib/interactions');
            const result = await toggleFollow(user.uid, seller.uid, user.displayName || 'Alguien', {
                name: seller.store?.name || seller.displayName || 'Vendedor',
                avatar: seller.store?.logo || seller.avatar || '',
                slug: seller.store?.slug || seller.uid,
                reputation: seller.reputation?.averageRating || 5.0
            });
            setIsFollowing(result.isFollowing);
            notify({
                type: 'success',
                title: result.isFollowing ? 'Siguiendo Vendedor' : 'Dejaste de seguir',
                message: result.isFollowing ? `Ahora sigues a ${seller.store?.name || seller.displayName}` : `Ya no sigues a este vendedor`,
                icon: result.isFollowing ? 'person_add' : 'person_remove'
            });
        } catch (error) {
            console.error(error);
            notify({ type: 'error', title: 'Error', message: 'No se pudo actualizar el seguimiento.', icon: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-outline-variant/30 relative overflow-hidden">
            {/* Header Badge */}
            {(isVerified || (seller.trustLevel === 'Alto' || seller.trustLevel === 'Premium')) && (
                <div className="absolute top-0 right-0 py-1.5 px-3 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-bl-2xl border-l border-b border-primary/10 shadow-sm animate-in slide-in-from-top duration-500">
                    Comerciante Verificado
                </div>
            )}

            <div className="flex justify-between items-center mb-5">
                <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Información del Vendedor</h3>
                {user && user.uid !== seller.uid && (
                    <button
                        onClick={handleFollow}
                        disabled={loading}
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${isFollowing
                            ? 'bg-surface-container-high text-on-surface hover:bg-error/10 hover:text-error'
                            : 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm'
                            }`}
                    >
                        {loading ? '...' : isFollowing ? (
                            <>
                                <span className="material-symbols-outlined text-[14px]">check</span> Siguiendo
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[14px]">person_add</span> Seguir Vendedor
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className="flex items-center gap-4 mb-6">
                <Link to={`/profile/${seller.uid}`} className="shrink-0 relative group">
                    <img
                        src={seller.store?.logo || seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.store?.name || seller.displayName || 'Vendedor')}&background=random`}
                        alt={seller.store?.name || seller.displayName || 'Vendedor'}
                        className="size-14 rounded-2xl object-cover border-2 border-surface shadow-sm transition-transform group-hover:scale-105 duration-300"
                    />
                    {isVerified && (
                        <div className="absolute -bottom-1 -right-1 size-5 bg-surface rounded-full flex items-center justify-center shadow-sm border border-outline-variant/30">
                            <span className="material-symbols-outlined text-primary text-sm font-black">verified</span>
                        </div>
                    )}
                </Link>
                <div className="flex-1 min-w-0">
                    <Link to={`/shop/${seller.store?.slug || seller.uid}`} className="text-base font-black text-primary font-headline hover:text-secondary flex items-center gap-1.5 transition-colors leading-snug">
                        <span className="line-clamp-2 break-words">{seller.store?.name || seller.displayName || 'Vendedor de Oportunidades'}</span>
                        {isOfficialStore && (
                            <span className="material-symbols-outlined text-primary text-base shrink-0" title="Tienda Oficial Verificada">verified</span>
                        )}
                    </Link>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {isOfficialStore ? (
                            <span className="text-[9px] font-black text-primary uppercase tracking-wide flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">verified</span> OFICIAL
                            </span>
                        ) : (
                            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide">{seller.sellerStatus || 'Socio Activo'}</span>
                        )}
                        <div className="size-1 bg-outline-variant rounded-full" />
                        <span className={`text-[9px] font-black uppercase tracking-wide ${seller.trustLevel === 'Bajo' ? 'text-error' : seller.trustLevel === 'Medio' ? 'text-amber-600' : 'text-primary'}`}>
                            Confianza: {seller.trustLevel || 'Medio'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 mb-5 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className={`material-symbols-outlined text-sm ${i <= Math.round(seller.reputation?.averageRating || 5) ? 'text-amber-500 fill-1' : 'text-outline-variant'}`}>star</span>
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">{seller.successfulSales || 0} Ventas</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <Link to={`/shop/${seller.store?.slug || seller.uid}`} className="text-center bg-primary text-on-primary px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm hover:bg-primary/90 transition-all">
                        Ver Tienda
                    </Link>
                    <Link to={`/profile/${seller.uid}`} className="text-center bg-surface border border-outline-variant/30 text-on-surface px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-surface-container-low transition-all">
                        Ver Perfil
                    </Link>
                </div>
                {onContactSeller && (
                    <button
                        onClick={onContactSeller}
                        className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm hover:bg-emerald-500 transition-all flex items-center justify-center gap-1.5"
                    >
                        <span className="material-symbols-outlined text-sm">chat</span>
                        Hablar con el Vendedor
                    </button>
                )}
            </div>

            <div className="bg-primary/5 rounded-2xl p-3.5 border border-primary/10 flex items-center gap-3">
                <div className="size-9 bg-surface rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl font-black">bolt</span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-primary uppercase tracking-tight">Tiempo de Respuesta</p>
                    <p className="text-[10px] font-medium text-on-surface-variant truncate mt-0.5">
                        {seller.responseTime || 'Responde en pocas horas'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SellerSection;
