
import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../lib/auth';
import { startChat } from '../../lib/chat';
import { Wallet, initMercadoPago } from '@mercadopago/sdk-react';

// Inicializar MP (Usar clave pública desde .env)
initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY || 'TEST-c13f9948-4cb2-4753-9993-4fc3c0352778');

// Hooks
import { useProduct } from '../../hooks/useProduct';
import { useNotification } from '../../context/NotificationContext';
import { trackEvent } from '../../lib/storeEvents';

// Components
import { MobileHeader } from '../../components/ui/MobileHeader';
import FloatingChat from '../../components/chat/FloatingChat';
import ShareModal from '../../components/product/ShareModal';
import SellerSection from '../../components/product/SellerSection';
import ProductMedia from '../../components/product/ProductMedia';
import FavoriteButton from '../../components/FavoriteButton';
import QuestionsSection from '../../components/product/QuestionsSection';
import ProductActions from '../../components/product/ProductActions';
import SellerStoreBanner from '../../components/product/SellerStoreBanner';

import { toggleFavorite, checkIsFavorite, toggleProductAlert, checkHasAlert, reportItem, trackProductView as incrementProductViews } from '../../lib/interactions';
import { trackProductView } from '../../lib/users';
import ReportModal from '../../components/product/ReportModal';
import { useCart } from '../../context/CartContext';

const SizeGuideModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [guideTab, setGuideTab] = useState<'ropa' | 'calzado' | 'bebe' | 'pantalones'>('ropa');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl p-6 lg:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h3 className="text-2xl font-black text-primary mb-2 font-headline">Guía Oficial de Talles y Medidas</h3>
        <p className="text-xs text-on-surface-variant mb-6">Encontrá tu medida ideal en centímetros para cada categoría.</p>
        
        {/* Tabs */}
        <div className="flex border-b border-outline-variant/30 mb-6 shrink-0 overflow-x-auto">
          <button 
            onClick={() => setGuideTab('ropa')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors shrink-0 ${guideTab === 'ropa' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
          >
            Indumentaria
          </button>
          <button 
            onClick={() => setGuideTab('calzado')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors shrink-0 ${guideTab === 'calzado' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
          >
            Calzado
          </button>
          <button 
            onClick={() => setGuideTab('pantalones')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors shrink-0 ${guideTab === 'pantalones' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
          >
            Pantalones
          </button>
          <button 
            onClick={() => setGuideTab('bebe')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-colors shrink-0 ${guideTab === 'bebe' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
          >
            Bebés y Niños
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto pr-1 flex-1">
          {guideTab === 'ropa' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-primary sticky top-0">
                <tr>
                  <th className="p-3 rounded-tl-xl font-black">Talle</th>
                  <th className="p-3 font-black">Equivalencia</th>
                  <th className="p-3 font-black">Pecho (cm)</th>
                  <th className="p-3 font-black">Cintura (cm)</th>
                  <th className="p-3 rounded-tr-xl font-black">Cadera (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface-variant">
                <tr><td className="p-3 font-bold text-primary">Único / U</td><td className="p-3">Talle Universal</td><td className="p-3">88-102</td><td className="p-3">70-88</td><td className="p-3">90-106</td></tr>
                <tr><td className="p-3 font-bold text-primary">2XS / XXS</td><td className="p-3">34 / 36</td><td className="p-3">78-82</td><td className="p-3">58-62</td><td className="p-3">82-86</td></tr>
                <tr><td className="p-3 font-bold text-primary">XS</td><td className="p-3">36 / 38</td><td className="p-3">82-86</td><td className="p-3">62-66</td><td className="p-3">86-90</td></tr>
                <tr><td className="p-3 font-bold text-primary">S</td><td className="p-3">38 / 40</td><td className="p-3">86-91</td><td className="p-3">68-74</td><td className="p-3">90-96</td></tr>
                <tr><td className="p-3 font-bold text-primary">M</td><td className="p-3">40 / 42</td><td className="p-3">96-101</td><td className="p-3">78-84</td><td className="p-3">98-104</td></tr>
                <tr><td className="p-3 font-bold text-primary">L</td><td className="p-3">42 / 44</td><td className="p-3">106-111</td><td className="p-3">88-94</td><td className="p-3">106-112</td></tr>
                <tr><td className="p-3 font-bold text-primary">XL</td><td className="p-3">44 / 46</td><td className="p-3">116-121</td><td className="p-3">98-104</td><td className="p-3">114-120</td></tr>
                <tr><td className="p-3 font-bold text-primary">2XL / XXL</td><td className="p-3">46 / 48</td><td className="p-3">126-131</td><td className="p-3">108-114</td><td className="p-3">122-128</td></tr>
                <tr><td className="p-3 font-bold text-primary">3XL / XXXL</td><td className="p-3">48 / 50</td><td className="p-3">136-141</td><td className="p-3">118-124</td><td className="p-3">130-136</td></tr>
                <tr><td className="p-3 font-bold text-primary">4XL / XXXXL</td><td className="p-3">50 / 52</td><td className="p-3">146-151</td><td className="p-3">128-134</td><td className="p-3">138-144</td></tr>
              </tbody>
            </table>
          )}

          {guideTab === 'calzado' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-primary sticky top-0">
                <tr>
                  <th className="p-3 rounded-tl-xl font-black">Número / Talle</th>
                  <th className="p-3 font-black">Largo del pie (cm)</th>
                  <th className="p-3 rounded-tr-xl font-black">Equivalencia US (Promedio)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface-variant">
                <tr><td className="p-3 font-bold text-primary">Nº 34</td><td className="p-3">22.0 cm</td><td className="p-3">US 4.5</td></tr>
                <tr><td className="p-3 font-bold text-primary">Nº 35</td><td className="p-3">22.5 cm</td><td className="p-3">US 5</td></tr>
                <tr><td className="p-3 font-bold text-primary">Nº 36</td><td className="p-3">23.0 cm</td><td className="p-3">US 5.5 / 6</td></tr>
                <tr><td className="p-3 font-bold text-primary">Nº 37</td><td className="p-3">24.0 cm</td><td className="p-3">US 6.5</td></tr>
                <tr><td className="p-3 font-bold text-primary">Nº 38</td><td className="p-3">24.5 cm</td><td className="p-3">US 7</td></tr>
                <tr><td className="p-3 font-bold text-primary">Nº 39</td><td className="p-3">25.0 cm</td><td className="p-3">US 7.5 / 8</td></tr>
                <tr><td className="p-3 font-bold text-primary">Nº 40</td><td className="p-3">26.0 cm</td><td className="p-3">US 8.5</td></tr>
                <tr><td className="p-3 font-bold text-primary">Nº 41</td><td className="p-3">26.5 cm</td><td className="p-3">US 9</td></tr>
                <tr><td className="p-3 font-bold text-primary">Nº 42</td><td className="p-3">27.0 cm</td><td className="p-3">US 9.5 / 10</td></tr>
                <tr><td className="p-3 font-bold text-primary">Nº 43</td><td className="p-3">28.0 cm</td><td className="p-3">US 10.5</td></tr>
                <tr><td className="p-3 font-bold text-primary">Nº 44</td><td className="p-3">28.5 cm</td><td className="p-3">US 11 / 11.5</td></tr>
                <tr><td className="p-3 font-bold text-primary">Nº 45</td><td className="p-3">29.0 cm</td><td className="p-3">US 12</td></tr>
                <tr><td className="p-3 font-bold text-primary">Nº 46</td><td className="p-3">30.0 cm</td><td className="p-3">US 12.5 / 13</td></tr>
                <tr><td className="p-3 font-bold text-primary">Nº 47</td><td className="p-3">30.5 cm</td><td className="p-3">US 13.5</td></tr>
              </tbody>
            </table>
          )}

          {guideTab === 'pantalones' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-primary sticky top-0">
                <tr>
                  <th className="p-3 rounded-tl-xl font-black">Talle Numérico</th>
                  <th className="p-3 font-black">Cintura (cm)</th>
                  <th className="p-3 rounded-tr-xl font-black">Cadera (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface-variant">
                <tr><td className="p-3 font-bold text-primary">Talle 28</td><td className="p-3">70 - 73 cm</td><td className="p-3">88 - 91 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">Talle 30</td><td className="p-3">74 - 77 cm</td><td className="p-3">92 - 95 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">Talle 32</td><td className="p-3">78 - 81 cm</td><td className="p-3">96 - 99 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">Talle 34</td><td className="p-3">82 - 85 cm</td><td className="p-3">100 - 103 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">Talle 36</td><td className="p-3">86 - 89 cm</td><td className="p-3">104 - 107 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">Talle 38</td><td className="p-3">90 - 93 cm</td><td className="p-3">108 - 111 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">Talle 40</td><td className="p-3">94 - 97 cm</td><td className="p-3">112 - 115 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">Talle 42</td><td className="p-3">98 - 102 cm</td><td className="p-3">116 - 119 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">Talle 44</td><td className="p-3">103 - 107 cm</td><td className="p-3">120 - 123 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">Talle 46</td><td className="p-3">108 - 112 cm</td><td className="p-3">124 - 127 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">Talle 48</td><td className="p-3">113 - 117 cm</td><td className="p-3">128 - 131 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">Talle 50</td><td className="p-3">118 - 122 cm</td><td className="p-3">132 - 135 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">Talle 52</td><td className="p-3">123 - 127 cm</td><td className="p-3">136 - 139 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">Talle 54</td><td className="p-3">128 - 132 cm</td><td className="p-3">140 - 143 cm</td></tr>
              </tbody>
            </table>
          )}

          {guideTab === 'bebe' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-primary sticky top-0">
                <tr>
                  <th className="p-3 rounded-tl-xl font-black">Talle</th>
                  <th className="p-3 font-black">Edad / Etapa</th>
                  <th className="p-3 rounded-tr-xl font-black">Estatura del niño (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface-variant">
                <tr><td className="p-3 font-bold text-primary">0-3m</td><td className="p-3">Recién nacido a 3 meses</td><td className="p-3">Hasta 60 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">3-6m</td><td className="p-3">3 a 6 meses</td><td className="p-3">60 - 67 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">6-9m</td><td className="p-3">6 a 9 meses</td><td className="p-3">67 - 72 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">9-12m</td><td className="p-3">9 a 12 meses</td><td className="p-3">72 - 78 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">12-18m</td><td className="p-3">12 a 18 meses</td><td className="p-3">78 - 83 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">18-24m</td><td className="p-3">18 a 24 meses</td><td className="p-3">83 - 88 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">T2</td><td className="p-3">2 años</td><td className="p-3">88 - 93 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">T4</td><td className="p-3">4 años</td><td className="p-3">98 - 105 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">T6</td><td className="p-3">6 años</td><td className="p-3">110 - 116 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">T8</td><td className="p-3">8 años</td><td className="p-3">122 - 128 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">T10</td><td className="p-3">10 años</td><td className="p-3">134 - 140 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">T12</td><td className="p-3">12 años</td><td className="p-3">146 - 152 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">T14</td><td className="p-3">14 años</td><td className="p-3">158 - 164 cm</td></tr>
                <tr><td className="p-3 font-bold text-primary">T16</td><td className="p-3">16 años</td><td className="p-3">168 - 172 cm</td></tr>
              </tbody>
            </table>
          )}
        </div>
        <p className="text-[10px] text-on-surface-variant mt-4 shrink-0">Las medidas en centímetros pueden variar ligeramente según el corte o la marca. Usar como guía de referencia.</p>
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const {
    product,
    activeImg,
    setActiveImg,
    isHovered,
    setIsHovered,
    mousePos,
    showFullscreen,
    setShowFullscreen,
    isShareModalOpen,
    setIsShareModalOpen,
    imageRef,
    handleMouseMove
  } = useProduct();

  const navigate = useNavigate();

  const { user } = useAuth();
  const { notify } = useNotification();
  const { addToCart } = useCart();
  const [offerAmount, setOfferAmount] = useState('');
  const [floatingChatId, setFloatingChatId] = useState<string | null>(null);

  // Mock states for actions -> Real states
  const [isSaved, setIsSaved] = useState(false);
  const [hasAlert, setHasAlert] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [isMatingPayment, setIsMatingPayment] = useState(false);

  // New UI states
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'shipping'>('specs');

  // Check initial state & Track View
  useEffect(() => {
    window.scrollTo(0, 0);
    if (user && product.id) {
      checkIsFavorite(user.uid, product.id).then(setIsSaved);
      checkHasAlert(user.uid, product.id).then(setHasAlert);

      // Track behavior (personalization + popularity)
      trackProductView(user.uid, product.id, product.category);
      incrementProductViews(product.id);
    }
    
    if (product.id && product.sellerId) {
      trackEvent(product.sellerId, 'page_view', { productId: product.id, productTitle: product.title });
    }
  }, [user, product.id, product.category, product.sellerId, product.title]);

  const handleAction = async (action: string) => {
    if (!user) {
      notify({ type: 'info', title: 'Identidad Requerida', message: 'Inicia tu registro para continuar con esta acción.', icon: 'account_circle' });
      navigate('/register');
      return;
    }

    switch (action) {
      case 'save':
        try {
          const { isFavorite } = await toggleFavorite(user.uid, product.id);
          setIsSaved(isFavorite);
          notify({ type: 'success', title: isFavorite ? 'Guardado' : 'Removido', message: isFavorite ? 'Producto añadido a favoritos.' : 'Producto eliminado de favoritos.', icon: 'favorite' });
        } catch (e) {
          notify({ type: 'error', title: 'Error', message: 'No se pudo actualizar favoritos.', icon: 'error' });
        }
        break;
      case 'alert':
        try {
          const { hasAlert } = await toggleProductAlert(user.uid, product.id);
          setHasAlert(hasAlert);
          notify({ type: 'success', title: hasAlert ? 'Alerta Activada' : 'Alerta Desactivada', message: hasAlert ? 'Te notificaremos cambios en este producto.' : 'Ya no recibirás notificaciones de este producto.', icon: 'notifications' });
        } catch (e) {
          notify({ type: 'error', title: 'Error', message: 'No se pudo actualizar la alerta.', icon: 'error' });
        }
        break;
      case 'report':
        setIsReportModalOpen(true);
        break;
    }
  };

  const handleReportSubmit = async (reason: string, description: string) => {
    if (!user) return;

    const result = await reportItem({
      reporterId: user.uid,
      reporterName: user.displayName || user.email || 'Usuario Anónimo',
      targetId: product.id,
      targetType: 'product',
      reason,
      description
    });

    if (result.success) {
      notify({ type: 'success', title: 'Reporte Recibido', message: 'Gracias. Nuestro equipo revisará el caso.', icon: 'verified_user' });
    } else {
      notify({ type: 'error', title: 'Error', message: 'No se pudo enviar el reporte.', icon: 'error' });
    }
  };

  const handleSendOffer = () => {
    if (!offerAmount) return;
    notify(`Oferta de $${offerAmount} enviada al vendedor`, 'success');
    setOfferAmount('');
  };

  const handleContactSeller = async () => {
    if (!user) {
      notify({ type: 'info', title: 'Identidad Requerida', message: 'Registrate para contactar al vendedor.', icon: 'account_circle' });
      navigate('/register');
      return;
    }
    const targetSellerId = product.seller?.id || product.seller?.uid || product.sellerId;
    if (!targetSellerId) {
      notify({ type: 'error', title: 'Error', message: 'No se identificó al vendedor del producto.', icon: 'error' });
      return;
    }
    if (user.uid === targetSellerId) {
      notify({ type: 'warning', title: 'Es tu producto', message: 'No puedes enviarte mensajes a ti mismo.', icon: 'person' });
      return;
    }

    try {
      const sellerName = product.seller?.displayName || product.seller?.name || product.sellerName || 'Vendedor';
      const sellerImg = product.seller?.avatar || product.seller?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName)}&background=random`;
      const chatId = await startChat(user.uid, targetSellerId, {
        displayName: sellerName,
        photoURL: sellerImg
      });
      setFloatingChatId(chatId);
    } catch (error: any) {
      console.error("Error contact seller:", error);
      notify({ type: 'error', title: 'Error', message: error.message || 'No se pudo iniciar el chat.', icon: 'error' });
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      notify({ type: 'info', title: 'Identidad Requerida', message: 'Completa tu registro para realizar la compra.', icon: 'account_circle' });
      navigate('/register');
      return;
    }

    if (product.status !== 'AVAILABLE') {
      notify({ type: 'warning', title: 'No disponible', message: 'Este producto ya no está a la venta.', icon: 'info' });
      return;
    }

    if (user && product.seller?.id === user.uid) {
      notify({ type: 'error', title: 'Operación inválida', message: 'No podés comprar tu propio producto. Iniciá sesión con otra cuenta.', icon: 'block' });
      return;
    }

    if (product.color && (Array.isArray(product.color) ? product.color.length > 0 : true) && selectedColor === null) {
      notify({ type: 'warning', title: 'Selecciona un Color', message: 'Por favor seleccioná un color para continuar.', icon: 'palette' });
      return;
    }
    if (product.size && (Array.isArray(product.size) ? product.size.length > 0 : true) && selectedSize === null) {
      notify({ type: 'warning', title: 'Selecciona un Talle', message: 'Por favor seleccioná un talle para continuar.', icon: 'straighten' });
      return;
    }

    // Redirigir al Checkout con la información del producto
    navigate('/checkout', {
      state: {
        productId: product.id,
        productTitle: product.title,
        productPrice: product.price,
        productImage: product.images?.[0],
        sellerId: product.seller.id,
        sellerName: product.seller.displayName || product.seller.name,
        deliveryMethods: product.deliveryMethods,
        condition: product.condition,
        productQuantity: quantity,
        selectedColor: selectedColor !== null ? (Array.isArray(product.color) ? product.color[selectedColor] : product.color) : null,
        selectedSize: selectedSize
      }
    });
  };

  const handleAddToCart = () => {
    if (user && product.seller?.id === user.uid) {
      notify({ type: 'error', title: 'Operación inválida', message: 'No podés agregar tu propio producto al carrito.', icon: 'block' });
      return;
    }
    if (product.color && (Array.isArray(product.color) ? product.color.length > 0 : true) && selectedColor === null) {
      notify({ type: 'warning', title: 'Selecciona un Color', message: 'Por favor seleccioná un color para continuar.', icon: 'palette' });
      return;
    }
    if (product.size && (Array.isArray(product.size) ? product.size.length > 0 : true) && selectedSize === null) {
      notify({ type: 'warning', title: 'Selecciona un Talle', message: 'Por favor seleccioná un talle para continuar.', icon: 'straighten' });
      return;
    }

    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images?.[0],
      quantity: quantity,
      sellerId: product.seller.id,
      sellerName: product.seller.displayName || product.seller.name,
      selectedColor: selectedColor !== null ? (Array.isArray(product.color) ? product.color[selectedColor] : product.color) : null,
      selectedSize: selectedSize
    });
  };

  // JSON-LD schema for rich search results
  const getJsonLd = () => {
    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.seoTitle || product.title,
      "image": product.images || [],
      "description": product.seoDescription || product.description,
      "brand": {
        "@type": "Brand",
        "name": product.brand || "Unspecified"
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "ARS",
        "price": product.price,
        "itemCondition": product.condition === 'new' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": product.seller.displayName || product.seller.name || "Vendelo Hoy User"
        }
      }
    };
  };

  return (
    <main className="max-w-[1280px] mx-auto px-0 md:px-3 lg:px-6 py-0 md:py-3 lg:py-6 bg-background min-h-screen font-body relative pb-24 md:pb-0">
      <Helmet>
        <title>{`${product.seoTitle || product.title} | Vendelo Hoy!`}</title>
        <meta name="description" content={product.seoDescription || product.description.substring(0, 150) + '...'} />
        <meta property="og:title" content={`${product.seoTitle || product.title} - $${product.price.toLocaleString()}`} />
        <meta property="og:description" content={product.seoDescription || product.description.substring(0, 100) + '...'} />
        {product.images?.[0] && <meta property="og:image" content={product.images[0]} />}
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify(getJsonLd())}
        </script>
      </Helmet>

      <MobileHeader variant="product" />

      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={product.title}
      />
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportSubmit}
        targetName={product.title}
      />

      {/* Floating Chat Modal */}
      <AnimatePresence>
        {floatingChatId && (
          <FloatingChat 
            chatId={floatingChatId} 
            onClose={() => setFloatingChatId(null)} 
            sellerName={product.seller?.displayName || product.seller?.name || product.sellerName || 'Vendedor'}
            sellerPhoto={product.seller?.avatar || product.seller?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.seller?.displayName || 'Vendedor')}&background=random`}
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-8">
        {/* LEFT COLUMN - IMAGE GALLERY */}
        <div className="lg:col-span-7 xl:col-span-7 order-1 flex flex-col gap-2">
          <ProductMedia
            images={product.images}
            activeImg={activeImg}
            setActiveImg={setActiveImg}
            isHovered={isHovered}
            setIsHovered={setIsHovered}
            mousePos={mousePos}
            onMouseMove={handleMouseMove}
            onFullscreen={() => setShowFullscreen(true)}
            onShare={() => setIsShareModalOpen(true)}
            imageRef={imageRef}
          />
        </div>

        {/* RIGHT COLUMN - PURCHASING HUB */}
        <div className="lg:col-span-5 xl:col-span-5 lg:row-span-2 order-2 h-full">
          <div className="lg:sticky lg:top-24 flex flex-col h-full">
            
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-4">
              <Link to="/" className="hover:text-primary transition-colors">Shop</Link>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <Link to="/search" className="hover:text-primary transition-colors">{product.category}</Link>
            </nav>

            {/* Title & Reviews */}
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-3xl lg:text-4xl font-black text-primary leading-[1.1] font-headline tracking-tighter">{product.title}</h1>
              {product.views !== undefined && (
                <div className="flex items-center gap-1 text-on-surface-variant whitespace-nowrap mt-2">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  <span className="text-[10px] font-bold">{product.views} Visitas</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <p className="text-2xl font-light text-on-surface tracking-tight">${product.price.toLocaleString()}</p>
              {product.oldPrice && product.oldPrice > product.price && (
                <p className="text-sm text-on-surface-variant line-through opacity-60">
                  ${product.oldPrice.toLocaleString()}
                </p>
              )}
            </div>

            {/* Short Description */}
            <p className="text-sm text-on-surface-variant leading-relaxed mb-8">
              {product.description.substring(0, 150)}{product.description.length > 150 ? '...' : ''}
            </p>

            {/* Conditional Variants (Only if size or color exist) */}
            {(product.color || product.size) && (
              <div className="space-y-6 mb-8">
                {/* Color */}
                {product.color && (Array.isArray(product.color) ? product.color.length > 0 : true) && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Color</p>
                    <div className="flex flex-wrap gap-3">
                      {(Array.isArray(product.color) ? product.color : [product.color]).map((c: string) => {
                          const colorMap: Record<string, string> = {
                              'Negro': '#000000', 'Blanco': '#FFFFFF', 'Gris': '#808080', 
                              'Azul': '#0000FF', 'Rojo': '#FF0000', 'Verde': '#008000', 
                              'Amarillo': '#FFFF00', 'Rosa': '#FFC0CB', 'Marrón': '#A52A2A', 'Beige': '#F5F5DC',
                              'Multicolor': 'conic-gradient(red, yellow, green, blue, magenta, red)'
                          };
                          const bg = colorMap[c];
                          const style = c === 'Multicolor' ? { background: bg } : { backgroundColor: bg || '#e5e7eb' };
                          const isActive = selectedColor === (Array.isArray(product.color) ? product.color : [product.color]).indexOf(c);
                          return (
                            <button
                              key={c}
                              onClick={() => setSelectedColor((Array.isArray(product.color) ? product.color : [product.color]).indexOf(c))}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-outline-variant/30 hover:border-outline-variant'}`}
                            >
                              <div 
                                className={`size-6 rounded-full border border-outline-variant/30 ${isActive ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                                style={style}
                              />
                              <span className={`font-bold text-xs ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>{c}</span>
                            </button>
                          );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Size */}
                {product.size && (Array.isArray(product.size) ? product.size.length > 0 : true) && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Talle</p>
                      {['ropa', 'calzado', 'indumentaria', 'moda', 'camisetas', 'interior'].some(k => product.category.toLowerCase().includes(k)) && (
                          <span onClick={() => setIsSizeGuideOpen(true)} className="text-[10px] font-bold text-secondary cursor-pointer hover:underline">Guía de Talles</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const rawSizes = Array.isArray(product.size) ? product.size : [product.size];
                        const cleaned = rawSizes.map((sz: string) => sz.replace(/^(Nº\s*|Talle\s*)/i, '').trim());
                        const unique = [...new Set(cleaned)];
                        return unique.map((sz: string) => (
                          <button 
                            key={sz}
                            onClick={() => setSelectedSize(sz)}
                            className={`px-4 py-2 font-black text-xs rounded-xl border-2 transition-all ${selectedSize === sz ? 'border-primary text-primary bg-primary/5 shadow-sm' : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/50'}`}
                          >
                            {sz}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            {(product.quantity || 1) > 1 && product.status === 'AVAILABLE' && (
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Cantidad</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-4 py-2 text-on-surface hover:bg-surface-container-low transition-colors font-bold"
                    >-</button>
                    <div className="px-4 font-bold text-sm min-w-[3rem] text-center">{quantity}</div>
                    <button 
                      onClick={() => setQuantity(q => Math.min(product.quantity || 1, q + 1))}
                      className="px-4 py-2 text-on-surface hover:bg-surface-container-low transition-colors font-bold"
                    >+</button>
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {product.quantity} disponibles
                  </span>
                </div>
              </div>
            )}

            {/* Purchase Actions (Desktop Only) */}
            <div className="hidden md:flex flex-col gap-3 mb-4">
              <div className="flex gap-3">
                {preferenceId ? (
                  <div className="flex-1 animate-in zoom-in-95 duration-300">
                    <Wallet initialization={{ preferenceId }} />
                  </div>
                ) : (
                  <button
                    onClick={handleBuyNow}
                    disabled={isMatingPayment || product.status !== 'AVAILABLE'}
                    className="flex-1 bg-primary text-white py-4 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">{isMatingPayment ? 'sync' : 'bolt'}</span>
                    {isMatingPayment ? 'Procesando...' : product.status !== 'AVAILABLE' ? 'No disponible' : 'Comprar Ya'}
                  </button>
                )}
                <FavoriteButton
                  product={{
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.images?.[0] || '',
                    sellerName: product.seller?.displayName || product.seller?.name || 'Vendedor'
                  }}
                  className="size-[56px] shrink-0 bg-secondary flex items-center justify-center rounded-xl text-white hover:bg-secondary/90 transition-colors shadow-lg shadow-secondary/20"
                />
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.status !== 'AVAILABLE'}
                className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface py-4 rounded-xl font-bold text-sm hover:bg-surface-container transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">shopping_bag</span>
                Agregar al Carrito
              </button>
              <button
                onClick={handleContactSeller}
                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-sm hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-95 mt-1"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                Preguntar / Hablar con el Vendedor
              </button>
            </div>
            
            {product.status === 'AVAILABLE' && (
              <p className="text-[10px] text-center text-on-surface-variant mb-8">Envío express gratuito disponible en esta zona.</p>
            )}
          </div>
        </div>
      </div>

      {/* ROW 2: Details & Seller Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-8 mt-6 lg:mt-8">
        
        {/* LEFT COLUMN - DETAILS */}
        <div className="lg:col-span-7 xl:col-span-7 order-1 flex flex-col gap-6">
          {/* Description */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 lg:p-6 border border-outline-variant/20 shadow-sm h-fit">
            <h3 className="text-2xl font-black text-primary font-headline tracking-tighter mb-6">Descripción del Producto</h3>
            <div className="prose prose-slate max-w-none text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap">
              {product.description}
            </div>
          </div>

          {/* Minimalist Tabs for Specs & Shipping */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden h-fit">
            <div className="flex border-b border-outline-variant/20">
              <button
                onClick={() => setActiveTab('specs')}
                className={`flex-1 py-4 text-center text-sm font-bold border-b-2 transition-colors ${activeTab === 'specs' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
              >
                Especificaciones Técnicas
              </button>
              <button
                onClick={() => setActiveTab('shipping')}
                className={`flex-1 py-4 text-center text-sm font-bold border-b-2 transition-colors ${activeTab === 'shipping' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
              >
                Envíos y Retiros
              </button>
            </div>

            <div className="p-6 lg:p-8">
              {activeTab === 'specs' ? (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm py-2 border-b border-outline-variant/20">
                    <span className="text-on-surface-variant font-bold">Estado</span>
                    <span className="text-primary font-medium">{product.condition === 'new' ? 'Nuevo' : product.condition === 'like-new' ? 'Como Nuevo' : product.condition === 'good' ? 'Buen Estado' : 'Usado'}</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-outline-variant/20">
                    <span className="text-on-surface-variant font-bold">Categoría</span>
                    <span className="text-primary font-medium">{product.category}</span>
                  </div>
                  {product.brand && (
                    <div className="flex justify-between text-sm py-2 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant font-bold">Marca</span>
                      <span className="text-primary font-medium">{product.brand}</span>
                    </div>
                  )}
                  {product.model && (
                    <div className="flex justify-between text-sm py-2 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant font-bold">Modelo</span>
                      <span className="text-primary font-medium">{product.model}</span>
                    </div>
                  )}
                  {product.warranty && (
                    <div className="flex justify-between text-sm py-2 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant font-bold">Garantía</span>
                      <span className="text-primary font-medium">{product.warranty}</span>
                    </div>
                  )}
                  {product.productDimensions && (product.productDimensions.length || product.productDimensions.width || product.productDimensions.height) && (
                    <>
                      {product.productDimensions.length && (
                        <div className="flex justify-between text-sm py-2 border-b border-outline-variant/20">
                          <span className="text-on-surface-variant font-bold">Largo</span>
                          <span className="text-primary font-medium">{product.productDimensions.length} cm</span>
                        </div>
                      )}
                      {product.productDimensions.width && (
                        <div className="flex justify-between text-sm py-2 border-b border-outline-variant/20">
                          <span className="text-on-surface-variant font-bold">Ancho</span>
                          <span className="text-primary font-medium">{product.productDimensions.width} cm</span>
                        </div>
                      )}
                      {product.productDimensions.height && (
                        <div className="flex justify-between text-sm py-2 border-b border-outline-variant/20">
                          <span className="text-on-surface-variant font-bold">Alto</span>
                          <span className="text-primary font-medium">{product.productDimensions.height} cm</span>
                        </div>
                      )}
                    </>
                  )}
                  {product.tags && (
                    <div className="pt-4 mt-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">Etiquetas / SEO Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(product.tags) ? product.tags : typeof product.tags === 'string' ? product.tags.split(',') : []).map((t: string, idx: number) => {
                          const cleanTag = t.trim();
                          if (!cleanTag) return null;
                          return (
                            <button
                              key={idx}
                              onClick={() => navigate(`/search?q=${encodeURIComponent(cleanTag)}`)}
                              className="bg-surface-container-low hover:bg-primary/10 text-on-surface-variant hover:text-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[14px]">tag</span>
                              {cleanTag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {product.deliveryMethods && product.deliveryMethods.length > 0 ? (
                    product.deliveryMethods.map((m: string) => {
                      const methodMap: Record<string, { label: string, icon: string }> = {
                        'correo_argentino': { label: 'Correo Argentino (A todo el país)', icon: 'local_shipping' },
                        'en_mano': { label: 'Retiro en persona', icon: 'handshake' },
                        'acordar': { label: 'Acordar con vendedor', icon: 'chat' },
                        'domicilio': { label: 'App de Transporte (Uber/Didi/Cabify)', icon: 'local_taxi' }
                      };
                      const method = methodMap[m] || { label: m, icon: 'package' };
                      return (
                        <div key={m} className="flex items-center gap-4 text-sm p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl">
                          <span className="material-symbols-outlined text-secondary text-xl">{method.icon}</span>
                          <span className="text-primary font-medium">{method.label}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center gap-4 text-sm p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl">
                      <span className="material-symbols-outlined text-secondary text-xl">chat</span>
                      <span className="text-primary font-medium">Acordar envío con el vendedor</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - SELLER INFO */}
        <div className="lg:col-span-5 xl:col-span-5 order-2">
          <div className="flex flex-col gap-6">
            <SellerSection seller={product.seller} onContactSeller={handleContactSeller} />
            
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex gap-3">
              <span className="material-symbols-outlined text-primary text-xl">shield</span>
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1.5">Consejos de Seguridad</h5>
                <ul className="text-[10px] font-medium text-on-surface-variant space-y-1 list-disc pl-3">
                  <li>Encuéntrese en un lugar público y bien iluminado</li>
                  <li>Inspeccione el artículo antes de pagar</li>
                  <li>Nunca envíe dinero por transferencia bancaria directa</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* YOU MAY ALSO LIKE */}
      <div className="mt-16 lg:mt-24 border-t border-outline-variant/30 pt-12">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Recomendados para vos</h4>
        <h2 className="text-2xl lg:text-3xl font-black text-primary font-headline tracking-tighter mb-8">Te podría interesar</h2>
        
        {/* We use QuestionsSection here temporarily or replace it entirely. Let's keep it clean */}
        <div className="px-4 md:px-0">
          <QuestionsSection itemId={product.id} sellerId={product.seller.id} itemTitle={product.title} />
        </div>
      </div>

      {/* MOBILE FIXED BOTTOM ACTION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface border-t border-outline-variant/30 px-4 py-3 pb-safe flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={handleContactSeller}
          className="flex-1 max-w-[120px] bg-surface-container text-on-surface py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border border-outline-variant/50 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-lg">chat_bubble</span>
          Chat
        </button>
        <button
          onClick={handleBuyNow}
          disabled={isMatingPayment || product.status !== 'AVAILABLE'}
          className="flex-1 bg-primary text-on-primary py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-premium active:scale-95 transition-transform disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">{isMatingPayment ? 'sync' : 'shopping_bag'}</span>
          {isMatingPayment ? 'Procesando' : product.status !== 'AVAILABLE' ? 'No disponible' : 'Comprar Ahora'}
        </button>
      </div>

    </main>
  );
};

export default ProductDetail;
