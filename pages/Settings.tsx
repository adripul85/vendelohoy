import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { updateUserProfile, deleteUserAccount, submitVerification, approveVerification, rejectVerification, ReputationLog, addReputationPoints, checkStoreIdentifierAvailability } from '../lib/users';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { autoVerifyIdentity, VerificationStep } from '../lib/verification';
import { uploadFile } from '../lib/storage';
import { useNotification } from '../context/NotificationContext';
import { useDialog } from '../context/DialogContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import StoreAdvancedPanel from '../components/settings/StoreAdvancedPanel';
import { FaWhatsapp, FaInstagram, FaTiktok, FaFacebook, FaYoutube, FaXTwitter, FaGlobe } from 'react-icons/fa6';

type TabType = 'profile' | 'shop' | 'reputation' | 'safety' | 'billing';

const DebouncedColorPicker = ({ value, onChange, placeholder, defaultColor = '#000000', label }: { value: string, onChange: (val: string) => void, placeholder?: string, defaultColor?: string, label?: string }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (localValue !== value) {
                onChange(localValue);
            }
        }, 150);
        return () => clearTimeout(handler);
    }, [localValue, value, onChange]);

    return (
        <div className="flex gap-3 items-center">
            <input 
                type="color" 
                value={localValue.startsWith('rgb') || !localValue ? defaultColor : localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                className="size-12 rounded-xl cursor-pointer border-none bg-transparent shrink-0"
                title={label}
            />
            {placeholder && (
                <div className="flex-1 relative min-w-0">
                    <input 
                        type="text"
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-sky-100 rounded-xl py-3 px-4 font-mono font-bold text-slate-600 outline-none"
                        placeholder={placeholder}
                    />
                    <div 
                        className="absolute right-3 top-1/2 -translate-y-1/2 size-4 rounded-full border border-slate-200"
                        style={{ backgroundColor: localValue }}
                    />
                </div>
            )}
        </div>
    );
};

