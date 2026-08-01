import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../lib/auth';
import { createTransaction, PaymentMethod } from '../../lib/transactions';
import { subscribeToProduct } from '../../lib/items';
import { httpsCallable } from 'firebase/functions'; // Use Firebase Cloud Functions
import { db } from '../../lib/firebase';
import { getUserProfile, updateUserProfile } from '../../lib/users';
import { trackEvent } from '../../lib/analytics';
import PaymentMethodSelector from '../../components/checkout/PaymentMethodSelector';
import { useCart } from '../../context/CartContext';
import { getPlatformSettings, PlatformSettings } from '../../lib/settings';
import { validateCoupon, incrementCouponUsage } from '../../lib/marketing';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { user, userProfile } = useAuth();
  const { cart, total: cartTotal, clearCart } = useCart(); // Added clearCart
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('MERCADO_PAGO');
  const [deliveryMethod, setDeliveryMethod] = useState<'correo_argentino' | 'en_mano' | 'acordar' | 'domicilio'>('en_mano');
  const [productDeliveryMethods, setProductDeliveryMethods] = useState<string[] | null>(null);
  const [shippingAvailable, setShippingAvailable] = useState<boolean>(true); // Default true until fetched
  const [notes, setNotes] = useState<string>('');
  const [couponCode, setCouponCode] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<{ id: string, amount: number, code: string } | null>(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
      street: userProfile?.location?.address || '',
      number: '',
      floor: '',
      city: userProfile?.location?.city || '',
      province: userProfile?.location?.province || '',
      zipCode: userProfile?.location?.zipCode || ''
  });

  // Derive checkout data from state or cart
  const state = location.state || {};
  const queryParams = new URLSearchParams(location.search);
  const resumedTxId = queryParams.get('tx') || state.transactionId;

  const [isResuming, setIsResuming] = useState(!!resumedTxId);
  const [resumedTxData, setResumedTxData] = useState<any>(null);

  const isCartMode = !state.productId && cart.length > 0 && !resumedTxId;

  const productId = state.productId || (isCartMode ? `cart-${Date.now()}` : resumedTxData?.itemId || null);
  const productTitle = state.productTitle || (isCartMode ? `Pedido de Carrito (${cart.length} items)` : resumedTxData?.itemTitle || '');
  const productPrice = state.productPrice || (isCartMode ? cartTotal : resumedTxData?.amount || 0);
  const sellerId = state.sellerId || (isCartMode ? cart[0]?.sellerId : resumedTxData?.sellerId || '');
  const sellerName = state.sellerName || (isCartMode ? cart[0]?.sellerName : resumedTxData?.sellerName || '');
  const productQuantity = state.productQuantity || (isCartMode ? cart.length : 1);

  const [isDeleted, setIsDeleted] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(resumedTxId || null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  // Initial Fetch if Resuming
  React.useEffect(() => {
    getPlatformSettings().then(setPlatformSettings);
    if (resumedTxId) {
      setLoading(true);
      import('../../lib/transactions').then(({ getTransaction }) => {
        getTransaction(resumedTxId).then(tx => {
          if (tx && tx.status === 'PENDING_PAYMENT') {
            setResumedTxData(tx);
            if (tx.deliveryMethod) setDeliveryMethod(tx.deliveryMethod);
            if (tx.paymentMethod) setSelectedMethod(tx.paymentMethod);
          } else {
            notify({ type: 'error', title: 'Error de Sesión', message: 'Esta transacción ya no está disponible para pago.', icon: 'error' });
            navigate('/dashboard');
          }
          setLoading(false);
        });
      });
    }
  }, [resumedTxId, navigate, notify]);

  React.useEffect(() => {
    // Only subscribe to product updates if it's a real single product, not a virtual cart ID or resuming
    if (productId && !productId.startsWith('cart-') && !isResuming) {
      // Subscribe to real-time updates
      const unsubscribePromise = subscribeToProduct(productId, (item) => {
        if (!item) {
          // If item returns null, it has been deleted
          setIsDeleted(true);
          notify({ type: 'error', title: 'Producto No Disponible', message: 'El vendedor ha eliminado este producto o pausado la venta.', icon: 'production_quantity_limits' });
          setTimeout(() => navigate('/'), 2000);
        } else {
          if (item.deliveryMethods) {
            setProductDeliveryMethods(item.deliveryMethods);
            // If the currently selected method is no longer available, default to the first available one
            if (!item.deliveryMethods.includes(deliveryMethod)) {
                setDeliveryMethod(item.deliveryMethods[0] as any || 'en_mano');
            }
          }
          if (item.shippingAvailable !== undefined) {
            setShippingAvailable(item.shippingAvailable);
            if (!item.shippingAvailable && (!item.deliveryMethods || !item.deliveryMethods.includes('correo_argentino'))) {
                // Keep selected method if possible, otherwise fallback
            }
          }
          // Si el método es correo, calculamos
          if (deliveryMethod === 'correo_argentino' && deliveryAddress.zipCode.length >= 4) {
             // sellerZip = item.location (if it has zipcode) or just fetch seller profile? 
             // for now we simulate calculation
             setIsCalculatingShipping(true);
             import('../../lib/shipping').then(({ calculateShippingCost }) => {
                // Mock seller zip if not available in item
                calculateShippingCost('2000', deliveryAddress.zipCode, item.dimensions ? { ...item.dimensions, weight: item.weight || 1 } : { weight: item.weight || 1, length: 10, width: 10, height: 10 })
                .then(cost => {
                    setShippingCost(cost);
                    setIsCalculatingShipping(false);
                }).catch(err => {
                    setShippingCost(3500); // fallback
                    setIsCalculatingShipping(false);
                });
             });
          } else {
            setShippingCost(0);
          }
        }
      });
      
      import('../../lib/items').then(({ getItem }) => {
          getItem(productId).then(item => {
              if (item) {
                  trackEvent(item.sellerId, 'checkout_start', { productId: item.id, productTitle: item.title });
              }
          });
      });

      return () => { unsubscribePromise.then(unsub => unsub()); };
    }
  }, [productId, navigate, notify, isResuming, deliveryMethod, deliveryAddress.zipCode]);

  if (!productId && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="bg-surface-container-lowest size-24 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-outline-variant font-black">shopping_cart_off</span>
          </div>
          <h3 className="text-2xl font-black text-on-surface mb-2 uppercase tracking-tight">Carrito Vacío</h3>
          <p className="text-sm font-bold text-on-surface-variant mb-10">No se detectaron activos para adquisición.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Explorar el Mercado
          </button>
        </div>
      </div>
    );
  }

  // Block self-purchase
  if (sellerId && user && sellerId === user.uid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="bg-red-50 size-24 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-red-500 font-black">block</span>
          </div>
          <h3 className="text-2xl font-black text-on-surface mb-2 uppercase tracking-tight">No podés comprar tu propio producto</h3>
          <p className="text-sm font-bold text-on-surface-variant mb-10">Iniciá sesión con otra cuenta para probar la compra.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // NEW MODEL: Dynamic Fees from Settings
  const escrowFeePercentage = platformSettings?.escrowFeePercentage ?? 0.05;
  const gatewayFeePercentage = platformSettings?.paymentProcessingFeePercentage ?? 0.06;

  // El Pago Protegido solo aplica a medios digitales (MP)
  const isDigitalPayment = selectedMethod === 'MERCADO_PAGO';

  const protectionFee = isDigitalPayment
    ? (platformSettings?.useFixedPagoProtegidoFee
      ? (platformSettings.escrowFixedFee ?? 2500)
      : Math.round(productPrice * productQuantity * escrowFeePercentage))
    : 0;

  const gatewayFee = isDigitalPayment
    ? Math.round(productPrice * productQuantity * gatewayFeePercentage)
    : 0;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidatingCoupon(true);
    
    try {
      const code = couponCode.toUpperCase().replace(/\s/g, '');
      // 1. Fetch seller's store coupons first
      const seller = await getUserProfile(sellerId);
      const storeCoupon = seller?.store?.coupons?.find(c => c.code === code && c.active);

      if (storeCoupon) {
        if (storeCoupon.uses >= storeCoupon.maxUses) {
          setDiscountInfo(null);
          notify({ type: 'error', title: 'Cupón Agotado', message: 'Este cupón ha alcanzado su límite de usos.', icon: 'error' });
          setIsValidatingCoupon(false);
          return;
        }
        const discountAmount = Math.round(productPrice * (storeCoupon.discountPercentage / 100));
        setDiscountInfo({ id: storeCoupon.id, amount: discountAmount, code: storeCoupon.code });
        notify({ type: 'success', title: 'Cupón Aplicado', message: `Descuento de $${discountAmount.toLocaleString()} aplicado correctamente.`, icon: 'confirmation_number' });
      } else {
        // 2. Check global platform marketing coupons
        const globalRes = await validateCoupon(code, productPrice);
        if (globalRes.success && globalRes.discount !== undefined) {
          setDiscountInfo({ id: globalRes.couponId || 'global', amount: globalRes.discount, code: globalRes.couponCode || code, isGlobal: true } as any);
          notify({ type: 'success', title: 'Cupón Global Aplicado', message: `Descuento de $${globalRes.discount.toLocaleString()} aplicado correctamente.`, icon: 'confirmation_number' });
        } else {
          setDiscountInfo(null);
          notify({ type: 'error', title: 'Cupón Inválido', message: globalRes.error || 'El cupón no existe o está inactivo.', icon: 'error' });
        }
      }
    } catch (e) {
      setDiscountInfo(null);
      notify({ type: 'error', title: 'Error', message: 'No se pudo validar el cupón.', icon: 'error' });
    }
    setIsValidatingCoupon(false);
  };

  const total = (productPrice * productQuantity) + protectionFee + gatewayFee + shippingCost - (discountInfo?.amount || 0);

  const handlePayment = async () => {
    if (!user) {
      notify({ type: 'error', title: 'Sesión Requerida', message: 'Por favor inicia sesión para finalizar tu compra.', icon: 'lock' });
      navigate('/login');
      return;
    }

    setLoading(true);

    if (deliveryMethod === 'correo_argentino' || deliveryMethod === 'domicilio') {
      const { street, number, city, province, zipCode } = deliveryAddress;
      if (!street || !number || !city || !province || !zipCode) {
          notify({ type: 'error', title: 'Datos Incompletos', message: 'Por favor, completa todos los campos obligatorios de la Dirección de Entrega.', icon: 'where_to_vote' });
          setLoading(false);
          return;
      }
    }

    let transactionId = currentTransactionId;

    if (!transactionId) {
      const result = await createTransaction({
        buyerId: user.uid,
        sellerId: sellerId,
        itemId: productId,
        itemTitle: productTitle,
        quantity: productQuantity,
        amountProduct: productPrice * productQuantity,
        amount: total,
        paymentMethod: selectedMethod,
        deliveryMethod: deliveryMethod,
        ...( (deliveryMethod === 'correo_argentino' || deliveryMethod === 'domicilio') ? { deliveryAddress } : {} ),
        itemImage: resumedTxData?.itemImage || state.productImage || (isCartMode ? cart[0]?.image : null),
        platformFee: protectionFee,
        gatewayFee: gatewayFee,
        shippingCost: shippingCost,
        notes: notes,
        featuredFeeApplied: (state.isFeatured && state.featuredUntil && (state.featuredUntil.toDate ? state.featuredUntil.toDate() : new Date(state.featuredUntil)) > new Date())
          ? state.featuredFeeApplied
          : null
      });

      if (!result.success || !result.id) {
        notify({ type: 'error', title: 'Error Fatal', message: 'No se pudo inicializar el libro contable seguro.', icon: 'error' });
        setLoading(false);
        return;
      }
      transactionId = result.id;
      if (isCartMode) clearCart(); // Clean cart after success
      if (discountInfo?.id) {
        try {
          if ((discountInfo as any).isGlobal) {
            await incrementCouponUsage(discountInfo.id);
          } else {
            const seller = await getUserProfile(sellerId);
            if (seller?.store?.coupons) {
              const updatedCoupons = seller.store.coupons.map(c => 
                c.id === discountInfo.id ? { ...c, uses: c.uses + 1 } : c
              );
              await updateUserProfile(sellerId, { 
                store: { ...(seller.store as any), coupons: updatedCoupons } 
              });
            }
          }
        } catch (e) {
          console.error("Failed to increment coupon usage:", e);
        }
      }
    }

    if (selectedMethod === 'MERCADO_PAGO') {
      try {
        // Nueva llamada a API Vercel de Split Payments
        const response = await fetch('/api/mp-preference', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: productTitle,
            price: total,
            quantity: 1,
            productId: productId || transactionId,
            sellerId: sellerId,
            transactionId: transactionId
          })
        });

        const data = await response.json();

        if (!response.ok) {
           throw new Error(data.error || 'Error al conectar con Mercado Pago (Split Payment)');
        }

        if (data.id) {
          // Redirección directa al checkout de MP con el ID de preferencia generado
          window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.id}`;
        } else if (data.url || data.init_point) {
          window.location.href = data.url || data.init_point;
        } else {
          throw new Error("Respuesta inválida desde la pasarela de pagos.");
        }

      } catch (error: any) {
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
          notify({ type: 'warning', title: 'Modo de Depuración', message: 'Bypass del emulador o error de API local: Simulando confirmación de pago para testing.', icon: 'developer_mode' });
          setTimeout(() => {
            navigate(`/success?collection_status=approved&external_reference=${transactionId}&payment_type=credit_card`);
          }, 1500);
          return;
        }

        const backendMessage = error.message || 'Error de protocolo desconocido';
        notify({ type: 'error', title: 'Excepción de Pago', message: backendMessage, icon: 'cloud_off' });
        setLoading(false);
        return;
      }

    } else {
      navigate(`/success?collection_status=pending&external_reference=${transactionId}&payment_method=${selectedMethod}`);
    }
  };



  return (
    <>
      <div className="min-h-screen bg-surface py-12 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">

          {/* Header Compacto */}
          <div className="flex items-center gap-4 mb-10">
            <div className="size-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <span className="material-symbols-outlined text-on-primary font-black">lock</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-on-surface uppercase tracking-tight">Finalizar Compra</h1>
              <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Protocolo de custodia segura activado</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-10 items-start">

            {/* Columna Izquierda: Producto y Costos */}
            <div className="w-full lg:w-[45%] space-y-6">
              <div className="bg-surface-container-lowest rounded-[32px] shadow-premium border border-outline-variant/50 overflow-hidden animate-in fade-in slide-in-from-left-5 duration-700">
                {/* Product Header */}
                <div className="bg-on-surface px-8 py-10 text-on-primary relative overflow-hidden flex items-center gap-6">
                  <div className="absolute top-0 right-0 size-64 bg-primary/20 blur-[120px] -mr-16 -mt-16"></div>

                  {/* Product Image Preview */}
                  <div className="relative z-10 size-32 rounded-2xl overflow-hidden border-2 border-white/10 shadow-xl shrink-0">
                    <img
                      src={resumedTxData?.itemImage || state.productImage || (isCartMode ? cart[0]?.image : null) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                      alt={productTitle}
                      className="size-full object-cover"
                    />
                  </div>

                  <div className="relative z-10">
                    <p className="text-primary text-[9px] uppercase font-black tracking-[0.4em] mb-2">Protocolo de Adquisición</p>
                    <h2 className="text-2xl font-black tracking-tight capitalize line-clamp-2 leading-tight">{productTitle}</h2>
                    {(state.selectedColor || state.selectedSize) && (
                        <div className="flex gap-2 text-[10px] font-bold text-white/80 uppercase mt-2">
                            {state.selectedColor && <span>Color: <span className="text-white">{state.selectedColor}</span></span>}
                            {state.selectedColor && state.selectedSize && <span>|</span>}
                            {state.selectedSize && <span>Talle: <span className="text-white">{state.selectedSize}</span></span>}
                        </div>
                    )}
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* Cost Breakdown */}
                  <div className="space-y-4">
                    {!isCartMode && (
                      <div className="flex items-center gap-4 py-4 border-b border-outline-variant/30/50">
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-on-surface uppercase tracking-tight">Estado del Activo</span>
                            <span className="size-1 bg-gray-300 rounded-full"></span>
                            <span className="text-[10px] font-bold text-on-surface-variant capitalize">{state.condition === 'new' ? 'Nuevo' : state.condition === 'like_new' ? 'Excelente' : 'Usado'}</span>
                          </div>
                          <p className="text-[11px] font-bold text-on-surface-variant leading-tight">Verificado bajo protocolo de inspección estándar.</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center px-2 py-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
                        Valor del Producto
                      </span>
                      <span className="text-xs font-black text-on-surface">$ {productPrice.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center px-2 py-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                        Gastos de Pasarela
                        <span className="relative group/tip cursor-help">
                          <span className="material-symbols-outlined text-[14px] text-outline hover:text-on-surface-variant transition-colors">help</span>
                          <span className="invisible group-hover/tip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-on-surface text-on-primary text-[9px] font-bold normal-case tracking-normal leading-relaxed p-3 rounded-xl shadow-xl z-50 pointer-events-none">
                            Comisión del procesador de pagos (Mercado Pago / MODO) por procesar tu transacción de forma segura.
                            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-800"></span>
                          </span>
                        </span>
                      </span>
                      <span className="text-xs font-black text-on-surface">$ {gatewayFee.toLocaleString()}</span>
                    </div>

                    {shippingCost > 0 && (
                        <div className="flex justify-between items-center px-2 py-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                            Costo de Envío
                            {isCalculatingShipping && <span className="material-symbols-outlined text-[12px] animate-spin">refresh</span>}
                          </span>
                          <span className="text-xs font-black text-on-surface">
                              {isCalculatingShipping ? 'Calculando...' : `$ ${shippingCost.toLocaleString()}`}
                          </span>
                        </div>
                    )}

                    <div className={`flex justify-between items-center p-5 rounded-[20px] border transition-all relative group ${isDigitalPayment ? 'bg-primary-container border-primary-100 text-primary' : 'bg-surface-container-low border-outline-variant/50 text-slate-400 opacity-60'}`}>
                      {isDigitalPayment && <div className="absolute top-0 right-0 w-20 h-20 bg-primary-200/20 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform overflow-hidden"></div>}
                      <div className="flex items-center gap-4 relative z-10">
                        <div className={`size-10 rounded-lg flex items-center justify-center shadow-sm border ${isDigitalPayment ? 'bg-surface-container-lowest border-primary-100' : 'bg-surface-container border-outline-variant/50'}`}>
                          <span className={`material-symbols-outlined text-xl font-black ${isDigitalPayment ? 'text-primary' : 'text-slate-300'}`}>
                            {isDigitalPayment ? 'gpp_good' : 'lock_open'}
                          </span>
                        </div>
                        <div>
                          <span className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1 flex items-center gap-1.5 ${isDigitalPayment ? 'text-primary' : 'text-on-surface-variant'}`}>
                            Protección Pago Protegido
                            {isDigitalPayment && (
                              <span className="relative group/tip2 cursor-help">
                                <span className="material-symbols-outlined text-[14px] text-primary-400 hover:text-primary transition-colors">help</span>
                                <span className="invisible group-hover/tip2:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-on-surface text-on-primary text-[9px] font-bold normal-case tracking-normal leading-relaxed p-3 rounded-xl shadow-xl z-50 pointer-events-none">
                                  Tarifa de custodia que garantiza que tu dinero está protegido hasta que recibas el producto conforme. Si hay un problema, te devolvemos el dinero.
                                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-800"></span>
                                </span>
                              </span>
                            )}
                          </span>
                          <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest leading-none">
                            {isDigitalPayment ? 'Safe Deal Fee' : 'No aplica en trato directo'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right relative z-10">
                        <span className={`font-black text-base block ${isDigitalPayment ? 'text-on-surface' : 'text-slate-400'}`}>$ {protectionFee.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Coupons Section */}
                  <div className="pt-6 border-t border-outline-variant/30 space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="¿Tenés un cupón?"
                        disabled={!!discountInfo}
                        className="flex-grow bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary-100 disabled:opacity-50"
                      />
                      <button
                        onClick={discountInfo ? () => { setDiscountInfo(null); setCouponCode(''); } : handleApplyCoupon}
                        disabled={isValidatingCoupon || (!couponCode && !discountInfo)}
                        className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${discountInfo ? 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-on-primary' : 'bg-on-surface text-on-primary hover:bg-black disabled:opacity-30'}`}
                      >
                        {isValidatingCoupon ? '...' : discountInfo ? 'Remover' : 'Aplicar'}
                      </button>
                    </div>
                    {discountInfo && (
                      <div className="flex justify-between items-center px-2 py-2 bg-emerald-50 rounded-xl border border-emerald-100 animate-in zoom-in-95 duration-300">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">confirmation_number</span>
                          Descuento {discountInfo.code}
                        </span>
                        <span className="text-xs font-black text-emerald-600">-$ {discountInfo.amount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="border-t border-outline-variant/30 pt-6">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <span className="text-[8px] font-black text-outline uppercase tracking-[0.3em] block mb-1">Total a Transferir</span>
                        <span className="text-4xl font-black text-on-surface tracking-tighter">$ {total.toLocaleString()}</span>
                      </div>
                      <div className="pb-1 opacity-50">
                        <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="size-1 bg-emerald-500 rounded-full animate-pulse"></span>
                          Cifrado de Punto a Punto
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 opacity-20 grayscale px-10">
                <span className="material-symbols-outlined text-xs">enhanced_encryption</span>
                <p className="text-[8px] font-black uppercase tracking-[0.3em]">Hardware Encrypted Transaction Layer</p>
              </div>
            </div>

            {/* Columna Derecha: Logística y Pago */}
            <div className="w-full lg:w-[55%] space-y-6">
              {/* Delivery Method Selector */}
              <div className="bg-surface-container-lowest p-8 rounded-[32px] border border-outline-variant/50 shadow-sm animate-in fade-in slide-in-from-right-5 duration-700">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">local_shipping</span>
                  Protocolo de Logística
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {[
                    { id: 'correo_argentino', label: 'Correo Argentino', icon: 'local_shipping', sub: 'Servicio postal' },
                    { id: 'en_mano', label: 'En mano', icon: 'handshake', sub: 'En persona' },
                    { id: 'acordar', label: 'Acordar', icon: 'chat', sub: 'Con vendedor' },
                    { id: 'domicilio', label: 'Domicilio', icon: 'home', sub: 'Puerta a puerta' }
                  ].filter(m => (resumedTxData?.deliveryMethods || productDeliveryMethods || state.deliveryMethods || ['en_mano']).includes(m.id))
                    .map((method) => (
                      <div
                        key={method.id}
                        onClick={() => setDeliveryMethod(method.id as any)}
                        className={`flex items-center gap-3 p-4 border rounded-xl shadow-sm cursor-pointer transition-all ${deliveryMethod === method.id ? 'bg-primary-container/30 border-primary-vibrant ring-1 ring-primary-100' : 'bg-surface-container-lowest border-outline-variant/50 hover:bg-surface-container-lowest'}`}
                      >
                        <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${deliveryMethod === method.id ? 'bg-surface-container-lowest text-primary shadow-sm' : 'bg-surface-container-lowest text-on-surface-variant'}`}>
                          <span className="material-symbols-outlined text-lg font-black">{method.icon}</span>
                        </div>
                        <div className="flex-grow">
                          <span className={`text-[10px] font-black uppercase tracking-widest block ${deliveryMethod === method.id ? 'text-on-surface' : 'text-on-surface-variant'}`}>{method.label}</span>
                          <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">{method.sub}</p>
                        </div>
                        {deliveryMethod === method.id && <span className="material-symbols-outlined text-sm text-primary">check_circle</span>}
                      </div>
                    ))}
                </div>

                {['correo_argentino', 'domicilio'].includes(deliveryMethod) && (
                  <div className="mt-4 p-5 border rounded-2xl bg-surface-container-lowest animate-in fade-in slide-in-from-top-2 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                          <span className="material-symbols-outlined text-primary font-black text-xl">location_on</span>
                          <h4 className="text-[12px] font-black uppercase tracking-widest text-on-surface">Dirección de Entrega</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 sm:col-span-1">
                              <label className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Calle</label>
                              <input 
                                  type="text" 
                                  value={deliveryAddress.street}
                                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/50 outline-none focus:border-primary-vibrant text-sm font-bold text-on-surface transition-colors"
                              />
                          </div>
                          <div className="col-span-1 sm:col-span-1 flex gap-2">
                              <div className="flex-1">
                                  <label className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Número</label>
                                  <input 
                                      type="text" 
                                      value={deliveryAddress.number}
                                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, number: e.target.value })}
                                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/50 outline-none focus:border-primary-vibrant text-sm font-bold text-on-surface transition-colors"
                                  />
                              </div>
                              <div className="flex-1">
                                  <label className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Piso/Dpto</label>
                                  <input 
                                      type="text" 
                                      value={deliveryAddress.floor}
                                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, floor: e.target.value })}
                                      placeholder="Opcional"
                                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/50 outline-none focus:border-primary-vibrant text-sm font-bold text-on-surface transition-colors placeholder:text-gray-400"
                                  />
                              </div>
                          </div>
                          
                          <div className="col-span-2 sm:col-span-1">
                              <label className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Ciudad / Localidad</label>
                              <input 
                                  type="text" 
                                  value={deliveryAddress.city}
                                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/50 outline-none focus:border-primary-vibrant text-sm font-bold text-on-surface transition-colors"
                              />
                          </div>

                          <div className="col-span-1 sm:col-span-1">
                              <label className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Provincia</label>
                              <input 
                                  type="text" 
                                  value={deliveryAddress.province}
                                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, province: e.target.value })}
                                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/50 outline-none focus:border-primary-vibrant text-sm font-bold text-on-surface transition-colors"
                              />
                          </div>

                          <div className="col-span-1 sm:col-span-1">
                              <label className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 ml-1">Código Postal</label>
                              <input 
                                  type="text" 
                                  placeholder="Ej: 2000"
                                  value={deliveryAddress.zipCode}
                                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, zipCode: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container border-2 border-indigo-100 outline-none focus:border-indigo-400 text-sm font-black text-indigo-900 transition-colors"
                              />
                          </div>
                      </div>
                      
                      {deliveryMethod === 'correo_argentino' && (
                          <div className="mt-4 pt-4 border-t border-outline-variant/30 flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">local_shipping</span> Costo de Envío
                              </span>
                              {isCalculatingShipping ? (
                                  <span className="text-xs text-primary font-bold flex items-center gap-1">
                                      <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                                      Cotizando...
                                  </span>
                              ) : (
                                  deliveryAddress.zipCode.length >= 4 && shippingCost > 0 ? (
                                      <span className="text-sm text-emerald-600 font-black bg-emerald-50 px-3 py-1 rounded-lg">
                                          ${shippingCost.toLocaleString('es-AR')}
                                      </span>
                                  ) : (
                                      <span className="text-[10px] text-gray-400 font-bold uppercase">A calcular</span>
                                  )
                              )}
                          </div>
                      )}
                  </div>
                )}

                {/* Notes Field */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Notas del trato (Opcional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Detalles sobre el punto de encuentro o envío..."
                    className="w-full bg-surface border border-outline-variant/50 rounded-xl py-3 px-4 text-xs font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary-100 transition-all placeholder:text-outline resize-none"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="bg-surface-container-lowest p-8 rounded-[32px] border border-outline-variant/50 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                <PaymentMethodSelector
                  selectedMethod={selectedMethod}
                  onSelect={setSelectedMethod}
                />

                {/* Action Button */}
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-primary text-on-primary text-xs font-black py-5 rounded-2xl hover:opacity-95 transition-all shadow-xl shadow-primary-500/10 disabled:opacity-50 flex justify-center items-center gap-3 active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                      <span className="uppercase tracking-[0.2em]">Enlazando...</span>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined font-black text-base">verified_user</span>
                      <span className="uppercase tracking-[0.2em]">
                        {selectedMethod === 'MERCADO_PAGO' ? 'Autorizar Pago MP' :
                            'Finalizar Adquisición'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
