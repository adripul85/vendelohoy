import React, { useState, useEffect } from 'react';
import { UserProfile, updateUserProfile, getUserProfile } from '../../lib/users';
import { ItemData, getItemsBySeller, deleteItem, updateItem, adjustItemStock } from '../../lib/items';
import { TransactionData, getUserTransactions } from '../../lib/transactions';
import { useNotification } from '../../context/NotificationContext';
import { Link } from 'react-router-dom';
import { subscribeToChats, Chat } from '../../lib/chat';
import { format } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis } from 'recharts';
import ERPDashboard from '../dashboard/ERPDashboard';
import StockAdjustmentModal from './StockAdjustmentModal';
import StockHistoryModal from './StockHistoryModal';
import PriceAdjustmentModal from './PriceAdjustmentModal';

interface StoreAdvancedPanelProps {
    user: UserProfile;
    customizationSlot?: React.ReactNode;
}

const BuyerCell = ({ buyerId, transaction, onStatusChange }: { buyerId: string, transaction: any, onStatusChange?: () => void }) => {
    const [buyer, setBuyer] = useState<UserProfile | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRequestingCourier, setIsRequestingCourier] = useState(false);
    const { notify } = useNotification();
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
                                {transaction.deliveryAddress && (
                                    <div className="mt-2 p-2 bg-slate-100/80 rounded-xl border border-slate-200">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">location_on</span> Dirección de Envío</p>
                                        <p className="text-xs font-bold text-slate-800 leading-tight">
                                            {transaction.deliveryAddress.street} {transaction.deliveryAddress.number}
                                            {transaction.deliveryAddress.apartment ? ` Dpto: ${transaction.deliveryAddress.apartment}` : ''}
                                        </p>
                                        <p className="text-[10px] font-medium text-slate-600 mt-0.5">
                                            {transaction.deliveryAddress.city}, {transaction.deliveryAddress.province} 
                                            {transaction.deliveryAddress.zipCode ? ` (CP: ${transaction.deliveryAddress.zipCode})` : ''}
                                        </p>
                                    </div>
                                )}
                                {transaction.deliveryMethod === 'domicilio' && (
                                    <div className="mt-2 p-2 bg-slate-100/80 rounded-xl border border-slate-200">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">payments</span> Pago del Envío</p>
                                        <p className="text-xs font-bold text-slate-800">
                                            {transaction.shippingPaymentMethod === 'pay_now' ? 'Pagado por adelantado' : 'Pago en destino (Se le abona al chofer)'}
                                        </p>
                                    </div>
                                )}
                                {transaction.deliveryMethod === 'domicilio' && !transaction.trackingNumber && transaction.status !== 'CANCELLED' && transaction.status !== 'REFUNDED' && (
                                    <button 
                                        type="button"
                                        disabled={isRequestingCourier}
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            setIsRequestingCourier(true);
                                            try {
                                                const { requestCourier } = await import('../../api-handlers/request-courier');
                                                await requestCourier(transaction.id);
                                                notify({ type: 'success', title: 'Vehículo Solicitado', message: 'El chofer va en camino.', icon: 'local_taxi' });
                                                if (onStatusChange) onStatusChange();
                                                setIsModalOpen(false);
                                            } catch (err: any) {
                                                notify({ type: 'error', title: 'Error', message: err.message, icon: 'error' });
                                            }
                                            setIsRequestingCourier(false);
                                        }}
                                        className="w-full mt-3 py-2 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
                                    >
                                        <span className={`material-symbols-outlined text-sm ${isRequestingCourier ? 'animate-spin' : ''}`}>{isRequestingCourier ? 'refresh' : 'local_taxi'}</span>
                                        {isRequestingCourier ? 'Solicitando...' : 'Solicitar Vehículo (Uber/Cabify)'}
                                    </button>
                                )}
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