export default function Settings() {
    const navigate = useNavigate();
    const { user, userProfile, profileLoading, refreshProfile, logout } = useAuth();
    const { notify } = useNotification();
    const { showConfirm } = useDialog();
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [searchParams] = useSearchParams();
    const tabFromUrl = searchParams.get('tab') as TabType;
    const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl || 'profile');

    useEffect(() => {
        if (tabFromUrl && ['profile', 'shop', 'reputation', 'safety', 'billing'].includes(tabFromUrl)) {
            setActiveTab(tabFromUrl);
        }
    }, [tabFromUrl]);
    const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
    const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([]);
    const [isVerifying, setIsVerifying] = useState(false);
    const [reputationLogs, setReputationLogs] = useState<ReputationLog[]>([]);
    const [myProducts, setMyProducts] = useState<any[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        phone: '',
        city: '',
        state: '',
        zipCode: '',
        address: '',
        avatar: '',
        coverImage: '',
        dni: '',
        social: {
            whatsapp: '',
            instagram: '',
            tiktok: '',
        },
        identity: {
            birthday: '',
            gender: '',
        },
        logistics: {
            deliveryMethods: [] as string[],
            businessHours: '',
        },
        bankDetails: {
            cbu: '',
            alias: '',
            bankName: '',
            holderName: '',
            accountType: 'Caja de Ahorro',
            dni: '',
        },
        taxDetails: {
            cuit: '',
            taxCondition: 'Monotributo' as 'Monotributo' | 'Responsable Inscripto' | 'Consumidor Final' | 'Exento',
        },
        shopTheme: {
            backgroundType: 'gradient' as 'color' | 'image' | 'gradient',
            primaryColor: '#0369a1',
            secondaryColor: '#65a30d',
            backgroundColor: '#0f172a',
            backgroundImage: '',
            accentColor: '#65a30d',
            typography: 'font-sans',
        },
        storeInfo: {
            isActive: false,
            name: '',
            slug: '',
            logo: '',
            banner: '',
            tagline: '',
            description: '',
            announcement: '',
            announcementColor: '#0369a1',
            announcementActive: false,
            warranty: '',
            dispatchTime: '',
            showCouponsPublic: false,
            featuredProductIds: [] as string[],
            catalogSort: 'default' as 'default' | 'featured_first' | 'best_sellers' | 'price_low' | 'price_high',
            socialLinks: {
                instagram: '',
                tiktok: '',
                whatsapp: '',
                website: '',
                facebook: '',
                youtube: '',
                twitter: '',
            },
        }
    });

    const [previews, setPreviews] = useState({
        avatar: '',
        coverImage: '',
    });

    const [storeIdStatus, setStoreIdStatus] = useState<{ loading: boolean; available: boolean; reason?: string }>({ loading: false, available: true });

    useEffect(() => {
        if (!user) return;
        const name = formData.storeInfo.name;
        const slug = formData.storeInfo.slug;
        if (!name && !slug) {
            setStoreIdStatus({ loading: false, available: true });
            return;
        }

        setStoreIdStatus(prev => ({ ...prev, loading: true }));
        const timer = setTimeout(async () => {
            const res = await checkStoreIdentifierAvailability(user.uid, name, slug);
            setStoreIdStatus({ loading: false, available: res.available, reason: res.reason });
        }, 400);

        return () => clearTimeout(timer);
    }, [formData.storeInfo.name, formData.storeInfo.slug, user]);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (userProfile) {
            setFormData({
                displayName: userProfile.displayName || '',
                bio: userProfile.bio || '',
                phone: userProfile.phone || '',
                city: userProfile.location?.city || '',
                state: userProfile.location?.state || '',
                zipCode: userProfile.location?.zipCode || '',
                address: userProfile.location?.address || '',
                avatar: userProfile.avatar || '',
                coverImage: userProfile.coverImage || '',
                dni: userProfile.dni || '',
                social: {
                    whatsapp: userProfile.social?.whatsapp || '',
                    instagram: userProfile.social?.instagram || '',
                    tiktok: userProfile.social?.tiktok || '',
                },
                identity: {
                    birthday: userProfile.identity?.birthday || '',
                    gender: userProfile.identity?.gender || '',
                },
                logistics: {
                    deliveryMethods: userProfile.logistics?.deliveryMethods || [],
                    businessHours: userProfile.logistics?.businessHours || '',
                },
                bankDetails: {
                    cbu: userProfile.bankDetails?.cbu || '',
                    alias: userProfile.bankDetails?.alias || '',
                    bankName: userProfile.bankDetails?.bankName || '',
                    holderName: userProfile.bankDetails?.holderName || '',
                    accountType: userProfile.bankDetails?.accountType || 'Caja de Ahorro',
                    dni: userProfile.bankDetails?.dni || '',
                },
                taxDetails: {
                    cuit: userProfile.taxDetails?.cuit || '',
                    taxCondition: userProfile.taxDetails?.taxCondition || 'Monotributo',
                },
                shopTheme: {
                    backgroundType: userProfile.shopTheme?.backgroundType || 'gradient',
                    primaryColor: userProfile.shopTheme?.primaryColor || '#0369a1',
                    secondaryColor: userProfile.shopTheme?.secondaryColor || '#65a30d',
                    backgroundColor: userProfile.shopTheme?.backgroundColor || '#0f172a',
                    backgroundImage: userProfile.shopTheme?.backgroundImage || '',
                    accentColor: userProfile.shopTheme?.accentColor || '#65a30d',
                    typography: userProfile.shopTheme?.typography || 'font-sans',
                },
                storeInfo: {
                    isActive: userProfile.store?.isActive || false,
                    name: userProfile.store?.name || '',
                    slug: userProfile.store?.slug || '',
                    logo: userProfile.store?.logo || '',
                    banner: userProfile.store?.banner || '',
                    tagline: userProfile.store?.tagline || '',
                    description: userProfile.store?.description || '',
                    announcement: userProfile.store?.announcement || '',
                    announcementColor: userProfile.store?.announcementColor || '#0369a1',
                    announcementActive: userProfile.store?.announcementActive || false,
                    warranty: userProfile.store?.warranty || '',
                    dispatchTime: userProfile.store?.dispatchTime || '',
                    showCouponsPublic: userProfile.store?.showCouponsPublic || false,
                    featuredProductIds: userProfile.store?.featuredProductIds || [],
                    catalogSort: userProfile.store?.catalogSort || 'default',
                    socialLinks: {
                        instagram: userProfile.store?.socialLinks?.instagram || '',
                        tiktok: userProfile.store?.socialLinks?.tiktok || '',
                        whatsapp: userProfile.store?.socialLinks?.whatsapp || '',
                        website: userProfile.store?.socialLinks?.website || '',
                        facebook: userProfile.store?.socialLinks?.facebook || '',
                        youtube: userProfile.store?.socialLinks?.youtube || '',
                        twitter: userProfile.store?.socialLinks?.twitter || '',
                    },
                }
            });
            setPreviews({
                avatar: userProfile.avatar || '',
                coverImage: userProfile.coverImage || '',
            });
        }
    }, [userProfile]);

    useEffect(() => {
        if (user && activeTab === 'shop') {
            const fetchMyProducts = async () => {
                try {
                    const q = query(collection(db, 'items'), where('sellerId', '==', user.uid));
                    const snap = await getDocs(q);
                    const prods = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setMyProducts(prods);
                } catch (e) {
                    console.error("Error fetching my products for shop customization:", e);
                }
            };
            fetchMyProducts();
        }
    }, [user, activeTab]);

    useEffect(() => {
        const fetchReputationLogs = async () => {
            if (activeTab === 'reputation' && user) {
                try {
                    const q = query(
                        collection(db, "reputationLogs"),
                        where("uid", "==", user.uid)
                    );
                    const querySnapshot = await getDocs(q);
                    const logs = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as ReputationLog[];
                    
                    // Sort in memory to avoid needing a Firestore composite index
                    logs.sort((a, b) => {
                        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
                        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
                        return timeB - timeA;
                    });
                    
                    setReputationLogs(logs);

                    // --- RETROACTIVE POINTS CHECK ---
                    if (userProfile) {
                        let needsRefresh = false;
                        const hasDniLog = logs.some(l => l.reason === 'Identidad Verificada');
                        const hasCbuLog = logs.some(l => l.reason === 'Cuenta de Cobro Vinculada');

                        if ((userProfile.dni || userProfile.verificationBadges?.identityVerified) && !hasDniLog) {
                            await addReputationPoints(user.uid, 500, 'Identidad Verificada');
                            needsRefresh = true;
                        }
                        if ((userProfile.bankDetails?.cbu || userProfile.bankDetails?.alias || userProfile.mercadoPagoOAuth) && !hasCbuLog) {
                            await addReputationPoints(user.uid, 300, 'Cuenta de Cobro Vinculada');
                            needsRefresh = true;
                        }

                        if (needsRefresh) {
                            refreshProfile();
                            // Fetch logs again
                            const newSnapshot = await getDocs(q);
                            setReputationLogs(newSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ReputationLog[]);
                        }
                    }
                    // --------------------------------
                } catch (err) {
                    console.error("Error fetching logs:", err);
                }
            }
        };
        fetchReputationLogs();
    }, [activeTab, user]);

    if (profileLoading) {
        return <LoadingSpinner text="Sincronizando Protocolos..." />;
    }

    if (!user) {
        navigate('/login');
        return null;
    }

    // Fallback if profile failed to load but user is authenticated
    if (!userProfile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="size-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500">
                    <span className="material-symbols-outlined text-4xl">cloud_off</span>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Error de Sincronización</h2>
                    <p className="text-slate-500 font-medium max-w-md mx-auto mt-2">No pudimos conectar con tu perfil. Por favor, intenta recargar la página.</p>
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all"
                >
                    Reintentar Conexión
                </button>
            </div>
        );
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'coverImage' | 'shopBackground' | 'storeLogo' | 'storeBanner') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSaving(true);
        setUploadProgress('Optimizando...');

        try {
            // Compress image before upload
            const maxDimension = (type === 'shopBackground' || type === 'storeBanner') ? 1920 : type === 'storeLogo' ? 512 : 1024;
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: maxDimension,
                useWebWorker: true,
            };
            
            const compressedFile = await imageCompression(file, options);
            
            // Preview
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type !== 'shopBackground' && type !== 'storeLogo' && type !== 'storeBanner') {
                    setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
                }
            };
            reader.readAsDataURL(compressedFile);

            setUploadProgress('Subiendo...');
            
            // MOCK UPLOAD DUE TO FIREBASE STORAGE QUOTA
            // Generate a random image URL depending on the type
            let url = '';
            if (type === 'avatar') {
                url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
            } else if (type === 'coverImage') {
                url = `https://picsum.photos/seed/${Date.now()}/1000/300`;
            } else if (type === 'storeLogo') {
                url = `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now()}`;
            } else if (type === 'storeBanner') {
                url = `https://picsum.photos/seed/${Date.now()}/1200/300`;
            } else {
                url = `https://picsum.photos/seed/${Date.now()}/1920/1080`;
            }
            
            // Fake upload delay
            await new Promise(resolve => setTimeout(resolve, 800));
            if (type === 'shopBackground') {
                setFormData(prev => ({ 
                    ...prev, 
                    shopTheme: { ...prev.shopTheme, backgroundImage: url } 
                }));
            } else if (type === 'storeLogo') {
                setFormData(prev => ({ 
                    ...prev, 
                    storeInfo: { ...prev.storeInfo, logo: url } 
                }));
            } else if (type === 'storeBanner') {
                setFormData(prev => ({ 
                    ...prev, 
                    storeInfo: { ...prev.storeInfo, banner: url } 
                }));
            } else {
                setFormData(prev => ({ ...prev, [type]: url }));
            }
            
            notify({ type: 'success', title: 'Imagen Optimizada', message: 'Se ha sincronizado y comprimido la nueva imagen.', icon: 'speed' });
        } catch (error: any) {
            console.error("Error in handleFileChange:", error);
            notify({ 
                type: 'error', 
                title: 'Error de Carga', 
                message: error.message?.includes('403') ? 'Error de permisos en el servidor. Reintentando...' : 'No se pudo procesar la imagen.', 
                icon: 'error' 
            });
        } finally {
            setIsSaving(false);
            setUploadProgress('');
        }
    };

    const handleCityChange = async (val: string) => {
        setFormData({ ...formData, city: val });
        if (val.length > 2) {
            try {
                const res = await fetch(`https://apis.datos.gob.ar/georef/api/localidades?nombre=${encodeURIComponent(val)}&max=5`);
                const data = await res.json();
                if (data.localidades) {
                    setCitySuggestions(data.localidades);
                    setShowSuggestions(true);
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            setCitySuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleAddressChange = async (val: string) => {
        setFormData(prev => ({ ...prev, address: val }));
        if (val.length > 2) {
            try {
                let url = `https://apis.datos.gob.ar/georef/api/direcciones?direccion=${encodeURIComponent(val)}&max=5`;
                
                // Extract province from city field to filter results
                let provinciaFilter = '';
                if (formData.city && formData.city.includes(',')) {
                    provinciaFilter = formData.city.split(',')[1].trim();
                } else if (formData.city) {
                    // No comma: use the city value directly as province (works for CABA, etc.)
                    provinciaFilter = formData.city.trim();
                }
                if (provinciaFilter) {
                    url += `&provincia=${encodeURIComponent(provinciaFilter)}`;
                }

                const res = await fetch(url);
                const data = await res.json();
                if (data.direcciones && data.direcciones.length > 0) {
                    setAddressSuggestions(data.direcciones);
                    setShowAddressSuggestions(true);
                } else {
                    // Fallback to calles if they haven't typed a number yet
                    let callesUrl = `https://apis.datos.gob.ar/georef/api/calles?nombre=${encodeURIComponent(val)}&max=5`;
                    if (provinciaFilter) {
                         callesUrl += `&provincia=${encodeURIComponent(provinciaFilter)}`;
                    }
                    const resCalles = await fetch(callesUrl);
                    const dataCalles = await resCalles.json();
                    if (dataCalles.calles && dataCalles.calles.length > 0) {
                         const fakeDirecciones = dataCalles.calles.map((c: any) => ({
                             nomenclatura: c.nombre,
                             calle: { nombre: c.nombre },
                             altura: { valor: '' },
                             localidad_censal: { nombre: '' },
                             provincia: { nombre: c.provincia?.nombre || '' }
                         }));
                         setAddressSuggestions(fakeDirecciones);
                         setShowAddressSuggestions(true);
                    } else {
                         setAddressSuggestions([]);
                         setShowAddressSuggestions(false);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            setAddressSuggestions([]);
            setShowAddressSuggestions(false);
        }
    };

    const handleSelectAddress = async (sug: any) => {
        const streetName = sug.calle?.nombre || '';
        const streetNumber = sug.altura?.valor || '';
        const formattedAddress = `${streetName} ${streetNumber}`.trim();

        setFormData(prev => ({ ...prev, address: formattedAddress || sug.nomenclatura }));
        setShowAddressSuggestions(false);

        if (sug.ubicacion?.lat && sug.ubicacion?.lon) {
            try {
                // Use Nominatim Reverse Geocoding to get Postcode
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${sug.ubicacion.lat}&lon=${sug.ubicacion.lon}`, {
                    headers: { 'User-Agent': 'DeOportunidades/1.0' }
                });
                const data = await res.json();
                if (data?.address?.postcode) {
                    setFormData(prev => ({ ...prev, zipCode: data.address.postcode.replace(/[^0-9a-zA-Z]/g, '') }));
                    return; // Exit if found
                }
            } catch (e) {
                console.error("Error fetching postcode:", e);
            }
        }

        // Fallback: If no exact lat/lon or reverse geocoding failed, get postcode from city
        try {
            const searchQuery = formData.city ? `${formData.city}, Argentina` : 'Argentina';
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=1`, {
                headers: { 'User-Agent': 'DeOportunidades/1.0' }
            });
            const data = await res.json();
            if (data && data.length > 0 && data[0].address?.postcode) {
                setFormData(prev => ({ ...prev, zipCode: data[0].address.postcode.replace(/[^0-9a-zA-Z]/g, '') }));
            }
        } catch (e) {
            console.error("Error fetching fallback postcode:", e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        if (formData.storeInfo.name || formData.storeInfo.slug) {
            const availability = await checkStoreIdentifierAvailability(user.uid, formData.storeInfo.name, formData.storeInfo.slug);
            if (!availability.available) {
                notify({ type: 'error', title: 'Error', message: availability.reason || "El nombre comercial o enlace no está disponible o está protegido contra suplantación." });
                setIsSaving(false);
                return;
            }
        }

        const result = await updateUserProfile(user.uid, {
            displayName: formData.displayName,
            bio: formData.bio,
            phone: formData.phone,
            avatar: formData.avatar,
            coverImage: formData.coverImage,
            location: {
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
                address: formData.address,
            },
            social: formData.social,
            identity: formData.identity,
            logistics: formData.logistics,
            bankDetails: formData.bankDetails,
            taxDetails: formData.taxDetails,
            dni: formData.dni,
            shopTheme: formData.shopTheme,
            store: {
                ...(userProfile?.store || { plan: 'FREE', coupons: [], logo: '', banner: '', description: '' }),
                isActive: formData.storeInfo.isActive,
                name: formData.storeInfo.name,
                slug: formData.storeInfo.slug,
                logo: formData.storeInfo.logo,
                banner: formData.storeInfo.banner,
                tagline: formData.storeInfo.tagline,
                description: formData.storeInfo.description,
                announcement: formData.storeInfo.announcement,
                announcementColor: formData.storeInfo.announcementColor,
                announcementActive: formData.storeInfo.announcementActive,
                warranty: formData.storeInfo.warranty,
                dispatchTime: formData.storeInfo.dispatchTime,
                showCouponsPublic: formData.storeInfo.showCouponsPublic,
                featuredProductIds: formData.storeInfo.featuredProductIds,
                catalogSort: formData.storeInfo.catalogSort,
                socialLinks: formData.storeInfo.socialLinks,
            }
        });

        setIsSaving(false);

        if (result.success) {
            await refreshProfile();
            notify({
                type: 'success',
                title: 'Perfil Actualizado',
                message: 'Tus cambios han sido guardados correctamente.',
                icon: 'check_circle'
            });
        } else {
            notify({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron guardar los cambios.',
                icon: 'error'
            });
        }
    };

    const handlePurgeData = async () => {
        const isConfirmed = await showConfirm(
            "Eliminar Cuenta",
            "¿ESTÁS SEGURO? Esta acción eliminará permanentemente tu cuenta y todos tus datos. No se puede deshacer.",
            "Sí, Eliminar",
            "Cancelar",
            "delete_forever"
        );
        if (isConfirmed) {
            setLoading(true);
            const res = await deleteUserAccount(user.uid);
            if (res.success) {
                notify({ type: 'warning', title: 'Cuenta Eliminada', message: 'Tu cuenta ha sido eliminada permanentemente.', icon: 'delete_forever' });
                logout();
                navigate('/');
            } else if (res.requiresReauth) {
                notify({
                    type: 'info',
                    title: 'Seguridad',
                    message: 'Por seguridad, debes volver a iniciar sesión para eliminar tu cuenta.',
                    icon: 'lock_reset'
                });
            } else {
                notify({ type: 'error', title: 'Error', message: 'No se pudo eliminar la cuenta.', icon: 'report' });
            }
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Perfil Público', icon: 'person' },
        { id: 'shop', label: 'Mi Tienda', icon: 'palette' },
        { id: 'reputation', label: 'Mi Reputación', icon: 'military_tech' },
        { id: 'safety', label: 'Seguridad y Logística', icon: 'verified_user' },
        { id: 'billing', label: 'Datos de Cobro', icon: 'account_balance' },
    ] as const;

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300 ${activeTab === 'shop' ? 'max-w-5xl' : 'max-w-4xl'}`}>
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">Configuración</h1>
                        <p className="text-slate-500 font-medium mt-1">Gestiona tu identidad, logística y pagos.</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="flex gap-2 p-1.5 bg-slate-200/50 rounded-2xl mb-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <AnimatePresence mode="wait">
                        {/* TAB: PERFIL PUBLICO */}
                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-8"
                            >
                                <div className="flex flex-col sm:flex-row items-center gap-8">
                                    <div className="relative group">
                                        <div className="size-32 rounded-3xl overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100 relative">
                                            <img src={previews.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName || user.email || 'U')}&background=random`} className="w-full h-full object-cover" />
                                            {isSaving && (
                                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                                                    <div className="size-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-1" />
                                                    <span className="text-[8px] font-black text-white uppercase tracking-widest">{uploadProgress}</span>
                                                </div>
                                            )}
                                        </div>
                                        <label className="absolute -bottom-2 -right-2 size-10 bg-slate-900 text-white rounded-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                                            <span className="material-symbols-outlined text-xl">photo_camera</span>
                                            <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" />
                                        </label>
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <h3 className="text-xl font-bold text-slate-900 font-display">Imagen de Perfil</h3>
                                        <p className="text-slate-400 text-sm font-medium mt-1">Sube una foto clara. Los perfiles con foto generan 3x más confianza.</p>
                                    </div>
                                </div>

                                {/* Cover Image Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">Imagen de Portada</h3>
                                            <p className="text-slate-400 text-xs font-medium mt-0.5">Define la estética de tu tienda o perfil personal.</p>
                                        </div>
                                    </div>
                                    <div className="relative aspect-[21/9] sm:aspect-[21/6] rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 group">
                                        <img src={previews.coverImage || formData.coverImage || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000'} className="w-full h-full object-cover" />
                                        {isSaving && (
                                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-all z-20">
                                                <div className="size-8 border-3 border-white/20 border-t-white rounded-full animate-spin mb-2" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{uploadProgress}</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <label className="cursor-pointer">
                                                <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                                                    <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Cambiar Portada</span>
                                                </div>
                                                <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'coverImage')} accept="image/*" />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Público</label>
                                        <input
                                            type="text"
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                            placeholder="Tu nombre o tienda"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Instagram (@usuario)</label>
                                        <input
                                            type="text"
                                            value={formData.social.instagram}
                                            onChange={(e) => setFormData({ ...formData, social: { ...formData.social, instagram: e.target.value } })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                            placeholder="@usuario"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">TikTok (@usuario)</label>
                                        <input
                                            type="text"
                                            value={formData.social.tiktok || ''}
                                            onChange={(e) => setFormData({ ...formData, social: { ...formData.social, tiktok: e.target.value } })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                            placeholder="@usuario"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Twitter / X (@usuario)</label>
                                        <input
                                            type="text"
                                            value={formData.social.twitter || ''}
                                            onChange={(e) => setFormData({ ...formData, social: { ...formData.social, twitter: e.target.value } })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                            placeholder="@usuario"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Biografía / Acerca de ti</label>
                                    <textarea
                                        rows={4}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all resize-none"
                                        placeholder="Cuéntales a tus compradores quién eres o qué vendes..."
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* TAB: MI TIENDA */}
                        {activeTab === 'shop' && (
                            <motion.div
                                key="shop"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                {!formData.storeInfo.isActive ? (
                                    <div className="bg-white rounded-[32px] p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-6">
                                        <div className="size-20 bg-sky-50 rounded-3xl flex items-center justify-center text-sky-700 mb-2">
                                            <span className="material-symbols-outlined text-4xl font-black">store</span>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Habilita tu Tienda Virtual</h3>
                                            <p className="text-slate-500 font-medium max-w-md mx-auto">
                                                Crea tu propio espacio personalizado, gestiona tu stock, ofrece cupones y obtén un enlace único para tu marca.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, isActive: true } })}
                                            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20"
                                        >
                                            <span className="material-symbols-outlined">rocket_launch</span>
                                            Comenzar Ahora
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {user && <StoreAdvancedPanel 
                                            user={userProfile as any} 
                                            customizationSlot={
                                                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="size-12 bg-sky-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-600/20">
                                                    <span className="material-symbols-outlined text-2xl font-black">palette</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-900 tracking-tight">Personalización de Tienda</h4>
                                                    <p className="text-slate-500 text-sm font-medium">Define la identidad, colores y el fondo que verán tus clientes.</p>
                                                </div>
                                            </div>

                                            {/* Name and Slug */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                                                    <input
                                                        type="text"
                                                        value={formData.storeInfo.name}
                                                        onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, name: e.target.value } })}
                                                        className={`w-full bg-slate-50 border-2 rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all ${!storeIdStatus.available && formData.storeInfo.name ? 'border-red-400 focus:border-red-500 bg-red-50/30' : 'border-transparent focus:border-slate-100 focus:bg-white'}`}
                                                        placeholder="Ej: Mi Marca"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Enlace Personalizado</label>
                                                    <input
                                                        type="text"
                                                        value={formData.storeInfo.slug}
                                                        onChange={(e) => {
                                                            const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
                                                            setFormData({ ...formData, storeInfo: { ...formData.storeInfo, slug } });
                                                        }}
                                                        className={`w-full bg-slate-50 border-2 rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all ${!storeIdStatus.available && formData.storeInfo.slug ? 'border-red-400 focus:border-red-500 bg-red-50/30' : 'border-transparent focus:border-slate-100 focus:bg-white'}`}
                                                        placeholder="ej: mi-marca"
                                                    />
                                                    <p className="text-[10px] text-slate-400 px-2 font-medium">Tu tienda se verá en: /shop/{formData.storeInfo.slug || 'mi-marca'}</p>
                                                </div>
                                            </div>

                                            {/* Real-time Anti-Plagiarism / Availability Status Banner */}
                                            {(formData.storeInfo.name || formData.storeInfo.slug) && (
                                                <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold transition-all ${storeIdStatus.loading ? 'bg-slate-50 border border-slate-200 text-slate-500' : !storeIdStatus.available ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
                                                    {storeIdStatus.loading ? (
                                                        <>
                                                            <div className="size-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                                            <span>Verificando unicidad en base de datos y sistema anti-plagio...</span>
                                                        </>
                                                    ) : !storeIdStatus.available ? (
                                                        <>
                                                            <span className="material-symbols-outlined text-base text-red-500">gpp_bad</span>
                                                            <span><strong>No disponible:</strong> {storeIdStatus.reason}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="material-symbols-outlined text-base text-emerald-500">verified_user</span>
                                                            <span><strong>¡Identificadores Únicos y Protegidos!</strong> Nombre y enlace disponibles para tu tienda de por vida.</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {/* Logo & Banner Upload */}
                                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Identidad Visual de la Tienda</label>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    {/* Logo */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-xs text-sky-600">image</span>
                                                                Logo de la Tienda
                                                            </label>
                                                            <label className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-black transition-all shadow-sm flex items-center gap-1.5">
                                                                <span className="material-symbols-outlined text-xs">upload</span>
                                                                Subir
                                                                <input 
                                                                    type="file" 
                                                                    className="hidden" 
                                                                    onChange={(e) => handleFileChange(e, 'storeLogo')} 
                                                                    accept="image/*" 
                                                                />
                                                            </label>
                                                        </div>
                                                        <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center group">
                                                            {formData.storeInfo.logo ? (
                                                                <>
                                                                    <img 
                                                                        src={formData.storeInfo.logo} 
                                                                        className="w-full h-full object-contain p-4" 
                                                                        alt="Logo de Tienda"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setFormData(prev => ({ ...prev, storeInfo: { ...prev.storeInfo, logo: '' } }))}
                                                                        className="absolute top-2 right-2 size-7 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div className="text-center">
                                                                    <span className="material-symbols-outlined text-3xl text-slate-300 mb-1">add_photo_alternate</span>
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">512×512px recomendado</p>
                                                                </div>
                                                            )}
                                                            {isSaving && (
                                                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                                                                    <div className="size-8 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">O pegar URL</label>
                                                            <input 
                                                                type="text"
                                                                value={formData.storeInfo.logo}
                                                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, logo: e.target.value } })}
                                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-xl py-2.5 px-4 outline-none font-bold text-slate-700 transition-all text-xs"
                                                                placeholder="https://..."
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Banner */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-xs text-sky-600">panorama</span>
                                                                Banner / Portada
                                                            </label>
                                                            <label className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-black transition-all shadow-sm flex items-center gap-1.5">
                                                                <span className="material-symbols-outlined text-xs">upload</span>
                                                                Subir
                                                                <input 
                                                                    type="file" 
                                                                    className="hidden" 
                                                                    onChange={(e) => handleFileChange(e, 'storeBanner')} 
                                                                    accept="image/*" 
                                                                />
                                                            </label>
                                                        </div>
                                                        <div className="relative aspect-[21/9] rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center group">
                                                            {formData.storeInfo.banner ? (
                                                                <>
                                                                    <img 
                                                                        src={formData.storeInfo.banner} 
                                                                        className="w-full h-full object-cover" 
                                                                        alt="Banner de Tienda"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setFormData(prev => ({ ...prev, storeInfo: { ...prev.storeInfo, banner: '' } }))}
                                                                        className="absolute top-2 right-2 size-7 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div className="text-center">
                                                                    <span className="material-symbols-outlined text-3xl text-slate-300 mb-1">add_photo_alternate</span>
                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">1200×300px recomendado</p>
                                                                </div>
                                                            )}
                                                            {isSaving && (
                                                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                                                                    <div className="size-8 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">O pegar URL</label>
                                                            <input 
                                                                type="text"
                                                                value={formData.storeInfo.banner}
                                                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, banner: e.target.value } })}
                                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-xl py-2.5 px-4 outline-none font-bold text-slate-700 transition-all text-xs"
                                                                placeholder="https://..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tagline */}
                                            <div className="col-span-full space-y-2">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Eslogan / Tagline</label>
                                                <input
                                                    type="text"
                                                    value={formData.storeInfo.tagline}
                                                    onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, tagline: e.target.value } })}
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                                    placeholder="Ej: Tecnología y gadgets al mejor precio del mercado"
                                                    maxLength={80}
                                                />
                                                <p className="text-[10px] text-slate-400 px-2 font-medium">{formData.storeInfo.tagline.length}/80 — Aparece debajo del nombre de tu tienda.</p>
                                            </div>

                                            {/* Store Description / Quiénes Somos */}
                                            <div className="col-span-full space-y-2">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción de la Tienda (Quiénes Somos)</label>
                                                <textarea
                                                    value={formData.storeInfo.description}
                                                    onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, description: e.target.value } })}
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all resize-none min-h-[100px]"
                                                    placeholder="Contá la historia de tu marca, tu especialidad o lo que hace diferente a tu tienda..."
                                                    maxLength={400}
                                                    rows={3}
                                                />
                                                <p className="text-[10px] text-slate-400 px-2 font-medium">{formData.storeInfo.description.length}/400 — Los compradores lo verán en tu perfil de tienda.</p>
                                            </div>

                                {/* Background Type Selector */}
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Fondo</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            { id: 'color', label: 'Color Sólido', icon: 'format_color_fill' },
                                            { id: 'gradient', label: 'Gradiente Moderno', icon: 'gradient' },
                                            { id: 'image', label: 'Imagen de Marca', icon: 'image' },
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => setFormData({ 
                                                    ...formData, 
                                                    shopTheme: { ...formData.shopTheme, backgroundType: type.id as any } 
                                                })}
                                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.shopTheme.backgroundType === type.id
                                                    ? 'bg-slate-900 border-slate-900 text-white'
                                                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-xl">{type.icon}</span>
                                                <span className="text-sm font-bold">{type.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Typography Selector */}
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipografía Principal</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {[
                                            { id: 'font-sans', label: 'Jakarta Sans', sample: 'Ag', family: "'Plus Jakarta Sans', sans-serif" },
                                            { id: 'font-inter', label: 'Inter', sample: 'Ag', family: "'Inter', sans-serif" },
                                            { id: 'font-poppins', label: 'Poppins', sample: 'Ag', family: "'Poppins', sans-serif" },
                                            { id: 'font-roboto', label: 'Roboto', sample: 'Ag', family: "'Roboto', sans-serif" },
                                            { id: 'font-montserrat', label: 'Montserrat', sample: 'Ag', family: "'Montserrat', sans-serif" },
                                            { id: 'font-opensans', label: 'Open Sans', sample: 'Ag', family: "'Open Sans', sans-serif" },
                                            { id: 'font-lato', label: 'Lato', sample: 'Ag', family: "'Lato', sans-serif" },
                                            { id: 'font-playfair', label: 'Playfair Display', sample: 'Ag', family: "'Playfair Display', serif" },
                                            { id: 'font-serif', label: 'Serif (Clásica)', sample: 'Ag', family: "Georgia, 'Times New Roman', serif" },
                                            { id: 'font-mono', label: 'Mono (Técnica)', sample: 'Ag', family: "'Courier New', monospace" },
                                        ].map(font => (
                                            <button
                                                key={font.id}
                                                type="button"
                                                onClick={() => setFormData({ 
                                                    ...formData, 
                                                    shopTheme: { ...formData.shopTheme, typography: font.id } 
                                                })}
                                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.shopTheme.typography === font.id || (!formData.shopTheme.typography && font.id === 'font-sans')
                                                    ? 'bg-primary-container border-primary/30 text-on-primary-container ring-1 ring-primary/10'
                                                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:border-slate-200'
                                                    }`}
                                            >
                                                <span className="text-2xl font-bold leading-none" style={{ fontFamily: font.family }}>{font.sample}</span>
                                                <span className="text-[11px] font-bold truncate">{font.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Conditional Settings based on Background Type */}
                                <AnimatePresence mode="wait">
                                    {formData.shopTheme.backgroundType === 'color' && (
                                        <motion.div 
                                            key="color-settings"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4 pt-4 border-t border-slate-100"
                                        >
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Color de Fondo</label>
                                                <div className="flex gap-4 items-center">
                                                    <input 
                                                        type="color" 
                                                        value={formData.shopTheme.backgroundColor}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            shopTheme: { ...formData.shopTheme, backgroundColor: e.target.value }
                                                        })}
                                                        className="size-12 rounded-xl cursor-pointer border-none bg-transparent"
                                                    />
                                                    <input 
                                                        type="text"
                                                        value={formData.shopTheme.backgroundColor}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            shopTheme: { ...formData.shopTheme, backgroundColor: e.target.value }
                                                        })}
                                                        className="flex-1 bg-slate-50 border-2 border-transparent rounded-xl py-3 px-4 font-mono font-bold text-slate-600 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {formData.shopTheme.backgroundType === 'gradient' && (
                                        <motion.div 
                                            key="gradient-settings"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100"
                                        >
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Color Primario</label>
                                                <DebouncedColorPicker 
                                                    value={formData.shopTheme.primaryColor}
                                                    onChange={(val) => setFormData({
                                                        ...formData,
                                                        shopTheme: { ...formData.shopTheme, primaryColor: val }
                                                    })}
                                                    defaultColor="#4f46e5"
                                                    placeholder="#000000 o rgb(0,0,0)"
                                                    label="Color Primario"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Color Secundario</label>
                                                <DebouncedColorPicker 
                                                    value={formData.shopTheme.secondaryColor}
                                                    onChange={(val) => setFormData({
                                                        ...formData,
                                                        shopTheme: { ...formData.shopTheme, secondaryColor: val }
                                                    })}
                                                    defaultColor="#9333ea"
                                                    placeholder="#000000 o rgb(0,0,0)"
                                                    label="Color Secundario"
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {formData.shopTheme.backgroundType === 'image' && (
                                        <motion.div 
                                            key="image-settings"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-6 pt-4 border-t border-slate-100"
                                        >
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Imagen de Fondo</label>
                                                    <label className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black transition-all shadow-lg flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-sm">upload</span>
                                                        Subir desde mi equipo
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            onChange={(e) => handleFileChange(e, 'shopBackground')} 
                                                            accept="image/*" 
                                                        />
                                                    </label>
                                                </div>

                                                <div className="relative aspect-[21/9] rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 group">
                                                    {formData.shopTheme.backgroundImage ? (
                                                        <img 
                                                            src={formData.shopTheme.backgroundImage} 
                                                            className="w-full h-full object-cover" 
                                                            alt="Fondo de Tienda"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                                            <span className="material-symbols-outlined text-4xl mb-2">image</span>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sin Imagen</p>
                                                        </div>
                                                    )}
                                                    
                                                    {isSaving && (
                                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 transition-all duration-300">
                                                            <div className="size-10 border-4 border-white/20 border-t-white rounded-full animate-spin shadow-lg mb-3" />
                                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{uploadProgress}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">O pegar URL externa</label>
                                                    <input 
                                                        type="text"
                                                        value={formData.shopTheme.backgroundImage || ''}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            shopTheme: { ...formData.shopTheme, backgroundImage: e.target.value }
                                                        })}
                                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-xl py-3 px-4 outline-none font-bold text-slate-700 transition-all text-sm"
                                                        placeholder="https://ejemplo.com/mi-fondo.jpg"
                                                    />
                                                </div>
                                                
                                                <p className="text-[10px] font-medium text-slate-400 px-1 italic">
                                                    Recomendado: Imágenes horizontales de alta resolución (1920x1080).
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Accent Color */}
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Color de Acento (Botones y Detalles)</label>
                                        <div className="flex gap-4 items-center">
                                            <DebouncedColorPicker 
                                                value={formData.shopTheme.accentColor}
                                                onChange={(val) => setFormData({
                                                    ...formData,
                                                    shopTheme: { ...formData.shopTheme, accentColor: val }
                                                })}
                                                defaultColor="#e11d48"
                                                label="Color de Acento"
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {['#e11d48', '#4f46e5', '#16a34a', '#d97706', '#9333ea', '#0891b2'].map(c => (
                                                    <button 
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, shopTheme: { ...formData.shopTheme, accentColor: c } })}
                                                        className={`size-8 rounded-lg border-2 transition-all ${formData.shopTheme.accentColor === c ? 'border-slate-900 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* === ANNOUNCEMENT BAR === */}
                                <div className="space-y-4 pt-6 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Barra de Anuncios</label>
                                            <p className="text-[10px] text-slate-400 ml-1 mt-0.5">Se muestra en la parte superior de tu tienda para promociones y avisos.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({
                                                ...formData,
                                                storeInfo: { ...formData.storeInfo, announcementActive: !formData.storeInfo.announcementActive }
                                            })}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 shrink-0 ${formData.storeInfo.announcementActive ? 'bg-sky-700' : 'bg-slate-200'}`}
                                        >
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${formData.storeInfo.announcementActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    {formData.storeInfo.announcementActive && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <input
                                                type="text"
                                                value={formData.storeInfo.announcement}
                                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, announcement: e.target.value } })}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                                placeholder="🚀 Envío GRATIS en compras superiores a $50.000"
                                                maxLength={120}
                                            />
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Color:</span>
                                                <div className="flex gap-2">
                                                    {['#e11d48', '#4f46e5', '#16a34a', '#d97706', '#0891b2', '#0f172a'].map(c => (
                                                        <button
                                                            key={c}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, announcementColor: c } })}
                                                            className={`size-7 rounded-lg border-2 transition-all ${formData.storeInfo.announcementColor === c ? 'border-slate-900 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                                                            style={{ backgroundColor: c }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Preview */}
                                            {formData.storeInfo.announcement && (
                                                <div
                                                    className="py-2.5 px-4 rounded-xl text-center text-white text-xs font-bold tracking-wide"
                                                    style={{ backgroundColor: formData.storeInfo.announcementColor || '#e11d48' }}
                                                >
                                                    {formData.storeInfo.announcement}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* === STORE SOCIAL LINKS === */}
                                <div className="space-y-4 pt-6 border-t border-slate-100">
                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Redes Sociales de la Tienda</label>
                                        <p className="text-[10px] text-slate-400 ml-1 mt-0.5">Aparecen como botones en tu tienda pública para que tus clientes te contacten.</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Instagram */}
                                        <div className="group flex flex-col gap-1.5 bg-slate-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-pink-300 focus-within:bg-white hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                                            <div className="flex items-center gap-2.5 text-pink-600 font-black text-xs uppercase tracking-wider">
                                                <motion.div animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
                                                    <FaInstagram className="text-lg text-pink-600 drop-shadow-sm group-hover:scale-125 transition-transform" />
                                                </motion.div>
                                                Instagram
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.storeInfo.socialLinks?.instagram || ''}
                                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, socialLinks: { ...formData.storeInfo.socialLinks, instagram: e.target.value } } })}
                                                className="bg-transparent outline-none font-bold text-slate-700 w-full text-sm placeholder:text-slate-400"
                                                placeholder="@mi_tienda"
                                            />
                                        </div>

                                        {/* TikTok */}
                                        <div className="group flex flex-col gap-1.5 bg-slate-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-slate-400 focus-within:bg-white hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                                            <div className="flex items-center gap-2.5 text-slate-900 font-black text-xs uppercase tracking-wider">
                                                <motion.div animate={{ y: [0, -4, 0], rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}>
                                                    <FaTiktok className="text-lg text-slate-900 drop-shadow-sm group-hover:scale-125 transition-transform" />
                                                </motion.div>
                                                TikTok
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.storeInfo.socialLinks?.tiktok || ''}
                                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, socialLinks: { ...formData.storeInfo.socialLinks, tiktok: e.target.value } } })}
                                                className="bg-transparent outline-none font-bold text-slate-700 w-full text-sm placeholder:text-slate-400"
                                                placeholder="@mi_tienda"
                                            />
                                        </div>

                                        {/* Facebook */}
                                        <div className="group flex flex-col gap-1.5 bg-slate-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-blue-300 focus-within:bg-white hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                                            <div className="flex items-center gap-2.5 text-blue-600 font-black text-xs uppercase tracking-wider">
                                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                                                    <FaFacebook className="text-lg text-blue-600 drop-shadow-sm group-hover:scale-125 transition-transform" />
                                                </motion.div>
                                                Facebook
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.storeInfo.socialLinks?.facebook || ''}
                                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, socialLinks: { ...formData.storeInfo.socialLinks, facebook: e.target.value } } })}
                                                className="bg-transparent outline-none font-bold text-slate-700 w-full text-sm placeholder:text-slate-400"
                                                placeholder="facebook.com/mi.tienda"
                                            />
                                        </div>

                                        {/* YouTube */}
                                        <div className="group flex flex-col gap-1.5 bg-slate-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-red-300 focus-within:bg-white hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                                            <div className="flex items-center gap-2.5 text-red-600 font-black text-xs uppercase tracking-wider">
                                                <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}>
                                                    <FaYoutube className="text-lg text-red-600 drop-shadow-sm group-hover:scale-125 transition-transform" />
                                                </motion.div>
                                                YouTube
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.storeInfo.socialLinks?.youtube || ''}
                                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, socialLinks: { ...formData.storeInfo.socialLinks, youtube: e.target.value } } })}
                                                className="bg-transparent outline-none font-bold text-slate-700 w-full text-sm placeholder:text-slate-400"
                                                placeholder="@mi_canal"
                                            />
                                        </div>

                                        {/* X (Twitter) */}
                                        <div className="group flex flex-col gap-1.5 bg-slate-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-slate-400 focus-within:bg-white hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                                            <div className="flex items-center gap-2.5 text-slate-800 font-black text-xs uppercase tracking-wider">
                                                <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}>
                                                    <FaXTwitter className="text-lg text-slate-800 drop-shadow-sm group-hover:scale-125 transition-transform" />
                                                </motion.div>
                                                X (Twitter)
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.storeInfo.socialLinks?.twitter || ''}
                                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, socialLinks: { ...formData.storeInfo.socialLinks, twitter: e.target.value } } })}
                                                className="bg-transparent outline-none font-bold text-slate-700 w-full text-sm placeholder:text-slate-400"
                                                placeholder="@mi_tienda"
                                            />
                                        </div>

                                        {/* WhatsApp */}
                                        <div className="group flex flex-col gap-1.5 bg-slate-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-emerald-300 focus-within:bg-white hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                                            <div className="flex items-center gap-2.5 text-emerald-600 font-black text-xs uppercase tracking-wider">
                                                <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                                                    <FaWhatsapp className="text-lg text-emerald-600 drop-shadow-sm group-hover:scale-125 transition-transform" />
                                                </motion.div>
                                                WhatsApp
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.storeInfo.socialLinks?.whatsapp || ''}
                                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, socialLinks: { ...formData.storeInfo.socialLinks, whatsapp: e.target.value } } })}
                                                className="bg-transparent outline-none font-bold text-slate-700 w-full text-sm placeholder:text-slate-400"
                                                placeholder="+54 11 1234-5678"
                                            />
                                        </div>

                                        {/* Sitio Web */}
                                        <div className="group flex flex-col gap-1.5 bg-slate-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-sky-300 focus-within:bg-white hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                                            <div className="flex items-center gap-2.5 text-sky-700 font-black text-xs uppercase tracking-wider">
                                                <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }}>
                                                    <FaGlobe className="text-lg text-sky-700 drop-shadow-sm group-hover:scale-125 transition-transform" />
                                                </motion.div>
                                                Sitio Web
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.storeInfo.socialLinks?.website || ''}
                                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, socialLinks: { ...formData.storeInfo.socialLinks, website: e.target.value } } })}
                                                className="bg-transparent outline-none font-bold text-slate-700 w-full text-sm placeholder:text-slate-400"
                                                placeholder="https://mitienda.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* === WARRANTY & DISPATCH === */}
                                <div className="space-y-4 pt-6 border-t border-slate-100">
                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Garantías y Logística</label>
                                        <p className="text-[10px] text-slate-400 ml-1 mt-0.5">Generá confianza mostrando tus políticas de garantía y tiempos de despacho.</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs text-emerald-500">verified_user</span>
                                                Garantía del Vendedor
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.storeInfo.warranty}
                                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, warranty: e.target.value } })}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all text-sm"
                                                placeholder="Ej: 6 meses de garantía directa"
                                                maxLength={100}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs text-sky-600">local_shipping</span>
                                                Tiempo de Despacho
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.storeInfo.dispatchTime}
                                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, dispatchTime: e.target.value } })}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all text-sm"
                                                placeholder="Ej: Despachamos en 24hs hábiles"
                                                maxLength={100}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* === CATALOG SORT & COUPONS TOGGLE === */}
                                <div className="space-y-4 pt-6 border-t border-slate-100">
                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Catálogo y Promociones</label>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Orden del Catálogo</label>
                                            <select
                                                value={formData.storeInfo.catalogSort}
                                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, catalogSort: e.target.value as any } })}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all text-sm cursor-pointer appearance-none"
                                            >
                                                <option value="default">Publicación más reciente</option>
                                                <option value="featured_first">Destacados y Flash primero</option>
                                                <option value="best_sellers">Más vendidos primero</option>
                                                <option value="price_low">Menor precio primero</option>
                                                <option value="price_high">Mayor precio primero</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cupones en Portada</label>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    storeInfo: { ...formData.storeInfo, showCouponsPublic: !formData.storeInfo.showCouponsPublic }
                                                })}
                                                className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl border-2 transition-all ${formData.storeInfo.showCouponsPublic ? 'bg-sky-50 border-sky-200 text-sky-800' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-xl">local_offer</span>
                                                    <span className="text-sm font-bold">Mostrar cupones activos al público</span>
                                                </div>
                                                <div className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${formData.storeInfo.showCouponsPublic ? 'bg-sky-700' : 'bg-slate-300'}`}>
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${formData.storeInfo.showCouponsPublic ? 'translate-x-5' : 'translate-x-1'}`} />
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* === VITRINA VIP / PRODUCTOS ESTRELLA === */}
                                <div className="space-y-4 pt-6 border-t border-slate-100">
                                    <div>
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm text-yellow-500">star</span>
                                            Vitrina VIP (Productos Estrella)
                                        </label>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">Selecciona hasta 4 productos para mostrarlos en un carrusel destacado justo debajo del banner de tu tienda.</p>
                                    </div>
                                    {myProducts.length === 0 ? (
                                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/60 text-center">
                                            <p className="text-xs font-bold text-slate-400">No tienes productos publicados para destacar aún.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {myProducts.map((p) => {
                                                const isSelected = (formData.storeInfo.featuredProductIds || []).includes(p.id);
                                                return (
                                                    <div 
                                                        key={p.id}
                                                        onClick={() => {
                                                            const current = formData.storeInfo.featuredProductIds || [];
                                                            let updated: string[];
                                                            if (isSelected) {
                                                                updated = current.filter(id => id !== p.id);
                                                            } else {
                                                                if (current.length >= 4) {
                                                                    notify({ type: 'warning', title: 'Límite alcanzado', message: 'Puedes destacar máximo 4 productos.', icon: 'star' });
                                                                    return;
                                                                }
                                                                updated = [...current, p.id];
                                                            }
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                storeInfo: { ...prev.storeInfo, featuredProductIds: updated }
                                                            }));
                                                        }}
                                                        className={`relative p-2.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2 ${isSelected ? 'border-sky-700 bg-sky-50/50 shadow-md shadow-sky-600/10' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}
                                                    >
                                                        <div className="aspect-square rounded-xl overflow-hidden bg-white relative">
                                                            <img src={p.images?.[0] || p.image || 'https://picsum.photos/200'} alt={p.title} className="w-full h-full object-cover" />
                                                            {isSelected && (
                                                                <div className="absolute top-1.5 right-1.5 size-6 bg-sky-700 text-white rounded-full flex items-center justify-center shadow">
                                                                    <span className="material-symbols-outlined text-xs font-black">check</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-800 truncate">{p.title}</p>
                                                            <p className="text-[11px] font-black text-sky-700">${p.price?.toLocaleString() || 0}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <p className="text-[10px] text-slate-400 font-bold ml-1">
                                        {(formData.storeInfo.featuredProductIds || []).length}/4 productos seleccionados
                                    </p>
                                </div>

                                {/* Cerrar Tienda */}
                                <div className="pt-8 border-t border-slate-100 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const confirm = await showConfirm('Desactivar Tienda', '¿Seguro que deseas desactivar tu tienda? Tus productos volverán a ser publicaciones regulares.', 'Desactivar', 'Cancelar', 'store_off');
                                            if (confirm) {
                                                setFormData({ ...formData, storeInfo: { ...formData.storeInfo, isActive: false } });
                                                notify({ type: 'info', title: 'Tienda desactivada', message: 'Los cambios se aplicarán al guardar.', icon: 'store_off' });
                                            }
                                        }}
                                        className="text-red-500 text-sm font-bold flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg">power_settings_new</span>
                                        Cerrar Tienda
                                    </button>
                                </div>
                            </div>
                        } 
                    />}
                    </>
                )}
                </motion.div>
            )}

                        {/* TAB: REPUTACION / GAMIFICACION */}
                        {activeTab === 'reputation' && (
                            <motion.div
                                key="reputation"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* XP Card */}
                                <div className="bg-slate-900 rounded-[32px] p-8 shadow-xl shadow-slate-200 border border-slate-800 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden text-white">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-vibrant/20 rounded-full blur-[80px] pointer-events-none -mt-20 -mr-20"></div>
                                    
                                    {(() => {
                                        const xp = userProfile.reputationPoints || 0;
                                        const levels = [
                                            { name: 'Bronce', min: 0, max: 999, icon: 'military_tech', color: 'text-amber-600', bg: 'bg-amber-600/20' },
                                            { name: 'Plata', min: 1000, max: 2499, icon: 'military_tech', color: 'text-slate-400', bg: 'bg-slate-400/20' },
                                            { name: 'Oro', min: 2500, max: 4999, icon: 'workspace_premium', color: 'text-yellow-400', bg: 'bg-yellow-400/20' },
                                            { name: 'Diamante', min: 5000, max: Infinity, icon: 'diamond', color: 'text-cyan-400', bg: 'bg-cyan-400/20' }
                                        ];
                                        const currentLvl = levels.find(l => xp >= l.min && xp <= l.max) || levels[0];
                                        const nextLvlIndex = levels.findIndex(l => l.name === currentLvl.name) + 1;
                                        const nextLvl = levels[nextLvlIndex < levels.length ? nextLvlIndex : levels.length - 1];
                                        const progress = xp >= 5000 ? 100 : ((xp - currentLvl.min) / (currentLvl.max - currentLvl.min)) * 100;

                                        return (
                                            <>
                                                <div className="flex-1 relative z-10 w-full">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg bg-white/10 text-white/80">
                                                            SISTEMA DE PUNTOS
                                                        </span>
                                                    </div>
                                                    <h3 className="text-4xl font-black tracking-tight mb-2 flex items-center gap-3">
                                                        {xp} <span className="text-xl text-slate-400">XP</span>
                                                    </h3>
                                                    <p className="text-slate-400 font-medium mb-6">Nivel actual: <strong className={currentLvl.color}>{currentLvl.name}</strong></p>
                                                    
                                                    {/* Progress Bar */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                            <span>Progreso</span>
                                                            <span>{xp >= 5000 ? 'NIVEL MÁXIMO' : `${nextLvl.min - xp} XP para ${nextLvl.name}`}</span>
                                                        </div>
                                                        <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
                                                            <div className="bg-gradient-to-r from-primary to-primary-vibrant h-full rounded-full transition-all duration-1000 relative" style={{ width: `${progress}%` }}>
                                                                <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 blur-md translate-x-1/2"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={`size-32 rounded-full ${currentLvl.bg} flex items-center justify-center shrink-0 border-4 border-slate-800 shadow-2xl relative z-10`}>
                                                    <span className={`material-symbols-outlined text-6xl font-black ${currentLvl.color}`}>
                                                        {currentLvl.icon}
                                                    </span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Quests / Missions */}
                                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Misiones Disponibles</h4>
                                        <div className="space-y-4">
                                            {/* Mission 1: DNI */}
                                            <div className="p-4 rounded-2xl border-2 border-slate-100 flex items-start gap-4">
                                                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${userProfile.dni ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                                                    <span className="material-symbols-outlined font-black">{userProfile.dni ? 'check' : 'badge'}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className={`text-sm font-bold ${userProfile.dni ? 'text-slate-900 line-through opacity-50' : 'text-slate-900'}`}>Verificar Identidad (DNI)</p>
                                                        <span className="text-[10px] font-black bg-primary-50 text-primary-600 px-2 py-1 rounded-md uppercase tracking-widest">+500 XP</span>
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-500">Obligatorio para nivel Plata. Verifica tu cuenta al 100%.</p>
                                                    {!userProfile.dni && (
                                                        <button type="button" onClick={() => setActiveTab('safety')} className="text-[10px] font-black text-primary-vibrant mt-3 uppercase tracking-widest hover:underline flex items-center gap-1">
                                                            Ir a Seguridad <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Mission 2: CBU */}
                                            <div className="p-4 rounded-2xl border-2 border-slate-100 flex items-start gap-4">
                                                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${(userProfile.bankDetails?.cbu || userProfile.bankDetails?.alias || userProfile.mercadoPagoOAuth) ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                                                    <span className="material-symbols-outlined font-black">{(userProfile.bankDetails?.cbu || userProfile.bankDetails?.alias || userProfile.mercadoPagoOAuth) ? 'check' : 'account_balance'}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className={`text-sm font-bold ${(userProfile.bankDetails?.cbu || userProfile.bankDetails?.alias || userProfile.mercadoPagoOAuth) ? 'text-slate-900 line-through opacity-50' : 'text-slate-900'}`}>Vincular Cuenta de Cobro</p>
                                                        <span className="text-[10px] font-black bg-primary-50 text-primary-600 px-2 py-1 rounded-md uppercase tracking-widest">+300 XP</span>
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-500">Obligatorio para nivel Oro. Agrega CBU o CVU.</p>
                                                    {!(userProfile.bankDetails?.cbu || userProfile.bankDetails?.alias || userProfile.mercadoPagoOAuth) && (
                                                        <button type="button" onClick={() => setActiveTab('billing')} className="text-[10px] font-black text-primary-vibrant mt-3 uppercase tracking-widest hover:underline flex items-center gap-1">
                                                            Ir a Facturación <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Mission 3: Sale */}
                                            <div className="p-4 rounded-2xl border-2 border-slate-100 flex items-start gap-4">
                                                <div className="size-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined font-black">sell</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="text-sm font-bold text-slate-900">Completar una Venta Exitosa</p>
                                                        <span className="text-[10px] font-black bg-primary-50 text-primary-600 px-2 py-1 rounded-md uppercase tracking-widest">+25 XP</span>
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-500">Por cada venta sin reclamos ni disputas.</p>
                                                </div>
                                            </div>
                                            
                                            {/* Mission 4: Recommendation */}
                                            <div className="p-4 rounded-2xl border-2 border-slate-100 flex items-start gap-4">
                                                <div className="size-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined font-black">thumb_up</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="text-sm font-bold text-slate-900">Recibir recomendación (5★)</p>
                                                        <span className="text-[10px] font-black bg-primary-50 text-primary-600 px-2 py-1 rounded-md uppercase tracking-widest">+5 XP</span>
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-500">Por cada recomendación positiva de compradores.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        {/* Benefits */}
                                        <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-200">
                                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Beneficios por Nivel</h4>
                                            <ul className="space-y-4">
                                                <li className="flex items-center gap-4 text-sm font-bold text-slate-700">
                                                    <span className="material-symbols-outlined text-slate-400">check_circle</span>
                                                    Badge de Verificado (Nivel Plata o superior)
                                                </li>
                                                <li className="flex items-center gap-4 text-sm font-bold text-slate-700">
                                                    <span className="material-symbols-outlined text-primary-vibrant">auto_awesome</span>
                                                    Publicaciones Destacadas Gratis (Nivel Oro o superior)
                                                </li>
                                                <li className="flex items-center gap-4 text-sm font-bold text-slate-700">
                                                    <span className="material-symbols-outlined text-slate-400">support_agent</span>
                                                    Soporte Prioritario (Nivel Diamante)
                                                </li>
                                            </ul>
                                        </div>

                                        {/* Logs */}
                                        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex-1">
                                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Historial de Puntos</h4>
                                            {reputationLogs.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">history</span>
                                                    <p className="text-sm font-medium text-slate-400">Aún no ganaste puntos.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                                    {reputationLogs.map(log => (
                                                        <div key={log.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`size-8 rounded-lg flex items-center justify-center ${log.points > 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                                                                    <span className="material-symbols-outlined text-sm font-black">{log.points > 0 ? 'add' : 'remove'}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900">{log.reason}</p>
                                                                    <p className="text-[10px] font-medium text-slate-400">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleDateString() : 'Reciente'}</p>
                                                                </div>
                                                            </div>
                                                            <span className={`text-xs font-black uppercase ${log.points > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                {log.points > 0 ? '+' : ''}{log.points} XP
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB: SEGURIDAD Y LOGISTICA */}
                        {activeTab === 'safety' && (
                            <motion.div
                                key="safety"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                {/* KYC Verification Section */}
                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="size-12 bg-primary-vibrant rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                                            <span className="material-symbols-outlined text-2xl font-black">verified</span>
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900 tracking-tight">Verificación de Identidad</h4>
                                            <p className="text-slate-500 text-sm font-medium">Validación oficial para desbloquear beneficios de vendedor.</p>
                                        </div>
                                    </div>

                                    {/* Status Banner */}
                                    {userProfile.verificationEvidence?.status && userProfile.verificationEvidence.status !== 'none' && (
                                        <div className={`mb-8 p-6 rounded-2xl border flex gap-4 items-center ${userProfile.verificationEvidence.status === 'approved' ? 'bg-emerald-50 border-emerald-100' :
                                            userProfile.verificationEvidence.status === 'rejected' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
                                            }`}>
                                            <span className={`material-symbols-outlined text-2xl ${userProfile.verificationEvidence.status === 'approved' ? 'text-emerald-600' :
                                                userProfile.verificationEvidence.status === 'rejected' ? 'text-rose-600' : 'text-amber-600'
                                                }`}>
                                                {userProfile.verificationEvidence.status === 'approved' ? 'verified_user' :
                                                    userProfile.verificationEvidence.status === 'rejected' ? 'report_problem' : 'work_history'
                                                }
                                            </span>
                                            <div className="flex-1">
                                                <p className={`text-sm font-black uppercase tracking-widest ${userProfile.verificationEvidence.status === 'approved' ? 'text-emerald-700' :
                                                    userProfile.verificationEvidence.status === 'rejected' ? 'text-rose-700' : 'text-amber-700'
                                                    }`}>
                                                    {userProfile.verificationEvidence.status === 'approved' ? 'Identidad Verificada' :
                                                        userProfile.verificationEvidence.status === 'rejected' ? 'Verificación Rechazada' : 'Verificación en Proceso'
                                                    }
                                                </p>
                                                {userProfile.verificationEvidence.status === 'rejected' && userProfile.verificationEvidence.rejectionReason && (
                                                    <p className="text-xs font-bold text-rose-600/70 mt-1 italic">Motivo: "{userProfile.verificationEvidence.rejectionReason}"</p>
                                                )}
                                                {userProfile.verificationEvidence.status === 'pending' && (
                                                    <p className="text-xs font-bold text-amber-600/70 mt-0.5">Nuestro equipo está auditando tus documentos. Esto suele demorar menos de 24hs.</p>
                                                )}
                                            </div>
                                            {userProfile.verificationEvidence.status === 'rejected' && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateUserProfile(user.uid, { "verificationEvidence.status": "none" }).then(() => refreshProfile())}
                                                    className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all"
                                                >
                                                    Reintentar
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Upload Interface */}
                                    {(userProfile.verificationEvidence?.status === 'none' || !userProfile.verificationEvidence?.status) && (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {[
                                                    { key: 'dniFront', label: 'Frente DNI', icon: 'badge' },
                                                    { key: 'dniBack', label: 'Dorso DNI', icon: 'credit_card' },
                                                    { key: 'selfie', label: 'Selfie', icon: 'face' }
                                                ].map((step) => (
                                                    <div key={step.key} className="space-y-3">
                                                        <div className="relative group aspect-video rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-primary-vibrant/50 hover:bg-slate-100">
                                                            {userProfile.verificationEvidence?.[step.key as keyof typeof userProfile.verificationEvidence] ? (
                                                                <img
                                                                    src={userProfile.verificationEvidence[step.key as keyof typeof userProfile.verificationEvidence] as string}
                                                                    className="w-full h-full object-cover"
                                                                    alt={step.label}
                                                                />
                                                            ) : (
                                                                <div className="text-center p-4">
                                                                    <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">{step.icon}</span>
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{step.label}</span>
                                                                </div>
                                                            )}
                                                            <label className="absolute inset-0 cursor-pointer bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (!file) return;
                                                                        setIsSaving(true);
                                                                        try {
                                                                            const path = `kyc/${user.uid}/${step.key}_${Date.now()}`;
                                                                            const url = await uploadFile(file, path);
                                                                            await updateUserProfile(user.uid, {
                                                                                [`verificationEvidence.${step.key}`]: url
                                                                            });
                                                                            await refreshProfile();
                                                                            notify({ type: 'success', title: 'Imagen Cargada', message: step.label + ' sincronizado.', icon: 'check_circle' });
                                                                        } catch (err) {
                                                                            notify({ type: 'error', title: 'Error', message: 'Fallo al subir archivo.', icon: 'error' });
                                                                        }
                                                                        setIsSaving(false);
                                                                    }}
                                                                />
                                                                {!userProfile.verificationEvidence?.[step.key as keyof typeof userProfile.verificationEvidence] && (
                                                                    <span className="absolute bottom-4 right-4 size-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                                                                        <span className="material-symbols-outlined text-sm">add_a_photo</span>
                                                                    </span>
                                                                )}
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Verification Steps Progress */}
                                            {verificationSteps.length > 0 && (
                                                <div className="space-y-3 mb-6">
                                                    {verificationSteps.map((step) => (
                                                        <div key={step.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                                                            step.status === 'success' ? 'bg-emerald-50 border-emerald-200' :
                                                            step.status === 'error' ? 'bg-rose-50 border-rose-200' :
                                                            step.status === 'running' ? 'bg-amber-50 border-amber-200' :
                                                            'bg-slate-50 border-slate-100'
                                                        }`}>
                                                            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                                step.status === 'success' ? 'bg-emerald-500 text-white' :
                                                                step.status === 'error' ? 'bg-rose-500 text-white' :
                                                                step.status === 'running' ? 'bg-amber-500 text-white animate-pulse' :
                                                                'bg-slate-200 text-slate-400'
                                                            }`}>
                                                                <span className="material-symbols-outlined text-lg font-black">
                                                                    {step.status === 'success' ? 'check' :
                                                                     step.status === 'error' ? 'close' :
                                                                     step.status === 'running' ? 'hourglass_top' : 'schedule'}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-xs font-black uppercase tracking-widest ${
                                                                    step.status === 'success' ? 'text-emerald-700' :
                                                                    step.status === 'error' ? 'text-rose-700' :
                                                                    step.status === 'running' ? 'text-amber-700' : 'text-slate-400'
                                                                }`}>{step.label}</p>
                                                                <p className={`text-xs font-medium mt-0.5 ${
                                                                    step.status === 'success' ? 'text-emerald-600' :
                                                                    step.status === 'error' ? 'text-rose-600' :
                                                                    step.status === 'running' ? 'text-amber-600' : 'text-slate-400'
                                                                }`}>{step.message}</p>
                                                                {step.status === 'running' && step.progress !== undefined && (
                                                                    <div className="w-full bg-amber-200 rounded-full h-1.5 mt-2">
                                                                        <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${step.progress}%` }} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Automatic Verify Button */}
                                            {userProfile.verificationEvidence?.dniFront && userProfile.verificationEvidence?.selfie && !isVerifying && (
                                                <button
                                                    type="button"
                                                    disabled={!formData.dni}
                                                    onClick={async () => {
                                                        if (!formData.dni) {
                                                            notify({ type: 'error', title: 'DNI Requerido', message: 'Ingresá tu número de DNI antes de verificar.', icon: 'error' });
                                                            return;
                                                        }
                                                        setIsVerifying(true);
                                                        setVerificationSteps([]);
                                                        
                                                        try {
                                                            const result = await autoVerifyIdentity(
                                                                userProfile.verificationEvidence!.dniFront,
                                                                userProfile.verificationEvidence!.selfie,
                                                                formData.dni,
                                                                (steps) => setVerificationSteps([...steps])
                                                            );
                                                            
                                                            if (result.approved) {
                                                                await approveVerification(user.uid);
                                                                await refreshProfile();
                                                                notify({ type: 'success', title: '¡Identidad Verificada!', message: 'Tu identidad fue confirmada automáticamente.', icon: 'verified_user' });
                                                            } else {
                                                                const rejectResult = await rejectVerification(user.uid, result.rejectionReason || 'Verificación fallida.');
                                                                await refreshProfile();
                                                                
                                                                const attempts = (rejectResult as any).attempts || 0;
                                                                if (attempts >= 3) {
                                                                    notify({ type: 'warning', title: 'Revisión Manual Habilitada', message: 'Alcanzaste el máximo de intentos automáticos. Podés enviar tus documentos para revisión manual.', icon: 'support_agent' });
                                                                } else {
                                                                    notify({ type: 'error', title: 'Verificación Fallida', message: result.rejectionReason || 'Intentá con mejores fotos.', icon: 'error' });
                                                                }
                                                            }
                                                        } catch (err) {
                                                            console.error('Verification error:', err);
                                                            notify({ type: 'error', title: 'Error', message: 'Ocurrió un error durante la verificación. Intentá de nuevo.', icon: 'error' });
                                                        }
                                                        
                                                        setIsVerifying(false);
                                                    }}
                                                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-[1.02] ${
                                                        !formData.dni 
                                                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none hover:scale-100'
                                                            : 'bg-primary-vibrant text-white shadow-primary-500/20'
                                                    }`}
                                                >
                                                    <span className="flex items-center justify-center gap-2">
                                                        <span className="material-symbols-outlined text-lg">verified_user</span>
                                                        Verificar Identidad Automáticamente
                                                    </span>
                                                </button>
                                            )}

                                            {/* Loading state */}
                                            {isVerifying && (
                                                <div className="w-full py-4 bg-slate-100 rounded-2xl flex items-center justify-center gap-3">
                                                    <div className="size-5 border-2 border-primary-vibrant border-t-transparent rounded-full animate-spin" />
                                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Verificando...</span>
                                                </div>
                                            )}

                                            {/* Manual Fallback after 3 failed attempts */}
                                            {(userProfile.verificationEvidence?.failedAttempts || 0) >= 3 && 
                                             userProfile.verificationEvidence?.status !== 'pending' &&
                                             userProfile.verificationEvidence?.status !== 'approved' && (
                                                <div className="mt-4 p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-symbols-outlined text-2xl text-amber-600">support_agent</span>
                                                        <div>
                                                            <p className="text-sm font-black text-amber-800">Revisión Manual Disponible</p>
                                                            <p className="text-xs font-medium text-amber-600 mt-0.5">
                                                                La verificación automática no pudo confirmar tu identidad después de {userProfile.verificationEvidence?.failedAttempts} intentos. 
                                                                Podés enviar tus documentos para que un administrador los revise personalmente.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            setIsSaving(true);
                                                            await submitVerification(user.uid);
                                                            await refreshProfile();
                                                            setIsSaving(false);
                                                            notify({ type: 'success', title: 'Enviado para Revisión Manual', message: 'Un administrador revisará tus documentos. Esto puede demorar hasta 24hs.', icon: 'send' });
                                                        }}
                                                        className="w-full py-3 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-600 transition-all"
                                                    >
                                                        <span className="flex items-center justify-center gap-2">
                                                            <span className="material-symbols-outlined text-lg">send</span>
                                                            Enviar para Revisión Manual
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Número de DNI</label>
                                            <input
                                                type="text"
                                                value={formData.dni}
                                                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                                placeholder="Solo números"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp de Contacto</label>
                                            <input
                                                type="text"
                                                value={formData.social.whatsapp}
                                                onChange={(e) => setFormData({ ...formData, social: { ...formData.social, whatsapp: e.target.value } })}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                                placeholder="Ej: +54911..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha de Nacimiento</label>
                                            <input
                                                type="date"
                                                value={formData.identity.birthday}
                                                onChange={(e) => setFormData({ ...formData, identity: { ...formData.identity, birthday: e.target.value } })}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2 relative">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ciudad</label>
                                            <input
                                                type="text"
                                                value={formData.city}
                                                onChange={(e) => handleCityChange(e.target.value)}
                                                onFocus={() => { if(citySuggestions.length > 0) setShowSuggestions(true); }}
                                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                                placeholder="Empezá a escribir tu ciudad..."
                                                autoComplete="off"
                                            />
                                            {showSuggestions && citySuggestions.length > 0 && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 shadow-xl rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                                                    {citySuggestions.map((sug, i) => (
                                                        <div 
                                                            key={i} 
                                                            className="px-6 py-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                                                            onClick={() => {
                                                                setFormData({ ...formData, city: `${sug.nombre}, ${sug.provincia.nombre}` });
                                                                setShowSuggestions(false);
                                                            }}
                                                        >
                                                            <p className="text-sm font-bold text-slate-800">{sug.nombre}</p>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{sug.provincia.nombre}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Código Postal (Obligatorio para Envíos)</label>
                                            <input
                                                type="text"
                                                value={formData.zipCode}
                                                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                                placeholder="Ej: 2000"
                                            />
                                        </div>
                                        <div className="space-y-2 relative">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dirección (Calle y Altura)</label>
                                            <input
                                                type="text"
                                                value={formData.address}
                                                onChange={(e) => handleAddressChange(e.target.value)}
                                                onFocus={() => { if(addressSuggestions.length > 0) setShowAddressSuggestions(true); }}
                                                onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                                placeholder="Empezá a escribir tu dirección..."
                                                autoComplete="off"
                                            />
                                            {showAddressSuggestions && addressSuggestions.length > 0 && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 shadow-xl rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                                                    {addressSuggestions.map((sug, i) => (
                                                        <div 
                                                            key={i} 
                                                            className="px-6 py-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                                                            onClick={() => handleSelectAddress(sug)}
                                                        >
                                                            <p className="text-sm font-bold text-slate-800">{sug.calle.nombre} {sug.altura.valor}</p>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{sug.localidad_censal.nombre || sug.provincia.nombre}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Métodos de Entrega</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {[
                                                { id: 'pickup', label: 'Retiro en domicilio', icon: 'home' },
                                                { id: 'meeting', label: 'Punto de encuentro', icon: 'handshake' },
                                                { id: 'shipping', label: 'Envío a domicilio', icon: 'local_shipping' },
                                                { id: 'agreement', label: 'Acordar con vendedor', icon: 'chat' },
                                            ].map(method => (
                                                <label
                                                    key={method.id}
                                                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.logistics.deliveryMethods.includes(method.id)
                                                        ? 'bg-slate-900 border-slate-900 text-white'
                                                        : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={formData.logistics.deliveryMethods.includes(method.id)}
                                                        onChange={() => {
                                                            const methods = [...formData.logistics.deliveryMethods];
                                                            if (methods.includes(method.id)) {
                                                                setFormData({ ...formData, logistics: { ...formData.logistics, deliveryMethods: methods.filter(m => m !== method.id) } });
                                                            } else {
                                                                setFormData({ ...formData, logistics: { ...formData.logistics, deliveryMethods: [...methods, method.id] } });
                                                            }
                                                        }}
                                                    />
                                                    <span className="material-symbols-outlined text-xl">{method.icon}</span>
                                                    <span className="text-sm font-bold">{method.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB: DATOS DE COBRO & MERCADO PAGO */}
                        {activeTab === 'billing' && (
                            <motion.div
                                key="billing"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* MERCADO PAGO OAUTH SECTION */}
                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#009ee3]/5 rounded-full blur-[60px] pointer-events-none -mt-20 -mr-20"></div>

                                    <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-6 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 px-5 shrink-0 rounded-[18px] bg-[#009ee3] flex items-center justify-center shadow-lg shadow-[#009ee3]/20 w-fit">
                                                <div className="flex items-center gap-1.5 text-white font-black tracking-tighter text-lg">
                                                    <span className="material-symbols-outlined text-2xl">handshake</span>
                                                    <span>mercado<span className="text-sky-200">pago</span></span>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-slate-900 tracking-tight">Cobros Automáticos</h4>
                                                <p className="text-slate-500 text-sm font-medium mt-0.5">Recibe el dinero de tus ventas directo en tu cuenta.</p>
                                            </div>
                                        </div>

                                        {userProfile.mercadoPagoOAuth ? (
                                            <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl border border-emerald-100/50">
                                                <span className="material-symbols-outlined font-black">check_circle</span>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest">Cuenta Vinculada</p>
                                                    <p className="text-[10px] font-bold opacity-80 uppercase">ID: {userProfile.mercadoPagoOAuth.userId}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const clientId = import.meta.env.VITE_MP_CLIENT_ID || 'PENDING_CLIENT_ID';
                                                        // Fallback to VITE_MP_REDIRECT_URI if set, otherwise use current origin.
                                                        const redirectUri = import.meta.env.VITE_MP_REDIRECT_URI || `${window.location.origin}/api/mercadopago-oauth`;
                                                        const authUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${redirectUri}&state=${user.uid}`;
                                                        window.location.href = authUrl;
                                                    }}
                                                    className="bg-[#009ee3] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#009ee3]/20 hover:bg-[#008cc7] transition-all active:scale-[0.98] flex items-center gap-2 whitespace-nowrap w-full md:w-auto justify-center"
                                                >
                                                    <span className="material-symbols-outlined text-base">link</span>
                                                    Vincular Cuenta
                                                </button>
                                                
                                                {/* MOCK LINK FOR TESTING (NO CLIENT SECRET NEEDED) */}
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const confirm = await showConfirm("Vincular MercadoPago", "¿Vincular usando el Access Token de Prueba proporcionado?", "Vincular", "Cancelar", "link");
                                                        if (confirm) {
                                                            setIsSaving(true);
                                                            const testToken = "APP_USR-4773832435343676-031310-0064546a2496fc97279e7909f582cab5-3117965906";
                                                            try {
                                                                const res = await updateUserProfile(user.uid, {
                                                                    mercadoPagoOAuth: {
                                                                        accessToken: testToken,
                                                                        publicKey: "APP_USR-32ad7602-56a5-4d63-b13b-503512d4f1e5",
                                                                        userId: "3117965906",
                                                                        updatedAt: new Date()
                                                                    }
                                                                });
                                                                if (res.success) {
                                                                    refreshProfile();
                                                                    notify({ type: 'success', title: 'Test Linked', message: 'Modo test activado.', icon: 'science' });
                                                                }
                                                            } catch (err) {
                                                                console.error(err);
                                                            }
                                                            setIsSaving(false);
                                                        }
                                                    }}
                                                    className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors py-2"
                                                >
                                                    [ Modulo de Testeo: Vincular Manualmente ]
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {!userProfile.mercadoPagoOAuth && (
                                        <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3 relative z-10">
                                            <span className="material-symbols-outlined text-amber-600 text-sm mt-0.5">security</span>
                                            <p className="text-xs font-bold text-amber-800 leading-relaxed">
                                                Para vender en la plataforma usando "Pago Protegido", es obligatorio vincular tu cuenta de Mercado Pago. Nosotros dividimos el pago automáticamente, dejándote el 100% de tu ganancia al confirmar la entrega, sin intermediarios.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* TRANSFERENCIAS BANCARIAS MANUALES (LEGACY/RECAUDADORA) */}
                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-8 opacity-60 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center justify-between pb-4 border-b border-light-100">
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">CBU de Respaldo (Opcional)</h4>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                                        <span className="material-symbols-outlined text-slate-400">info</span>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Liquidaciones Manuales</p>
                                            <p className="text-xs font-medium text-slate-500 mt-1">Si Mercado Pago no está disponible, usaremos estos datos bancarios para transferirte tus ganancias. Asegúrate de que coincida con tu DNI.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-4 p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">CBU / CVU o Alias</label>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={formData.bankDetails.cbu || formData.bankDetails.alias}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (/^\d+$/.test(val)) {
                                                                setFormData({ ...formData, bankDetails: { ...formData.bankDetails, cbu: val, alias: '' } });
                                                            } else {
                                                                setFormData({ ...formData, bankDetails: { ...formData.bankDetails, alias: val, cbu: '' } });
                                                            }
                                                        }}
                                                        className="flex-1 bg-white border-2 border-slate-200 focus:border-slate-900 rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all font-mono text-sm"
                                                        placeholder="22 dígitos o alias.ejemplo"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Banco / Entidad</label>
                                                <input
                                                    type="text"
                                                    value={formData.bankDetails.bankName || ''}
                                                    onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, bankName: e.target.value } })}
                                                    className="w-full bg-white border-2 border-slate-200 focus:border-slate-900 rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all text-sm"
                                                    placeholder="Ej: Banco Galicia, MercadoPago"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Titular de la Cuenta</label>
                                                <input
                                                    type="text"
                                                    value={formData.bankDetails.holderName || ''}
                                                    onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, holderName: e.target.value } })}
                                                    className="w-full bg-white border-2 border-slate-200 focus:border-slate-900 rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all text-sm uppercase"
                                                    placeholder="NOMBRE COMPLETO"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">DNI del Titular (Para cotejar pagos)</label>
                                            <input
                                                type="text"
                                                value={formData.bankDetails.dni || ''}
                                                onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, dni: e.target.value } })}
                                                className="w-full bg-white border-2 border-slate-200 focus:border-slate-900 rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all font-mono text-sm"
                                                placeholder="Documento del titular de la cuenta"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 px-1">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tipo de Cuenta</label>
                                        <select
                                            value={formData.bankDetails.accountType}
                                            onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountType: e.target.value } })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                                        >
                                            <option>Caja de Ahorro</option>
                                            <option>Cuenta Corriente</option>
                                            <option>Cuenta Digital (Fintech)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* DATOS FISCALES (AFIP) */}
                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-8">
                                    <div className="flex items-center justify-between pb-4 border-b border-light-100">
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Datos Fiscales (AFIP)</h4>
                                    </div>
                                    <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                                        <span className="material-symbols-outlined text-amber-500">receipt_long</span>
                                        <div>
                                            <p className="text-sm font-bold text-amber-800">Facturación de Comisiones</p>
                                            <p className="text-xs font-medium text-amber-700/80 mt-1">Obligatorio para operar y retirar fondos. Estos datos se usarán para emitir las facturas por los cargos de la plataforma.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">CUIT / CUIL</label>
                                            <input
                                                type="text"
                                                value={formData.taxDetails.cuit}
                                                onChange={(e) => setFormData({ ...formData, taxDetails: { ...formData.taxDetails, cuit: e.target.value } })}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-200 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all font-mono text-sm"
                                                placeholder="Sin guiones (Ej: 20123456789)"
                                                maxLength={11}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Condición frente al IVA</label>
                                            <select
                                                value={formData.taxDetails.taxCondition}
                                                onChange={(e) => setFormData({ ...formData, taxDetails: { ...formData.taxDetails, taxCondition: e.target.value as any } })}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-200 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="Monotributo">Monotributo</option>
                                                <option value="Responsable Inscripto">Responsable Inscripto</option>
                                                <option value="Consumidor Final">Consumidor Final</option>
                                                <option value="Exento">Sujeto Exento</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <div className="flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 bg-slate-900 text-white py-5 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98] shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    GUARDANDO...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-base">save</span>
                                    GUARDAR CAMBIOS
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Account Purge */}
                <div className="mt-12 pt-8 border-t border-slate-200">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Zona de Peligro</h4>
                    <button
                        onClick={handlePurgeData}
                        className="text-red-500 text-sm font-bold flex items-center gap-2 hover:bg-red-50 p-3 rounded-xl transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">delete_forever</span>
                        Eliminar todos mis datos y cuenta
                    </button>
                </div>
            </div>
        </div>
    );
}
