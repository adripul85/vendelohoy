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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
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

          <div className="bg-white p-10 rounded-4xl border border-light-200 shadow-premium">
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
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-dark-800 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    ${d.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-4xl border border-light-200 shadow-premium overflow-hidden">
            <div className="px-10 py-8 border-b border-light-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-dark-800">Historial de Transacciones</h3>
              <button className="text-[10px] font-black text-primary-vibrant uppercase tracking-widest hover:underline transition-all">Descargar CSV</button>
            </div>

            <div className="p-0">
              {loadingMovements ? (
                <div className="p-20 text-center">
                  <span className="material-symbols-outlined animate-spin text-4xl text-primary-vibrant mb-4">progress_activity</span>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cargando movimientos...</p>
                </div>
              ) : movements.length === 0 ? (
                <div className="p-20 text-center">
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

        <div className="lg:col-span-12 xl:col-span-4 xl:sticky xl:top-24 h-fit">
          <div className="bg-white p-10 rounded-4xl border-2 border-dark-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 size-20 bg-dark-800/5 -mr-5 -mt-5 rounded-full"></div>
            <h3 className="text-2xl font-black text-dark-800 mb-2">Cobros Automáticos</h3>
            <p className="text-[10px] text-gray-400 font-bold mb-10 leading-relaxed">
              El dinero de tus ventas se transferirá directamente a esta cuenta.
            </p>
            <div className="space-y-6">
              <div className="pt-4">
                <label className="block text-[10px] font-black text-gray-400 mb-6 uppercase tracking-widest ml-1">Cuenta de Destino</label>
                <button
                  onClick={() => setShowBankModal(true)}
                  className={`w-full py-5 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${userProfile?.bankDetails?.cbu ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'border-dashed border-light-200 text-gray-400 hover:bg-light-50'}`}
                >
                  <span className="material-symbols-outlined text-sm">account_balance</span>
                  {userProfile?.bankDetails?.cbu ? `Cuenta: ${userProfile.bankDetails.bankName} (...${userProfile.bankDetails.cbu.slice(-4)})` : 'Vincular Cuenta (CBU/CVU)'}
                </button>
              </div>

              <div className="bg-primary-50/50 p-6 rounded-3xl border border-primary-100/50">
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-primary-vibrant text-xl font-black">autorenew</span>
                  <p className="text-[10px] font-bold text-primary-800/60 leading-relaxed uppercase">
                    Cuando el comprador confirma la entrega, el pago se procesa y envía automáticamente. No necesitas solicitar retiros manuales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Details Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-800/80 backdrop-blur-sm p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-dark-800">Datos Bancarios</h3>
              <button onClick={() => setShowBankModal(false)} className="size-10 rounded-full bg-light-50 flex items-center justify-center hover:bg-light-100 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6">
              <div className="relative">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black text-dark-800 uppercase tracking-widest">CBU / CVU</label>
                  {isValidating && <div className="size-3 border-2 border-primary-vibrant/20 border-t-primary-vibrant rounded-full animate-spin"></div>}
                </div>
                <input className="w-full bg-light-50 border border-light-200 rounded-xl px-4 py-3 font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100 placeholder:opacity-30"
                  placeholder="22 dígitos"
                  value={bankForm.cbu}
                  onChange={e => {
                    const val = e.target.value;
                    setBankForm({ ...bankForm, cbu: val, bankName: '', holderName: '' });
                  }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-dark-800 uppercase tracking-widest mb-2">Alias</label>
                <input className="w-full bg-light-50 border border-light-200 rounded-xl px-4 py-3 font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100 placeholder:opacity-30"
                  placeholder="nombre.apellido.mp"
                  value={bankForm.alias}
                  onChange={e => {
                    const val = e.target.value;
                    setBankForm({ ...bankForm, alias: val, bankName: '', holderName: '' });
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-[10px] font-black text-dark-800 uppercase tracking-widest mb-2">Banco / Entidad</label>
                  <input className="w-full bg-light-100 border border-transparent rounded-xl px-4 py-3 font-bold text-dark-800 outline-none read-only:text-gray-500"
                    placeholder="Sincronizando..."
                    value={bankForm.bankName}
                    readOnly
                  />
                  {bankForm.bankName && (
                    <span className="material-symbols-outlined absolute right-3 top-[38px] text-emerald-500 text-sm animate-in zoom-in">verified</span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-dark-800 uppercase tracking-widest mb-2">Tipo Cuenta</label>
                  <select className="w-full bg-light-50 border border-light-200 rounded-xl px-4 py-3 font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100"
                    value={bankForm.accountType} onChange={e => setBankForm({ ...bankForm, accountType: e.target.value })}
                  >
                    <option value="CA">Caja de Ahorro</option>
                    <option value="CC">Cuenta Corriente</option>
                    <option value="VIRTUAL">Billetera Virtual</option>
                  </select>
                </div>
              </div>
              <div className="relative">
                <label className="block text-[10px] font-black text-dark-800 uppercase tracking-widest mb-2">Titular de la Cuenta</label>
                <input className="w-full bg-light-100 border border-transparent rounded-xl px-4 py-3 font-bold text-dark-800 outline-none read-only:text-gray-500"
                  placeholder="Confirmando identidad..."
                  value={bankForm.holderName}
                  readOnly
                />
              </div>

              <button
                onClick={handleLinkBank}
                disabled={!bankForm.bankName || isValidating}
                className="w-full bg-dark-800 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg mt-4 disabled:opacity-50 disabled:grayscale"
              >
                {isValidating ? 'Validando...' : 'Guardar Datos'}
              </button>
              <p className="text-center text-[10px] text-gray-400 mt-4 leading-relaxed max-w-xs mx-auto">
                Al guardar, confirmas que eres el titular de la cuenta. Los retiros a terceros serán rechazados.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