const StoreAdvancedPanel: React.FC<StoreAdvancedPanelProps> = ({ user, customizationSlot }) => {
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<(ItemData & { id: string })[]>([]);
    const [sales, setSales] = useState<TransactionData[]>([]);
    const [coupons, setCoupons] = useState(user.store?.coupons || []);
    const [newCoupon, setNewCoupon] = useState({ code: '', discountPercentage: 10, maxUses: 10 });
    
    // Inventory Modals State
    const [selectedAdjustItem, setSelectedAdjustItem] = useState<(ItemData & { id: string }) | null>(null);
    const [selectedPriceItem, setSelectedPriceItem] = useState<(ItemData & { id: string }) | null>(null);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<(ItemData & { id: string }) | null>(null);
    const [recentChats, setRecentChats] = useState<Chat[]>([]);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToChats(user.uid, (fetchedChats) => {
            const sorted = fetchedChats.sort((a, b) => {
                const timeA = a.lastMessageTimestamp?.toMillis?.() || 0;
                const timeB = b.lastMessageTimestamp?.toMillis?.() || 0;
                return timeB - timeA;
            }).slice(0, 3);
            setRecentChats(sorted);
        });
        return () => unsubscribe();
    }, [user]);

    const handleSaveStock = async (newStock: number, isInfinite: boolean, reason: string, type: 'add' | 'subtract' | 'replace', adjustment: number) => {
        if (!selectedAdjustItem) return;
        try {
            const res = await adjustItemStock(selectedAdjustItem.id, newStock, isInfinite, {
                type, adjustment, newStock, previousStock: selectedAdjustItem.hasInfiniteStock ? 'infinite' : (selectedAdjustItem.quantity || 0), reason
            });
            if (res.success) {
                notify('Stock actualizado', 'success');
                setItems(items.map(item => item.id === selectedAdjustItem.id ? { ...item, quantity: newStock, hasInfiniteStock: isInfinite } : item));
            } else {
                notify('Error al actualizar stock', 'error');
            }
        } catch (error) {
            console.error("Error adjusting stock:", error);
            notify("Error al actualizar el stock", "error");
        }
    };
    
    const handlePriceUpdate = async (newPrice: number, newCost?: number) => {
        if (!selectedPriceItem) return;
        try {
            const updates: Partial<any> = { price: newPrice };
            if (newCost !== undefined) updates.cost = newCost;
            
            await updateItem(selectedPriceItem.id, updates);
            setItems(items.map(item => item.id === selectedPriceItem.id ? { ...item, price: newPrice, cost: newCost ?? item.cost } : item));
            notify("Precio actualizado correctamente", "success");
        } catch (error) {
            console.error("Error updating price:", error);
            notify("Error al actualizar el precio", "error");
        }
    };

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

    const handleDownloadReport = async () => {
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
        
        notify({ type: 'info', title: 'Generando reporte', message: 'Por favor, espera un momento...', icon: 'downloading' });

        const headers = "ID Venta,Fecha,Comprador,DNI,Email,Teléfono,Domicilio,Producto,Opciones,Envío,Estado,Monto\n";
        
        const rowPromises = filteredSales.map(async s => {
            const date = s.createdAt ? format(s.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A';
            const status = s.status === 'COMPLETED' ? 'Completado' : s.status === 'SHIPPED' ? 'Enviado' : 'Pendiente';
            const amount = `$${(s.amountTotal || s.amount).toLocaleString()}`;
            
            // Fetch buyer info
            let buyerName = 'No especificado';
            let buyerDni = 'No especificado';
            let buyerEmail = 'No especificado';
            let buyerPhone = 'No especificado';
            let buyerAddress = 'No especificado';
            
            try {
                const buyer = await getUserProfile(s.buyerId);
                if (buyer) {
                    buyerName = buyer.displayName || `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || 'No especificado';
                    buyerDni = buyer.documentNumber || 'No especificado';
                    buyerEmail = buyer.email || 'No especificado';
                    buyerPhone = buyer.phoneNumber || 'No especificado';
                    if (buyer.address) {
                        buyerAddress = `${buyer.address.street} ${buyer.address.number}, ${buyer.address.city}, ${buyer.address.province}`;
                    }
                }
            } catch (err) {
                console.error("Error fetching buyer", err);
            }
            
            // Resolve product title (handles old "Pedido de Carrito" entries)
            let productTitle = s.itemTitle || 'Producto desconocido';
            if (productTitle.toLowerCase().includes('pedido de carrito') || productTitle.toLowerCase().includes('cart')) {
                const matchById = items.find(i => i.id === s.itemId);
                if (matchById) {
                    productTitle = matchById.title;
                } else {
                    const salePrice = s.amountProduct || s.amount || 0;
                    const matchByPrice = salePrice > 0 ? items.find(i => i.price === salePrice) : null;
                    if (matchByPrice) {
                        productTitle = matchByPrice.title;
                    } else if (s.itemImage) {
                        const matchByImage = items.find(i => i.images && i.images.includes(s.itemImage));
                        productTitle = matchByImage ? matchByImage.title : 'Compra múltiple';
                    } else {
                        productTitle = 'Compra múltiple';
                    }
                }
            }
            const options = [s.selectedColor, s.selectedSize].filter(Boolean).join(' / ') || 'N/A';
            const shipping = s.deliveryMethod || 'N/A';

            return `"${s.id}","${date}","${buyerName}","${buyerDni}","${buyerEmail}","${buyerPhone}","${buyerAddress}","${productTitle}","${options}","${shipping}","${status}","${amount}"`;
        });
        
        const rows = (await Promise.all(rowPromises)).join('\n');

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
                <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide w-full md:w-auto pb-2 md:pb-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm text-sm shrink-0">
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">calendar_today</span>
                        <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="bg-transparent text-slate-700 font-bold outline-none cursor-pointer" />
                        <span className="text-slate-300">-</span>
                        <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="bg-transparent text-slate-700 font-bold outline-none cursor-pointer" />
                    </div>
                    <button type="button" onClick={handleDownloadReport} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-xl text-sm font-bold text-white flex items-center gap-2 shadow-sm shrink-0">
                        <span className="material-symbols-outlined text-lg">download</span>
                        Descargar Reporte
                    </button>
                </div>
            </div>
            
{/* Nuevo ERP Dashboard */}
            <div className="mt-8">
                <ERPDashboard sales={sales} items={items} storeId={user.uid} customizationSlot={customizationSlot} overviewSlot={
                    <>
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

            {/* Rendimiento de Ventas (Bar Chart) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="font-black text-slate-900">Rendimiento de Ventas</h4>
                    <select className="text-[11px] font-bold text-slate-500 bg-slate-50 border-none rounded-lg px-3 py-1.5 outline-none cursor-pointer">
                        <option>Últimos 15 días</option>
                    </select>
                </div>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Array.from({ length: 15 }).map((_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() - (14 - i));
                            
                            // Find sales for this day
                            const daySales = sales.filter(s => {
                                if (!s.createdAt) return false;
                                const saleDate = s.createdAt.toDate();
                                return saleDate.getDate() === date.getDate() && saleDate.getMonth() === date.getMonth();
                            });
                            
                            return {
                                name: format(date, 'dd MMM'),
                                amount: daySales.reduce((sum, s) => sum + s.amount, 0)
                            };
                        })}>
                            <XAxis 
                                dataKey="name" 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                                dy={10}
                                minTickGap={30}
                            />
                            <Bar 
                                dataKey="amount" 
                                fill="#6366f1" 
                                radius={[4, 4, 0, 0]}
                                barSize={24}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Desglose de Ventas Recientes */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h4 className="font-black text-slate-900">Desglose de Ventas Recientes</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Producto</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Fecha</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Comprador</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Monto Venta</th>
                                <th className="px-6 py-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest border-b border-slate-100 text-right">Ganancia Neta</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sales.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm font-bold text-slate-400">
                                        No hay ventas registradas aún.
                                    </td>
                                </tr>
                            ) : (
                                sales.slice(0, 10).map((sale) => {
                                    const item = items.find(i => i.id === sale.itemId);
                                    const feeRate = sale.feeApplied || (item?.flashSaleFeeApplied ? item.flashSaleFeeApplied : item?.featuredFeeApplied ? item.featuredFeeApplied : 0);
                                    const netAmount = sale.amount * (1 - feeRate);

                                    return (
                                        <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                                        {sale.itemImage ? (
                                                            <img src={sale.itemImage} alt="" className="w-full h-full object-cover" />
                                                        ) : item?.images?.[0] || item?.image ? (
                                                            <img src={item.images?.[0] || item.image} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                <span className="material-symbols-outlined text-[20px]">image</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700 max-w-[200px] truncate">
                                                            {sale.itemTitle || item?.title || 'Producto Eliminado'}
                                                        </p>
                                                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {sale.id.substring(0,8).toUpperCase()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs font-bold text-slate-500">
                                                    {sale.createdAt ? format(sale.createdAt.toDate(), 'dd MMM yyyy') : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <BuyerCell buyerId={sale.buyerId} transaction={sale} onStatusChange={() => window.location.reload()} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xs font-black text-slate-900">${sale.amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xs font-black text-emerald-600">${netAmount.toLocaleString()}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                
                {/* Inventario Maestro */}
                <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h4 className="font-black text-slate-900 text-xl">Inventario</h4>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest w-[40%]">Producto</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest w-[15%]">Stock</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest w-[20%] text-center">SKU</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest w-[10%] text-center">Historial</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest w-[15%] text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="size-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                                                    {item.images?.[0] || item.image ? (
                                                        <img src={item.images?.[0] || item.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-slate-300">photo_camera</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-sm font-bold text-indigo-600 hover:text-indigo-800 line-clamp-2 leading-snug">{item.title}</p>
                                                    <div className="mt-1.5 flex items-center gap-2">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${item.status === 'AVAILABLE' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-slate-500 border-slate-200 bg-slate-100'}`}>
                                                            {item.status === 'AVAILABLE' ? 'Activo' : 'Oculto'}
                                                        </span>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <span className="text-[10px] font-medium text-slate-400">
                                                                ${item.price.toLocaleString()}
                                                            </span>
                                                            <button 
                                                                type="button"
                                                                onClick={() => setSelectedPriceItem(item)}
                                                                className="size-5 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
                                                                title="Modificar precio"
                                                            >
                                                                <span className="material-symbols-outlined text-[12px]">edit</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <input 
                                                        type="text"
                                                        readOnly
                                                        value={item.hasInfiniteStock ? '∞' : (item.quantity || 0)}
                                                        className={`w-20 bg-orange-50 border border-orange-200 rounded-md px-3 py-1.5 text-sm font-black outline-none ${item.hasInfiniteStock ? 'text-indigo-600 text-lg' : 'text-slate-700'}`}
                                                    />
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => setSelectedAdjustItem(item)}
                                                    className="size-8 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors border border-slate-200"
                                                    title="Editar stock"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[11px] font-mono font-bold text-slate-500">{item.sku || 'Sin SKU'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                type="button"
                                                onClick={() => setSelectedHistoryItem(item)}
                                                className="size-8 rounded-full bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-400 hover:text-indigo-600 mx-auto flex items-center justify-center transition-colors"
                                                title="Ver historial de stock"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">history</span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 flex justify-end gap-2 items-center h-full">
                                            {/* Offline sale button */}
                                            <button 
                                                type="button"
                                                onClick={() => handleMarkAsSoldOffline(item)}
                                                className="text-[9px] font-black text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors border border-slate-200"
                                                title="Marcar como vendido offline (en efectivo/persona)"
                                            >
                                                VENDER OFFLINE
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="size-7 rounded-md text-red-500 bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors border border-red-100"
                                                title="Eliminar producto"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cupones */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col flex-1">
                        <h4 className="font-black text-slate-900 mb-4">Cupones</h4>
                        
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text"
                                placeholder="CÓDIGO"
                                value={newCoupon.code}
                                onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none uppercase"
                            />
                            <div className="relative w-20">
                                <input 
                                    type="number"
                                    value={newCoupon.discountPercentage}
                                    onChange={e => setNewCoupon({...newCoupon, discountPercentage: Number(e.target.value)})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none pr-6 text-right"
                                />
                                <span className="absolute right-2 top-1.5 text-xs font-bold text-slate-400">%</span>
                            </div>
                        </div>
                        <div className="flex gap-2 mb-4">
                            <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usos:</span>
                                <input 
                                    type="number"
                                    value={newCoupon.maxUses}
                                    onChange={e => setNewCoupon({...newCoupon, maxUses: Number(e.target.value)})}
                                    className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full"
                                />
                            </div>
                            <button 
                                type="button"
                                onClick={handleCreateCoupon}
                                className="bg-emerald-500 text-white font-bold text-xs px-4 rounded-lg hover:bg-emerald-600 transition-colors"
                            >
                                Crear
                            </button>
                        </div>

                        <div className="space-y-2 flex-1 overflow-y-auto max-h-[120px]">
                            {coupons.length === 0 ? (
                                <p className="text-xs text-center text-slate-400 font-medium py-4">Sin cupones activos.</p>
                            ) : (
                                coupons.map(coupon => (
                                    <div key={coupon.id} className={`flex items-center justify-between p-2 rounded-lg border ${coupon.active ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <div>
                                            <p className={`text-xs font-black ${coupon.active ? 'text-indigo-700' : 'text-slate-500'}`}>{coupon.code}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{coupon.discountPercentage}% OFF • {coupon.uses}/{coupon.maxUses} usos</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                type="button"
                                                onClick={() => toggleCoupon(coupon.id)}
                                                className={`size-7 rounded-md flex items-center justify-center transition-colors ${coupon.active ? 'text-emerald-600 bg-emerald-100/50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">{coupon.active ? 'toggle_on' : 'toggle_off'}</span>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => deleteCoupon(coupon.id)}
                                                className="size-7 rounded-md text-red-500 bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Centro de Mensajes Promo */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                                <span className="material-symbols-outlined">forum</span>
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-sm">Centro de Mensajes</h4>
                                <p className="text-[10px] text-slate-500 font-medium">Últimas consultas</p>
                            </div>
                        </div>
                        
                        <div className="flex-1 space-y-3 mb-4">
                            {recentChats.length === 0 ? (
                                <div className="text-center py-6">
                                    <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">mark_chat_read</span>
                                    <p className="text-xs font-bold text-slate-400">No hay mensajes recientes</p>
                                </div>
                            ) : (
                                recentChats.map(chat => {
                                    const otherUser = chat.participantsData?.[chat.participants.find(p => p !== user.uid) || ''] || { displayName: 'Usuario' };
                                    const unreadCount = chat.unreadCount?.[user.uid] || 0;
                                    return (
                                        <div key={chat.id} className="flex gap-3 items-center p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                            <div className="size-8 rounded-full bg-slate-100 overflow-hidden shrink-0">
                                                {otherUser.photoURL ? (
                                                    <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-slate-400 text-sm mt-1.5 ml-1.5">person</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-900 truncate">{otherUser.displayName}</p>
                                                <p className={`text-[10px] truncate ${unreadCount > 0 ? 'font-black text-slate-800' : 'text-slate-500'}`}>{chat.lastMessage}</p>
                                            </div>
                                            {unreadCount > 0 && (
                                                <div className="size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                                                    {unreadCount}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                        
                        <Link to="/messages" className="w-full py-2 bg-slate-50 text-emerald-600 hover:bg-emerald-50 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                            Ir a Bandeja
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Link>
                    </div>
                </div>
            </div>

            {selectedAdjustItem && (
                <StockAdjustmentModal 
                    item={selectedAdjustItem}
                    isOpen={!!selectedAdjustItem}
                    onClose={() => setSelectedAdjustItem(null)}
                    onSave={handleSaveStock}
                />
            )}

            {selectedPriceItem && (
                <PriceAdjustmentModal
                    item={selectedPriceItem}
                    isOpen={!!selectedPriceItem}
                    onClose={() => setSelectedPriceItem(null)}
                    onSave={handlePriceUpdate}
                />
            )}

            {selectedHistoryItem && (
                <StockHistoryModal 
                    itemId={selectedHistoryItem.id}
                    itemTitle={selectedHistoryItem.title}
                    isOpen={!!selectedHistoryItem}
                    onClose={() => setSelectedHistoryItem(null)}
                />
            )}

            {/* Banner Oficial */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h4 className="font-black text-slate-900 mb-4">Verificaciones e Integraciones</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-slate-100 rounded-xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-yellow-300 transition-colors">
                        <div className="size-12 bg-yellow-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-yellow-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14.5 4l-9 9 9 9h5l-9-9 9-9z"/>
                                <path d="M19.5 9l-5 5 5 5v-10z"/>
                            </svg>
                        </div>
                        <h5 className="font-bold text-slate-900 text-sm mb-2">Reputación MercadoLibre</h5>
                        <p className="text-xs text-slate-500 mb-4">Vincula tu cuenta para importar tus puntos y nivel de mercado de ML de forma segura.</p>
                        <button className="px-6 py-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 text-xs font-bold rounded-lg transition-colors">
                            Vincular Cuenta (Próximamente)
                        </button>
                    </div>

                    <div className="border-2 border-indigo-50 bg-indigo-50/30 rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        {user?.store?.paidOfficialTick && (
                            <div className="absolute top-4 right-4 text-emerald-500 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                                <span className="material-symbols-outlined text-sm">check_circle</span> Activa
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
                    </>
                } />
            </div>
        </div>
    );
};

export default StoreAdvancedPanel;
