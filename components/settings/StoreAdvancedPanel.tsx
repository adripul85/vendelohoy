import React, { useState, useEffect } from 'react';
import { UserProfile, updateUserProfile } from '../../lib/users';
import { ItemData, getItemsBySeller, deleteItem, updateItem } from '../../lib/items';
import { TransactionData, getUserTransactions } from '../../lib/transactions';
import { useNotification } from '../../context/NotificationContext';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import ERPDashboard from '../dashboard/ERPDashboard';

interface StoreAdvancedPanelProps {
    user: UserProfile;
}

const BuyerCell = ({ buyerId, transaction }: { buyerId: string, transaction: any }) => {
    const [buyer, setBuyer] = useState<UserProfile | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    useEffect(() => {
        import('../../lib/users').then(({ getUserProfile }) => {
            getUserProfile(buyerId).then(setBuyer);
        });
    }, [buyerId]);

    return (
        <>
            <button type="button" onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }} className="col-span-2 text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline truncate">
                {buyer ? buyer.displayName : `@${buyerId.substring(0,6)}`}
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={(e) => { e.preventDefault(); setIsModalOpen(false); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <div className="flex flex-col items-center mb-6">
                            <img src={buyer?.avatar || `https://ui-avatars.com/api/?name=${buyer?.displayName || 'C'}&background=random`} alt="Avatar" className="size-20 rounded-2xl mb-4 shadow-sm" />
                            <h3 className="text-xl font-black text-slate-900">{buyer?.displayName || 'Comprador'}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {buyerId}</p>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">local_shipping</span> Entrega</h4>
                                <p className="text-xs font-bold text-slate-700 capitalize">{transaction.deliveryMethod?.replace('_', ' ') || 'No especificado'}</p>
                                {transaction.trackingNumber && <p className="text-[10px] text-slate-500 font-medium mt-1">Tracking: {transaction.trackingNumber}</p>}
                            </div>
                            {buyer?.email && (
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">badge</span> Datos Personales</h4>
                                    <p className="text-xs font-bold text-slate-700">{buyer.email}</p>
                                    {buyer.dni && <p className="text-xs font-bold text-slate-700 mt-1">DNI: {buyer.dni}</p>}
                                    {buyer.social?.whatsapp && <p className="text-xs font-bold text-slate-700 mt-1">WhatsApp: {buyer.social.whatsapp}</p>}
                                    
                                    {(buyer.location?.address || buyer.location?.city) && (
                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Domicilio</p>
                                            <p className="text-xs font-bold text-slate-700">
                                                {buyer.location?.address}
                                                {buyer.location?.address && (buyer.location?.city || buyer.location?.state) ? ', ' : ''}
                                                {buyer.location?.city}
                                                {buyer.location?.city && buyer.location?.state ? ', ' : ''}
                                                {buyer.location?.state}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <button type="button" onClick={(e) => { e.preventDefault(); setIsModalOpen(false); }} className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

const StoreAdvancedPanel: React.FC<StoreAdvancedPanelProps> = ({ user }) => {
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<(ItemData & { id: string })[]>([]);
    const [sales, setSales] = useState<TransactionData[]>([]);
    const [coupons, setCoupons] = useState(user.store?.coupons || []);
    const [newCoupon, setNewCoupon] = useState({ code: '', discountPercentage: 10, maxUses: 10 });
    
    // Date filter state (Defaults to last 30 days)
    const [reportStartDate, setReportStartDate] = useState(format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'));
    const [reportEndDate, setReportEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [userItems, userTxs] = await Promise.all([
                    getItemsBySeller(user.uid),
                    getUserTransactions(user.uid)
                ]);
                setItems(userItems);
                setSales(userTxs.ventas.filter(t => t.status === 'COMPLETED' || t.status === 'PAID_HELD' || t.status === 'SHIPPED'));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user.uid]);

    const handleCreateCoupon = async () => {
        if (!newCoupon.code || newCoupon.discountPercentage <= 0) {
            notify({ type: 'error', title: 'Error', message: 'Código y descuento son requeridos.', icon: 'error' });
            return;
        }

        const code = newCoupon.code.toUpperCase().replace(/\s/g, '');
        const exists = coupons.find(c => c.code === code);
        
        if (exists) {
            notify({ type: 'error', title: 'Error', message: 'El cupón ya existe.', icon: 'error' });
            return;
        }

        const coupon = {
            id: Math.random().toString(36).substring(2, 9),
            code,
            discountPercentage: newCoupon.discountPercentage,
            maxUses: newCoupon.maxUses,
            uses: 0,
            active: true,
            createdAt: new Date().toISOString()
        };

        const updatedCoupons = [...coupons, coupon];
        
        try {
            await updateUserProfile(user.uid, { 
                store: { ...(user.store as any), coupons: updatedCoupons } 
            });
            setCoupons(updatedCoupons);
            setNewCoupon({ code: '', discountPercentage: 10, maxUses: 10 });
            notify({ type: 'success', title: 'Cupón Creado', message: 'El código de descuento está activo.', icon: 'local_offer' });
        } catch (e) {
            notify({ type: 'error', title: 'Error', message: 'No se pudo guardar el cupón.', icon: 'error' });
        }
    };

    const toggleCoupon = async (couponId: string) => {
        const updatedCoupons = coupons.map(c => 
            c.id === couponId ? { ...c, active: !c.active } : c
        );
        
        try {
            await updateUserProfile(user.uid, { 
                store: { ...(user.store as any), coupons: updatedCoupons } 
            });
            setCoupons(updatedCoupons);
            notify({ type: 'success', title: 'Cupón Actualizado', message: 'Estado del cupón modificado.', icon: 'sync' });
        } catch (e) {
            notify({ type: 'error', title: 'Error', message: 'No se pudo actualizar.', icon: 'error' });
        }
    };

    const deleteCoupon = async (couponId: string) => {
        if (!window.confirm('¿Seguro que deseas eliminar este cupón?')) return;
        const updatedCoupons = coupons.filter(c => c.id !== couponId);
        
        try {
            await updateUserProfile(user.uid, { 
                store: { ...(user.store as any), coupons: updatedCoupons } 
            });
            setCoupons(updatedCoupons);
            notify({ type: 'info', title: 'Cupón Eliminado', message: 'El cupón ha sido borrado.', icon: 'delete' });
        } catch (e) {
            notify({ type: 'error', title: 'Error', message: 'No se pudo eliminar.', icon: 'error' });
        }
    };

    const handleMarkAsSoldOffline = async (item: ItemData & {id: string}) => {
        if (!window.confirm("¿Confirmás que vendiste este producto en persona/efectivo?")) return;
        
        try {
            // Check for fees
            let fee = 0;
            if (item.flashSaleFeeApplied) fee += item.price * item.flashSaleFeeApplied;
            if (item.featuredFeeApplied) fee += item.price * item.featuredFeeApplied;
            
            if (fee > 0) {
                if (!window.confirm(`Al ser un producto promocionado, se debitarán $${fee} de tu saldo disponible. ¿Deseas continuar?`)) return;
                
                const newAvailable = (user.wallet?.available || 0) - fee;
                await updateUserProfile(user.uid, {
                    "wallet.available": newAvailable
                });
            }

            await updateItem(item.id, { status: 'SOLD', quantity: 0 });
            setItems(items.map(i => i.id === item.id ? { ...i, status: 'SOLD', quantity: 0 } : i));
            notify({ type: 'success', title: 'Producto Vendido', message: '¡Felicitaciones por tu venta offline!', icon: 'check_circle' });
        } catch (error) {
            notify({ type: 'error', title: 'Error', message: 'Hubo un problema al marcar como vendido.', icon: 'error' });
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!window.confirm("¿Seguro que deseas eliminar este producto permanentemente?")) return;
        try {
            await deleteItem(itemId);
            setItems(items.filter(i => i.id !== itemId));
            notify({ type: 'success', title: 'Producto Eliminado', message: 'El producto fue borrado de tu inventario.', icon: 'delete' });
        } catch (error) {
            notify({ type: 'error', title: 'Error', message: 'Hubo un problema al eliminar el producto.', icon: 'error' });
        }
    };

    const handleDownloadReport = () => {
        const filteredSales = sales.filter(s => {
            if (!s.createdAt) return false;
            const saleDate = s.createdAt.toDate();
            const start = new Date(reportStartDate + "T00:00:00");
            const end = new Date(reportEndDate + "T23:59:59");
            return saleDate >= start && saleDate <= end;
        });

        if (filteredSales.length === 0) {
            notify({ type: 'warning', title: 'Sin datos', message: 'No hay ventas en este rango de fechas.', icon: 'warning' });
            return;
        }

        const headers = "ID Pedido,Fecha,Comprador,Producto,Estado,Monto\n";
        const rows = filteredSales.map(s => {
            const date = s.createdAt ? format(s.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A';
            const status = s.status === 'COMPLETED' ? 'Completado' : s.status === 'SHIPPED' ? 'Enviado' : 'Pendiente';
            return `"${s.id}","${date}","${s.buyerId}","${s.itemId}","${status}",${s.amount}`;
        }).join('\n');

        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_ventas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalRevenue = sales.reduce((acc, sale) => acc + sale.amount, 0);

    return (
        <div className="space-y-6 animate-fade-in w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h3 className="text-[28px] font-black text-slate-900 tracking-tight leading-tight">
                        Dashboard
                    </h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Bienvenido de nuevo, aquí está el resumen de tu tienda.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm text-sm">
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">calendar_today</span>
                        <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="bg-transparent text-slate-700 font-bold outline-none cursor-pointer" />
                        <span className="text-slate-300">-</span>
                        <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="bg-transparent text-slate-700 font-bold outline-none cursor-pointer" />
                    </div>
                    <button onClick={handleDownloadReport} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-xl text-sm font-bold text-white flex items-center gap-2 shadow-sm shrink-0">
                        <span className="material-symbols-outlined text-lg">download</span>
                        Descargar Reporte
                    </button>
                </div>
            </div>
            
            {/* Nuevo ERP Dashboard */}
            <div className="mt-8">
                <ERPDashboard sales={sales} items={items} storeId={user.uid} />
            </div>
            
            {/* Main Stats Card - Core Ledger Style */}
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    
                    {/* Ingresos Totales */}
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Ingresos Totales</span>
                            <div className="size-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                <span className="material-symbols-outlined text-[18px]">payments</span>
                            </div>
                        </div>
                        <span className="text-3xl font-bold text-slate-900 tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            ${totalRevenue.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1 mt-2 text-[11px] font-bold">
                            <span className="text-emerald-600 flex items-center"><span className="material-symbols-outlined text-[12px]">trending_up</span> +0.0%</span>
                            <span className="text-slate-400 font-medium">vs mes pasado</span>
                        </div>
                    </div>

                    {/* Ventas Exitosas */}
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Ventas Exitosas</span>
                            <div className="size-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                            </div>
                        </div>
                        <span className="text-3xl font-bold text-slate-900 tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {sales.length}
                        </span>
                        <div className="flex items-center gap-1 mt-2 text-[11px] font-bold">
                            <span className="text-emerald-600 flex items-center"><span className="material-symbols-outlined text-[12px]">trending_up</span> +0.0%</span>
                            <span className="text-slate-400 font-medium">vs mes pasado</span>
                        </div>
                    </div>

                    {/* Productos Activos */}
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Prod. Activos</span>
                            <div className="size-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                            </div>
                        </div>
                        <span className="text-3xl font-bold text-slate-900 tracking-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {items.filter(i => i.status === 'AVAILABLE').length}
                        </span>
                        <div className="flex items-center gap-1 mt-2 text-[11px] font-bold">
                            <span className="text-emerald-600 flex items-center"><span className="material-symbols-outlined text-[12px]">trending_up</span> +0.0%</span>
                            <span className="text-slate-400 font-medium">vs mes pasado</span>
                        </div>
                    </div>

                    {/* Reputación */}
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Reputación</span>
                            <div className="size-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                <span className="material-symbols-outlined text-[18px]">star</span>
                            </div>
                        </div>
                        <span className="text-3xl font-bold text-slate-900 tracking-tight flex items-baseline gap-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {user.reputation?.averageRating || 0}
                            <span className="text-lg text-yellow-500 material-symbols-outlined mb-1">star</span>
                        </span>
                        <div className="flex items-center gap-1 mt-2 text-[11px] font-bold">
                            <span className="text-slate-400 font-medium">Basado en reseñas</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Rendimiento de Ventas Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] border border-slate-200">
                <div className="flex justify-between items-center mb-8">
                    <h4 className="text-[18px] font-bold text-slate-900 tracking-tight">Rendimiento de Ventas</h4>
                    <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1 cursor-pointer">
                        Últimos 15 días <span className="material-symbols-outlined text-[14px]">expand_more</span>
                    </div>
                </div>
                
                {/* CSS Bar Chart */}
                <div className="h-48 flex items-end gap-1 sm:gap-2 border-b border-slate-100 pb-2 relative pt-4">
                    {(() => {
                        const last15Days = Array.from({ length: 15 }, (_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (14 - i));
                            d.setHours(0,0,0,0);
                            return d;
                        });

                        const chartData = last15Days.map(date => {
                            const nextDay = new Date(date);
                            nextDay.setDate(date.getDate() + 1);
                            
                            const daySales = sales.filter(s => {
                                if (!s.createdAt) return false;
                                const saleDate = s.createdAt.toDate();
                                return saleDate >= date && saleDate < nextDay;
                            });

                            const revenue = daySales.reduce((acc, s) => acc + (s.amountProduct || s.amount), 0);
                            return {
                                date,
                                label: format(date, 'dd Oct'), // We can use generic formatting, but for exact match with design: format(date, 'dd MMM')
                                realLabel: format(date, 'dd MMM'),
                                revenue
                            };
                        });

                        const maxChartRevenue = Math.max(...chartData.map(d => d.revenue), 1);

                        return (
                            <>
                                {chartData.map((data, i) => (
                                    <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                                        {/* Tooltip */}
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap pointer-events-none transition-opacity z-10">
                                            ${data.revenue.toLocaleString()}
                                        </div>
                                        {/* Bar */}
                                        <div 
                                            className={`w-full rounded-t-sm transition-all duration-500 ease-out ${data.revenue > 0 ? 'bg-indigo-500 hover:bg-indigo-400 cursor-pointer' : 'bg-transparent'}`}
                                            style={{ height: `${(data.revenue / maxChartRevenue) * 100}%`, minHeight: data.revenue > 0 ? '4px' : '0' }}
                                        ></div>
                                    </div>
                                ))}
                                
                                {/* Y-Axis lines (decorative) */}
                                <div className="absolute left-0 right-0 top-1/2 border-t border-slate-100 -z-10"></div>
                                <div className="absolute left-0 right-0 top-1/4 border-t border-slate-100 -z-10"></div>
                                <div className="absolute left-0 right-0 top-3/4 border-t border-slate-100 -z-10"></div>
                            </>
                        );
                    })()}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                    {(() => {
                        const last15Days = Array.from({ length: 15 }, (_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (14 - i));
                            return d;
                        });
                        return (
                            <>
                                <span>{format(last15Days[0], 'dd MMM')}</span>
                                <span>{format(last15Days[7], 'dd MMM')}</span>
                                <span>{format(last15Days[14], 'dd MMM')}</span>
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Desglose de Ventas (Control de Stock-like table) */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] border border-slate-200">
                <h4 className="text-[18px] font-bold text-slate-900 tracking-tight mb-6">Desglose de Ventas Recientes</h4>
                
                <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-4">Producto</div>
                    <div className="col-span-2 text-center">Fecha</div>
                    <div className="col-span-2 text-center">Comprador</div>
                    <div className="col-span-2 text-right">Monto Venta</div>
                    <div className="col-span-2 text-right text-emerald-600">Ganancia Neta</div>
                </div>

                <div className="overflow-y-auto max-h-[350px] custom-scrollbar">
                    {sales.length === 0 ? (
                        <p className="text-center text-slate-400 text-sm py-8 font-medium">Aún no tienes ventas registradas.</p>
                    ) : (
                        sales.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)).map(sale => {
                            const salePrice = sale.amountProduct || sale.amount;
                            const fee = (sale.amountPlatformFee || sale.platformFee || 0) + (sale.amountGatewayFee || 0);
                            const profit = (sale as any).netAmount || (salePrice - fee);
                            
                            return (
                                <div key={sale.id} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 items-center hover:bg-slate-50 transition-colors">
                                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                                        {sale.itemImage ? (
                                            <img src={sale.itemImage} alt={sale.itemTitle} className="size-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                                        ) : (
                                            <div className="size-10 rounded-lg bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-400">inventory_2</span>
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <h5 className="font-semibold text-slate-800 text-sm truncate">{sale.itemTitle}</h5>
                                            <p className="text-[10px] text-slate-400 font-mono truncate">ID: #{sale.itemId?.substring(0,8)}</p>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-center text-xs font-bold text-slate-600">
                                        {sale.createdAt ? format(sale.createdAt.toDate(), 'dd MMM yyyy') : 'N/A'}
                                    </div>
                                    <BuyerCell buyerId={sale.buyerId} transaction={sale} />
                                    <div className="col-span-2 text-right font-bold text-slate-700 text-sm">
                                        ${salePrice.toLocaleString()}
                                    </div>
                                    <div className="col-span-2 text-right font-black text-emerald-600 text-sm">
                                        ${profit.toLocaleString()}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inventario - 2/3 width */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] border border-slate-200 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[18px] font-bold text-slate-900 tracking-tight">Control de Stock</h4>
                        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Ver todos</button>
                    </div>
                    
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <div className="col-span-4">Producto</div>
                        <div className="col-span-2 text-center">Stock</div>
                        <div className="col-span-3 text-right">Precio</div>
                        <div className="col-span-3 text-right pr-6">Estado</div>
                    </div>

                    <div className="overflow-y-auto max-h-[300px] custom-scrollbar flex-1">
                        <div className="flex flex-col">
                            {items.length === 0 ? (
                                <p className="text-center text-slate-400 text-sm py-8 font-medium">No tienes productos en tu tienda.</p>
                            ) : (
                                items.map(item => (
                                    <div key={item.id} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 items-center hover:bg-slate-50 transition-colors group">
                                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                                            <img src={item.images[0]} alt={item.title} className="size-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <h5 className="font-semibold text-slate-800 text-sm truncate">{item.title}</h5>
                                                <p className="text-[10px] text-slate-400 font-mono truncate">#{item.id?.substring(0,8)}</p>
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-center font-bold text-slate-700 text-sm">
                                            {item.quantity || 1}
                                        </div>
                                        <div className="col-span-3 text-right font-bold text-slate-700 text-sm truncate">
                                            ${item.price.toLocaleString()}
                                        </div>
                                        <div className="col-span-3 flex justify-end items-center gap-1">
                                            <span className={`px-2 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${item.status === 'SOLD' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                {item.status === 'SOLD' ? 'Vendido' : 'Activo'}
                                            </span>
                                            <button onClick={() => handleDeleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all p-1" title="Eliminar Producto">
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                            {item.status !== 'SOLD' && (
                                                <button onClick={() => handleMarkAsSoldOffline(item)} className="opacity-0 group-hover:opacity-100 text-emerald-500 hover:text-emerald-700 transition-all p-1" title="Marcar como Vendido (Efectivo)">
                                                    <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
                                                </button>
                                            )}
                                            <Link to={`/product/${item.id}`} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition-all p-1" title="Ver Producto">
                                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Columna Derecha (Cupones y Mensajes) - 1/3 width */}
                <div className="flex flex-col gap-6">

                    {/* Cupones */}
                    <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] border border-slate-200">
                        <h4 className="text-[18px] font-bold text-slate-900 tracking-tight mb-4">Cupones</h4>
                        
                        <div className="flex flex-col gap-2 mb-4">
                            <div className="flex gap-2">
                                <input type="text" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} placeholder="CÓDIGO" className="flex-1 bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-bold text-slate-700 uppercase outline-none focus:border-indigo-500 min-w-0" />
                                <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-2 w-20 focus-within:border-indigo-500 shrink-0">
                                    <input type="text" maxLength={2} value={newCoupon.discountPercentage || ''} onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setNewCoupon({...newCoupon, discountPercentage: val ? Math.min(99, Number(val)) : 0});
                                    }} className="w-full text-right pr-1 text-xs font-bold text-slate-700 outline-none bg-transparent min-w-0" />
                                    <span className="text-slate-400 text-xs font-bold shrink-0">%</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-2 flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 focus-within:border-indigo-500 min-w-0">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Usos:</span>
                                    <input type="text" maxLength={4} value={newCoupon.maxUses || ''} onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setNewCoupon({...newCoupon, maxUses: val ? Number(val) : 0});
                                    }} className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none min-w-0" />
                                </div>
                                <button onClick={handleCreateCoupon} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shrink-0">
                                    Crear
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                            {coupons.map(coupon => (
                                <div key={coupon.id} className={`flex items-center justify-between p-3 border rounded-lg transition-all ${coupon.active ? 'border-indigo-100 bg-indigo-50/50' : 'border-slate-100 bg-slate-50 grayscale'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 bg-white rounded-md flex items-center justify-center font-black text-indigo-600 shadow-sm text-xs border border-indigo-100">
                                            {coupon.discountPercentage}%
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-slate-800 text-xs tracking-tight">{coupon.code}</h5>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                                {coupon.uses}/{coupon.maxUses} USOS
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <button onClick={() => toggleCoupon(coupon.id)} className={`text-[9px] font-bold uppercase tracking-widest ${coupon.active ? 'text-slate-400 hover:text-amber-600' : 'text-emerald-600 hover:text-emerald-700'}`}>
                                            {coupon.active ? 'Pausar' : 'Activar'}
                                        </button>
                                        <button onClick={() => deleteCoupon(coupon.id)} className="text-[9px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-widest">
                                            Borrar
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {coupons.length === 0 && (
                                <p className="text-center text-slate-400 text-xs py-2 font-medium">Sin cupones activos.</p>
                            )}
                        </div>
                    </div>

                    {/* Centro de Mensajes Reducido */}
                    <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] border border-slate-200 flex flex-col items-center justify-center text-center">
                        <div className="size-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-3">
                            <span className="material-symbols-outlined text-2xl">forum</span>
                        </div>
                        <h4 className="text-[15px] font-bold text-slate-900">Centro de Mensajes</h4>
                        <p className="text-xs font-medium text-slate-500 mt-1 mb-4">Gestiona las consultas de tus clientes.</p>
                        <Link to="/messages" className="w-full py-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
                            Ir a Bandeja
                        </Link>
                    </div>
                </div>
            </div>

            {/* Integrations & Verification */}
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] border border-slate-200">
                <h4 className="text-[18px] font-bold text-slate-900 tracking-tight mb-6">Verificaciones e Integraciones</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ML Integration */}
                    <div className="flex flex-col items-center text-center p-6 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="size-12 bg-[#FFF159] rounded-xl flex items-center justify-center text-slate-900 mb-4 shadow-sm">
                            <span className="material-symbols-outlined font-black">handshake</span>
                        </div>
                        <h5 className="font-bold text-slate-800 text-sm mb-2">Reputación MercadoLibre</h5>
                        <p className="text-xs text-slate-500 mb-4">Vincula tu cuenta para importar tus puntos y nivel de mercado de ML de forma segura.</p>
                        <button className="w-full py-2.5 bg-[#FFF159] text-slate-900 font-bold text-xs rounded-lg hover:brightness-95 transition-all">
                            Vincular Cuenta (Próximamente)
                        </button>
                    </div>

                    {/* Tienda Oficial */}
                    <div className="flex flex-col items-center text-center p-6 bg-indigo-50/50 border border-indigo-100 rounded-xl relative overflow-hidden">
                        {(user?.store?.paidOfficialTick) && (
                            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">
                                Adquirido
                            </div>
                        )}
                        <div className="size-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-sm shadow-indigo-600/30">
                            <span className="material-symbols-outlined font-black">verified</span>
                        </div>
                        <h5 className="font-bold text-indigo-900 text-sm mb-2">Suscripción Tienda Oficial</h5>
                        <p className="text-xs text-indigo-600/70 mb-4">Requiere +500 ventas. Adquiere el Tick Azul único para destacar en todo el mercado.</p>
                        
                        <button 
                            onClick={async () => {
                                // DEMO TOGGLE
                                if (!user) return;
                                const updatedStore = { ...(user.store || {}), paidOfficialTick: !user.store?.paidOfficialTick } as any;
                                await import('../../lib/users').then(({ updateUserProfile }) => updateUserProfile(user.uid, { store: updatedStore }));
                                window.location.reload();
                            }}
                            className={`w-full py-2.5 font-bold text-xs rounded-lg transition-all ${user?.store?.paidOfficialTick ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'}`}
                        >
                            {user?.store?.paidOfficialTick ? 'Revocar Tick (Demo)' : 'Pagar Tick Oficial (Demo)'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreAdvancedPanel;
