import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useDialog } from '../context/DialogContext';
import { subscribeToUserTransactions, TransactionData } from '../lib/transactions';
import { subscribeToUserWalletMovements } from '../lib/users';

const Wallet = () => {
  const { userProfile, user } = useAuth();
  const { showAlert, showConfirm } = useDialog();
  const navigate = useNavigate();
  const wallet = userProfile?.wallet || { available: 0, inEscrow: 0, pending: 0, currency: 'ARS' };
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    let movementsData: any[] = [];
    let legacyTransactions: any = { compras: [], ventas: [], retiros: [] };

    const updateCombinedMovements = () => {
      const existingRefIds = new Set(movementsData.map(m => m.referenceId));

      const mappedLegacy: any[] = [
        ...legacyTransactions.compras
          .filter((t: any) => !existingRefIds.has(t.id))
          .map((t: any) => ({
            id: `legacy-${t.id}`,
            uid: user.uid,
            type: 'BUY_DEDUCTION',
            amount: t.amountTotal || t.total || t.amount,
            referenceId: t.id,
            itemTitle: t.itemTitle,
            description: `Compra (Sistema Anterior): ${t.itemTitle}`,
            timestamp: t.createdAt
          })),
        ...legacyTransactions.ventas
          .filter((t: any) => !existingRefIds.has(t.id))
          .map((t: any) => ({
            id: `legacy-${t.id}`,
            uid: user.uid,
            type: t.status === 'COMPLETED' ? 'SALE_REVENUE' : 'ESCROW_HOLD',
            amount: t.status === 'COMPLETED' ? (t.amountProduct || t.amount) : t.amountProduct || t.amount,
            referenceId: t.id,
            itemTitle: t.itemTitle,
            description: t.status === 'COMPLETED' ? `Venta (Sistema Anterior): ${t.itemTitle}` : `Venta en Garantía (Ant.): ${t.itemTitle}`,
            timestamp: t.createdAt
          })),
        ...(legacyTransactions.retiros || [])
          .filter((t: any) => !existingRefIds.has(t.id))
          .map((t: any) => ({
            id: `legacy-${t.id}`,
            uid: user.uid,
            type: t.status === 'completed' ? 'WITHDRAWAL_COMPLETED' : 'WITHDRAWAL_REQUEST',
            amount: t.amount,
            referenceId: t.id,
            description: `Retiro Bancario (Sistema Anterior)`,
            timestamp: t.createdAt
          }))
      ];

      const allMovements = [...movementsData, ...mappedLegacy].sort((a, b) => {
        const dateA = a.timestamp?.seconds || 0;
        const dateB = b.timestamp?.seconds || 0;
        return dateB - dateA;
      });

      setMovements(allMovements);
      setLoadingMovements(false);
    };

    const unsubMovements = subscribeToUserWalletMovements(user.uid, (data) => {
      movementsData = data;
      updateCombinedMovements();
    });

    const unsubLegacy = subscribeToUserTransactions(user.uid, (data) => {
      legacyTransactions = data;
      updateCombinedMovements();
    });

    return () => {
      unsubMovements();
      unsubLegacy();
    };
  }, [user]);

  // Chart Data Calculation
  const chartData = React.useMemo(() => {
    const days = 12;
    const data = new Array(days).fill(0);
    const today = new Date();

    movements.forEach(mv => {
      if (!mv.timestamp?.seconds) return;
      if (mv.type === 'WITHDRAWAL_REQUEST') return;
      const txDate = new Date(mv.timestamp.seconds * 1000);
      const diffTime = Math.abs(today.getTime() - txDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= days) {
        data[days - diffDays] += mv.amount;
      }
    });

    // Normalize to percentage for height (max 100%)
    const maxVal = Math.max(...data, 1);
    return data.map(val => ({ value: val, height: Math.max((val / maxVal) * 100, 10) }));
  }, [movements]);

  // Bank Logic
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({
    cbu: userProfile?.bankDetails?.cbu || '',
    alias: userProfile?.bankDetails?.alias || '',
    bankName: userProfile?.bankDetails?.bankName || '',
    holderName: userProfile?.bankDetails?.holderName || '',
    accountType: userProfile?.bankDetails?.accountType || 'CA'
  });

  const [isValidating, setIsValidating] = useState(false);

  // Sync form with profile when it loads
  useEffect(() => {
    if (userProfile?.bankDetails) {
      setBankForm(prev => ({
        ...prev,
        ...userProfile.bankDetails
      }));
    }
  }, [userProfile]);

  // Auto-fill mock verification when CBU or Alias is entered
  useEffect(() => {
    const timer = setTimeout(async () => {
      const { cbu, alias } = bankForm;
      const cleanInput = (cbu || alias).trim();

      if ((cleanInput.length === 22 || (cleanInput.includes('.') && cleanInput.length > 5)) && !bankForm.bankName) {
        setIsValidating(true);
        // Simulate Coelsa/Link lookup
        await new Promise(r => setTimeout(r, 1000));

        const { identifyBank, identifyHolder } = await import('../lib/banking');
        const mockBank = identifyBank(cleanInput);
        const mockHolder = identifyHolder(cleanInput, userProfile?.displayName || '');

        setBankForm(prev => ({
          ...prev,
          bankName: mockBank,
          holderName: mockHolder
        }));
        setIsValidating(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [bankForm.cbu, bankForm.alias]);

  const handleLinkBank = async () => {
    if (!user?.uid) return;
    const { updateUserProfile } = await import('../lib/users');
    const result = await updateUserProfile(user.uid, { bankDetails: bankForm });
    if (result.success) {
      await showAlert('Éxito', 'Datos bancarios vinculados correctamente.', 'check_circle');
      setShowBankModal(false);
      window.location.reload();
    } else {
      await showAlert('Error', 'Error al guardar datos bancarios.', 'error');
    }
  };



  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 pb-24 bg-light-50 min-h-screen">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-dark-800 mb-2">Mi Billetera Digital</h1>
        <p className="text-sm font-bold text-gray-400">Administra tus ganancias, fondos en garantía y retiros</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-10">
        <div className="lg:col-span-12 xl:col-span-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 p-8 text-white rounded-[40px] shadow-2xl flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 size-32 bg-primary-vibrant/20 blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
              <p className="text-[10px] font-black opacity-50 mb-6 uppercase tracking-[0.2em] relative z-10">Total Disponible</p>
              <p className="text-4xl font-black mb-10 relative z-10">${wallet.available.toLocaleString()}</p>
              <div className="bg-primary-vibrant text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20 w-fit relative z-10">
                Activo Verificado
              </div>
            </div>

            <div className="bg-white p-8 text-dark-800 rounded-[40px] shadow-premium border border-light-200 flex flex-col">
              <p className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-[0.2em]">En Garantía</p>
              <p className="text-3xl font-black mb-10">${wallet.inEscrow.toLocaleString()}</p>
              <div className="bg-primary-50 text-primary-vibrant px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-primary-100 w-fit">
                Fondos Protegidos
              </div>
            </div>

            <div className="bg-white p-8 text-dark-800 rounded-[40px] shadow-premium border border-light-200 flex flex-col">
              <p className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-[0.2em]">Liquidación Pendiente</p>
              <p className="text-3xl font-black mb-10">${wallet.pending.toLocaleString()}</p>
              <div className="bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 w-fit">
                En Proceso
              </div>
            </div>
          </div>

          <div className="bg-white p-4 md:p-10 rounded-4xl border border-light-200 shadow-premium">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-xl font-black text-dark-800 mb-1">Volumen de Actividad</h3>
                <p className="text-xs font-bold text-gray-400">Movimientos agregados en los últimos 12 días</p>
              </div>
              <div className="bg-light-100 px-4 py-2 rounded-xl text-dark-800 font-black text-[10px] uppercase tracking-widest">
                Sincronización en Tiempo Real
              </div>
            </div>
            <div className="h-48 w-full flex items-end justify-between gap-3 px-4">
              {chartData.map((d, i) => (
                <div
                  key={i}
                  className="w-full bg-dark-800/10 rounded-xl hover:bg-gradient-to-t hover:from-primary-600 hover:to-indigo-600 transition-all cursor-pointer group relative hover:shadow-lg hover:shadow-primary-500/30"
                  style={{ height: Math.max(d.height, 5) + '%' }}
                >
                  <div className="absolute -top-4 md:p-10 left-1/2 -translate-x-1/2 bg-dark-800 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    ${d.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-4xl border border-light-200 shadow-premium overflow-hidden">
            <div className="px-4 md:px-10 py-8 border-b border-light-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-dark-800">Historial de Transacciones</h3>
              <button className="text-[10px] font-black text-primary-vibrant uppercase tracking-widest hover:underline transition-all">Descargar CSV</button>
            </div>

            <div className="p-0">
              {loadingMovements ? (
                <div className="p-6 md:p-20 text-center">
                  <span className="material-symbols-outlined animate-spin text-4xl text-primary-vibrant mb-4">progress_activity</span>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cargando movimientos...</p>
                </div>
              ) : movements.length === 0 ? (
                <div className="p-6 md:p-20 text-center">
                  <div className="size-16 bg-light-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-gray-400">history</span>
                  </div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    No hay movimientos registrados en este período.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-light-100">
                  {movements.map((mv) => {
                    const isPositive = ['SALE_REVENUE', 'ESCROW_RELEASE', 'PLATFORM_REVENUE'].includes(mv.type);
                    const isEscrow = ['ESCROW_HOLD', 'ESCROW_RELEASE'].includes(mv.type);

                    return (
                      <div key={mv.id} className="p-6 hover:bg-light-50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                          <div className={`size-12 rounded-2xl flex items-center justify-center ${mv.type === 'ESCROW_HOLD' ? 'bg-primary-50 text-primary-vibrant' :
                            mv.type === 'ESCROW_RELEASE' ? 'bg-emerald-50 text-emerald-600' :
                              mv.type === 'SALE_REVENUE' ? 'bg-emerald-50 text-emerald-600' :
                                mv.type === 'PLATFORM_REVENUE' ? 'bg-indigo-50 text-indigo-600' :
                                  mv.type === 'BUY_DEDUCTION' ? 'bg-rose-50 text-rose-600' :
                                    'bg-gray-50 text-gray-600'
                            }`}>
                            <span className="material-symbols-outlined">
                              {mv.type === 'ESCROW_HOLD' ? 'shield' :
                                mv.type === 'ESCROW_RELEASE' ? 'lock_open' :
                                  mv.type === 'SALE_REVENUE' ? 'payments' :
                                    mv.type === 'PLATFORM_REVENUE' ? 'trending_up' :
                                      mv.type === 'BUY_DEDUCTION' ? 'shopping_cart' :
                                        mv.type === 'FEE_PROTECTION' ? 'verified_user' :
                                          'account_balance_wallet'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-black text-dark-800 mb-1">{mv.itemTitle || mv.description}</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${isEscrow ? 'bg-primary-50 text-primary-vibrant border-primary-100' :
                                mv.type === 'SALE_REVENUE' || mv.type === 'PLATFORM_REVENUE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  'bg-gray-50 text-gray-500 border-gray-100'
                                }`}>
                                {mv.type === 'ESCROW_HOLD' ? 'PROTECCIÓN ESCROW' :
                                  mv.type === 'ESCROW_RELEASE' ? 'LIBERACIÓN DE FONDOS' :
                                    mv.type === 'SALE_REVENUE' ? 'GANANCIA POR VENTA' :
                                      mv.type === 'BUY_DEDUCTION' ? 'PAGO REALIZADO' :
                                        mv.type === 'PLATFORM_REVENUE' ? 'INGRESO PLATAFORMA' :
                                          mv.type === 'WITHDRAWAL_REQUEST' ? 'SOLICITUD RETIRO' :
                                            mv.type === 'WITHDRAWAL_COMPLETED' ? 'RETIRO COMPLETADO' :
                                              mv.type === 'PENALTY' ? 'PENALIZACIÓN' :
                                                mv.type.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400">
                                {mv.timestamp?.seconds ? new Date(mv.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-black ${isPositive ? 'text-emerald-600' : 'text-dark-800'}`}>
                            {isPositive ? '+' : '-'}${mv.amount.toLocaleString()}
                          </p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            {mv.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-4 xl:sticky xl:top-6 lg:p-24 h-fit">
          <div className="bg-white p-4 md:p-10 rounded-4xl border-2 border-dark-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 size-20 bg-dark-800/5 -mr-5 -mt-5 rounded-full"></div>
            <h3 className="text-2xl font-black text-dark-800 mb-2">Mi Billetera Vinculada</h3>
            <p className="text-[10px] text-gray-400 font-bold mb-10 leading-relaxed">
              El dinero de tus ventas se acredita directamente en tu Mercado Pago mediante nuestra tecnología de cobros fraccionados (Split Payments).
            </p>
            <div className="space-y-6">
              <div className="pt-4">
                <label className="block text-[10px] font-black text-gray-400 mb-6 uppercase tracking-widest ml-1">Cuenta Receptora</label>
                <button
                  onClick={() => navigate('/settings?tab=billing')}
                  className={`w-full py-5 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${userProfile?.mercadoPagoOAuth?.accessToken ? 'bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'}`}
                >
                  <span className="material-symbols-outlined text-sm">handshake</span>
                  {userProfile?.mercadoPagoOAuth?.accessToken ? `Mercado Pago Vinculado` : 'Vincular Mercado Pago'}
                </button>
              </div>

              <div className="bg-sky-50/50 p-6 rounded-3xl border border-sky-100/50">
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-sky-600 text-xl font-black">bolt</span>
                  <p className="text-[10px] font-bold text-sky-900/70 leading-relaxed uppercase">
                    Las ventas impactan inmediatamente en tu cuenta personal de Mercado Pago. La comisión de la plataforma se separa en tiempo real y no necesitás gestionar retiros de saldo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
     </div>
  );
};

export default Wallet;
