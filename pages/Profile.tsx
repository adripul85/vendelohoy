import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useNotification } from '../context/NotificationContext';
import { getUserProfile, UserProfile } from '../lib/users';
import { getUserTransactions } from '../lib/transactions';
import { getItemsBySeller, ItemData } from '../lib/items';
import { toggleFollow, checkIsFollowing } from '../lib/interactions';
import ReviewsList from '../components/ReviewsList';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductCard from '../components/ProductCard';
import { UserIcon, StoreIcon, CheckIcon, HeartIcon } from '../components/animate-ui/icons';

const Profile = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { user, userProfile: currentUserProfile } = useAuth();
  const { notify } = useNotification();

  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<(ItemData & { id: string })[]>([]);
  const [activeTab, setActiveTab] = useState<'selling' | 'reviews_seller' | 'reviews_buyer'>('selling');
  const [isFollowing, setIsFollowing] = useState(false);
  const [metrics, setMetrics] = useState({
    totalOps: 0,
    disputes: 0,
    trustScore: 0
  });

  const isOwnProfile = !uid || uid === user?.uid;

  useEffect(() => {
    async function loadProfileData() {
      setLoading(true);

      let profile: UserProfile | null = null;
      let targetUid = uid || user?.uid;

      if (!targetUid) {
        setLoading(false);
        return;
      }

      if (isOwnProfile && currentUserProfile) {
        profile = currentUserProfile;
      } else {
        profile = await getUserProfile(targetUid);
      }

      if (profile) {
        setTargetProfile(profile);
        
        let totalOps = 0;
        let disputes = 0;

        if (isOwnProfile) {
          const { compras, ventas } = await getUserTransactions(targetUid);
          totalOps = compras.length + ventas.length;
          disputes = [...compras, ...ventas].filter(t => t.status === 'DISPUTED').length;
        } else {
          totalOps = profile.salesCount || profile.reputation?.totalOps || 0;
        }

        const userProducts = await getItemsBySeller(targetUid);
        const activeProducts = userProducts.filter(p => {
          if (isOwnProfile) return true; // owner sees all their products
          if (!p.status) return true;
          const s = String(p.status).toUpperCase();
          return ['AVAILABLE', 'ACTIVE', 'PUBLISHED', 'EN_VENTA', 'PUBLICADO', 'NEW', 'GOOD', 'USED', 'LIKE_NEW'].includes(s) || (p.quantity !== undefined && p.quantity > 0);
        });
        setProducts(activeProducts);

        const avgRating = profile.reputation?.averageRating || 0;
        const totalReviews = profile.reputation?.totalReviews || 0;
        const trustScore = totalReviews > 0 ? Math.round((avgRating / 5) * 100) : 0;
        setMetrics({ totalOps, disputes, trustScore });

        if (user && !isOwnProfile) {
          const following = await checkIsFollowing(user.uid, targetUid);
          setIsFollowing(following);
        }
      }

      setLoading(false);
    }

    loadProfileData();
  }, [uid, user, currentUserProfile]);

  const handleToggleFollow = async () => {
    if (!user) {
      notify({ type: 'error', title: 'Acceso Denegado', message: 'Debes iniciar sesión para seguir usuarios.', icon: 'lock' });
      return;
    }
    try {
      const { isFollowing: newStatus } = await toggleFollow(
        user.uid,
        targetProfile?.uid || '',
        user.displayName || user.email || 'Un usuario',
        {
          name: targetProfile?.displayName || targetProfile?.store?.name || 'Vendedor',
          avatar: targetProfile?.photoURL || targetProfile?.avatar || targetProfile?.store?.logo || '',
          slug: targetProfile?.store?.slug || targetProfile?.uid,
          reputation: targetProfile?.reputation?.averageRating || 5.0
        }
      );
      setIsFollowing(newStatus);
      notify({ type: 'success', title: newStatus ? 'Siguiendo' : 'Dejaste de seguir', message: newStatus ? `Ahora sigues a este usuario.` : 'Has dejado de seguir a este usuario.', icon: newStatus ? 'person_add' : 'person_remove' });
    } catch (error) {
      notify({ type: 'error', title: 'Error', message: 'No se pudo actualizar el estado.', icon: 'error' });
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Sincronizando Perfil de Comerciante..." />;

  if (!targetProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-50">
        <div className="text-center p-4 md:p-12 bg-white rounded-[40px] shadow-premium max-w-md">
          <div className="size-24 bg-light-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <span className="material-symbols-outlined text-5xl text-gray-300">person_off</span>
          </div>
          <h1 className="text-3xl font-black text-dark-800 mb-4 uppercase tracking-tighter">Identidad No Encontrada</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest leading-relaxed">La identidad de protocolo solicitada no está registrada en nuestra red de comercio seguro.</p>
          <button onClick={() => navigate('/')} className="mt-10 bg-dark-800 text-white px-4 md:px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-dark-900 transition-all active:scale-95 shadow-xl shadow-dark-800/10">Volver al Grid</button>
        </div>
      </div>
    );
  }

  const joinDate = targetProfile.createdAt?.toDate ? targetProfile.createdAt.toDate() : new Date();
  const joinYear = joinDate.getFullYear();

  return (
    <div className="bg-light-50 min-h-screen pb-32">
      {/* --- TOP BANNER --- */}
      <div className="h-48 md:h-64 w-full relative overflow-hidden bg-dark-900">
        <img
          src={targetProfile.coverImage || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=2670"}
          className="w-full h-full object-cover"
          alt="Network Banner"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 via-dark-900/20 to-transparent" />
      </div>

      <div className="max-w-[1280px] mx-auto px-6 relative z-10 -mt-12 md:-mt-16">
        {/* --- HEADER PROFILE CARD --- */}
        <div className="flex flex-col md:flex-row items-end gap-8 mb-16">
          <div className="relative group">
            <div className="size-32 md:size-40 rounded-full border-[4px] border-white overflow-hidden shadow-2xl bg-white relative z-10 transition-transform group-hover:scale-[1.02] duration-500">
              <img
                src={targetProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetProfile.displayName)}&background=random`}
                className="w-full h-full object-cover"
                alt={targetProfile.displayName}
              />
            </div>
            {targetProfile.profileComplete && (
              <div className="absolute bottom-2 right-2 z-20 bg-primary-vibrant text-white size-8 rounded-full flex items-center justify-center border-2 border-white shadow-xl rotate-[-10deg] animate-in zoom-in duration-700 delay-300">
                <span className="material-symbols-outlined text-lg font-black">verified</span>
              </div>
            )}
          </div>

          <div className="flex-1 pb-4 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-black text-dark-800 tracking-tighter drop-shadow-sm">
                {targetProfile.displayName}
              </h1>
              <div className="flex items-center gap-2 bg-primary-vibrant size-5 rounded-full justify-center">
                <span className="material-symbols-outlined text-white text-[10px] font-black">check</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-gray-400">
              <span>Vendedor Verificado</span>
              <div className="size-1 bg-light-200 rounded-full" />
              <span>Unido en {joinDate.toLocaleString('es-ES', { month: 'long' })} {joinYear}</span>
              <div className="size-1 bg-light-200 rounded-full" />
              <span className="text-primary-vibrant">Reputación Excelente</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pb-4">
            {!isOwnProfile && (
              <>
                <button
                  onClick={handleToggleFollow}
                  className={`h-11 px-6 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 active:scale-95 group ${isFollowing
                    ? 'bg-light-100 text-dark-800 border-light-200'
                    : 'bg-white text-dark-800 border-light-200 hover:bg-light-100'
                    }`}
                >
                  {isFollowing ? <CheckIcon size={18} className="text-emerald-600" /> : <UserIcon add size={18} />}
                  {isFollowing ? 'Siguiendo' : 'Seguir Vendedor'}
                </button>
                <button className="h-11 px-6 rounded-xl bg-primary-vibrant text-white font-black text-[9px] uppercase tracking-widest hover:shadow-lg shadow-primary-vibrant/20 transition-all flex items-center gap-2 active:scale-95">
                  <span className="material-symbols-outlined text-lg">chat_bubble</span>
                  Mensaje
                </button>
                <button
                  onClick={() => navigate(`/shop/${targetProfile.store?.slug || targetProfile.uid}`)}
                  className="h-11 px-6 rounded-xl bg-white text-dark-800 border font-black text-[9px] uppercase tracking-widest hover:bg-light-50 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                >
                  <StoreIcon size={18} className="text-primary-vibrant" />
                  Tienda
                </button>
              </>
            )}
            {isOwnProfile && (
              <>
                <button
                  onClick={() => navigate(`/shop/${targetProfile.store?.slug || targetProfile.uid}`)}
                  className="h-11 px-6 rounded-xl bg-white text-dark-800 border border-primary-100 font-black text-[9px] uppercase tracking-widest hover:bg-primary-50 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                >
                  <StoreIcon size={18} className="text-primary-vibrant" />
                  Mi Tienda Pública
                </button>
                <button
                  onClick={() => navigate('/favorites')}
                  className="h-11 px-6 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-black text-[9px] uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                >
                  <HeartIcon size={18} className="text-rose-600" />
                  Vendedores Guardados
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
          {/* --- SIDEBAR REPUTATION --- */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-light-200/50">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-dark-800 mb-10 pl-1">Reputación del Vendedor</h3>

              <div className="flex items-center gap-5 mb-8">
                <span className="text-4xl font-black text-dark-800 tracking-tighter">
                  {targetProfile.reputation?.averageRating.toFixed(1) || '0.0'}
                </span>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={`material-symbols-outlined text-xl ${i <= Math.round(targetProfile.reputation?.averageRating || 0) ? 'text-amber-400 fill-1' : 'text-light-200'}`}>star</span>
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                    {targetProfile.reputation?.totalReviews || 0} reseñas
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {[5, 4, 3, 2, 1].map((level) => {
                  const count = targetProfile.reputation?.ratingDistribution?.[level] || 0;
                  const total = targetProfile.reputation?.totalReviews || 0;
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                  return (
                    <div key={level} className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-gray-400 w-2">{level}</span>
                      <div className="flex-1 h-1.5 bg-light-50 rounded-full overflow-hidden border border-light-100">
                        <div className="h-full bg-primary-vibrant rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="text-[9px] font-black text-gray-300 w-8 text-right">{percentage}%</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3">
                {targetProfile.reputation?.averageRating && targetProfile.reputation.averageRating >= 4 && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[9px] uppercase tracking-tight bg-primary-50 text-primary-vibrant border-primary-100">
                    <span className="material-symbols-outlined text-base font-black">verified</span>
                    Vendedor Confiable
                  </div>
                )}
                {targetProfile.responseTime && (targetProfile.responseTime.toLowerCase().includes('min') || targetProfile.responseTime.toLowerCase().includes('1 h')) && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[9px] uppercase tracking-tight bg-emerald-50 text-emerald-600 border-emerald-100">
                    <span className="material-symbols-outlined text-base font-black">bolt</span>
                    Respuesta Rápida
                  </div>
                )}
                {metrics.totalOps > 10 && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[9px] uppercase tracking-tight bg-sky-50 text-sky-700 border-sky-100">
                    <span className="material-symbols-outlined text-base font-black">lock</span>
                    Comerciante Experto
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-light-200/50 space-y-6">
              <div className="flex items-start gap-4">
                <div className="size-10 bg-light-50 rounded-xl flex items-center justify-center border border-light-100 shrink-0">
                  <span className="material-symbols-outlined text-primary-vibrant text-lg">location_on</span>
                </div>
                <div className="pt-0.5">
                  <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Ubicación</p>
                  <p className="text-xs font-bold text-dark-800 uppercase tracking-tight">{targetProfile.location?.city || 'Desconocido'}, {targetProfile.location?.state || 'AR'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="size-10 bg-light-50 rounded-xl flex items-center justify-center border border-light-100 shrink-0">
                  <span className="material-symbols-outlined text-primary-vibrant text-lg">schedule</span>
                </div>
                <div className="pt-0.5">
                  <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Respuesta</p>
                  <p className="text-xs font-bold text-dark-800 uppercase tracking-tight">{targetProfile.responseTime || 'No especificado'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* --- MAIN CONTENT AREA --- */}
          <div className="lg:col-span-8 space-y-12">
            {/* Tabs Interface */}
            <div className="flex border-b border-light-200 gap-4 md:gap-10">
              {[
                { id: 'selling', label: `En Venta (${products.length})` },
                { id: 'reviews_seller', label: `Reseñas (${targetProfile.reputation?.totalReviews || 0})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 text-[9px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-primary-vibrant' : 'text-gray-400 hover:text-dark-800'}`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-vibrant rounded-t-full shadow-[0_-2px_6px_rgba(230,30,30,0.3)]" />
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'selling' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {products.map(p => (
                      <ProductCard key={p.id} product={p} location={targetProfile.location?.city} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-[40px] border border-light-200/50 border-dashed">
                    <div className="size-20 bg-light-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-outlined text-3xl text-gray-300">inventory_2</span>
                    </div>
                    <h3 className="text-lg font-black text-dark-800 uppercase tracking-tighter">No hay protocolos activos</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{isOwnProfile ? "Transmite tu primer activo para comenzar a operar." : "Este comerciante no tiene activos activos en la red."}</p>
                    {isOwnProfile && (
                      <button onClick={() => navigate('/publish')} className="mt-8 bg-dark-800 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-dark-900 transition-all active:scale-95 shadow-lg shadow-dark-800/10">Publicar Activo</button>
                    )}
                  </div>
                )}
              </div>
            )}

            {(activeTab === 'reviews_seller' || activeTab === 'reviews_buyer') && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className="text-xl font-black text-dark-800 uppercase tracking-widest flex items-center gap-4 ml-2 mt-4 text-[11px]">
                  <div className="size-10 bg-dark-800 text-white rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">history_edu</span>
                  </div>
                  Sincronizar Registros de Inteligencia
                </h3>
                <ReviewsList sellerId={targetProfile.uid} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
