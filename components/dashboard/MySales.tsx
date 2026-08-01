import React from 'react';
import { TransactionData } from '../../lib/transactions';

interface MySalesProps {
    sales: (TransactionData & { id: string })[];
    formatDate: (timestamp: any) => string;
    onUpdateTracking: (txId: string) => void;
    shippingTx: string | null;
    setShippingTx: (id: string | null) => void;
    trackingInput: string;
    setTrackingInput: (val: string) => void;
    courierInput: string;
    setCourierInput: (val: string) => void;
    handleUpdateTracking: (txId: string) => void;
    handleManualDelivery: (txId: string, method: string) => void;
    handleGenerateLabel: (txId: string) => void;
    isGeneratingLabel?: boolean;
}

export default function MySales({
    sales,
    formatDate,
    onUpdateTracking,
    shippingTx,
    setShippingTx,
    trackingInput,
    setTrackingInput,
    courierInput,
    setCourierInput,
    handleUpdateTracking,
    handleManualDelivery,
    handleGenerateLabel,
    isGeneratingLabel
}: MySalesProps) {
    // Cálculos de KPIs
    const totalSales = sales.length;
    const totalRevenue = sales.filter(s => s.status === 'COMPLETED').reduce((acc, curr) => acc + (curr.amountProduct || curr.amount), 0);
    // Ganancia asumiendo fee del 7%
    const estimatedProfit = totalRevenue * 0.93; 
    const moneyInEscrow = sales.filter(s => ['PAID_HELD', 'SHIPPED', 'DELIVERED_PENDING_REVIEW'].includes(s.status)).reduce((acc, curr) => acc + (curr.amountProduct || curr.amount), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between pl-2">
                <h2 className="text-2xl font-black text-on-surface tracking-tighter uppercase">Mis Ventas</h2>
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Seguimiento de Cobros</p>
            </div>

            {/* ANALÍTICAS Y KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/50 shadow-sm flex flex-col justify-between">
                    <span className="material-symbols-outlined text-primary-500 mb-2">trending_up</span>
                    <div>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Total Vendido</p>
                        <p className="text-2xl font-black text-on-surface tracking-tighter">${totalRevenue.toLocaleString('es-AR')}</p>
                    </div>
                </div>

                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
                    <span className="material-symbols-outlined text-emerald-500 mb-2">savings</span>
                    <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Tu Ganancia Neta</p>
                        <p className="text-2xl font-black text-emerald-700 tracking-tighter">${estimatedProfit.toLocaleString('es-AR')}</p>
                    </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm flex flex-col justify-between">
                    <span className="material-symbols-outlined text-amber-500 mb-2">lock_clock</span>
                    <div>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">En Custodia</p>
                        <p className="text-2xl font-black text-amber-700 tracking-tighter">${moneyInEscrow.toLocaleString('es-AR')}</p>
                    </div>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/50 shadow-sm flex flex-col justify-between">
                    <span className="material-symbols-outlined text-on-surface-variant mb-2">receipt_long</span>
                    <div>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Ventas Históricas</p>
                        <p className="text-2xl font-black text-on-surface tracking-tighter">{totalSales}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {sales.map((order) => (
                    <div key={order.id} className="bg-surface-container-lowest border border-outline-variant/50 rounded-[32px] overflow-hidden shadow-premium hover:shadow-premium-lg transition-all group">
                        <div className="p-8 flex flex-col md:flex-row gap-10">

                            {/* Imagen y Info Base */}
                            <div className="flex gap-6 flex-[1.5]">
                                <div className="size-24 bg-surface rounded-2xl overflow-hidden flex-shrink-0 border border-outline-variant/30">
                                    {order.itemImage ? (
                                        <img src={order.itemImage} className="w-full h-full object-cover" alt={order.itemTitle} />
                                    ) : (
                                        <span className="material-symbols-outlined text-4xl text-outline-variant flex items-center justify-center size-full">image</span>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-widest border border-amber-100/50">
                                        ID #{order.id.slice(-6).toUpperCase()}
                                    </span>
                                    <h3 className="text-lg font-black text-on-surface leading-tight line-clamp-2">{order.itemTitle}</h3>
                                    {(order.selectedColor || order.selectedSize) && (
                                        <div className="flex gap-2 text-[10px] font-bold text-on-surface-variant uppercase bg-surface-container-low px-2 py-1 rounded w-fit">
                                            {order.selectedColor && <span>Color: <span className="text-primary">{order.selectedColor}</span></span>}
                                            {order.selectedColor && order.selectedSize && <span>|</span>}
                                            {order.selectedSize && <span>Talle: <span className="text-primary">{order.selectedSize}</span></span>}
                                        </div>
                                    )}
                                    <p className="text-2xl font-black text-on-surface tracking-tighter">${(order.amountProduct || order.amount)?.toLocaleString('es-AR')}</p>
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{formatDate(order.createdAt)}</p>
                                </div>
                            </div>

                            {/* Money Timeline */}
                            {order.status === 'CANCELLED' ? (
                                <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                                    <span className="material-symbols-outlined text-4xl text-red-500 mb-2">cancel</span>
                                    <h4 className="text-sm font-black text-on-surface uppercase tracking-widest mb-1">Orden Cancelada</h4>
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase">{order.lastSystemMessage || 'Esta transacción fue cancelada y no se completará.'}</p>
                                </div>
                            ) : order.status === 'PENDING_PAYMENT' ? (
                                <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                                    <span className="material-symbols-outlined text-4xl text-amber-500 mb-2">hourglass_empty</span>
                                    <h4 className="text-sm font-black text-on-surface uppercase tracking-widest mb-1">Esperando Pago</h4>
                                    <p className="text-[10px] font-bold text-on-surface-variant uppercase">El comprador inició la compra pero aún no completó el pago.</p>
                                </div>
                            ) : (
                                <div className="flex-grow space-y-6 flex flex-col justify-center">
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Progreso de Liquidación</h4>
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-md border ${order.status === 'COMPLETED' ? 'text-emerald-500 bg-emerald-50 border-emerald-100' : 'text-primary bg-primary-container border-primary-100'
                                        }`}>
                                        {order.status === 'COMPLETED' ? 'DINERO LIBERADO' : 'EN CUSTODIA'}
                                    </span>
                                </div>

                                <div className="relative flex justify-between px-2">
                                    {/* Step 1: Venta */}
                                    <div className="flex flex-col items-center z-10">
                                        <div className={`size-8 rounded-full flex items-center justify-center shadow-lg transition-all ${['PAID_HELD', 'SHIPPED', 'DELIVERED_PENDING_REVIEW', 'COMPLETED'].includes(order.status)
                                            ? 'bg-emerald-500 text-on-primary shadow-emerald-200 scale-110'
                                            : 'bg-surface-container-lowest border-2 border-outline-variant/50 text-light-300'
                                            }`}>
                                            <span className="material-symbols-outlined text-xs font-black">payments</span>
                                        </div>
                                        <span className="text-[8px] mt-2 font-black text-on-surface-variant uppercase tracking-widest">Cobrado</span>
                                    </div>

                                    {/* Conector 1 */}
                                    <div className={`absolute top-4 left-[15%] w-[30%] h-[3px] rounded-full transition-all duration-700 ${['SHIPPED', 'DELIVERED_PENDING_REVIEW', 'COMPLETED'].includes(order.status) ? 'bg-emerald-500' : 'bg-surface-container-lowest'
                                        }`}></div>

                                    {/* Step 2: Entrega */}
                                    <div className="flex flex-col items-center z-10">
                                        <div className={`size-8 rounded-full flex items-center justify-center transition-all ${['SHIPPED', 'DELIVERED_PENDING_REVIEW', 'COMPLETED'].includes(order.status)
                                            ? 'bg-emerald-500 text-on-primary shadow-lg shadow-emerald-200 scale-110'
                                            : 'bg-surface-container-lowest border-2 border-outline-variant/50 text-light-300'
                                            }`}>
                                            <span className="material-symbols-outlined text-xs font-black">local_shipping</span>
                                        </div>
                                        <span className="text-[8px] mt-2 font-black text-on-surface-variant uppercase tracking-widest">Enviado</span>
                                    </div>

                                    {/* Conector 2 */}
                                    <div className={`absolute top-4 left-[55%] w-[30%] h-[3px] rounded-full transition-all duration-700 ${order.status === 'COMPLETED' ? 'bg-primary' : 'bg-surface-container-lowest'
                                        }`}></div>

                                    {/* Step 3: Pago Final */}
                                    <div className="flex flex-col items-center z-10">
                                        <div className={`size-8 rounded-full flex items-center justify-center transition-all ${order.status === 'COMPLETED'
                                            ? 'bg-primary text-on-primary shadow-lg shadow-primary-200 scale-125 ring-4 ring-primary-50'
                                            : 'bg-surface-container-lowest border-2 border-outline-variant/50 text-light-300'
                                            }`}>
                                            <span className="material-symbols-outlined text-xs font-black">account_balance</span>
                                        </div>
                                        <span className="text-[8px] mt-2 font-black text-on-surface-variant uppercase tracking-widest">Dinero Liberado</span>
                                    </div>
                                </div>

                                {order.status === 'COMPLETED' && (
                                    <p className="text-[10px] text-center font-bold text-emerald-600 bg-emerald-50 py-2 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
                                        Liquidación exitosa a tu cuenta bancaria vinculada.
                                    </p>
                                )}
                            </div>
                            )}

                            {/* Acciones */}
                            <div className="flex flex-col gap-3 justify-center min-w-[200px]">
                                {order.status === 'PAID_HELD' && (
                                    <>
                                        {shippingTx === order.id ? (
                                            <div className="flex flex-col gap-2 p-3 bg-surface rounded-2xl border border-outline-variant/50 animate-in zoom-in-95 duration-200">
                                                <select
                                                    value={courierInput}
                                                    onChange={(e) => setCourierInput(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 outline-none text-[10px] font-black uppercase tracking-widest focus:border-primary-vibrant"
                                                >
                                                    <option value="Correo Argentino">Correo Argentino</option>
                                                    <option value="Andreani">Andreani</option>
                                                    <option value="OCA">OCA</option>
                                                    <option value="Urbano">Urbano</option>
                                                    <option value="Otro">Otro</option>
                                                </select>
                                                
                                                {courierInput === 'Correo Argentino' ? (
                                                    <button 
                                                        onClick={() => handleGenerateLabel(order.id)} 
                                                        disabled={isGeneratingLabel}
                                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        {isGeneratingLabel ? (
                                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                                                        )}
                                                        Generar Etiqueta Oficial
                                                    </button>
                                                ) : (
                                                    <>
                                                        <input
                                                            type="text"
                                                            placeholder="Seguimiento #"
                                                            value={trackingInput}
                                                            onChange={(e) => setTrackingInput(e.target.value)}
                                                            className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 outline-none text-[10px] font-black uppercase tracking-widest focus:border-primary-vibrant"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleUpdateTracking(order.id)} className="flex-1 py-3 bg-primary text-on-primary rounded-xl text-[10px] font-black uppercase tracking-widest">GUARDAR</button>
                                                            <button onClick={() => setShippingTx(null)} className="size-10 bg-surface-container-lowest border border-outline-variant/50 text-on-surface-variant rounded-xl flex items-center justify-center hover:bg-surface-container transition-colors">
                                                                <span className="material-symbols-outlined text-sm">close</span>
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShippingTx(order.id)}
                                                className="w-full bg-primary text-on-primary py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary-200"
                                            >
                                                <span className="material-symbols-outlined text-base">local_shipping</span>
                                                Informar envío
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleManualDelivery(order.id, order.deliveryMethod)}
                                            className="w-full bg-surface-container-lowest border border-outline-variant/50 text-on-surface py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-surface transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-base">handshake</span>
                                            Entregado en mano
                                        </button>
                                    </>
                                )}
                                {order.status === 'SHIPPED' && (
                                    <div className="bg-surface p-4 rounded-2xl border border-outline-variant/30 text-center">
                                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Tracking</p>
                                        <p className="text-xs font-black text-on-surface tracking-widest">{order.trackingId}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
