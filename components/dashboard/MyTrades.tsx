import React from 'react';
import { Link } from 'react-router-dom';
import { TradeProposal, TradeStatus } from '../../lib/trades';

interface MyTradesProps {
    trades: { sent: TradeProposal[]; received: TradeProposal[] };
    currentUserId: string;
    filter: 'ALL' | 'RECEIVED' | 'SENT' | 'ACTIVE' | 'COMPLETED';
    setFilter?: (filter: 'ALL' | 'RECEIVED' | 'SENT' | 'ACTIVE' | 'COMPLETED') => void;
    searchQuery: string;
    formatDate: (timestamp: any) => string;
}

export default function MyTrades({
    trades,
    currentUserId,
    filter,
    setFilter,
    searchQuery,
    formatDate
}: MyTradesProps) {
    const allTrades = [
        ...trades.received.map(t => ({ ...t, isIncoming: true })),
        ...trades.sent.map(t => ({ ...t, isIncoming: false }))
    ].sort((a, b) => {
        const aTime = a.createdAt?.seconds || (a.createdAt?.toDate ? a.createdAt.toDate().getTime() / 1000 : (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() / 1000 : 0));
        const bTime = b.createdAt?.seconds || (b.createdAt?.toDate ? b.createdAt.toDate().getTime() / 1000 : (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() / 1000 : 0));
        return bTime - aTime;
    });

    // KPIs
    const totalTrades = allTrades.length;
    const pendingReceived = trades.received.filter(t => t.status === 'PROPOSED').length;
    const activeCustody = allTrades.filter(t => ['ACCEPTED_PENDING_PAYMENT', 'FEE_PAID', 'IN_TRANSIT'].includes(t.status)).length;
    const completedCount = allTrades.filter(t => t.status === 'COMPLETED').length;

    // Filter by tab
    let filteredList = allTrades.filter(t => {
        if (filter === 'RECEIVED') return t.isIncoming;
        if (filter === 'SENT') return !t.isIncoming;
        if (filter === 'ACTIVE') return ['PROPOSED', 'ACCEPTED_PENDING_PAYMENT', 'FEE_PAID', 'IN_TRANSIT'].includes(t.status);
        if (filter === 'COMPLETED') return t.status === 'COMPLETED';
        return true;
    });

    // Filter by search query
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filteredList = filteredList.filter(t => {
            const targetTitle = (t.targetItem?.title || t.targetItemTitle || '').toLowerCase();
            const counterName = (t.isIncoming ? t.initiatorName : t.receiverName || '').toLowerCase();
            const notes = (t.notes || '').toLowerCase();
            return targetTitle.includes(q) || counterName.includes(q) || notes.includes(q);
        });
    }

    const getStatusConfig = (status: TradeStatus, isIncoming: boolean) => {
        switch (status) {
            case 'PROPOSED':
                return {
                    label: isIncoming ? 'Por Responder' : 'Esperando Respuesta',
                    color: 'bg-amber-100 text-amber-900 border-amber-300',
                    dot: 'bg-amber-500 animate-pulse',
                    btnText: isIncoming ? 'Responder Propuesta' : 'Ver Propuesta',
                    btnColor: 'bg-purple-600 hover:bg-purple-700 text-white'
                };
            case 'COUNTERED':
                return {
                    label: 'Contraoferta Enviada',
                    color: 'bg-blue-100 text-blue-900 border-blue-300',
                    dot: 'bg-blue-500',
                    btnText: 'Revisar Contraoferta',
                    btnColor: 'bg-blue-600 hover:bg-blue-700 text-white'
                };
            case 'ACCEPTED_PENDING_PAYMENT':
                return {
                    label: 'Aceptado - Pago de Garantía Pendiente',
                    color: 'bg-indigo-100 text-indigo-900 border-indigo-300',
                    dot: 'bg-indigo-500 animate-pulse',
                    btnText: 'Pagar Fee de Garantía ($2.000)',
                    btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white'
                };
            case 'FEE_PAID':
                return {
                    label: 'Garantía en Custodia - Listo para Canje',
                    color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                    dot: 'bg-emerald-500',
                    btnText: 'Abrir Sala y Mostrar QR',
                    btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white'
                };
            case 'IN_TRANSIT':
                return {
                    label: 'En Envío por Correo',
                    color: 'bg-sky-100 text-sky-900 border-sky-300',
                    dot: 'bg-sky-500',
                    btnText: 'Seguir Envío',
                    btnColor: 'bg-sky-600 hover:bg-sky-700 text-white'
                };
            case 'COMPLETED':
                return {
                    label: 'Canje Completado 🎉',
                    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    dot: 'bg-emerald-500',
                    btnText: 'Ver Resumen del Canje',
                    btnColor: 'bg-slate-800 hover:bg-black text-white'
                };
            case 'DISPUTED':
                return {
                    label: 'En Disputa',
                    color: 'bg-rose-100 text-rose-900 border-rose-300',
                    dot: 'bg-rose-500',
                    btnText: 'Ir a Mediación',
                    btnColor: 'bg-rose-600 hover:bg-rose-700 text-white'
                };
            case 'CANCELLED':
            default:
                return {
                    label: 'Canje Cancelado',
                    color: 'bg-slate-100 text-slate-700 border-slate-200',
                    dot: 'bg-slate-400',
                    btnText: 'Ver Detalle',
                    btnColor: 'bg-slate-600 hover:bg-slate-700 text-white'
                };
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header info banner */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-8 rounded-[36px] text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 size-80 bg-purple-500/10 blur-3xl rounded-full pointer-events-none"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="size-16 bg-white/10 backdrop-blur-md text-white rounded-2xl flex items-center justify-center font-black border border-white/20 shadow-inner">
                        <span className="material-symbols-outlined text-3xl">sync_alt</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-black uppercase tracking-tight">Canjes y Permutas Protegidas</h2>
                            <span className="bg-purple-500/30 text-purple-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-purple-400/30">
                                Garantía Escrow
                            </span>
                        </div>
                        <p className="text-xs text-purple-200/90 max-w-xl">
                            Intercambiá artículos mano a mano o con envíos. Cada parte aporta un fee de garantía ($2.000) reembolsable al validar el doble código QR de seguridad.
                        </p>
                    </div>
                </div>
                <Link
                    to="/trades-info"
                    className="px-6 py-3.5 bg-white text-purple-950 hover:bg-purple-50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shrink-0 flex items-center gap-2 relative z-10 active:scale-95"
                >
                    <span>¿Cómo Funciona?</span>
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                </Link>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/50 shadow-sm flex flex-col justify-between">
                    <span className="material-symbols-outlined text-purple-600 mb-2 text-2xl">sync_alt</span>
                    <div>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Total Movimientos</p>
                        <p className="text-2xl font-black text-on-surface tracking-tighter">{totalTrades}</p>
                    </div>
                </div>

                <div className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between ${pendingReceived > 0 ? 'bg-amber-50 border-amber-200' : 'bg-surface-container-lowest border-outline-variant/50'}`}>
                    <span className={`material-symbols-outlined mb-2 text-2xl ${pendingReceived > 0 ? 'text-amber-600' : 'text-on-surface-variant'}`}>
                        move_to_inbox
                    </span>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${pendingReceived > 0 ? 'text-amber-800' : 'text-on-surface-variant'}`}>Por Responder</p>
                        <p className={`text-2xl font-black tracking-tighter ${pendingReceived > 0 ? 'text-amber-900' : 'text-on-surface'}`}>{pendingReceived}</p>
                    </div>
                </div>

                <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-sm flex flex-col justify-between">
                    <span className="material-symbols-outlined text-indigo-600 mb-2 text-2xl">security</span>
                    <div>
                        <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1">En Custodia Activa</p>
                        <p className="text-2xl font-black text-indigo-950 tracking-tighter">{activeCustody}</p>
                    </div>
                </div>

                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
                    <span className="material-symbols-outlined text-emerald-600 mb-2 text-2xl">verified</span>
                    <div>
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Completados</p>
                        <p className="text-2xl font-black text-emerald-950 tracking-tighter">{completedCount}</p>
                    </div>
                </div>
            </div>

            {/* Quick Filter Tabs */}
            {setFilter && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { id: 'ALL', label: `Todos (${totalTrades})`, icon: 'list' },
                        { id: 'RECEIVED', label: `Recibidos (${trades.received.length})`, icon: 'move_to_inbox', badge: pendingReceived },
                        { id: 'SENT', label: `Enviados (${trades.sent.length})`, icon: 'outbox' },
                        { id: 'ACTIVE', label: `En Custodia (${activeCustody})`, icon: 'security' },
                        { id: 'COMPLETED', label: `Completados (${completedCount})`, icon: 'check_circle' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id as any)}
                            className={`px-4 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all flex items-center gap-2 shrink-0 ${filter === tab.id
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-surface-container-lowest border border-outline-variant/50 text-on-surface-variant hover:text-on-surface'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">{tab.icon}</span>
                            <span>{tab.label}</span>
                            {tab.badge && tab.badge > 0 ? (
                                <span className="size-4 bg-red-600 text-white rounded-full text-[8px] font-black flex items-center justify-center animate-pulse">
                                    {tab.badge}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>
            )}

            {/* LIST OF TRADES */}
            {filteredList.length === 0 ? (
                <div className="text-center py-20 bg-surface-container-lowest rounded-[36px] border border-outline-variant/50 shadow-premium p-8">
                    <div className="size-20 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-200">
                        <span className="material-symbols-outlined text-4xl">sync_disabled</span>
                    </div>
                    <h3 className="text-lg font-black text-on-surface uppercase tracking-tight mb-2">
                        {filter === 'RECEIVED' ? 'No tenés propuestas de canje recibidas' :
                         filter === 'SENT' ? 'No has enviado propuestas de canje todavía' :
                         filter === 'ACTIVE' ? 'No hay canjes en custodia activa' :
                         filter === 'COMPLETED' ? 'Aún no has completado ningún canje' :
                         'No se encontraron movimientos de canjes'}
                    </h3>
                    <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-6">
                        Buscá publicaciones en el catálogo que tengan habilitada la opción de permuta o canje, y enviá tu propuesta segura mano a mano.
                    </p>
                    <Link
                        to="/search"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                    >
                        <span className="material-symbols-outlined text-base">search</span>
                        <span>Explorar Productos en el Mercado</span>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredList.map((trade) => {
                        const isIncoming = trade.isIncoming;
                        const statusConfig = getStatusConfig(trade.status, isIncoming);
                        const counterPartyName = isIncoming ? (trade.initiatorName || 'Usuario') : (trade.receiverName || 'Vendedor');
                        const counterPartyAvatar = isIncoming ? trade.initiatorAvatar : trade.receiverAvatar;
                        const targetImage = trade.targetItem?.images?.[0] || trade.targetItemImage || 'https://picsum.photos/120/120';
                        const targetTitle = trade.targetItem?.title || trade.targetItemTitle || 'Producto Objetivo';

                        // Cash difference perspective:
                        // trade.cashDifference > 0 means initiator offers cash to receiver.
                        const userReceivesCash = isIncoming ? trade.cashDifference > 0 : trade.cashDifference < 0;
                        const userPaysCash = isIncoming ? trade.cashDifference < 0 : trade.cashDifference > 0;
                        const absCashDiff = Math.abs(trade.cashDifference || 0);

                        return (
                            <div
                                key={trade.id}
                                className="bg-surface-container-lowest border border-outline-variant/50 rounded-[32px] p-6 md:p-8 shadow-premium hover:shadow-premium-lg transition-all space-y-6 group"
                            >
                                {/* Card Header */}
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-8 rounded-full flex items-center justify-center font-black text-xs ${isIncoming ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}`}>
                                            <span className="material-symbols-outlined text-base">
                                                {isIncoming ? 'move_to_inbox' : 'outbox'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isIncoming ? 'text-purple-600' : 'text-slate-600'}`}>
                                                {isIncoming ? 'Propuesta Recibida' : 'Propuesta Enviada por Vos'}
                                            </span>
                                            <p className="text-[10px] text-on-surface-variant font-bold">
                                                {formatDate(trade.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusConfig.color}`}>
                                            <div className={`size-2 rounded-full ${statusConfig.dot}`}></div>
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Main Trade Comparison Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                                    {/* Side 1: Target Item */}
                                    <div className="md:col-span-5 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center gap-4">
                                        <img
                                            src={targetImage}
                                            alt={targetTitle}
                                            className="size-16 rounded-xl object-cover border border-outline-variant/30 shrink-0 group-hover:scale-105 transition-transform"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant block">
                                                {isIncoming ? 'Por tu publicación:' : 'Publicación objetivo:'}
                                            </span>
                                            <h4 className="text-xs font-black text-on-surface truncate mt-0.5">
                                                {targetTitle}
                                            </h4>
                                            {trade.targetItem?.price ? (
                                                <p className="text-[11px] font-bold text-on-surface-variant">
                                                    Valor ref: ${trade.targetItem.price.toLocaleString('es-AR')}
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Middle: Exchange Badge */}
                                    <div className="md:col-span-1 flex flex-col items-center justify-center my-2 md:my-0">
                                        <div className="size-10 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-md">
                                            <span className="material-symbols-outlined text-lg">sync_alt</span>
                                        </div>
                                        {absCashDiff > 0 && (
                                            <span className={`mt-1.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-md whitespace-nowrap ${userReceivesCash ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {userReceivesCash ? `+$${absCashDiff.toLocaleString()}` : `-$${absCashDiff.toLocaleString()}`}
                                            </span>
                                        )}
                                    </div>

                                    {/* Side 2: Offered Items */}
                                    <div className="md:col-span-5 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant block mb-1">
                                            {isIncoming ? 'Lo que te ofrecen a cambio:' : 'Lo que ofrecés a cambio:'}
                                        </span>

                                        <div className="space-y-2">
                                            {/* Catalog offered items */}
                                            {trade.offeredItems && trade.offeredItems.length > 0 && (
                                                <div className="space-y-1.5">
                                                    {trade.offeredItems.map((off, idx) => (
                                                        <div key={off.id || idx} className="flex items-center gap-2.5">
                                                            <img
                                                                src={off.images?.[0] || 'https://picsum.photos/60/60'}
                                                                alt={off.title}
                                                                className="size-9 rounded-lg object-cover border shrink-0"
                                                            />
                                                            <span className="text-xs font-bold text-on-surface truncate">{off.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Custom offered items */}
                                            {trade.offeredCustomItems && trade.offeredCustomItems.length > 0 && (
                                                <div className="space-y-1.5">
                                                    {trade.offeredCustomItems.map((custom, idx) => (
                                                        <div key={idx} className="flex items-center gap-2.5">
                                                            {custom.images?.[0] ? (
                                                                <img
                                                                    src={custom.images[0]}
                                                                    alt={custom.title}
                                                                    className="size-9 rounded-lg object-cover border shrink-0"
                                                                />
                                                            ) : (
                                                                <div className="size-9 rounded-lg bg-surface flex items-center justify-center border shrink-0">
                                                                    <span className="material-symbols-outlined text-xs text-on-surface-variant">devices</span>
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <span className="text-xs font-bold text-on-surface truncate block">{custom.title}</span>
                                                                {custom.estimatedValue ? (
                                                                    <span className="text-[10px] text-slate-500 font-bold block">Valor est: ${custom.estimatedValue.toLocaleString('es-AR')}</span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {(!trade.offeredItems || trade.offeredItems.length === 0) && (!trade.offeredCustomItems || trade.offeredCustomItems.length === 0) && (
                                                <div className="py-1">
                                                    <span className="text-xs font-bold text-on-surface-variant italic">
                                                        {absCashDiff > 0 ? 'Oferta solo por la diferencia monetaria' : 'Intercambio directo acordado'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer bar with counterparty, delivery method, and CTA */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-outline-variant/30">
                                    <div className="flex items-center gap-4 text-xs font-bold text-on-surface-variant">
                                        <div className="flex items-center gap-2">
                                            {counterPartyAvatar ? (
                                                <img src={counterPartyAvatar} alt="" className="size-6 rounded-full object-cover border" />
                                            ) : (
                                                <div className="size-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-black">
                                                    {counterPartyName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="text-on-surface font-black">{counterPartyName}</span>
                                        </div>

                                        <span className="text-outline-variant">•</span>

                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm text-purple-600">
                                                {trade.deliveryMethod === 'en_mano' ? 'qr_code_2' : 'local_shipping'}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                                {trade.deliveryMethod === 'en_mano' ? 'En mano con doble QR' : 'Envío por Correo'}
                                            </span>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/trade/${trade.id}`}
                                        className={`px-6 py-3 rounded-xl text-center font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm ${statusConfig.btnColor} active:scale-95`}
                                    >
                                        <span>{statusConfig.btnText}</span>
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
