import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { publishItem, getProduct, updateItem } from '../../lib/items';
import { CATEGORIES } from '../../lib/constants';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../lib/auth';
import { getPlatformSettings, PlatformSettings } from '../../lib/settings';
import { Timestamp } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';

const StepContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
        {children}
    </div>
);

const Card = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 tracking-tight">{title}</h3>
        {children}
    </div>
);

export default function Publish() {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const { user, userProfile } = useAuth();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');

    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [imageUrlInput, setImageUrlInput] = useState('');

    const [form, setForm] = useState({
        title: '',
        price: '',
        oldPrice: '',
        cost: '',
        showPriceInStore: true,
        description: '',
        masterCategory: CATEGORIES[0].name,
        category: CATEGORIES[0].categories[0].name,
        subcategory: '',
        condition: 'new' as const,
        brand: '',
        color: [] as string[],
        size: [] as string[],
        videoUrl: '',
        hasInfiniteStock: false,
        quantity: 1,
        sku: '',
        barcode: '',
        weight: 1,
        length: 10,
        width: 10,
        height: 10,
        prodWeight: '' as string,
        prodLength: '' as string,
        prodWidth: '' as string,
        prodHeight: '' as string,
        mpn: '',
        ageRange: '',
        gender: '',
        tags: '',
        seoTitle: '',
        seoDescription: '',
        productUrlSlug: '',
        shippingAvailable: true,
        deliveryMethods: ['en_mano'] as string[],
        isFeatured: false,
        isFlashSale: false
    });

    const [settings, setSettings] = useState<PlatformSettings | null>(null);

    React.useEffect(() => {
        getPlatformSettings().then(setSettings);
    }, []);

    React.useEffect(() => {
        if (editId) {
            setLoading(true);
            getProduct(editId).then(item => {
                if (item) {
                    setForm({
                        title: item.title || '',
                        price: item.price ? item.price.toLocaleString('es-AR') : '',
                        oldPrice: item.oldPrice ? item.oldPrice.toLocaleString('es-AR') : '',
                        cost: item.cost ? item.cost.toLocaleString('es-AR') : '',
                        showPriceInStore: item.showPriceInStore !== undefined ? item.showPriceInStore : true,
                        description: item.description || '',
                        masterCategory: item.masterCategory || CATEGORIES[0].name,
                        category: item.category || CATEGORIES[0].categories[0].name,
                        subcategory: item.subcategory || '',
                        condition: item.condition || 'new',
                        brand: item.brand || '',
                        color: Array.isArray(item.color) ? item.color : (item.color ? [item.color] : []),
                        size: Array.isArray(item.size) ? item.size : (item.size ? [item.size] : []),
                        videoUrl: item.videoUrl || '',
                        hasInfiniteStock: item.hasInfiniteStock || false,
                        quantity: item.quantity || 1,
                        sku: item.sku || '',
                        barcode: item.barcode || '',
                        weight: item.weight || 1,
                        length: item.dimensions?.length || 10,
                        width: item.dimensions?.width || 10,
                        height: item.dimensions?.height || 10,
                        prodWeight: item.productDimensions?.weight?.toString() || '',
                        prodLength: item.productDimensions?.length?.toString() || '',
                        prodWidth: item.productDimensions?.width?.toString() || '',
                        prodHeight: item.productDimensions?.height?.toString() || '',
                        mpn: item.mpn || '',
                        ageRange: item.ageRange || '',
                        gender: item.gender || '',
                        tags: (item.tags || []).join(', '),
                        seoTitle: item.seoTitle || '',
                        seoDescription: item.seoDescription || '',
                        productUrlSlug: item.productUrlSlug || '',
                        shippingAvailable: item.shippingAvailable !== undefined ? item.shippingAvailable : true,
                        deliveryMethods: item.deliveryMethods || ['en_mano'],
                        isFeatured: item.isFeatured || false,
                        isFlashSale: item.isFlashSale || false,
                    });
                    setExistingImages(item.images || []);
                    setPreviews(item.images || []);
                }
                setLoading(false);
            });
        }
    }, [editId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        if (name === 'category') {
            setForm(prev => ({ ...prev, category: val as string, subcategory: '' }));
        } else {
            setForm(prev => ({ ...prev, [name]: val }));
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1280, useWebWorker: true };
            setLoading(true);
            setUploadProgress('Comprimiendo fotos...');
            try {
                const compressedFiles = await Promise.all(
                    files.map(async (file: File) => {
                        if (file.size / 1024 / 1024 < 1) return file;
                        return await imageCompression(file, options);
                    })
                );
                setSelectedFiles(prev => [...prev, ...compressedFiles as File[]]);
                const newPreviews = compressedFiles.map(file => URL.createObjectURL(file as Blob));
                setPreviews(prev => [...prev, ...newPreviews]);
                notify({ type: 'success', title: 'Fotos optimizadas', message: 'Imágenes comprimidas para carga rápida.', icon: 'speed' });
            } catch (error) {
                notify({ type: 'error', title: 'Error', message: 'No pudimos procesar las fotos.', icon: 'error' });
            } finally {
                setLoading(false);
                setUploadProgress('');
            }
        }
    };

    const removeFile = (index: number) => {
        if (index < existingImages.length) {
            setExistingImages(prev => prev.filter((_, i) => i !== index));
        } else {
            const selectedFilesIndex = index - existingImages.length;
            setSelectedFiles(prev => prev.filter((_, i) => i !== selectedFilesIndex));
        }
        setPreviews(prev => {
            const updated = prev.filter((_, i) => i !== index);
            if (index >= existingImages.length) {
                URL.revokeObjectURL(prev[index]);
            }
            return updated;
        });
    };

    const handleAddImageUrl = (e?: React.MouseEvent | React.FormEvent) => {
        if (e) e.preventDefault();
        if (!imageUrlInput || !imageUrlInput.trim().startsWith('http')) {
            notify({ type: 'warning', title: 'URL inválida', message: 'Por favor ingresa un link válido que comience con http:// o https://', icon: 'link' });
            return;
        }
        const cleanUrl = imageUrlInput.trim();
        setExistingImages(prev => [...prev, cleanUrl]);
        setPreviews(prev => [...prev, cleanUrl]);
        setImageUrlInput('');
        notify({ type: 'success', title: 'Foto agregada', message: 'Se vinculó la imagen externa correctamente.', icon: 'check_circle' });
    };

    const parsePrice = (priceStr: string) => {
        if (!priceStr || priceStr.trim() === '') return null;
        const cleanPrice = priceStr.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleanPrice);
        return (!isNaN(parsed) && parsed > 0) ? parsed : null;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);

        try {
            if (!form.title || !form.price) {
                notify({ type: 'warning', title: 'Datos Faltantes', message: 'Título y precio de venta son obligatorios.', icon: 'edit' });
                return;
            }

            const parsedPrice = parsePrice(form.price);
            if (!parsedPrice) {
                notify({ type: 'warning', title: 'Precio Inválido', message: 'Ingresa un precio de venta válido.', icon: 'payments' });
                return;
            }

            const parsedOldPrice = parsePrice(form.oldPrice);
            const parsedCost = parsePrice(form.cost);

            if (!user) {
                notify({ type: 'error', title: 'Acceso Denegado', message: 'Debes iniciar sesión para publicar ítems.', icon: 'lock' });
                return;
            }

            const uploadedImages: string[] = [];
            for (let i = 0; i < selectedFiles.length; i++) {
                setUploadProgress(`Simulando subida (${i + 1}/${selectedFiles.length})...`);
                uploadedImages.push(`https://picsum.photos/600/600?random=${Date.now() + i}`);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            setUploadProgress('Finalizando...');

            let result;
            const finalImages = [...existingImages, ...uploadedImages];
            const sellerLocation = userProfile?.location ? `${userProfile.location.city}, ${userProfile.location.state}` : undefined;

            let prodDims = (form.prodWeight || form.prodLength || form.prodWidth || form.prodHeight) ? {
                weight: parseFloat(form.prodWeight) || undefined,
                length: parseFloat(form.prodLength) || undefined,
                width: parseFloat(form.prodWidth) || undefined,
                height: parseFloat(form.prodHeight) || undefined
            } : undefined;
            if (prodDims) prodDims = JSON.parse(JSON.stringify(prodDims));

            const tagsArray = form.tags.split(',').map(t => t.trim()).filter(t => t !== '');

            const payload = {
                title: form.title,
                price: parsedPrice,
                oldPrice: parsedOldPrice !== null ? parsedOldPrice : (null as any),
                cost: parsedCost !== null ? parsedCost : (null as any),
                showPriceInStore: form.showPriceInStore,
                description: form.description,
                masterCategory: form.masterCategory,
                category: form.category,
                subcategory: form.subcategory,
                condition: form.condition as any,
                brand: form.brand,
                color: form.color,
                size: form.size,
                videoUrl: form.videoUrl,
                hasInfiniteStock: form.hasInfiniteStock,
                quantity: form.hasInfiniteStock ? 1 : (form.quantity || 1),
                sku: form.sku,
                barcode: form.barcode,
                mpn: form.mpn,
                ageRange: form.ageRange,
                gender: form.gender,
                tags: tagsArray,
                seoTitle: form.seoTitle,
                seoDescription: form.seoDescription,
                productUrlSlug: form.productUrlSlug,
                ...(prodDims && Object.keys(prodDims).length > 0 && { productDimensions: prodDims }),
                shippingAvailable: form.deliveryMethods.some(m => ['correo_argentino', 'domicilio'].includes(m)),
                deliveryMethods: form.deliveryMethods,
                weight: form.weight,
                dimensions: { length: form.length, width: form.width, height: form.height },
                images: finalImages.length > 0 ? finalImages : ["https://picsum.photos/400/400?random=1"],
                isFlashSale: form.isFlashSale,
                ...(sellerLocation && { location: sellerLocation })
            };

            if (editId) {
                const updateResult = await updateItem(editId, payload);
                result = { success: updateResult.success, id: editId };
            } else {
                let featuredUntil: Timestamp | null = null;
                if (form.isFeatured && settings) {
                    const expirationDate = new Date();
                    expirationDate.setHours(expirationDate.getHours() + settings.featuredDurationHours);
                    featuredUntil = Timestamp.fromDate(expirationDate);
                }

                result = await publishItem({
                    ...payload,
                    sellerId: user.uid,
                    sellerName: userProfile?.name || user.displayName || 'Vendedor',
                    views: 0,
                    isFeatured: form.isFeatured,
                    featuredUntil: featuredUntil,
                    featuredFeeApplied: form.isFeatured ? 0.05 : 0,
                    flashSaleFeeApplied: form.isFlashSale ? 0.10 : 0
                });
            }

            if (result.success) {
                notify({ type: 'success', title: editId ? 'Actualizado' : '¡Publicado!', message: editId ? 'Tu publicación ha sido actualizada.' : 'Tu ítem ya está en el marketplace.', icon: 'rocket_launch' });
                navigate(editId ? '/dashboard' : `/product/${result.id}`);
            } else {
                notify({ type: 'error', title: 'Error', message: 'Fallo al guardar en la base de datos.', icon: 'cloud_off' });
            }
        } catch (error: any) {
            notify({ type: 'error', title: 'Error Crítico', message: error.message || 'Ocurrió un fallo inesperado al publicar.', icon: 'bug_report' });
        } finally {
            setLoading(false);
            setUploadProgress('');
        }
    };

    const [step, setStep] = useState(1);
    const nextStep = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); setStep(prev => prev + 1); };
    const prevStep = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); setStep(prev => prev - 1); };

    const hasMercadoPago = !!userProfile?.mercadoPagoOAuth;

    if (user && !user.emailVerified) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-6 animate-in fade-in duration-500 font-body">
                <div className="bg-surface rounded-3xl shadow-sm border border-outline-variant/30 p-8 lg:p-12 max-w-lg text-center overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[60px] pointer-events-none -mt-20 -mr-20"></div>
                    <div className="size-24 bg-amber-100 text-amber-500 rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-500/10 relative z-10 p-4">
                        <span className="material-symbols-outlined text-4xl">mark_email_unread</span>
                    </div>
                    <h2 className="text-3xl font-black text-primary tracking-tighter mb-4 uppercase relative z-10 font-headline">Verificá tu Mail</h2>
                    <p className="text-sm font-bold text-on-surface-variant mb-8 leading-relaxed relative z-10">
                        Para empezar a publicar productos, primero debes verificar tu cuenta de correo electrónico.
                    </p>
                    <button onClick={() => navigate('/')} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all flex items-center justify-center gap-3 relative z-10">
                        <span className="material-symbols-outlined text-sm">home</span> Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    if (userProfile && !hasMercadoPago) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-6 animate-in fade-in duration-500 font-body">
                <div className="bg-surface rounded-3xl shadow-sm border border-outline-variant/30 p-8 lg:p-12 max-w-lg text-center overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#009ee3]/5 rounded-full blur-[60px] pointer-events-none -mt-20 -mr-20"></div>
                    <div className="h-14 px-8 w-fit shrink-0 bg-[#009ee3] rounded-[20px] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#009ee3]/20 relative z-10">
                        <div className="flex items-center gap-1.5 text-white font-black tracking-tighter text-xl">
                            <span className="material-symbols-outlined text-3xl">handshake</span>
                            <span>mercado<span className="text-sky-200">pago</span></span>
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-primary tracking-tighter mb-4 uppercase relative z-10 font-headline">Vinculá tu Cuenta</h2>
                    <p className="text-sm font-bold text-on-surface-variant mb-8 leading-relaxed relative z-10">
                        Para operar con Pago Protegido de forma automática, debes vincular tu cuenta de Mercado Pago.
                    </p>
                    <button onClick={() => navigate('/settings')} className="w-full bg-[#009ee3] text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#008cc7] transition-all flex items-center justify-center gap-3 relative z-10">
                        <span className="material-symbols-outlined text-sm">link</span> Vincular Cuenta Ahora
                    </button>
                </div>
            </div>
        );
    }



    // Calcular margen de ganancia
    const p = parsePrice(form.price) || 0;
    const c = parsePrice(form.cost) || 0;
    const profitMargin = (p > 0 && c > 0) ? (((p - c) / c) * 100).toFixed(2) : '--';

    return (
        <div className="bg-slate-50 min-h-screen font-body pb-20">
            {/* Cabecera superior fija o pegajosa estilo dashboard */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">{editId ? 'Editar producto' : 'Nuevo producto'}</h1>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 text-sm hover:bg-slate-50 transition-colors">
                        Cancelar
                    </button>
                    {step === 4 ? (
                        <button onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 rounded-xl bg-indigo-600 font-bold text-white text-sm hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                            {loading && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                            {loading ? (uploadProgress || 'Guardando...') : 'Guardar producto'}
                        </button>
                    ) : (
                        <button onClick={nextStep} className="px-5 py-2.5 rounded-xl bg-slate-900 font-bold text-white text-sm hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2">
                            Siguiente <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-10">
                {/* Wizard Stepper Moderno */}
                <div className="flex justify-between items-center mb-10 relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0"></div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 rounded-full z-0 transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
                    
                    {[1, 2, 3, 4].map(i => (
                        <button key={i} onClick={() => setStep(i)} className={`relative z-10 flex flex-col items-center gap-2 outline-none group`}>
                            <div className={`size-10 rounded-full flex items-center justify-center font-black text-sm border-4 transition-all duration-300 ${step === i ? 'bg-indigo-600 border-indigo-100 text-white shadow-md scale-110' : step > i ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400 group-hover:border-indigo-300'}`}>
                                {step > i ? <span className="material-symbols-outlined text-sm font-black">check</span> : i}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest absolute -bottom-6 w-24 text-center transition-colors ${step === i ? 'text-indigo-600' : 'text-slate-400'}`}>
                                {i === 1 ? 'Básico' : i === 2 ? 'Media' : i === 3 ? 'Precio' : 'Envíos'}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="mt-16">
                    {step === 1 && (
                        <StepContainer>
                            <Card title="Nombre y descripción">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Nombre</label>
                                        <input
                                            name="title" value={form.title} onChange={handleChange}
                                            placeholder="Ej: Campera de cuero"
                                            className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <label className="block text-xs font-bold text-slate-600">Descripción</label>
                                        </div>
                                        <textarea
                                            name="description" value={form.description} onChange={handleChange}
                                            placeholder="Detalla las características de tu producto..."
                                            className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 min-h-[160px] font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y placeholder:text-slate-400"
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card title="Categorías">
                                <p className="text-xs text-slate-500 mb-6">Ayudá a tus clientes a encontrar más rápido tus productos.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Rubro</label>
                                        <select
                                            name="masterCategory" value={form.masterCategory || CATEGORIES[0].name}
                                            onChange={(e) => {
                                                const master = CATEGORIES.find(c => c.name === e.target.value);
                                                setForm(prev => ({ ...prev, masterCategory: e.target.value, category: master ? master.categories[0].name : '', subcategory: '' }));
                                            }}
                                            className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            {CATEGORIES.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Categoría</label>
                                        <select
                                            name="category" value={form.category}
                                            onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value, subcategory: '' }))}
                                            className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            {CATEGORIES.find(c => c.name === form.masterCategory)?.categories.map(cat => (
                                                <option key={cat.name} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Subcategoría</label>
                                        <select
                                            name="subcategory" value={form.subcategory} onChange={handleChange}
                                            className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            <option value="" disabled>Seleccionar...</option>
                                            {CATEGORIES.find(c => c.name === form.masterCategory)?.categories.find(c => c.name === form.category)?.sub.map(sub => (
                                                <option key={sub} value={sub}>{sub}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="lg:col-span-3">
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Estado del Producto</label>
                                        <select
                                            name="condition" value={form.condition} onChange={handleChange}
                                            className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            <option value="new">Nuevo (Sin uso)</option>
                                            <option value="like_new">Como Nuevo (Poco uso)</option>
                                            <option value="good">Buen estado (Detalles leves)</option>
                                            <option value="used">Usado (Marcas visibles)</option>
                                            <option value="repair">Para reparar / Repuestos</option>
                                        </select>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Talles, Medidas y Paleta de Colores (Opcional)">
                                <div className="space-y-6">
                                    {/* Paleta de Colores */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Paleta de Colores disponibles</label>
                                        <p className="text-[11px] text-slate-500 mb-3">Hacé clic para seleccionar todos los colores que tenés disponibles para la venta:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { name: 'Negro', hex: '#000000' }, { name: 'Blanco', hex: '#FFFFFF', border: true }, { name: 'Gris', hex: '#808080' }, { name: 'Plata / Plateado', hex: '#C0C0C0' },
                                                { name: 'Azul', hex: '#0000FF' }, { name: 'Azul Marino', hex: '#000080' }, { name: 'Celeste', hex: '#87CEEB' }, { name: 'Rojo', hex: '#FF0000' }, { name: 'Bordó', hex: '#800000' },
                                                { name: 'Verde', hex: '#008000' }, { name: 'Verde Militar', hex: '#556B2F' }, { name: 'Verde Menta', hex: '#98FF98' },
                                                { name: 'Amarillo', hex: '#FFFF00' }, { name: 'Dorado', hex: '#FFD700' }, { name: 'Naranja', hex: '#FFA500' },
                                                { name: 'Rosa', hex: '#FFC0CB' }, { name: 'Fucsia', hex: '#FF00FF' }, { name: 'Violeta', hex: '#800080' }, { name: 'Lila', hex: '#E6E6FA' },
                                                { name: 'Marrón', hex: '#8B4513' }, { name: 'Suela', hex: '#D2B48C' }, { name: 'Beige', hex: '#F5F5DC', border: true }, { name: 'Crema', hex: '#FFFDD0', border: true },
                                                { name: 'Multicolor', hex: 'conic-gradient(red, yellow, green, blue, magenta, red)' }
                                            ].map(col => {
                                                const isSelected = form.color.includes(col.name);
                                                return (
                                                    <button
                                                        key={col.name}
                                                        type="button"
                                                        onClick={() => {
                                                            setForm(prev => ({
                                                                ...prev,
                                                                color: isSelected 
                                                                    ? prev.color.filter(c => c !== col.name) 
                                                                    : [...prev.color, col.name]
                                                            }));
                                                        }}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all active:scale-95 ${isSelected ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold shadow-sm' : 'border-slate-200 hover:border-slate-300 text-slate-600 font-medium bg-white'}`}
                                                    >
                                                        <div 
                                                            className={`size-5 rounded-full shrink-0 ${col.border ? 'border border-slate-300' : ''}`} 
                                                            style={{ background: col.hex }} 
                                                        />
                                                        <span className="text-xs">{col.name}</span>
                                                        {isSelected && <span className="material-symbols-outlined text-sm text-indigo-600 font-black">check</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Talles y Medidas */}
                                    <div className="pt-6 border-t border-slate-100">
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Talles y Medidas disponibles</label>
                                        <p className="text-[11px] text-slate-500 mb-3">Seleccioná los talles o números que tenés en stock (para ropa, calzado o bebés):</p>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Indumentaria General (Ropa / Deportiva)</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {['Único', '2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'].map(sz => {
                                                        const isSelected = form.size.includes(sz);
                                                        return (
                                                            <button
                                                                key={sz}
                                                                type="button"
                                                                onClick={() => {
                                                                    setForm(prev => ({
                                                                        ...prev,
                                                                        size: isSelected 
                                                                            ? prev.size.filter(s => s !== sz) 
                                                                            : [...prev.size, sz]
                                                                    }));
                                                                }}
                                                                className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                                                            >
                                                                {sz}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Calzado (Zapatillas / Zapatos / Botas)</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47'].map(sz => {
                                                        const isSelected = form.size.includes(sz);
                                                        return (
                                                            <button
                                                                key={sz}
                                                                type="button"
                                                                onClick={() => {
                                                                    setForm(prev => ({
                                                                        ...prev,
                                                                        size: isSelected 
                                                                            ? prev.size.filter(s => s !== sz) 
                                                                            : [...prev.size, sz]
                                                                    }));
                                                                }}
                                                                className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                                                            >
                                                                {sz}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Bebés y Niños</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {['0-3m', '3-6m', '6-9m', '9-12m', '12-18m', '18-24m', 'T2', 'T4', 'T6', 'T8', 'T10', 'T12', 'T14', 'T16'].map(sz => {
                                                        const isSelected = form.size.includes(sz);
                                                        return (
                                                            <button
                                                                key={sz}
                                                                type="button"
                                                                onClick={() => {
                                                                    setForm(prev => ({
                                                                        ...prev,
                                                                        size: isSelected 
                                                                            ? prev.size.filter(s => s !== sz) 
                                                                            : [...prev.size, sz]
                                                                    }));
                                                                }}
                                                                className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                                                            >
                                                                {sz}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Numérico / Pantalones</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54'].map(sz => {
                                                        const isSelected = form.size.includes(sz);
                                                        return (
                                                            <button
                                                                key={sz}
                                                                type="button"
                                                                onClick={() => {
                                                                    setForm(prev => ({
                                                                        ...prev,
                                                                        size: isSelected 
                                                                            ? prev.size.filter(s => s !== sz) 
                                                                            : [...prev.size, sz]
                                                                    }));
                                                                }}
                                                                className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                                                            >
                                                                {sz}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center gap-2.5 text-indigo-900 text-xs font-medium">
                                            <span className="material-symbols-outlined text-indigo-600 text-base">straighten</span>
                                            <span>Al publicar, tus clientes podrán consultar en vivo la <b>Guía Oficial de Medidas en cm</b> en la ficha del producto.</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Tags, Marca y SEO">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Marca</label>
                                            <input name="brand" value={form.brand} onChange={handleChange} placeholder="Ejemplo: Nike" className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Tags (separados por coma)</label>
                                            <input name="tags" value={form.tags} onChange={handleChange} placeholder="Ejemplo: campera, cuero, invierno" className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100 space-y-4">
                                        <h4 className="text-sm font-bold text-slate-800">SEO</h4>
                                        <p className="text-xs text-slate-500">Mejorá la visibilidad de este producto en Google, marketplaces y redes.</p>
                                        
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Título SEO</label>
                                            <input name="seoTitle" value={form.seoTitle} onChange={handleChange} placeholder="Ejemplo: Remeras estampadas" className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                                            <span className="text-[10px] text-slate-400 mt-1 block">{form.seoTitle.length}/70 caracteres</span>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Descripción SEO</label>
                                            <textarea name="seoDescription" value={form.seoDescription} onChange={handleChange} placeholder="Breve descripción para buscadores..." className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 min-h-[80px] font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                                            <span className="text-[10px] text-slate-400 mt-1 block">{form.seoDescription.length}/160 caracteres</span>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">URL del producto (Slug)</label>
                                            <div className="flex">
                                                <span className="bg-slate-100 border border-slate-300 border-r-0 rounded-l-xl py-3 px-4 text-slate-500 text-sm flex items-center">tienda.com/productos/</span>
                                                <input name="productUrlSlug" value={form.productUrlSlug} onChange={handleChange} placeholder="campera-de-cuero" className="flex-1 bg-white border border-slate-300 rounded-r-xl py-3 px-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </StepContainer>
                    )}

                    {step === 2 && (
                        <StepContainer>
                            <Card title="Fotos y video">
                                <div className="space-y-6">
                                    <label className="w-full bg-slate-50 border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50/50 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors">
                                        <div className="size-12 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-4 text-indigo-600">
                                            <span className="material-symbols-outlined text-2xl font-black">add</span>
                                        </div>
                                        <span className="text-sm font-bold text-indigo-600 mb-2">Arrastrá y soltá, o subí fotos del producto</span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1"><span className="material-symbols-outlined text-sm">image</span> Tamaño mínimo recomendado: 1280px / Formatos: WEBP, PNG, JPEG</span>
                                        <input type="file" multiple disabled={loading} accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>

                                    {previews.length > 0 && (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                                            {previews.map((src, i) => (
                                                <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-sm relative group bg-white border border-slate-200">
                                                    <img src={src} className="w-full h-full object-cover" alt={`Preview ${i}`} />
                                                    <button onClick={(e) => { e.preventDefault(); removeFile(i); }} className="absolute top-2 right-2 size-7 bg-red-500 hover:bg-red-600 rounded-full text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 opacity-0 group-hover:opacity-100">
                                                        <span className="material-symbols-outlined text-sm font-black">close</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="pt-6 border-t border-slate-100">
                                        <label className="block text-sm font-bold text-slate-800 mb-1">Link de imagen web (URL externa)</label>
                                        <p className="text-xs text-slate-500 mb-3">Si tienes la foto alojada en internet, pega aquí el link directo de la imagen</p>
                                        <div className="flex gap-2 mb-6">
                                            <input 
                                                type="url"
                                                value={imageUrlInput} 
                                                onChange={(e) => setImageUrlInput(e.target.value)} 
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImageUrl())}
                                                placeholder="https://ejemplo.com/mifoto.jpg" 
                                                className="flex-1 bg-white border border-slate-300 rounded-xl py-3 px-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleAddImageUrl}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                                            >
                                                <span className="material-symbols-outlined text-sm">add_link</span>
                                                <span>Agregar</span>
                                            </button>
                                        </div>

                                        <label className="block text-sm font-bold text-slate-800 mb-1">Link para video externo</label>
                                        <p className="text-xs text-slate-500 mb-3">Pegá un link de Youtube o de Vimeo sobre tu producto</p>
                                        <input name="videoUrl" value={form.videoUrl} onChange={handleChange} placeholder="https://youtube.com/watch?v=..." className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                                    </div>
                                </div>
                            </Card>
                        </StepContainer>
                    )}

                    {step === 3 && (
                        <StepContainer>
                            <Card title="Precios">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Precio de venta</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                <input
                                                    type="text" value={form.price}
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/[^0-9,]/g, '');
                                                        if ((rawValue.match(/,/g) || []).length > 1) return;
                                                        const parts = rawValue.split(',');
                                                        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                                                        setForm(prev => ({ ...prev, price: parts.join(',') }));
                                                    }}
                                                    placeholder="0.00"
                                                    className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-8 pr-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Precio promocional</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                <input
                                                    type="text" value={form.oldPrice}
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/[^0-9,]/g, '');
                                                        if ((rawValue.match(/,/g) || []).length > 1) return;
                                                        const parts = rawValue.split(',');
                                                        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                                                        setForm(prev => ({ ...prev, oldPrice: parts.join(',') }));
                                                    }}
                                                    placeholder="0.00"
                                                    className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-8 pr-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" name="showPriceInStore" checked={form.showPriceInStore} onChange={handleChange} className="peer sr-only" />
                                            <div className="size-5 bg-white border-2 border-slate-300 rounded-md peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-colors"></div>
                                            <span className="material-symbols-outlined absolute inset-0 text-white text-[16px] font-black opacity-0 peer-checked:opacity-100 flex items-center justify-center pointer-events-none">check</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-800">Mostrar el precio en la tienda</span>
                                    </label>

                                    <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Costo</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                <input
                                                    type="text" value={form.cost}
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/[^0-9,]/g, '');
                                                        if ((rawValue.match(/,/g) || []).length > 1) return;
                                                        const parts = rawValue.split(',');
                                                        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                                                        setForm(prev => ({ ...prev, cost: parts.join(',') }));
                                                    }}
                                                    placeholder="0.00"
                                                    className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-8 pr-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                />
                                            </div>
                                            <span className="text-[10px] text-slate-500 mt-2 block">Es de uso interno, tus clientes no lo verán en la tienda.</span>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-2">Margen de ganancia</label>
                                            <div className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 font-medium text-slate-500">
                                                {profitMargin !== '--' ? `${profitMargin}%` : '--'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Inventario">
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-slate-800 mb-2">Stock</label>
                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <label className="flex items-center gap-3 p-4 border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                                            <input type="radio" name="hasInfiniteStock" checked={form.hasInfiniteStock === true} onChange={() => setForm({...form, hasInfiniteStock: true})} className="size-4 text-indigo-600" />
                                            <span className="text-sm font-bold text-slate-800">Infinito</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                                            <input type="radio" name="hasInfiniteStock" checked={form.hasInfiniteStock === false} onChange={() => setForm({...form, hasInfiniteStock: false})} className="size-4 text-indigo-600" />
                                            <span className="text-sm font-bold text-slate-800">Limitado</span>
                                        </label>
                                    </div>

                                    {!form.hasInfiniteStock && (
                                        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-700">Cantidad disponible</span>
                                            <div className="flex items-center gap-3">
                                                <button onClick={(e) => { e.preventDefault(); setForm(prev => ({ ...prev, quantity: Math.max(1, (prev.quantity || 1) - 1) })); }} className="size-8 bg-white border border-slate-300 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 font-black">-</button>
                                                <input type="number" value={form.quantity} onChange={(e) => setForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))} className="w-12 text-center font-bold text-slate-900 outline-none bg-transparent" />
                                                <button onClick={(e) => { e.preventDefault(); setForm(prev => ({ ...prev, quantity: (prev.quantity || 1) + 1 })); }} className="size-8 bg-white border border-slate-300 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 font-black">+</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <Card title="Códigos">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">SKU</label>
                                        <input name="sku" value={form.sku} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                                        <span className="text-[10px] text-slate-500 mt-2 block">El SKU es un código que creás internamente para hacer un seguimiento.</span>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Código de barras</label>
                                        <input name="barcode" value={form.barcode} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                                        <span className="text-[10px] text-slate-500 mt-2 block">Consta de 13 números y se utiliza para identificar un producto universalmente.</span>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Destacar producto">
                                <p className="text-xs text-slate-500 mb-4">
                                    Elegí en qué secciones de tu tienda querés destacar este producto para darle mayor visibilidad.
                                    Al destacar un producto, se cobrará una comisión adicional del 5% sobre el precio de venta al momento de concretarse.
                                </p>
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${form.isFeatured ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${form.isFeatured ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        name="isFeatured" 
                                        checked={form.isFeatured}
                                        onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                                        className="hidden" 
                                    />
                                    <span className="text-sm font-bold text-slate-700">Destacar este producto</span>
                                </label>
                            </Card>

                            <Card title="Oferta Relámpago">
                                <p className="text-xs text-slate-500 mb-4">
                                    Activá esta opción para que el producto aparezca en la sección de "Oportunidades Flash" con mayor urgencia de compra.
                                </p>
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${form.isFlashSale ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${form.isFlashSale ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        name="isFlashSale" 
                                        checked={form.isFlashSale}
                                        onChange={(e) => setForm({ ...form, isFlashSale: e.target.checked })}
                                        className="hidden" 
                                    />
                                    <span className="text-sm font-bold text-slate-700">Participar de Ofertas Relámpago</span>
                                </label>
                            </Card>

                            <Card title="Instagram y Google Shopping">
                                <p className="text-xs text-slate-500 mb-6">Destacá tus productos en las vidrieras virtuales de Instagram y Google gratuitamente.</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">MPN</label>
                                        <input name="mpn" value={form.mpn} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="Definir" />
                                        <p className="text-[10px] text-slate-500 mt-2">
                                            <strong>¿Qué es el MPN?</strong> El MPN (Manufacturer Part Number) es el código de pieza del fabricante. Identifica los productos de forma única y mejora tu posicionamiento en Google Shopping y redes sociales.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Rango de edad</label>
                                        <div className="relative">
                                            <select name="ageRange" value={form.ageRange} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none">
                                                <option value="">Seleccioná el rango de edad</option>
                                                <option value="adults">Adultos</option>
                                                <option value="kids">Niños</option>
                                                <option value="toddlers">Bebés</option>
                                                <option value="infants">Recién nacidos</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Sexo</label>
                                        <div className="relative">
                                            <select name="gender" value={form.gender} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-xl py-3 px-4 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none">
                                                <option value="">Seleccioná el sexo</option>
                                                <option value="male">Masculino</option>
                                                <option value="female">Femenino</option>
                                                <option value="unisex">Unisex</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </StepContainer>
                    )}

                    {step === 4 && (
                        <StepContainer>
                            <Card title="Peso y dimensiones">
                                <p className="text-xs text-slate-500 mb-6">Ingresá los datos para calcular el costo de envío de los productos y mostrar los medios de envío en tu tienda.</p>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Peso</label>
                                        <div className="relative">
                                            <input name="prodWeight" type="number" step="0.1" value={form.prodWeight} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-4 pr-10 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">kg</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Profundidad</label>
                                        <div className="relative">
                                            <input name="prodLength" type="number" step="0.1" value={form.prodLength} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-4 pr-10 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">cm</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Ancho</label>
                                        <div className="relative">
                                            <input name="prodWidth" type="number" step="0.1" value={form.prodWidth} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-4 pr-10 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">cm</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Alto</label>
                                        <div className="relative">
                                            <input name="prodHeight" type="number" step="0.1" value={form.prodHeight} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-4 pr-10 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">cm</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Opciones de Entrega">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { id: 'en_mano', label: 'En persona', sub: 'Punto de encuentro' },
                                        { id: 'domicilio', label: 'Envío local', sub: 'A domicilio propio' },
                                        { id: 'correo_argentino', label: 'Correo', sub: 'Servicio Nacional' },
                                        { id: 'acordar', label: 'Acordar', sub: 'Coordinar chat' }
                                    ].map(method => (
                                        <div
                                            key={method.id}
                                            onClick={() => {
                                                const current = form.deliveryMethods;
                                                const updated = current.includes(method.id) ? current.filter(m => m !== method.id) : [...current, method.id];
                                                if (updated.length > 0) setForm({ ...form, deliveryMethods: updated });
                                            }}
                                            className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col justify-center items-center text-center transition-all ${form.deliveryMethods.includes(method.id) ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-300'}`}
                                        >
                                            <span className={`material-symbols-outlined text-2xl mb-2 ${form.deliveryMethods.includes(method.id) ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {method.id === 'en_mano' ? 'handshake' : method.id === 'domicilio' ? 'local_shipping' : method.id === 'correo_argentino' ? 'mark_email_read' : 'chat'}
                                            </span>
                                            <span className={`text-sm font-bold ${form.deliveryMethods.includes(method.id) ? 'text-indigo-900' : 'text-slate-700'}`}>{method.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </StepContainer>
                    )}
                </div>
                
                {/* Navegación inferior redundante pero útil */}
                <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between">
                    {step > 1 ? (
                        <button onClick={prevStep} className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">arrow_back</span> Atrás
                        </button>
                    ) : <div></div>}
                    
                    {step < 4 ? (
                        <button onClick={nextStep} className="px-5 py-2.5 rounded-xl bg-slate-900 font-bold text-white text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm">
                            Siguiente Paso <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={loading} className="px-5 py-2.5 rounded-xl bg-indigo-600 font-bold text-white text-sm hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                            {loading && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                            {loading ? (uploadProgress || 'Guardando...') : 'Publicar producto'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
