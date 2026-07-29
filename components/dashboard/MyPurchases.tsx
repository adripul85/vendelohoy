import React from 'react';
import { Link } from 'react-router-dom';
import { TransactionData } from '../../lib/transactions';

interface MyPurchasesProps {
    purchases: (TransactionData & { id: string })[];
    formatDate: (timestamp: any) => string;
    onConfirmReceipt: (txId: string) => void;
    onReleaseFunds: (txId: string) => void;
    onCancel?: (txId: string) => void;
    onHide?: (txId: string) => void;
    reviewedIds: Set<string>;
    onOpenReview: (tx: any) => void;
}

export default function MyPurchases({ purchases, formatDate, onConfirmReceipt, onReleaseFunds, onCancel, onHide, reviewedIds, onOpenReview }: MyPurchasesProps) {
    // KPIs para Compradores
    const totalPurchases = purchases.length;
    const totalSpent = purchases.filter(p => p.status === 'COMPLETED').reduce((acc, curr) => acc + (curr.amountTotal || curr.total || curr.amount || 0), 0);
    const moneyProtected = purchases.filter(p => ['PAID_HELD', 'SHIPPED', 'DELIVERED_PENDING_REVIEW'].includes(p.status)).reduce((acc, curr) => acc + (curr.amountTotal || curr.total || curr.amount || 0), 0);
    const activeOrders = purchases.filter(p => p.status !== 'COMPLETED' && p.status !== 'CANCELLED').length;


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between pl-2">
                <h2 className="text-2xl font-black text-on-surface tracking-tighter uppercase">Compras Recientes</h2>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Protección de Pago Activa 🛡️</p>
            </div>

            {/* ANALÍTICAS Y KPIs DE COMPRADOR */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/50 shadow-sm flex flex-col justify-between">
                    <span className="material-symbols-outlined text-on-surface mb-2">shopping_bag</span>
                    <div>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Total de Compras</p>
                        <p className="text-2xl font-black text-on-surface tracking-tighter">{totalPurchases}</p>
                    </div>
                </div>

                <div className="bg-primary-container p-6 rounded-3xl border border-primary-100 shadow-sm flex flex-col justify-between">
                    <span className="material-symbols-outlined text-primary-500 mb-2">payments</span>
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Inversión Total</p>
                        <p className="text-2xl font-black text-primary tracking-tighter">${totalSpent.toLocaleString('es-AR')}</p>
                    </div>
                </div>

                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
                    <span className="material-symbols-outlined text-emerald-500 mb-2">gpp_good</span>
                    <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Dinero Protegido</p>
                        <p className="text-2xl font-black text-emerald-700 tracking-tighter">${moneyProtected.toLocaleString('es-AR')}</p>
                    </div>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/50 shadow-sm flex flex-col justify-between">
                    <span className="material-symbols-outlined text-amber-500 mb-2">local_shipping</span>
                    <div>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Órdenes Activas</p>
                        <p className="text-2xl font-black text-on-surface tracking-tighter">{activeOrders}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {purchases.map((order) => {
                    // Logic for status labels
                    const getStatusLabel = (status: string) => {
                        switch (status) {
                            case 'PAID_HELD': return 'Pago en Custodia';
                            case 'SHIPPED': return 'Producto en Camino';
                            case 'DELIVERED_PENDING_REVIEW': return 'Llegó (Confirmar)';
                            case 'COMPLETED': return 'Finalizado';
                            case 'CANCELLED': return 'Cancelado';
                            default: return 'En Proceso';
                        }
                    };

                    const statusColor = order.status === 'COMPLETED' ? 'text-emerald-500 bg-emerald-50' :
                        order.status === 'CANCELLED' ? 'text-red-500 bg-red-50' :
                            'text-primary bg-primary-container';

                    return (
                        <div key={order.id} className="bg-surface-container-lowest border border-outline-variant/50 rounded-[32px] overflow-hidden shadow-premium hover:shadow-premium-lg transition-all group">
                            <div className="p-8 flex flex-col md:flex-row gap-8">

                                {/* Imagen del Producto */}
                                <div className="size-28 bg-surface rounded-2xl overflow-hidden flex-shrink-0 border border-outline-variant/30 flex items-center justify-center">
                                    {order.itemImage ? (
                                        <img src={order.itemImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={order.itemTitle} />
                                    ) : (
                                        <span className="material-symbols-outlined text-4xl text-outline-variant font-black">image</span>
                                    )}
                                </div>

                                {/* Info Principal */}
                                <div className="flex-grow space-y-2">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black text-on-surface-variant bg-surface px-3 py-1 rounded-lg uppercase tracking-widest border border-outline-variant/30">
                                            Orden #{order.id.slice(-6).toUpperCase()}
                                        </span>
                                        <p className="text-2xl font-black text-on-surface tracking-tighter">${(order.amountTotal || order.total)?.toLocaleString('es-AR')}</p>
                                    </div>
                                    <h3 className="text-xl font-black text-on-surface leading-tight group-hover:text-primary transition-colors">{order.itemTitle}</h3>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                                        <span>Fecha: {formatDate(order.createdAt)}</span>
                                        <span className="size-1 bg-gray-200 rounded-full"></span>
                                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full border border-current shadow-sm ${statusColor}`}>
                                            <span className="material-symbols-outlined text-sm font-black">
                                                {order.status === 'COMPLETED' ? 'verified' :
                                                    order.status === 'SHIPPED' ? 'local_shipping' :
                                                        order.status === 'PAID_HELD' ? 'lock_clock' : 'schedule'}
                                            </span>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </div>

                                    {order.status === 'SHIPPED' && order.trackingId && (
                                        <div className="mt-4 p-4 bg-primary-container rounded-2xl border border-primary-100 flex items-center gap-3 animate-in slide-in-from-left-2">
                                            <span className="material-symbols-outlined text-primary">local_shipping</span>
                                            <div className="text-[10px] font-black uppercase">
                                                <p className="text-primary mb-0.5">Seguimiento: {order.courier || 'Correo Argentino'}</p>
                                                <p className="text-on-surface tracking-widest">{order.trackingId}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Botones de Acción Crítica */}
                                <div className="flex flex-col gap-3 justify-center min-w-[220px]">
                                    {(order.status === 'SHIPPED' || order.status === 'PAID_HELD' || order.status === 'DELIVERED_PENDING_REVIEW') ? (
                                        <>
                                            {order.status === 'DELIVERED_PENDING_REVIEW' ? (
                                                <button
                                                    className="w-full bg-primary text-on-primary py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-primary-500/20 active:scale-95 flex items-center justify-center gap-2"
                                                    onClick={() => onReleaseFunds(order.id)}
                                                >
                                                    <span className="material-symbols-outlined text-sm">payments</span>
                                                    Aprobar y Liberar Pago
                                                </button>
                                            ) : (
                                                <button
                                                    className="w-full bg-on-surface text-on-primary py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-dark-800/20 active:scale-95 flex items-center justify-center gap-2"
                                                    onClick={() => onConfirmReceipt(order.id)}
                                                >
                                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                                    Confirmar Recepción
                                                </button>
                                            )}
                                            <Link
                                                to={`/resolution-center?tx=${order.id}`}
                                                className="text-[10px] font-black text-outline uppercase tracking-widest hover:text-red-500 transition-colors text-center"
                                            >
                                                ¿Problemas con el producto?
                                            </Link>
                                        </>
                                    ) : order.status === 'COMPLETED' && !reviewedIds.has(order.id) ? (
                                        <button
                                            className="w-full bg-amber-400 text-dark-900 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-300 transition-all shadow-xl shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
                                            onClick={() => onOpenReview(order)}
                                        >
                                            <span className="material-symbols-outlined text-sm">star</span>
                                            Calificar Vendedor
                                        </button>
                                    ) : order.status === 'PENDING_PAYMENT' ? (
                                        <div className="flex flex-col gap-3">
                                            <Link
                                                to={`/checkout?tx=${order.id}`}
                                                className="w-full bg-primary text-on-primary py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-dark-800/20 active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-sm">payments</span>
                                                Continuar Pago
                                            </Link>
                                            <button
                                                className="text-[10px] font-black text-outline uppercase tracking-widest hover:text-red-500 transition-colors text-center"
                                                onClick={() => onCancel && onCancel(order.id)}
                                            >
                                                Cancelar Orden
                                            </button>
                                        </div>
                                    ) : order.status === 'COMPLETED' ? (
                                        <div className="flex flex-col items-center gap-3 py-2">
                                            <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                                <span className="material-symbols-outlined text-sm font-black">verified</span>
                                                Compra Finalizada
                                            </div>
                                            <Link to={`/product/${order.itemId}`} className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">Dejar Opinión</Link>
                                        </div>
                                    ) : order.status === 'CANCELLED' ? (
                                        <div className="flex flex-col items-center gap-3 py-2">
                                            <div className="flex items-center gap-2 text-red-500 font-black text-xs uppercase tracking-widest bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                                                <span className="material-symbols-outlined text-sm font-black">cancel</span>
                                                Cancelada
                                            </div>
                                            <p className="text-[9px] font-bold text-center text-on-surface-variant uppercase">{order.lastSystemMessage || 'Esta transacción ha sido anulada.'}</p>
                                            <button 
                                                onClick={() => onHide && onHide(order.id)}
                                                className="mt-2 text-[9px] font-black text-outline uppercase tracking-widest hover:text-red-500 transition-colors flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                                Eliminar de este historial
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 bg-surface rounded-2xl border border-outline-variant/30">
                                            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest animate-pulse">Esperando al vendedor...</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Banner de Garantía */}
                            <div className="bg-surface/50 px-8 py-4 flex items-center justify-between border-t border-outline-variant/30">
                                <div className="flex items-center gap-3 text-on-surface-variant">
                                    <span className="material-symbols-outlined text-base">gpp_good</span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Tu pago está protegido hasta que confirmas la recepción</span>
                                </div>
                                <Link to={`/messages`} className="text-[9px] font-black text-on-surface uppercase flex items-center gap-2 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-base">chat_bubble</span>
                                    Mensaje al vendedor
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
