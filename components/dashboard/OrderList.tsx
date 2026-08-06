import React, { useState, useEffect, useMemo } from 'react';
import { TransactionData } from '../../lib/transactions';
import { ItemData } from '../../lib/items';
import { UserProfile, getUserProfile } from '../../lib/users';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CustomerDetailModal from './CustomerDetailModal';

interface OrderListProps {
    sales: (TransactionData & { id: string })[];
    items: (ItemData & { id: string })[];
}

type FilterStatus = 'ALL' | 'POR_COBRAR' | 'POR_EMPAQUETAR' | 'POR_ENVIAR' | 'POR_RETIRAR' | 'ARCHIVADO';

export default function OrderList({ sales, items }: OrderListProps) {
    // Resolve product titles for cart purchases
    const resolveTitle = (sale: any): string => {
        const raw = sale.itemTitle || '';
        if (!raw.toLowerCase().includes('pedido de carrito') && !raw.toLowerCase().includes('cart')) {
            return raw || 'Producto';
        }
        const matchById = items.find(i => i.id === sale.itemId);
        if (matchById) return matchById.title;
        const price = sale.amountProduct || sale.amount || 0;
        if (price > 0) {
            const matchByPrice = items.find(i => i.price === price);
            if (matchByPrice) return matchByPrice.title;
        }
        if (sale.itemImage) {
            const matchByImage = items.find(i => i.images && i.images.includes(sale.itemImage));
            if (matchByImage) return matchByImage.title;
        }
        return 'Compra múltiple';
    };
    const [filter, setFilter] = useState<FilterStatus>('ALL');
    const [buyers, setBuyers] = useState<Record<string, UserProfile>>({});
    const [selectedSale, setSelectedSale] = useState<(TransactionData & { id: string }) | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchBuyers = async () => {
            const uniqueBuyerIds = [...new Set(sales.map(s => s.buyerId))];
            const buyersData: Record<string, UserProfile> = {};
            
            await Promise.all(uniqueBuyerIds.map(async (id) => {
                if (!buyers[id]) {
                    const profile = await getUserProfile(id);
                    if (profile) buyersData[id] = profile;
                }
            }));
            
            if (Object.keys(buyersData).length > 0) {
                setBuyers(prev => ({ ...prev, ...buyersData }));
            }
        };
        
        fetchBuyers();
    }, [sales]);

    const getStatusCounts = () => {
        return {
            ALL: sales.length,
            POR_COBRAR: sales.filter(s => s.status === 'PENDING_PAYMENT').length,
            POR_EMPAQUETAR: sales.filter(s => s.status === 'PAID_HELD' || s.status === 'PAID_IN_CUSTODY').length,
            POR_ENVIAR: sales.filter(s => s.status === 'COMPLETED' && s.deliveryMethod !== 'en_mano').length, // Simplified logic for demo
            POR_RETIRAR: sales.filter(s => s.status === 'COMPLETED' && s.deliveryMethod === 'en_mano').length,
            ARCHIVADO: sales.filter(s => s.status === 'CANCELLED' || s.status === 'REFUNDED').length,
        };
    };

    const counts = getStatusCounts();

    const filteredSales = sales.filter(sale => {
        // First apply search
        const matchesSearch = searchQuery === '' || 
            sale.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (buyers[sale.buyerId]?.displayName || '').toLowerCase().includes(searchQuery.toLowerCase());
            
        if (!matchesSearch) return false;

        // Then apply status filter
        switch (filter) {
            case 'POR_COBRAR': return sale.status === 'PENDING_PAYMENT';
            case 'POR_EMPAQUETAR': return sale.status === 'PAID_HELD' || sale.status === 'PAID_IN_CUSTODY';
            case 'POR_ENVIAR': return sale.status === 'COMPLETED' && sale.deliveryMethod !== 'en_mano';
            case 'POR_RETIRAR': return sale.status === 'COMPLETED' && sale.deliveryMethod === 'en_mano';
            case 'ARCHIVADO': return sale.status === 'CANCELLED' || sale.status === 'REFUNDED';
            default: return true;
        }
    }).sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

    const handleOpenDetail = (sale: TransactionData & { id: string }) => {
        setSelectedSale(sale);
        setIsModalOpen(true);
    };

    return (
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
            {/* Top Toolbar */}
            <div className="p-4 md:p-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-slate-100">
                <div className="relative w-full xl:w-72">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                        type="text" 
                        placeholder="Buscar por ID o cliente..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                </div>
                
                <div className="flex overflow-x-auto whitespace-nowrap scrollbar-hide hide-scrollbar gap-2 w-full xl:w-auto pb-2 xl:pb-0">
                    <FilterTab label="Todas" count={counts.ALL} active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
                    <FilterTab label="Por cobrar" count={counts.POR_COBRAR} active={filter === 'POR_COBRAR'} onClick={() => setFilter('POR_COBRAR')} />
                    <FilterTab label="Por empaquetar" count={counts.POR_EMPAQUETAR} active={filter === 'POR_EMPAQUETAR'} onClick={() => setFilter('POR_EMPAQUETAR')} />
                    <FilterTab label="Por enviar" count={counts.POR_ENVIAR} active={filter === 'POR_ENVIAR'} onClick={() => setFilter('POR_ENVIAR')} />
                    <FilterTab label="Por retirar" count={counts.POR_RETIRAR} active={filter === 'POR_RETIRAR'} onClick={() => setFilter('POR_RETIRAR')} />
                    <FilterTab label="Por archivar" count={counts.ARCHIVADO} active={filter === 'ARCHIVADO'} onClick={() => setFilter('ARCHIVADO')} />
                    
                    <button className="flex items-center justify-center size-[38px] rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 ml-2 transition-colors shrink-0">
                        <span className="material-symbols-outlined text-[20px]">filter_list</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white border-b border-slate-100 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                            <th className="p-4 w-12 text-center"><input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" /></th>
                            <th className="p-4">Venta</th>
                            <th className="p-4">Fecha <span className="material-symbols-outlined text-[12px] align-middle">arrow_downward</span></th>
                            <th className="p-4">Cliente</th>
                            <th className="p-4">Total</th>
                            <th className="p-4">Producto</th>
                            <th className="p-4">Pago</th>
                            <th className="p-4">Envío</th>
                            <th className="p-4 w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {filteredSales.length > 0 ? filteredSales.map((sale) => (
                            <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                                <td className="p-4 text-center">
                                    <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" />
                                </td>
                                <td className="p-4">
                                    <span className="text-emerald-600 font-bold text-xs">#{sale.id.slice(0, 8)}</span>
                                </td>
                                <td className="p-4 text-slate-600 font-medium text-xs">
                                    {sale.createdAt ? format(sale.createdAt.toDate(), "dd MMM HH:mm", { locale: es }) : 'N/A'}
                                </td>
                                <td className="p-4">
                                    <button 
                                        onClick={() => handleOpenDetail(sale)} 
                                        className="text-emerald-600 font-bold hover:underline text-xs"
                                    >
                                        {buyers[sale.buyerId]?.displayName || 'Usuario'}
                                    </button>
                                </td>
                                <td className="p-4 font-black text-slate-800 tracking-tight text-sm">
                                    ${(sale.amountTotal || sale.amount).toLocaleString()}
                                </td>
                                <td className="p-4">
                                    <div className="max-w-[220px]">
                                        <p className="text-xs font-bold text-slate-700 truncate" title={resolveTitle(sale)}>{resolveTitle(sale)}</p>
                                        <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{sale.quantity || 1} unid.{sale.selectedColor ? ` · ${sale.selectedColor}` : ''}{sale.selectedSize ? ` · ${sale.selectedSize}` : ''}</p>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1 items-start">
                                        {sale.status === 'CANCELLED' ? (
                                            <Badge icon="block" text="Cancelada" color="gray" />
                                        ) : sale.status === 'COMPLETED' ? (
                                            <Badge icon="check_circle" text="Archivada" color="gray" />
                                        ) : (
                                            <Badge icon="payments" text="Pendiente" color="amber" />
                                        )}
                                        <span className="text-[10px] text-slate-500 font-bold mt-1">
                                            {sale.paymentMethod === 'MERCADO_PAGO' ? 'MercadoPago' : sale.paymentMethod === 'TRANSFER' ? 'Transferencia' : 'A convenir'}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-[10px] text-slate-500 font-bold">
                                    {sale.deliveryMethod === 'acordar' || sale.deliveryMethod === 'en_mano' ? 'Personalizado - A convenir' : sale.deliveryMethod}
                                </td>
                                <td className="p-4">
                                    <button className="size-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={9} className="p-12 text-center text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-3 block opacity-50">inbox</span>
                                    <p className="font-medium text-sm">No hay ventas que coincidan con los filtros.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
                <p>Mostrando {Math.min(filteredSales.length, 1)}-{filteredSales.length} ventas de {filteredSales.length}</p>
                <button className="flex items-center gap-1 text-emerald-600 font-bold hover:underline">
                    <span className="material-symbols-outlined text-[16px]">help</span> Más sobre ventas
                </button>
            </div>

            {isModalOpen && selectedSale && buyers[selectedSale.buyerId] && (
                <CustomerDetailModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    transaction={selectedSale}
                    buyer={buyers[selectedSale.buyerId]}
                />
            )}
        </div>
    );
}

function FilterTab({ label, count, active, onClick }: { label: string, count: number, active: boolean, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                active ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
            }`}
        >
            {label}
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {count}
            </span>
        </button>
    );
}

function Badge({ icon, text, color }: { icon: string, text: string, color: 'gray' | 'amber' | 'emerald' }) {
    const colors = {
        gray: 'bg-slate-100 text-slate-600 border-slate-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
    
    return (
        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 w-fit ${colors[color]}`}>
            <span className="material-symbols-outlined text-[12px]">{icon}</span> {text}
        </span>
    );
}
