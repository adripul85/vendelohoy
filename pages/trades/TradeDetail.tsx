import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/auth';
import { useNotification } from '../../context/NotificationContext';
import { 
    TradeProposal, 
    getTradeProposal, 
    acceptTradeProposal, 
    rejectTradeProposal, 
    confirmTradeQrScan,
    TRADE_PROTECTION_FEE 
} from '../../lib/trades';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { triggerHaptic } from '../../lib/haptics';

export const TradeDetail: React.FC = () => {
    const { id: tradeId } = useParams<{ id: string }>();
    const { user, loading: authLoading } = useAuth();
    const { notify } = useNotification();
    const navigate = useNavigate();

    const [trade, setTrade] = useState<TradeProposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [scannedCodeInput, setScannedCodeInput] = useState('');
    const [showScanModal, setShowScanModal] = useState(false);

    useEffect(() => {
        if (!tradeId) return;

        // Carga inicial completa con items poblados
        getTradeProposal(tradeId).then(data => {
            setTrade(data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });

        // Escucha en tiempo real
        const unsub = onSnapshot(doc(db, "trades", tradeId), (docSnap) => {
            if (docSnap.exists()) {
                setTrade(prev => prev ? { ...prev, ...docSnap.data() } as TradeProposal : null);
            }
        });

        return () => unsub();
    }, [tradeId]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <span className="material-symbols-outlined text-4xl text-purple-600 animate-spin">sync</span>
                    <p className="text-xs font-bold text-slate-500 mt-3">Cargando Sala de Canje...</p>
                </div>
            </div>
        );
    }

    if (!trade) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md">
                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">error_outline</span>
                    <h3 className="text-xl font-black text-slate-800 uppercase">Canje No Encontrado</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-6">Esta propuesta de intercambio no existe o fue eliminada.</p>
                    <button onClick={() => navigate('/dashboard')} className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black text-xs uppercase">
                        Volver a Mi Panel
                    </button>
                </div>
            </div>
        );
    }

    const isInitiator = user?.uid === trade.initiatorId;
    const isReceiver = user?.uid === trade.receiverId;
    const isParticipant = isInitiator || isReceiver;

    if (!isParticipant) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-3xl text-center max-w-md border border-slate-200">
                    <span className="material-symbols-outlined text-5xl text-red-500 mb-3">lock</span>
                    <h3 className="text-xl font-black text-slate-800 uppercase">Acceso Restringido</h3>
                    <p className="text-xs text-slate-500 mt-1 mb-6">Solo los dos usuarios participantes pueden ver esta sala de canje.</p>
                    <button onClick={() => navigate('/')} className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black text-xs uppercase">
                        Ir al Inicio
                    </button>
                </div>
            </div>
        );
    }

    const handleAccept = async () => {
        if (!tradeId) return;
        setActionLoading(true);
        const res = await acceptTradeProposal(tradeId);
        setActionLoading(false);
        if (res.success) {
            triggerHaptic('success');
            notify({ type: 'success', title: '¡Canje Aceptado!', message: 'Ambas partes deben abonar el Fee de Garantía para coordinar.', icon: 'handshake' });
        } else {
            notify({ type: 'error', title: 'Error', message: res.error || 'No se pudo aceptar el canje.', icon: 'error' });
        }
    };

    const handleReject = async () => {
        if (!tradeId) return;
        setActionLoading(true);
        const res = await rejectTradeProposal(tradeId);
        setActionLoading(false);
        if (res.success) {
            notify({ type: 'info', title: 'Canje Rechazado', message: 'La propuesta de intercambio ha sido cancelada.', icon: 'cancel' });
        }
    };

    const handlePayProtectionFee = async () => {
        if (!tradeId || !user) return;
        setActionLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/mp-trade-fee', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tradeId })
            });

            const data = await response.json().catch(() => ({}));
            if (response.ok && data.url) {
                window.location.href = data.url;
            } else {
                // Fallback para testing local
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    notify({ type: 'warning', title: 'Simulación Local', message: 'Simulando pago de fee de garantía en localhost...', icon: 'developer_mode' });
                    const { updateDoc, doc: fDoc, serverTimestamp } = await import('firebase/firestore');
                    const updateField = isInitiator ? { initiatorFeePaid: true } : { receiverFeePaid: true };
                    const bothPaid = (isInitiator && trade.receiverFeePaid) || (isReceiver && trade.initiatorFeePaid);
                    await updateDoc(fDoc(db, 'trades', tradeId), {
                        ...updateField,
                        ...(bothPaid ? { status: 'FEE_PAID' } : {}),
                        updatedAt: serverTimestamp()
                    });
                } else {
                    throw new Error(data.error || 'No se pudo generar el checkout de Mercado Pago.');
                }
            }
        } catch (error: any) {
            notify({ type: 'error', title: 'Fallo de Pago', message: error.message, icon: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleManualScanSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tradeId || !scannedCodeInput.trim()) return;
        setActionLoading(true);
        const res = await confirmTradeQrScan(tradeId, scannedCodeInput.trim().toUpperCase());
        setActionLoading(false);
        if (res.success) {
            triggerHaptic('success');
            notify({ type: 'success', title: '¡Confirmación Exitosa!', message: res.message, icon: 'verified' });
            setShowScanModal(false);
            setScannedCodeInput('');
        } else {
            notify({ type: 'error', title: 'Código Inválido', message: res.error || 'El código no es correcto.', icon: 'error' });
        }
    };

    const myQrToken = isInitiator ? trade.initiatorQrToken : trade.receiverQrToken;
    const otherUserName = isInitiator ? (trade.receiverName || 'Vendedor') : (trade.initiatorName || 'Comprador');
    const myFeePaid = isInitiator ? trade.initiatorFeePaid : trade.receiverFeePaid;
    const otherFeePaid = isInitiator ? trade.receiverFeePaid : trade.initiatorFeePaid;

    return (
        <div className="bg-slate-50 min-h-screen font-body pb-24">
            {/* Top Navigation */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/dashboard')} className="size-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                    </button>
                    <div>
                        <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Sala de Negociación</span>
                        <h1 className="text-lg font-black text-slate-900 tracking-tight">Canje Protegido #{trade.id?.slice(0, 8)}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        trade.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        trade.status === 'FEE_PAID' ? 'bg-purple-100 text-purple-700 animate-pulse' :
                        trade.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                    }`}>
                        {trade.status === 'PROPOSED' ? 'Propuesta Pendiente' :
                         trade.status === 'ACCEPTED_PENDING_PAYMENT' ? 'Esperando Pagos' :
                         trade.status === 'FEE_PAID' ? 'Garantía Activa' :
                         trade.status === 'COMPLETED' ? 'Canje Finalizado' :
                         trade.status === 'CANCELLED' ? 'Cancelado' : trade.status}
                    </span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
                {/* Security Anti-Evasion Banner */}
                {trade.status !== 'FEE_PAID' && trade.status !== 'COMPLETED' && (
                    <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-5 rounded-3xl mb-8 shadow-lg flex items-start md:items-center gap-4">
                        <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-2xl text-purple-300 font-black">shield_lock</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-black uppercase tracking-wide">Protocolo Anti-Evasión y Compra Protegida Activo</h4>
                            <p className="text-xs text-purple-200 mt-0.5 leading-relaxed">
                                Por tu seguridad, los números de contacto y direcciones físicas están bloqueados en el chat. Una vez que ambas partes acepten el canje y abonen el Fee de Garantía (${TRADE_PROTECTION_FEE.toLocaleString()}), se desbloquearán las herramientas de entrega y los Códigos QR.
                            </p>
                        </div>
                        <Link to="/trades-info" className="hidden lg:inline-flex px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap">
                            Ver Reglas
                        </Link>
                    </div>
                )}

                {/* Face to Face Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center mb-8">
                    {/* Item Objetivo (Receiver) */}
                    <div className="md:col-span-5 bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm relative">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Producto Publicado:</span>
                        <div className="flex items-center gap-4">
                            <img 
                                src={trade.targetItem?.images?.[0] || 'https://picsum.photos/120/120'} 
                                alt={trade.targetItem?.title || 'Producto'} 
                                className="size-20 rounded-2xl object-cover border border-slate-200 shrink-0" 
                            />
                            <div className="min-w-0">
                                <h3 className="text-base font-black text-slate-900 truncate">{trade.targetItem?.title || 'Producto'}</h3>
                                <p className="text-sm font-black text-purple-600">${trade.targetItem?.price.toLocaleString()}</p>
                                <p className="text-[11px] font-bold text-slate-400 mt-1">Dueño: {trade.receiverName || 'Vendedor'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Trade Icon & Cash Diff in Middle */}
                    <div className="md:col-span-2 flex flex-col items-center justify-center text-center">
                        <div className="size-14 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-purple-600/30 mb-2">
                            <span className="material-symbols-outlined text-2xl font-black">sync_alt</span>
                        </div>
                        {trade.cashDifference !== 0 && (
                            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[11px] font-black">
                                {trade.cashDifference > 0 ? `+ $${trade.cashDifference.toLocaleString()} a favor de ${trade.receiverName}` : `+ $${Math.abs(trade.cashDifference).toLocaleString()} a favor de ${trade.initiatorName}`}
                            </div>
                        )}
                        {trade.cashDifference === 0 && (
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mano a Mano</span>
                        )}
                    </div>

                    {/* Items Ofrecidos (Initiator) */}
                    <div className="md:col-span-5 bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm relative">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ofrecido a Cambio:</span>
                        {((trade.offeredItems && trade.offeredItems.length > 0) || (trade.offeredCustomItems && trade.offeredCustomItems.length > 0)) ? (
                            <div className="space-y-3">
                                {trade.offeredItems?.map(item => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <img src={item.images?.[0] || 'https://picsum.photos/120/120'} alt={item.title} className="size-16 rounded-2xl object-cover border border-slate-200 shrink-0" />
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-black text-slate-900 truncate">{item.title}</h4>
                                            <p className="text-xs font-black text-slate-600">${item.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                                {trade.offeredCustomItems?.map((cItem, cIdx) => (
                                    <div key={cIdx} className="flex items-center gap-4 bg-purple-50/70 p-3 rounded-2xl border border-purple-100">
                                        <div className="size-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-black shrink-0">
                                            <span className="material-symbols-outlined text-2xl">checkroom</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="text-[9px] font-black uppercase text-purple-600 tracking-wider">Artículo del Usuario</span>
                                            <h4 className="text-sm font-black text-slate-900 truncate">{cItem.title}</h4>
                                            {cItem.description && <p className="text-xs text-slate-500 truncate">{cItem.description}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs font-bold text-slate-400 py-4">Solo compensación económica propuesta.</p>
                        )}
                        <p className="text-[11px] font-bold text-slate-400 mt-2">Propuesto por: {trade.initiatorName || 'Comprador'}</p>
                    </div>
                </div>

                {/* ACTION CARDS ACCORDING TO STATUS */}

                {/* 1. Fase de Propuesta Inicial */}
                {trade.status === 'PROPOSED' && (
                    <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm mb-8">
                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mb-2">Resolución de la Propuesta</h3>
                        {isReceiver ? (
                            <div>
                                <p className="text-xs text-slate-500 mb-6">
                                    {trade.initiatorName} te propone este intercambio. Si estás de acuerdo con los productos y la diferencia económica, presiona Aceptar.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={handleAccept}
                                        disabled={actionLoading}
                                        className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-600/20 flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-base">check</span>
                                        Aceptar Propuesta de Canje
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={actionLoading}
                                        className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-wider transition-all"
                                    >
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-purple-600 text-2xl animate-pulse">hourglass_top</span>
                                    <div>
                                        <p className="text-xs font-black text-slate-800">Esperando que {otherUserName} responda a tu oferta.</p>
                                        <p className="text-[11px] text-slate-400">Te enviaremos una notificación apenas acepte o contraoferte.</p>
                                    </div>
                                </div>
                                <button onClick={handleReject} className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                    Cancelar Propuesta
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. Fase de Pago de Fee de Garantía */}
                {trade.status === 'ACCEPTED_PENDING_PAYMENT' && (
                    <div className="bg-white p-6 md:p-8 rounded-[32px] border border-purple-200 shadow-md mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-purple-600 text-2xl font-black">verified</span>
                            <div>
                                <h3 className="text-base font-black text-slate-900 uppercase">¡Ambas partes aceptaron el canje!</h3>
                                <p className="text-xs text-slate-500">Para activar la garantía y ver los códigos QR de entrega, ambos deben pagar el Fee de Plataforma (${TRADE_PROTECTION_FEE.toLocaleString()}).</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                            <div className={`p-4 rounded-2xl border flex items-center justify-between ${myFeePaid ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                <div>
                                    <p className="text-xs font-black text-slate-800">Tu Pago de Garantía</p>
                                    <p className="text-[11px] text-slate-500">${TRADE_PROTECTION_FEE.toLocaleString()} ARS</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${myFeePaid ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                                    {myFeePaid ? 'Abonado ✓' : 'Pendiente'}
                                </span>
                            </div>

                            <div className={`p-4 rounded-2xl border flex items-center justify-between ${otherFeePaid ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                <div>
                                    <p className="text-xs font-black text-slate-800">Pago de {otherUserName}</p>
                                    <p className="text-[11px] text-slate-500">${TRADE_PROTECTION_FEE.toLocaleString()} ARS</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${otherFeePaid ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                                    {otherFeePaid ? 'Abonado ✓' : 'Esperando...'}
                                </span>
                            </div>
                        </div>

                        {!myFeePaid ? (
                            <button
                                onClick={handlePayProtectionFee}
                                disabled={actionLoading}
                                className="w-full md:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-base">credit_card</span>
                                Pagar Fee de Garantía ($ {TRADE_PROTECTION_FEE.toLocaleString()}) con Mercado Pago
                            </button>
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                                Ya abonaste tu parte. Esperando que {otherUserName} complete su pago para desbloquear el Doble QR.
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Fase de Entrega con Doble QR (FEE_PAID) */}
                {trade.status === 'FEE_PAID' && (
                    <div className="bg-white p-6 md:p-8 rounded-[32px] border border-emerald-300 shadow-xl mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-black">
                                <span className="material-symbols-outlined text-2xl">qr_code_2</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase">Intercambio Seguro con Doble QR</h3>
                                <p className="text-xs text-slate-500">Muestren sus códigos al momento del encuentro para validar la entrega.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            {/* My QR Code Card */}
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center flex flex-col items-center">
                                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-3">Tu Código QR de Seguridad:</span>
                                <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-slate-300 shadow-inner mb-4">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(myQrToken)}`} 
                                        alt="QR de Seguridad" 
                                        className="size-44 object-contain"
                                    />
                                </div>
                                <span className="font-mono text-xs font-black text-slate-700 bg-slate-200 px-3 py-1 rounded-lg tracking-wider">
                                    {myQrToken}
                                </span>
                                <p className="text-[10px] text-slate-400 mt-2">Permite que {otherUserName} escanee este código cuando te entregue tu producto.</p>
                            </div>

                            {/* Scanner / Manual Input Card */}
                            <div className="space-y-4">
                                <div className="bg-purple-50 p-5 rounded-2xl border border-purple-200">
                                    <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider mb-1">Estado de las Confirmaciones:</h4>
                                    <div className="space-y-2 mt-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-600">Vos confirmaste a {otherUserName}:</span>
                                            <span className={`font-black uppercase ${ (isInitiator && trade.initiatorScannedReceiver) || (isReceiver && trade.receiverScannedInitiator) ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {((isInitiator && trade.initiatorScannedReceiver) || (isReceiver && trade.receiverScannedInitiator)) ? 'Confirmado ✓' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-600">{otherUserName} te confirmó:</span>
                                            <span className={`font-black uppercase ${ (isInitiator && trade.receiverScannedInitiator) || (isReceiver && trade.initiatorScannedReceiver) ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {((isInitiator && trade.receiverScannedInitiator) || (isReceiver && trade.initiatorScannedReceiver)) ? 'Confirmado ✓' : 'Pendiente'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowScanModal(true)}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                                    Ingresar / Validar Código de {otherUserName}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Canje Finalizado */}
                {trade.status === 'COMPLETED' && (
                    <div className="bg-emerald-50 border-2 border-emerald-300 p-8 rounded-[32px] text-center mb-8 shadow-sm">
                        <div className="size-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/30">
                            <span className="material-symbols-outlined text-3xl font-black">verified</span>
                        </div>
                        <h3 className="text-2xl font-black text-emerald-950 uppercase tracking-tight">¡Canje Completado Exitosamente!</h3>
                        <p className="text-xs font-bold text-emerald-800 mt-1 max-w-md mx-auto">
                            Ambas partes validaron el intercambio de los productos y la garantía de plataforma fue cerrada.
                        </p>
                    </div>
                )}
            </div>

            {/* Modal para Ingresar Token de la Contraparte */}
            {showScanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-black uppercase text-slate-900">Validar Código de {otherUserName}</h4>
                            <button onClick={() => setShowScanModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleManualScanSubmit} className="space-y-4">
                            <p className="text-xs text-slate-500">
                                Escribe o pega el código de seguridad que figura debajo del QR de {otherUserName} (Ej: TRD-INI-...):
                            </p>
                            <input 
                                type="text"
                                value={scannedCodeInput}
                                onChange={(e) => setScannedCodeInput(e.target.value)}
                                placeholder="TRD-..."
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono font-black text-center text-slate-900 outline-none uppercase focus:ring-2 focus:ring-emerald-500"
                            />
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowScanModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-xs uppercase text-slate-600">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={actionLoading || !scannedCodeInput.trim()} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase shadow-md hover:bg-emerald-700 disabled:opacity-50">
                                    Validar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
