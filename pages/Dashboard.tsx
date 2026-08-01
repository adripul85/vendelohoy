import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { getUserTransactions, TransactionData, TransactionStatus } from '../lib/transactions';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getReviewForTransaction } from '../lib/reviews';
import { getItemsBySeller, ItemData, deleteItem, toggleFeaturedItem } from '../lib/items';
import { updateUserProfile } from '../lib/users';
import { uploadFile } from '../lib/storage';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { useDialog } from '../context/DialogContext';
import ReviewModal from '../components/ReviewModal';
import MyPurchases from '../components/dashboard/MyPurchases';
import MySales from '../components/dashboard/MySales';
import ConfirmModal from '../components/ui/ConfirmModal';
export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const notify = useNotification().notify;
  const { showConfirm, showAlert } = useDialog();

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const [activeTab, setActiveTab] = useState<'publicaciones' | 'compras' | 'ventas' | 'disputas' | 'perfil'>('publicaciones');
  const [transactions, setTransactions] = useState<{ compras: any[], ventas: any[] }>({ compras: [], ventas: [] });
  const [userItems, setUserItems] = useState<(ItemData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [reviewedTransactions, setReviewedTransactions] = useState<Set<string>>(new Set());

  // New States for Management
  const [filterQuery, setFilterQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validatingTx, setValidatingTx] = useState<string | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [shippingTx, setShippingTx] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [courierInput, setCourierInput] = useState('Correo Argentino');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TransactionStatus>('ALL');
  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [txToCancel, setTxToCancel] = useState<string | null>(null);
  const [itemToFeature, setItemToFeature] = useState<ItemData | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [txToRelease, setTxToRelease] = useState<string | null>(null);
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Claim Daily XP
    const todayStr = new Date().toISOString().split('T')[0];
    const claimKey = `xp_notified_${user.uid}_${todayStr}`;
    if (!sessionStorage.getItem(claimKey)) {
      sessionStorage.setItem(claimKey, 'true');
      import('../lib/users').then(async ({ claimDailyLoginXp }) => {
        try {
          const claimed = await claimDailyLoginXp(user.uid);
          if (claimed) {
            notify({ type: 'success', title: '¡Racha Diaria!', message: 'Has ganado +10 XP por tu visita de hoy.', icon: 'star' });
          }
        } catch (err: any) {
          sessionStorage.removeItem(claimKey);
          console.error('XP CLAIM ERROR:', err);
        }
      });
    }

    const transactionsRef = collection(db, "transactions");

    // Queries
    const qBuy = query(transactionsRef, where("buyerId", "==", user.uid), orderBy("createdAt", "desc"));
    const qSell = query(transactionsRef, where("sellerId", "==", user.uid), orderBy("createdAt", "desc"));

    // Listeners
    const unsubBuy = onSnapshot(qBuy, (snapshot) => {
      const hiddenTxs = JSON.parse(localStorage.getItem('hiddenTxs') || '[]');
      const compras = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any, type: 'compra' }))
        .filter(tx => !hiddenTxs.includes(tx.id));

      setTransactions(prev => ({ ...prev, compras }));

      // Check for reviews for these purchases
      const checkReviews = async () => {
        const reviewed = new Set<string>();
        for (const tx of compras) {
          if (tx.status === 'COMPLETED') {
            const review = await getReviewForTransaction(tx.id);
            if (review) reviewed.add(tx.id);
          }
        }
        setReviewedTransactions(prev => {
          const next = new Set(prev);
          reviewed.forEach(id => next.add(id));
          return next;
        });
      };
      checkReviews();
      setLoading(false);
    });

    const unsubSell = onSnapshot(qSell, (snapshot) => {
      const hiddenTxs = JSON.parse(localStorage.getItem('hiddenTxs') || '[]');
      const ventas = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any, type: 'venta' }))
        .filter(tx => !hiddenTxs.includes(tx.id));
      setTransactions(prev => ({ ...prev, ventas }));
      setLoading(false);
    });

    // Fetch User Items (Publications)
    const fetchUserItems = async () => {
      const items = await getItemsBySeller(user.uid);
      setUserItems(items);
    };
    fetchUserItems();

    return () => {
      unsubBuy();
      unsubSell();
    };
  }, [user]);

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="text-center">
          <div className="bg-surface-container-low w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">lock</span>
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">Acceso Restringido</h3>
          <p className="text-on-surface-variant mb-6">Debes iniciar sesión para ver tu panel</p>
          <Link to="/login" className="btn-primary">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  const handleReleaseFunds = (transactionId: string) => {
    setTxToRelease(transactionId);
    setConfirmModalOpen(true);
  };

  const confirmReleaseFunds = async () => {
    if (!txToRelease) return;
    setConfirmModalOpen(false);

    // We assume releaseFunds handles buyer confirmation if no token is provided (or we might need a specific flag)
    // For now, let's try calling it. If backend requires token, we might need a distinct 'confirmDelivery' function 
    // but typically releaseFunds is the final step.
    const { releaseFunds } = await import('../lib/transactions');
    const result = await releaseFunds(txToRelease);
    if (result.success) {
      notify({ type: 'success', title: '¡Fondos Liberados!', message: 'El vendedor ha recibido su pago y ha sido notificado.', icon: 'payments' });
      // Refresh transactions locally
      setTransactions(prev => ({
        ...prev,
        compras: prev.compras.map(t => t.id === txToRelease ? { ...t, status: 'COMPLETED' } : t)
      }));
      // Auto-open review modal
      const releasedTx = transactions.compras.find(t => t.id === txToRelease);
      if (releasedTx) {
        setSelectedTransaction({ ...releasedTx, status: 'COMPLETED' });
        setReviewModalOpen(true);
      }
    } else {
      notify({ type: 'error', title: 'Error', message: 'No se pudo liberar el pago.', icon: 'error' });
    }
    setTxToRelease(null);
  };

  // Filter transactions
  const filteredTransactions = transactions.ventas.filter(deal => {
    const matchesSearch = deal.itemTitle.toLowerCase().includes(filterQuery.toLowerCase()) || deal.id.includes(filterQuery);
    const matchesStatus = statusFilter === 'ALL' || deal.status === statusFilter;

    // Specific status mapping for sidebar labels if needed
    if (statusFilter === 'PAID_HELD' && deal.status === 'PAID_HELD') return matchesSearch;
    if (statusFilter === 'SHIPPED' && deal.status === 'SHIPPED') return matchesSearch;

    return matchesSearch && matchesStatus;
  });

  const filteredPurchases = transactions.compras.filter(deal => {
    const matchesSearch = deal.itemTitle.toLowerCase().includes(filterQuery.toLowerCase()) || deal.id.includes(filterQuery);

    // Status Logic for Buyer Sidebar
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'PAID_HELD' && (deal.status === 'PAID_HELD' || deal.status === 'SHIPPED')) || // Active orders
      (statusFilter === 'COMPLETED' && deal.status === 'COMPLETED') ||
      (statusFilter === 'CANCELLED' && deal.status === 'CANCELLED') ||
      (deal.status === statusFilter); // Fallback for exact match

    return matchesSearch && matchesStatus;
  });

  const list = activeTab === 'compras' ? filteredPurchases : filteredTransactions;

  const filteredUserItems = userItems.filter(item => {
    const matchesQuery = item.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(filterQuery.toLowerCase());
    const isAvailable = !item.status || item.status === 'AVAILABLE';
    return matchesQuery && isAvailable;
  });

  const handleDeleteItem = async (id: string) => {
    setIsDeleting(true);
    const result = await deleteItem(id);
    setIsDeleting(false);
    setItemToDelete(null);

    if (result.success) {
      notify({ type: 'success', title: 'Eliminado', message: 'El producto ha sido eliminado.', icon: 'delete' });
      setUserItems(prev => prev.filter(item => item.id !== id));
    } else {
      notify({ type: 'error', title: 'Error', message: 'No se pudo eliminar el producto.', icon: 'error' });
    }
  };

  const confirmToggleFeatured = async (id: string, currentlyFeatured: boolean) => {
    setItemToFeature(null);
    try {
      const { auth } = await import('../lib/firebase');
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const response = await fetch('/api/bump-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ itemId: id })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        notify({
          type: 'success',
          title: !currentlyFeatured ? '¡Producto Destacado!' : 'Destacado Removido',
          message: result.message || 'La operación fue exitosa.',
          icon: 'bolt'
        });
        setUserItems(prev => prev.map(item => item.id === id ? { ...item, isFeatured: !currentlyFeatured } : item));
      } else {
        notify({ type: 'error', title: 'Error', message: result.error || 'No se pudo cambiar el estado de destacado.', icon: 'error' });
      }
    } catch (error) {
      notify({ type: 'error', title: 'Error', message: 'Error de red al destacar.', icon: 'error' });
    }
  };
  const handleToggleFeatured = async (item: any) => {
    if (item.isFeatured) {
        // If already featured, just turn it off
        confirmToggleFeatured(item.id, true);
    } else {
        // Validation: must have shipping (which implies platform payments)
        const hasShipping = item.shippingAvailable || (item.deliveryMethods && item.deliveryMethods.some((m: string) => ['correo_argentino', 'domicilio'].includes(m)));
        if (!hasShipping) {
            notify({ type: 'warning', title: 'Operación no válida', message: 'Solo los productos con opción de envío pueden destacarse.', icon: 'local_shipping' });
            return;
        }
        // Open modal
        setItemToFeature(item);
    }
  };

  const handleValidateDelivery = async (txId: string) => {
    if (!qrInput) return;

    // Import dynamically to avoid circular dependencies/performance hit
    const { releaseFunds } = await import('../lib/transactions');
    notify({ type: 'info', title: 'Verificando...', message: 'Validando token de entrega...', icon: 'qr_code_scanner' });

    const result = await releaseFunds(txId, qrInput.toUpperCase());

    if (result.success) {
      notify({ type: 'success', title: 'Entrega Exitosa', message: 'Fondos liberados correctamente.', icon: 'verified' });
      setValidatingTx(null);
      setQrInput('');

      // Refresh transactions locally
      setTransactions(prev => ({
        ...prev,
        ventas: prev.ventas.map(t => t.id === txId ? { ...t, status: 'COMPLETED' } : t)
      }));
    } else {
      notify({ type: 'error', title: 'Token Inválido', message: 'El código ingresado no es correcto.', icon: 'error' });
    }
  };

  const handleUpdateTracking = async (txId: string) => {
    if (!trackingInput || !courierInput) {
      notify({ type: 'error', title: 'Faltan Datos', message: 'Por favor completa todos los campos de envío.', icon: 'local_shipping' });
      return;
    }

    const { updateTracking } = await import('../lib/transactions');
    notify({ type: 'info', title: 'Actualizando...', message: 'Registrando información de envío...', icon: 'local_shipping' });

    const result = await updateTracking(txId, trackingInput, courierInput);

    if (result.success) {
      notify({ type: 'success', title: 'Envío Registrado', message: 'El comprador ha sido notificado.', icon: 'check_circle' });
      setShippingTx(null);
      setTrackingInput('');

      setTransactions(prev => ({
        ...prev,
        ventas: prev.ventas.map(t => t.id === txId ? { ...t, status: 'SHIPPED', trackingId: trackingInput, courier: courierInput } : t)
      }));
    } else {
      notify({ type: 'error', title: 'Error', message: 'No se pudo actualizar el seguimiento.', icon: 'error' });
    }
  };

  const handleConfirmReceipt = async (txId: string) => {
    // Only for shipping items - digital handshake
    const { updateTransactionStatus } = await import('../lib/transactions');
    notify({ type: 'info', title: 'Confirmando...', message: 'Registrando recepción del paquete...', icon: 'inventory' });

    const result = await updateTransactionStatus(txId, 'DELIVERED_PENDING_REVIEW');

    if (result.success) {
      notify({ type: 'success', title: 'Paquete Recibido', message: 'Tienes 48hs para revisar el producto.', icon: 'timer' });
      setTransactions(prev => ({
        ...prev,
        compras: prev.compras.map(t => t.id === txId ? { ...t, status: 'DELIVERED_PENDING_REVIEW' } : t)
      }));
    } else {
      notify({ type: 'error', title: 'Error', message: 'No se pudo confirmar la recepción.', icon: 'error' });
    }
  };

  // Helper components for the new design
  const handleCancelTransaction = async () => {
    if (!txToCancel || !user) return;

    const { cancelTransaction } = await import('../lib/transactions');
    setLoading(true); // Re-use loading or local state

    // Note: The UI says 3% penalty. The backend logic in cancelTransaction should ideally reflect this for buyers too if needed.
    // For now we just call the function.
    const result = await cancelTransaction(txToCancel, user.uid);
    setLoading(false);
    setCancelModalOpen(false);
    setTxToCancel(null);

    if (result.success) {
      notify({ type: 'success', title: 'Orden Cancelada', message: 'La transacción ha sido cancelada.', icon: 'cancel' });
      // Update local state
      setTransactions(prev => ({
        ...prev,
        compras: prev.compras.map(t => t.id === txToCancel ? { ...t, status: 'CANCELLED' } : t),
        ventas: prev.ventas.map(t => t.id === txToCancel ? { ...t, status: 'CANCELLED' } : t)
      }));
    } else {
      notify({ type: 'error', title: 'Error', message: 'No se pudo cancelar la orden.', icon: 'error' });
    }
  };

  const handleGenerateLabel = async (txId: string) => {
    setIsGeneratingLabel(true);
    notify({ type: 'info', title: 'Generando...', message: 'Conectando con Correo Argentino...', icon: 'cloud_sync' });
    
    try {
        const { generateShippingLabel } = await import('../lib/shipping');
        const tx = transactions.ventas.find(t => t.id === txId);
        
        const labelResult = await generateShippingLabel(txId, user.uid, tx?.buyerId || "");
        
        if (labelResult && labelResult.trackingNumber) {
            // Actualizar tracking en base de datos
            const { updateTracking } = await import('../lib/transactions');
            await updateTracking(txId, labelResult.trackingNumber, 'Correo Argentino');
            
            // Guardar url de la etiqueta si viene en el result (depende de como queramos manejarlo, en este ejemplo lo asumo para UI)
            notify({ type: 'success', title: '¡Etiqueta Generada!', message: 'Se ha creado el envío correctamente.', icon: 'check_circle' });
            
            setShippingTx(null);
            setTransactions(prev => ({
                ...prev,
                ventas: prev.ventas.map(t => t.id === txId ? { ...t, status: 'SHIPPED', trackingId: labelResult.trackingNumber, courier: 'Correo Argentino', labelUrl: labelResult.labelUrl } : t)
            }));
            
            if (labelResult.labelUrl) {
                window.open(labelResult.labelUrl, '_blank');
            }
        }
    } catch (err: any) {
        notify({ type: 'error', title: 'Error API', message: 'No pudimos generar la etiqueta: ' + err.message, icon: 'error' });
    } finally {
        setIsGeneratingLabel(false);
    }
  };

  const confirmCancel = async () => {
    await handleCancelTransaction();
  };

  const handleHideTransaction = (txId: string) => {
    const hidden = JSON.parse(localStorage.getItem('hiddenTxs') || '[]');
    if (!hidden.includes(txId)) {
      hidden.push(txId);
      localStorage.setItem('hiddenTxs', JSON.stringify(hidden));
    }
    setTransactions(prev => ({
      ...prev,
      compras: prev.compras.filter(t => t.id !== txId),
      ventas: prev.ventas.filter(t => t.id !== txId)
    }));
  };


  const MetricCard = ({ title, value, subtext, icon, color }: { title: string, value: string | number, subtext: string, icon: string, color: string }) => (
    <div className="bg-surface-container-lowest p-8 rounded-[32px] border border-outline-variant/50 shadow-premium flex items-start gap-6 relative overflow-hidden group">
      <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        <span className="material-symbols-outlined text-2xl font-black">{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-3xl font-black text-on-surface tracking-tighter mb-1">{value}</h4>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">{subtext}</p>
      </div>
    </div>
  );

  const ProgressStep = ({ label, active, completed, isLast }: { label: string, active: boolean, completed: boolean, isLast?: boolean }) => (
    <div className={`flex-1 flex flex-col items-center gap-3 ${isLast ? 'flex-0' : ''}`}>
      <div className="w-full flex items-center">
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${completed || active ? 'bg-primary' : 'bg-surface-container'}`} />
        {!isLast && <div className={`h-px w-full border-t border-dashed border-outline-variant/50 mx-2`} />}
      </div>
      <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${active ? 'text-primary' : completed ? 'text-on-surface' : 'text-outline'}`}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="bg-surface min-h-screen">
      <div className="max-w-[1440px] mx-auto px-6 py-10">

        {/* TOP NAV BAR (Mockup style) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
          <div>
            <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-1 transition-all">
              {activeTab === 'compras' ? 'Mis Compras' : activeTab === 'ventas' ? 'Vendedor Mercado' : activeTab === 'publicaciones' ? 'Mis Publicaciones' : activeTab === 'disputas' ? 'Panel de Disputas' : 'Configuración de Perfil'}
            </h1>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest leading-relaxed">
              {activeTab === 'compras' ? 'Rastrea tus órdenes y administra pagos protegidos.' : activeTab === 'ventas' ? 'Monitorea tus ingresos y optimiza tu rendimiento.' : activeTab === 'publicaciones' ? 'Gestiona tus productos activos en el mercado.' : activeTab === 'disputas' ? 'Gestiona disputas activas y resuelve conflictos.' : 'Mantén actualizada tu seguridad e insignias.'}
            </p>
          </div>

          <div className="flex overflow-x-auto snap-x scrollbar-hide bg-surface-container-lowest p-2 md:rounded-[24px] border-y md:border border-outline-variant/50 shadow-premium -mx-6 md:mx-0">
            {[
              { id: 'publicaciones', label: 'Publicaciones', icon: 'inventory_2' },
              { id: 'compras', label: 'Compras', icon: 'shopping_bag' },
              { id: 'ventas', label: 'Ventas', icon: 'payments' },
              { id: 'disputas', label: 'Disputas', icon: 'gavel', badge: [...transactions.compras, ...transactions.ventas].filter(t => t.status === 'DISPUTED').length },
              { id: 'perfil', label: 'Perfil', icon: 'settings', action: () => navigate('/settings') },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => tab.action ? tab.action() : setActiveTab(tab.id as any)}
                className={`snap-start shrink-0 px-6 md:px-8 py-3.5 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all flex items-center gap-3 ${activeTab === tab.id
                  ? 'bg-primary text-on-primary shadow-xl translate-y-[-2px]'
                  : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
                {tab.badge > 0 && <span className="size-5 bg-red-600 text-on-primary rounded-full text-[8px] font-black flex items-center justify-center animate-pulse">{tab.badge}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* KYC STATUS BANNER */}
        {userProfile?.verificationEvidence?.status && userProfile.verificationEvidence.status !== 'approved' && (
          <div className={`mb-12 p-6 rounded-[32px] border flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500 ${userProfile.verificationEvidence.status === 'pending'
            ? 'bg-amber-50 border-amber-100 text-amber-800'
            : userProfile.verificationEvidence.status === 'rejected'
              ? 'bg-rose-50 border-rose-100 text-rose-800'
              : 'bg-primary-container border-primary-100 text-on-primary-container'
            }`}>
            <div className="flex items-center gap-5">
              <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 ${userProfile.verificationEvidence.status === 'pending'
                ? 'bg-amber-500 text-on-primary'
                : userProfile.verificationEvidence.status === 'rejected'
                  ? 'bg-rose-500 text-on-primary'
                  : 'bg-primary text-on-primary'
                }`}>
                <span className="material-symbols-outlined text-2xl font-black">
                  {userProfile.verificationEvidence.status === 'pending' ? 'history' : userProfile.verificationEvidence.status === 'rejected' ? 'error' : 'verified_user'}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight">
                  {userProfile.verificationEvidence.status === 'pending' ? 'Verificación en Proceso' : userProfile.verificationEvidence.status === 'rejected' ? 'Verificación Rechazada' : 'Verifica tu Identidad'}
                </h4>
                <p className="text-[11px] font-bold opacity-70 uppercase tracking-widest mt-1">
                  {userProfile.verificationEvidence.status === 'pending'
                    ? 'Estamos revisando tus documentos. Esto suele tardar menos de 24hs.'
                    : userProfile.verificationEvidence.status === 'rejected'
                      ? `Motivo: ${userProfile.verificationEvidence.rejectionReason || 'Documentación no legible'}. Por favor, vuelve a intentarlo.`
                      : 'Aumenta tu reputación y desbloquea beneficios verificando tu identidad.'
                  }
                </p>
              </div>
            </div>
            <Link
              to="/settings"
              className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${userProfile.verificationEvidence.status === 'pending'
                ? 'bg-amber-500 text-on-primary hover:bg-amber-600'
                : userProfile.verificationEvidence.status === 'rejected'
                  ? 'bg-rose-500 text-on-primary hover:bg-rose-600'
                  : 'bg-primary text-on-primary hover:opacity-90'
                }`}
            >
              {userProfile.verificationEvidence.status === 'rejected' ? 'REINTENTAR AHORA' : 'GESTIONAR'}
            </Link>
          </div>
        )}

        {/* MAIN DASHBOARD CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* --- SIDEBAR PANEL --- */}
          <div className="lg:col-span-3 space-y-8">

            {/* Context-Specific Sidebars */}
            {activeTab === 'publicaciones' && (
              <div className="bg-surface-container-lowest p-6 rounded-[40px] border border-outline-variant/50 shadow-premium">
                <h3 className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em] pl-1 mb-6 text-center">
                  {new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="grid grid-cols-7 gap-y-4 text-center">
                  {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <span key={i} className="text-[9px] font-black text-outline">{d}</span>)}
                  {(() => {
                    const today = new Date();
                    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
                    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                    
                    // Get activity days with details
                    const activityDays = new Set<number>();
                    const dayActivities = new Map<number, { type: string, detail: string }[]>();

                    [...transactions.compras, ...transactions.ventas].forEach(t => {
                      const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
                      if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
                        const d = date.getDate();
                        activityDays.add(d);
                        if (!dayActivities.has(d)) dayActivities.set(d, []);
                        dayActivities.get(d)!.push({ type: t.type === 'compra' ? 'Compra' : 'Venta', detail: t.itemTitle || 'Producto' });
                      }
                      
                      if (t.status === 'CANCELLED' && t.updatedAt) {
                        const cancelDate = t.updatedAt?.toDate ? t.updatedAt.toDate() : new Date(t.updatedAt);
                        if (cancelDate.getMonth() === today.getMonth() && cancelDate.getFullYear() === today.getFullYear()) {
                          const cd = cancelDate.getDate();
                          activityDays.add(cd);
                          if (!dayActivities.has(cd)) dayActivities.set(cd, []);
                          dayActivities.get(cd)!.push({ type: 'Cancelación', detail: t.itemTitle || 'Producto' });
                        }
                      }
                    });
                    userItems.forEach(item => {
                      const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
                      if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
                        const d = date.getDate();
                        activityDays.add(d);
                        if (!dayActivities.has(d)) dayActivities.set(d, []);
                        dayActivities.get(d)!.push({ type: 'Publicación', detail: item.title });
                      }
                    });

                    return (
                      <>
                        {[...Array(firstDayOfMonth)].map((_, i) => <span key={`empty-${i}`} />)}
                        {[...Array(daysInMonth)].map((_, i) => {
                          const day = i + 1;
                          const isToday = day === today.getDate();
                          const hasActivity = activityDays.has(day);
                          const activities = dayActivities.get(day) || [];
                          
                          return (
                            <div key={day} className="relative group cursor-default">
                              <span className={`text-[10px] font-bold p-1 rounded-lg block transition-all ${
                                isToday 
                                  ? 'bg-primary text-on-primary font-black' 
                                  : hasActivity 
                                    ? 'bg-amber-100 text-amber-700 font-black hover:bg-amber-200'
                                    : 'text-on-surface hover:bg-surface'
                              }`}>
                                {day}
                              </span>
                              {hasActivity && !isToday && (
                                <div className="absolute -top-1 -right-1 size-1.5 bg-primary rounded-full border border-white" />
                              )}

                              {/* Hover Tooltip for Activity Details */}
                              {hasActivity && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-on-surface text-on-primary p-3 rounded-2xl shadow-premium-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] pointer-events-none origin-bottom">
                                  <h5 className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-2 border-b border-gray-700 pb-2">
                                    Revisión de Actividad
                                  </h5>
                                  <ul className="space-y-1.5 text-left text-[10px] font-bold">
                                    {activities.slice(0, 4).map((act, idx) => (
                                      <li key={idx} className="truncate">
                                        <span className={`mr-1.5 ${act.type === 'Compra' ? 'text-secondary' : act.type === 'Venta' ? 'text-emerald-400' : act.type === 'Cancelación' ? 'text-rose-500' : 'text-amber-400'}`}>[{act.type}]</span>
                                        <span className="text-outline-variant">{act.detail}</span>
                                      </li>
                                    ))}
                                    {activities.length > 4 && (
                                      <li className="text-on-surface-variant italic pt-1">y {activities.length - 4} más...</li>
                                    )}
                                  </ul>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[5px] border-transparent border-t-dark-800"></div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {activeTab === 'compras' && (
              <>
                <div className="bg-surface-container-lowest p-8 rounded-[40px] border border-outline-variant/50 shadow-premium space-y-8">
                  <h3 className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em] pl-1">Estado de Compra</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Todas las Compras', count: transactions.compras.length, icon: 'list', status: 'ALL' },
                      { label: 'Órdenes Activas', count: transactions.compras.filter(t => ['PAID_HELD', 'SHIPPED', 'DELIVERED_PENDING_REVIEW'].includes(t.status)).length, icon: 'order_approve', status: 'PAID_HELD' },
                      { label: 'Completadas', count: transactions.compras.filter(t => t.status === 'COMPLETED').length, icon: 'check_circle', status: 'COMPLETED' },
                      { label: 'Canceladas', count: transactions.compras.filter(t => t.status === 'CANCELLED').length, icon: 'cancel', status: 'CANCELLED' }
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => setStatusFilter(item.status as any)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${statusFilter === item.status ? 'bg-primary-container border-primary-100 text-primary shadow-sm translate-x-1' : 'border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/50'}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined text-xl">{item.icon}</span>
                          <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                        </div>
                        <span className={`size-6 rounded-lg flex items-center justify-center text-[10px] font-black ${statusFilter === item.status ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest'}`}>{item.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-8 rounded-[40px] border border-outline-variant/50 shadow-premium">
                  <h3 className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em] pl-1 mb-6">Periodo</h3>
                  <div className="relative">
                    <select className="w-full bg-surface border border-outline-variant/50 rounded-2xl py-4 px-6 font-bold text-on-surface outline-none appearance-none cursor-pointer text-xs">
                      <option>Últimos 30 días</option>
                      <option>Últimos 3 meses</option>
                      <option>Historial completo</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div className="bg-primary-container p-8 rounded-[40px] border border-primary-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary font-black">verified_user</span>
                    <h4 className="text-[11px] font-black text-on-primary-container uppercase tracking-widest">Protección Pago Protegido</h4>
                  </div>
                  <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest leading-relaxed">
                    Tu pago se mantiene seguro en depósito de garantía. Los fondos solo se liberan al vendedor una vez que confirmas que recibiste el artículo en la condición descrita.
                  </p>
                </div>
              </>
            )}

            {activeTab === 'ventas' && (
              <>
                <div className="bg-surface-container-lowest p-8 rounded-[40px] border border-outline-variant/50 shadow-premium space-y-8">
                  <h3 className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em] pl-1">Filtrar por Estado</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Todas las Ventas', count: transactions.ventas.length, icon: 'list', status: 'ALL' },
                      { label: 'Esperando Envío', count: transactions.ventas.filter(t => t.status === 'PAID_HELD' && t.deliveryMethod === 'SHIPPING').length, icon: 'local_shipping', status: 'PAID_HELD' },
                      { label: 'En Inspección', count: transactions.ventas.filter(t => t.status === 'DELIVERED_PENDING_REVIEW').length, icon: 'visibility', status: 'DELIVERED_PENDING_REVIEW' },
                      { label: 'Completadas', count: transactions.ventas.filter(t => t.status === 'COMPLETED').length, icon: 'check_circle', status: 'COMPLETED' }
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => setStatusFilter(item.status as any)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${statusFilter === item.status ? 'bg-primary border-primary-vibrant text-on-primary shadow-xl translate-x-1' : 'border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/50'}`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined text-xl">{item.icon}</span>
                          <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                        </div>
                        <span className={`size-6 rounded-lg flex items-center justify-center text-[10px] font-black ${statusFilter === item.status ? 'bg-surface-container-lowest/20' : 'bg-surface-container-lowest'}`}>{item.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-8 rounded-[40px] border border-outline-variant/50 shadow-premium">
                  <h3 className="text-[10px] font-black text-on-surface uppercase tracking-[0.2em] pl-1 mb-8">
                    Resumen Rápido
                  </h3>
                  <div className="space-y-4">
                    <p className="text-[11px] font-bold text-on-surface-variant flex justify-between">
                      <span className="uppercase tracking-widest">En preparación:</span>
                      <span className="text-on-surface font-black">{transactions.ventas.filter(t => t.status === 'PAID_HELD').length}</span>
                    </p>
                    <p className="text-[11px] font-bold text-on-surface-variant flex justify-between">
                      <span className="uppercase tracking-widest">Enviados:</span>
                      <span className="text-on-surface font-black">{transactions.ventas.filter(t => t.status === 'SHIPPED').length}</span>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* --- MAIN CONTENT PANEL --- */}
          <div className="lg:col-span-9 space-y-10">

            {/* SELLER METRICS (Only on Sales Tab) */}
            {activeTab === 'ventas' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
                <MetricCard
                  title="Saldo Pendiente"
                  value={`$${(transactions.ventas.filter(t => ['PAID_HELD', 'SHIPPED', 'DELIVERED_PENDING_REVIEW'].includes(t.status)).reduce((acc, curr) => acc + (curr.amountProduct || curr.amount || 0), 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                  subtext="Fondos en periodo de garantía"
                  icon="account_balance_wallet"
                  color="bg-amber-50 text-amber-500"
                />
                <MetricCard
                  title="Saldo Disponible"
                  value={`$${(userProfile?.wallet?.available || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                  subtext="Retirar fondos ahora →"
                  icon="savings"
                  color="bg-primary-container text-primary"
                />
                <MetricCard
                  title="Ventas Totales Históricas"
                  value={`$${(transactions.ventas.filter(t => t.status === 'COMPLETED').reduce((acc, curr) => acc + (curr.amountProduct || curr.amount || 0), 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                  subtext={`En ${transactions.ventas.filter(t => t.status === 'COMPLETED').length} transacciones`}
                  icon="trending_up"
                  color="bg-emerald-50 text-emerald-500"
                />
              </div>
            )}

            {/* DASHBOARD HEADER SEARCH & ACTIONS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pl-2">
              <h2 className="text-2xl font-black text-on-surface tracking-tighter">
                {activeTab === 'compras' ? 'Compras Recientes' : activeTab === 'ventas' ? 'Ventas Recientes' : activeTab === 'publicaciones' ? 'Mis Productos Activos' : 'Nodos de Seguridad'}
              </h2>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 text-[10px] font-black uppercase tracking-widest text-on-surface hover:bg-surface transition-all focus-within:ring-2 focus-within:ring-primary-100">
                  <span className="material-symbols-outlined text-lg">filter_alt</span>
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="bg-transparent outline-none w-20 placeholder:text-on-surface-variant font-black uppercase"
                  />
                </button>
                <button
                  onClick={() => navigate('/publish')}
                  className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-on-surface text-on-primary text-[10px] font-black uppercase tracking-widest hover:bg-inverse-surface transition-all shadow-xl shadow-dark-800/10 active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  Nueva Publicación
                </button>
                <button className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/50 text-[10px] font-black uppercase tracking-widest text-on-surface hover:bg-surface transition-all">
                  <span className="material-symbols-outlined text-lg">file_download</span>
                  Exportar
                </button>
              </div>
            </div>

            {/* TRANSACTIONS LIST */}
            <div className="space-y-8">
              {loading ? (
                  <div className="flex flex-col items-center justify-center py-32">
                    <LoadingSpinner size="lg" text="Sincronizando historial..." />
                  </div>
                ) : activeTab === 'publicaciones' ? (
                  filteredUserItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredUserItems.map(item => (
                      <div key={item.id} className="bg-surface-container-lowest rounded-[40px] border border-outline-variant/50 shadow-premium overflow-hidden transition-all hover:shadow-premium-lg group animate-in fade-in duration-500">
                        <div className="p-8">
                          <div className="flex gap-6">
                            <div className="size-24 rounded-2xl bg-surface shrink-0 overflow-hidden border border-outline-variant/30 flex items-center justify-center">
                              {item.images && item.images[0] ? (
                                <img src={item.images[0]} className="w-full h-full object-cover" alt={item.title} />
                              ) : (
                                <span className="material-symbols-outlined text-3xl text-outline-variant">image</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">{item.category}</p>
                              <h3 className="text-xl font-black text-on-surface tracking-tight group-hover:text-red-600 transition-colors line-clamp-1">{item.title}</h3>
                              <div className="flex items-baseline gap-2 pt-1">
                                <p className="text-2xl font-black text-on-surface">${item.price.toLocaleString()}</p>
                                {item.oldPrice && item.oldPrice > item.price && (
                                  <p className="text-sm font-bold text-on-surface-variant line-through opacity-70">
                                    ${item.oldPrice.toLocaleString()}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="size-2 bg-emerald-500 rounded-full"></span>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">Activo</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3 mt-8">
                            <button onClick={() => navigate(`/product/${item.id}`)} className="flex-1 py-3 bg-surface-container-lowest text-on-surface rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-surface-container transition-all">Ver Publicación</button>
                            <button
                              onClick={() => handleToggleFeatured(item)}
                              className={`flex-1 py-3 border rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${item.isFeatured
                                ? 'bg-amber-50 border-amber-200 text-amber-600'
                                : 'bg-surface-container-lowest border-outline-variant/50 text-on-surface hover:bg-surface'
                                }`}
                            >
                              <span className={`material-symbols-outlined text-sm ${item.isFeatured ? 'fill-1' : ''}`}>bolt</span>
                              {item.isFeatured ? 'Destacado' : 'Destacar'}
                            </button>
                            <button onClick={() => navigate(`/publish?edit=${item.id}`)} className="size-10 flex items-center justify-center bg-surface-container-lowest border border-outline-variant/50 text-on-surface rounded-xl hover:bg-surface transition-all">
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button onClick={() => setItemToDelete(item.id)} className="size-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all">
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-surface-container-lowest rounded-[40px] border border-outline-variant/50 shadow-premium">
                    <div className="bg-surface-container-lowest size-24 rounded-full flex items-center justify-center mx-auto mb-8">
                      <span className="material-symbols-outlined text-4xl text-outline">inventory</span>
                    </div>
                    <h3 className="text-3xl font-black text-on-surface mb-4 uppercase tracking-tighter">No tienes publicaciones</h3>
                    <p className="text-sm font-bold text-on-surface-variant mb-10 max-w-sm mx-auto uppercase">Comienza a vender tus activos en nuestra red segura hoy mismo.</p>
                    <Link to="/publish" className="inline-block bg-red-600 text-on-primary px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl transition-transform active:scale-95">Publicar un Producto</Link>
                  </div>
                )
              ) : list.length > 0 ? (
                activeTab === 'compras' ? (
                  <MyPurchases
                    purchases={list}
                    formatDate={formatDate}
                    onConfirmReceipt={handleConfirmReceipt}
                    onReleaseFunds={handleReleaseFunds}
                    onHide={handleHideTransaction}
                    reviewedIds={reviewedTransactions}
                    onOpenReview={(tx) => {
                      setSelectedTransaction(tx);
                      setReviewModalOpen(true);
                    }}
                    onCancel={(id) => {
                      setTxToCancel(id);
                      setCancelModalOpen(true);
                    }}
                  />
                ) : (
                  <MySales
                    sales={list}
                    formatDate={formatDate}
                    onUpdateTracking={handleUpdateTracking}
                    shippingTx={shippingTx}
                    setShippingTx={setShippingTx}
                    trackingInput={trackingInput}
                    setTrackingInput={setTrackingInput}
                    courierInput={courierInput}
                    setCourierInput={setCourierInput}
                    handleUpdateTracking={handleUpdateTracking}
                    handleManualDelivery={(txId) => setValidatingTx(txId)}
                    handleGenerateLabel={handleGenerateLabel}
                    isGeneratingLabel={isGeneratingLabel}
                  />
                )
              ) : (
                <div className="text-center py-24 bg-surface-container-lowest rounded-[40px] border border-outline-variant/50 shadow-premium">
                  <div className="bg-surface-container-lowest size-24 rounded-full flex items-center justify-center mx-auto mb-8">
                    <span className="material-symbols-outlined text-4xl text-outline">history_toggle_off</span>
                  </div>
                  <h3 className="text-3xl font-black text-on-surface mb-4 uppercase tracking-tighter">No se encontró actividad</h3>
                  <p className="text-sm font-bold text-on-surface-variant mb-10 max-w-sm mx-auto uppercase">Explora nuestro mercado global para comenzar tu red de confianza.</p>
                  <Link to="/" className="inline-block bg-primary text-on-primary px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl transition-transform active:scale-95">Explorar Productos</Link>
                </div>
              )}

              {/* DISPUTAS TAB CONTENT */}
              {activeTab === 'disputas' && (
                <div className="space-y-6">
                  {(() => {
                    const allDisputed = [...transactions.compras, ...transactions.ventas].filter(t => t.status === 'DISPUTED');
                    if (allDisputed.length === 0) return (
                      <div className="text-center py-24 bg-surface-container-lowest rounded-[40px] border border-outline-variant/50 shadow-premium">
                        <div className="bg-emerald-50 size-24 rounded-full flex items-center justify-center mx-auto mb-8">
                          <span className="material-symbols-outlined text-4xl text-emerald-400">verified</span>
                        </div>
                        <h3 className="text-3xl font-black text-on-surface mb-4 uppercase tracking-tighter">Sin Disputas Activas</h3>
                        <p className="text-sm font-bold text-on-surface-variant max-w-sm mx-auto uppercase">¡Todo en orden! No tienes disputas pendientes.</p>
                      </div>
                    );
                    return allDisputed.map((deal: any) => (
                      <div key={deal.id} className="bg-surface-container-lowest rounded-[32px] border border-red-100 shadow-premium p-8 flex flex-col md:flex-row items-start md:items-center gap-6 hover:shadow-xl transition-all">
                        <div className="size-20 rounded-2xl bg-surface overflow-hidden border border-outline-variant/30 shrink-0">
                          <img src={deal.itemImage || 'https://picsum.photos/200'} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-red-100 animate-pulse">Disputa Activa</span>
                            <span className="text-[9px] font-black text-outline uppercase tracking-widest">ORDEN #{deal.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                          <h4 className="text-xl font-black text-on-surface tracking-tight">{deal.itemTitle || 'Producto'}</h4>
                          <p className="text-xs font-bold text-on-surface-variant">Monto: <span className="text-on-surface">${(deal.amountProduct || deal.amount)?.toLocaleString()}</span> · {deal.type === 'compra' ? '🛒 Eres el Comprador' : '🏪 Eres el Vendedor'}</p>
                          {deal.disputeReason && (
                            <p className="text-xs font-bold text-red-400 italic">Motivo: "{deal.disputeReason.slice(0, 100)}"</p>
                          )}
                        </div>
                        <button
                          onClick={() => navigate(`/dispute/${deal.id}`)}
                          className="px-8 py-4 bg-red-600 text-on-primary text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-red-700 shadow-xl shadow-red-600/20 flex items-center gap-2 shrink-0"
                        >
                          <span className="material-symbols-outlined text-sm">forum</span>
                          Ir a Mediación
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* HELP BANNER */}
              <div className="bg-surface-container-lowest p-8 rounded-[40px] border border-outline-variant/50 shadow-premium flex flex-col md:flex-row items-center gap-8 justify-between">
                <div className="flex items-center gap-6">
                  <div className="size-14 bg-secondary-container text-secondary rounded-2xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined font-black">help</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-on-surface uppercase tracking-tight">¿Necesitas ayuda con una orden?</h4>
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest pt-1">Visita nuestro Centro de Resolución para asistencia con envíos o calidad del ítem.</p>
                  </div>
                </div>
                <Link to="/resolution-center" className="w-full md:w-auto bg-surface border border-outline-variant/30 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-on-surface hover:bg-surface-container-lowest transition-all text-center">Abrir Caso</Link>
              </div>
            </div>
          </div>
        </div >

        {/* PROFILE TAB CONTENT REMOVED - NOW IN /SETTINGS */}
      </div >

      {/* DEV ZONE: RESET DATABASE (ADMIN ONLY) */}
      {
        userProfile?.role === 'admin' ? (
          <div className="max-w-[1440px] mx-auto px-6 py-8 flex justify-center">
            <button
              onClick={async () => {
                const confirm1 = await showConfirm("RESET TOTAL", "⚠️ ¿RESET TOTAL? Esto borrará TODAS las transacciones y reseteará las billeteras a $0. Esta acción es irreversible.", "Resetear", "Cancelar", "dangerous");
                if (confirm1) {
                  const { resetPlatformData } = await import('../lib/admin');
                  const result = await resetPlatformData();
                  if (result.success) {
                    await showAlert("Base de datos reseteada", "Base de datos reseteada correctamente.", "check_circle");
                    window.location.reload();
                  } else {
                    await showAlert("Error", "Error al resetear: " + result.error, "error");
                  }
                }
              }}
              className="bg-red-50 border border-red-200 text-red-600 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">dangerous</span>
              Developer Reset (Limpiar DB)
            </button>
          </div>
        ) : (
      <div className="max-w-[1440px] mx-auto px-6 py-8 flex justify-center">
        {/* Herramienta de promoción a admin removida por seguridad */}
      </div>
        )
      }


      {/* MODAL COMPONENTS */}
      {
        selectedTransaction && (
          <ReviewModal
            isOpen={reviewModalOpen}
            onClose={() => { setReviewModalOpen(false); setSelectedTransaction(null); }}
            transactionId={selectedTransaction.id}
            itemId={selectedTransaction.itemId}
            itemTitle={selectedTransaction.itemTitle}
            sellerId={selectedTransaction.sellerId}
            onReviewSubmitted={async () => {
              if (user) {
                const data = await getUserTransactions(user.uid);
                setTransactions(data);
                const reviewed = new Set<string>();
                for (const transaction of data.compras) {
                  const review = await getReviewForTransaction(transaction.id);
                  if (review) reviewed.add(transaction.id);
                }
                setReviewedTransactions(reviewed);
              }
            }}
          />
        )
      }

      {/* VALIDATE DELIVERY MODAL */}
      {
        validatingTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4">
            <div className="bg-surface-container-lowest p-8 rounded-[32px] shadow-2xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="size-16 bg-primary-container text-primary rounded-2xl mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl font-black">qr_code_scanner</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-on-surface mb-2">Validar Entrega</h3>
                <p className="text-sm font-bold text-on-surface-variant">
                  Ingresa el código que te proporcionó el comprador al recibir el producto.
                </p>
              </div>
              <input
                type="text"
                placeholder="Ej. XYZ123"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                className="w-full text-center px-4 py-4 rounded-xl bg-surface border border-outline-variant/50 outline-none font-black text-xl tracking-[0.2em] uppercase focus:border-primary-vibrant"
              />
              <div className="flex gap-4">
                <button
                  onClick={() => { setValidatingTx(null); setQrInput(''); }}
                  className="flex-1 py-4 bg-surface-container-lowest text-on-surface rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-surface-container transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleValidateDelivery(validatingTx)}
                  disabled={!qrInput}
                  className="flex-1 py-4 bg-primary text-on-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg disabled:opacity-50"
                >
                  Validar
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* DELETE CONFIRMATION MODAL */}
      {
        itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4">
            <div className="bg-surface-container-lowest p-8 rounded-[32px] shadow-2xl max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="size-16 bg-red-50 text-red-500 rounded-2xl mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl font-black">warning</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-on-surface mb-2">¿Eliminar Publicación?</h3>
                <p className="text-sm font-bold text-on-surface-variant">Esta acción no se puede deshacer. El ítem dejará de estar visible en el marketplace.</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-4 bg-surface-container-lowest text-on-surface rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-surface-container transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteItem(itemToDelete)}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-red-600 text-on-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* CANCEL CONFIRMATION MODAL */}
      {txToCancel && (
        <ConfirmModal 
            isOpen={cancelModalOpen}
            onClose={() => setCancelModalOpen(false)}
            onConfirm={confirmCancel}
            title="Cancelar Trato"
            description={
                <>
                    <p>¿Estás seguro de cancelar este trato?</p>
                    <p className="mt-2 text-sm text-gray-500">Se realizará un reembolso total de tu dinero a tu cuenta.</p>
                    <p className="mt-2">Esta acción es irreversible.</p>
                </>
            }
            confirmText="Sí, Cancelar Trato"
            cancelText="Volver"
            variant="danger"
        />
      )}

      {/* Release Funds Modal */}
      <ConfirmModal 
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={confirmReleaseFunds}
        title="Liberar Pago"
        description="¿Estás seguro de que recibiste el producto en condiciones y deseas liberar el pago al vendedor? El vendedor recibirá el dinero y será notificado. Esta acción es irreversible."
        confirmText="Aprobar y Liberar Pago"
        cancelText="Aún no"
        variant="success"
      />

      {/* Feature Modal */}
      {itemToFeature && (
        <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative border border-outline-variant/50 animate-in zoom-in-95">
            <button onClick={() => setItemToFeature(null)} className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="size-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl text-amber-500 fill-1">bolt</span>
            </div>
            <h3 className="text-2xl font-black text-on-surface tracking-tighter mb-2">Destacar Publicación</h3>
            <p className="text-sm font-bold text-on-surface-variant leading-relaxed mb-8">
              Al destacar tu producto "{itemToFeature.title}", aparecerá en la sección de ofertas relámpago con máxima prioridad.
              <br /><br />
              <span className="text-amber-500">Costo:</span> Destacar tiene un costo de <strong>$500 ARS</strong> que se debitará de tu billetera. <br />
              Si tienes nivel <strong>Oro o Diamante</strong>, ¡este beneficio es completamente GRATIS!
            </p>
            <div className="flex gap-4">
              <button onClick={() => setItemToFeature(null)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors">Cancelar</button>
              <button onClick={() => confirmToggleFeatured(itemToFeature.id, false)} className="flex-1 py-4 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all">Aceptar y Destacar</button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
