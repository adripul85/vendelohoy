import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, AreaChart, Area, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';
import { ItemData } from '../../lib/items';

interface AdvancedProductsStatsProps {
    items: (ItemData & { id: string })[];
    sales: any[];
}

const BLUE_SHADES = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'];

export default function AdvancedProductsStats({ items, sales }: AdvancedProductsStatsProps) {

    // Build a lookup map from items for resolving cart titles
    const itemsMap = useMemo(() => {
        const map: Record<string, string> = {};
        items.forEach(i => { map[i.id] = i.title; });
        return map;
    }, [items]);

    // Resolve the real product title (handles old "Pedido de Carrito" entries)
    const resolveTitle = (sale: any): string => {
        const raw = sale.itemTitle || '';
        // If it's a normal title, use it
        if (!raw.toLowerCase().includes('pedido de carrito') && !raw.toLowerCase().includes('cart')) {
            return raw || 'Producto';
        }
        // Try direct ID lookup first
        if (sale.itemId && itemsMap[sale.itemId]) {
            return itemsMap[sale.itemId];
        }
        // Try matching by product price
        const salePrice = sale.amountProduct || sale.amount || 0;
        if (salePrice > 0) {
            const matchByPrice = items.find(i => i.price === salePrice);
            if (matchByPrice) return matchByPrice.title;
        }
        // Try matching by image URL
        if (sale.itemImage) {
            const matchByImage = items.find(i => i.images && i.images.includes(sale.itemImage));
            if (matchByImage) return matchByImage.title;
        }
        // Last resort
        return 'Compra múltiple';
    };

    // Count sales per product
    const salesByProduct = useMemo(() => {
        const map: Record<string, { count: number, revenue: number, title: string }> = {};
        sales.forEach(s => {
            const key = s.itemId || 'unknown';
            if (!map[key]) {
                map[key] = { count: 0, revenue: 0, title: resolveTitle(s) };
            }
            map[key].count++;
            map[key].revenue += (s.amountTotal || s.amount || 0);
        });
        return map;
    }, [sales, itemsMap]);

    // Total products sold (unique product IDs that appear in sales)
    const totalProductsSold = Object.keys(salesByProduct).length;

    // Products by sales volume (Top chart)
    const productsBySalesData = useMemo(() => {
        return Object.entries(salesByProduct)
            .map(([id, data]) => ({
                name: data.title.length > 20 ? data.title.substring(0, 20) + '...' : data.title,
                fullName: data.title,
                ventas: data.count
            }))
            .sort((a, b) => b.ventas - a.ventas)
            .slice(0, 8);
    }, [salesByProduct]);

    // Sales over time (trend line)
    const salesOverTimeData = useMemo(() => {
        const months: Record<string, number> = {};
        sales.forEach(s => {
            const date = s.createdAt?.toDate ? s.createdAt.toDate() : new Date();
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months[key] = (months[key] || 0) + 1;
        });
        return Object.entries(months)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([month, count]) => {
                const [y, m] = month.split('-');
                const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                return { name: monthNames[parseInt(m) - 1] || m, productos: count };
            });
    }, [sales]);

    // Stock reserved (items with pending transactions)
    const stockReservedData = useMemo(() => {
        const pendingItemIds = new Set(
            sales.filter(s => s.status === 'PAID_HELD' || s.status === 'PENDING_PAYMENT' || s.status === 'SHIPPED')
                .map(s => s.itemId)
        );
        return items
            .filter(i => pendingItemIds.has(i.id))
            .map(i => ({
                title: i.title.length > 30 ? i.title.substring(0, 30) + '...' : i.title,
                stock: i.quantity || 1,
                reservado: sales.filter(s => s.itemId === i.id && (s.status === 'PAID_HELD' || s.status === 'PENDING_PAYMENT' || s.status === 'SHIPPED')).length
            }))
            .slice(0, 8);
    }, [items, sales]);

    // Product details table with projected days of stock
    const detailsTableData = useMemo(() => {
        // Calculate avg sales per day across all history
        const now = Date.now();
        const oldestSale = sales.reduce((min, s) => {
            const t = s.createdAt?.toMillis ? s.createdAt.toMillis() : (s.createdAt?.seconds ? s.createdAt.seconds * 1000 : now);
            return t < min ? t : min;
        }, now);
        const totalDays = Math.max(1, (now - oldestSale) / (1000 * 60 * 60 * 24));

        return items.map(item => {
            const itemSales = salesByProduct[item.id];
            const salesCount = itemSales?.count || 0;
            const revenue = itemSales?.revenue || 0;
            const avgPerDay = salesCount / totalDays;
            const stock = item.hasInfiniteStock ? Infinity : (item.quantity || 0);
            const daysRemaining = avgPerDay > 0 && stock !== Infinity ? Math.round(stock / avgPerDay) : null;
            
            return {
                id: item.id,
                title: item.title,
                variant: [
                    ...(Array.isArray(item.color) ? item.color : item.color ? [item.color] : []),
                    ...(Array.isArray(item.size) ? item.size : item.size ? [item.size] : [])
                ].join(' / ') || '-',
                pedidos: salesCount,
                stock: item.hasInfiniteStock ? '∞' : (stock || 0),
                daysRemaining,
                revenue
            };
        }).sort((a, b) => b.pedidos - a.pedidos);
    }, [items, sales, salesByProduct]);

    // Top 50 products ranked
    const top50Data = useMemo(() => {
        return Object.entries(salesByProduct)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 50);
    }, [salesByProduct]);

    const maxRevenue = top50Data.length > 0 ? top50Data[0].revenue : 1;

    // Scatter data: Price vs Stock
    const scatterData = useMemo(() => {
        return items.map(item => ({
            name: item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title,
            precio: item.price,
            stock: item.hasInfiniteStock ? 100 : (item.quantity || 0),
            ventas: salesByProduct[item.id]?.count || 0
        }));
    }, [items, salesByProduct]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Row 1: Top 3 Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Productos vendidos (Area Chart) */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Productos vendidos</h4>
                    <p className="text-3xl font-black text-slate-800 tracking-tighter mb-4">{totalProductsSold}</p>
                    <div className="h-[100px] -mx-2 -mb-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesOverTimeData}>
                                <defs>
                                    <linearGradient id="colorProductos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="productos" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProductos)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Productos por ventas (Bar Chart) */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Productos por ventas</h4>
                    <div className="h-[140px] mt-2 -mx-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productsBySalesData.slice(0, 6)}>
                                <XAxis dataKey="name" tick={false} axisLine={false} tickLine={false} />
                                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Bar dataKey="ventas" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={24}>
                                    {productsBySalesData.slice(0, 6).map((_, idx) => (
                                        <Cell key={`cell-${idx}`} fill={BLUE_SHADES[Math.min(idx, BLUE_SHADES.length - 1)]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stock reservado (Mini Table) */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Stock reservado</h4>
                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                        {stockReservedData.length > 0 ? stockReservedData.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50 last:border-0">
                                <span className="font-medium text-slate-600 truncate flex-1 mr-2">{item.title}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{item.reservado} res.</span>
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">{item.stock} total</span>
                                </div>
                            </div>
                        )) : (
                            <p className="text-slate-400 text-xs italic text-center py-6">Sin stock reservado actualmente.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 2: Products Detail Table */}
            <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h4 className="font-black text-slate-800 tracking-tight">Detalles productos vendidos</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                                <th className="p-4 pl-6">Producto</th>
                                <th className="p-4">Variante</th>
                                <th className="p-4 text-center">Pedidos</th>
                                <th className="p-4 text-center">Stock actual</th>
                                <th className="p-4 text-center">Días restantes de stock</th>
                                <th className="p-4 text-right pr-6">Facturación</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {detailsTableData.slice(0, 15).map((row) => (
                                <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 pl-6 font-medium text-slate-700 max-w-[200px] truncate">{row.title}</td>
                                    <td className="p-4 text-slate-500 text-xs">{row.variant}</td>
                                    <td className="p-4 text-center font-bold text-blue-600">{row.pedidos}</td>
                                    <td className="p-4 text-center">
                                        <span className={`font-bold text-xs px-2 py-1 rounded-lg ${
                                            row.stock === '∞' ? 'bg-blue-50 text-blue-600' :
                                            (typeof row.stock === 'number' && row.stock <= 3) ? 'bg-red-50 text-red-600' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {row.stock}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {row.daysRemaining !== null ? (
                                            <span className={`font-bold text-xs px-2 py-1 rounded-lg ${
                                                row.daysRemaining <= 7 ? 'bg-red-50 text-red-600' :
                                                row.daysRemaining <= 30 ? 'bg-amber-50 text-amber-600' :
                                                'bg-emerald-50 text-emerald-600'
                                            }`}>
                                                {row.daysRemaining > 99 ? '+99 días' : `${row.daysRemaining} días`}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right pr-6 font-black text-slate-800">${row.revenue.toLocaleString()}</td>
                                </tr>
                            ))}
                            {detailsTableData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">No hay datos de productos.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Row 3: Top 50 + Scatter */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 50 Products */}
                <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h4 className="font-black text-slate-800 tracking-tight">Top {Math.min(top50Data.length, 50)} productos vendidos</h4>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                        {top50Data.length > 0 ? top50Data.map((product, idx) => (
                            <div key={product.id} className="flex items-center gap-3 px-6 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <span className="text-[10px] font-black text-slate-400 w-6 text-right shrink-0">{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate">{product.title}</p>
                                    <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.max(5, (product.revenue / maxRevenue) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <span className="text-xs font-black text-slate-700 shrink-0">${product.revenue.toLocaleString()}</span>
                            </div>
                        )) : (
                            <div className="p-8 text-center text-slate-400 italic text-sm">Sin datos de ventas aún.</div>
                        )}
                    </div>
                </div>

                {/* Scatter Plot: Dispersion de ventas e inventario */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
                    <h4 className="font-black text-slate-800 tracking-tight mb-4">Dispersión de ventas e inventario</h4>
                    <div className="h-[380px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="stock" name="Stock" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} label={{ value: 'Stock', position: 'bottom', fontSize: 11, fill: '#94a3b8', offset: 5 }} />
                                <YAxis dataKey="precio" name="Precio" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `$${v/1000}k`} label={{ value: 'Precio', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} />
                                <ZAxis dataKey="ventas" range={[40, 300]} name="Ventas" />
                                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }} formatter={(value: any, name: string) => {
                                    if (name === 'Precio') return [`$${Number(value).toLocaleString()}`, name];
                                    return [value, name];
                                }} />
                                <Scatter data={scatterData} fill="#3B82F6">
                                    {scatterData.map((_, idx) => (
                                        <Cell key={`scatter-${idx}`} fill={BLUE_SHADES[idx % BLUE_SHADES.length]} fillOpacity={0.7} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
