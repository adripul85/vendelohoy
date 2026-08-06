import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { TransactionData } from '../../lib/transactions';

interface AdvancedSalesStatsProps {
    sales: any[]; // Using any to tolerate missing fields in older transactions
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];
const GREEN_SHADES = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'];

export default function AdvancedSalesStats({ sales }: AdvancedSalesStatsProps) {
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((acc, s) => acc + (s.amountTotal || s.amount || 0), 0);
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // 1. Pedidos por estado de pago
    const statusData = useMemo(() => {
        const counts = { Pendiente: 0, Pagado: 0, Cancelado: 0 };
        sales.forEach(s => {
            if (s.status === 'PENDING_PAYMENT') counts.Pendiente++;
            else if (s.status === 'CANCELLED' || s.status === 'REFUNDED') counts.Cancelado++;
            else counts.Pagado++;
        });
        return [
            { name: 'Pendiente', valor: counts.Pendiente },
            { name: 'Pagado', valor: counts.Pagado },
            { name: 'Cancelado/Reembolsado', valor: counts.Cancelado },
        ];
    }, [sales]);

    // 2. Clientes (Top)
    const topClients = useMemo(() => {
        const clients: Record<string, { id: string, name: string, count: number, total: number }> = {};
        sales.forEach(s => {
            if (!clients[s.buyerId]) {
                clients[s.buyerId] = { id: s.buyerId, name: s.buyerName || 'Cliente Anónimo', count: 0, total: 0 };
            }
            clients[s.buyerId].count++;
            clients[s.buyerId].total += (s.amountTotal || s.amount || 0);
        });
        return Object.values(clients).sort((a, b) => b.total - a.total).slice(0, 5);
    }, [sales]);

    // 3. Ingresos por método de pago
    const methodData = useMemo(() => {
        const methods: Record<string, number> = { 'MercadoPago': 0, 'Transferencia': 0, 'Efectivo': 0, 'Otro': 0 };
        sales.forEach(s => {
            if (s.paymentMethod === 'MERCADO_PAGO') methods['MercadoPago'] += (s.amountTotal || s.amount || 0);
            else if (s.paymentMethod === 'TRANSFER') methods['Transferencia'] += (s.amountTotal || s.amount || 0);
            else if (s.paymentMethod === 'CASH') methods['Efectivo'] += (s.amountTotal || s.amount || 0);
            else methods['Otro'] += (s.amountTotal || s.amount || 0);
        });
        return Object.entries(methods).filter(([_, v]) => v > 0).map(([k, v]) => ({ name: k, total: v }));
    }, [sales]);

    // 4. Facturación por cuotas (Simulated as most gateways group it as credit card)
    const installmentsData = useMemo(() => {
        return [
            { name: '1 Cuota / Débito', value: totalRevenue * 0.65 },
            { name: '3 Cuotas', value: totalRevenue * 0.20 },
            { name: '6 Cuotas', value: totalRevenue * 0.10 },
            { name: '12 Cuotas', value: totalRevenue * 0.05 },
        ];
    }, [totalRevenue]);

    // 5. Envío Pago vs Gratuito
    const shippingData = useMemo(() => {
        let pagado = 0;
        let gratuito = 0;
        sales.forEach(s => {
            if (s.shippingCost && s.shippingCost > 0) pagado++;
            else gratuito++;
        });
        return [
            { name: 'Envío Pago', cantidad: pagado },
            { name: 'Envío Gratuito / A Convenir', cantidad: gratuito }
        ];
    }, [sales]);

    // 6. Top Provincias
    const provincesData = useMemo(() => {
        const provs: Record<string, { count: number, total: number }> = {};
        sales.forEach(s => {
            const p = s.deliveryAddress?.province || 'Sin especificar';
            if (!provs[p]) provs[p] = { count: 0, total: 0 };
            provs[p].count++;
            provs[p].total += (s.amountTotal || s.amount || 0);
        });
        const sortedByRevenue = Object.entries(provs).map(([name, data]) => ({ name, total: data.total })).sort((a, b) => b.total - a.total).slice(0, 5);
        const sortedByCount = Object.entries(provs).map(([name, data]) => ({ name, count: data.count })).sort((a, b) => b.count - a.count).slice(0, 5);
        return { sortedByRevenue, sortedByCount };
    }, [sales]);

    return (
        <div className="space-y-6">
            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard title="Pedidos Creados" value={totalSales} />
                <MetricCard title="Facturación" value={totalRevenue} prefix="$" />
                <MetricCard title="Ticket Promedio" value={avgTicket} prefix="$" />
            </div>

            {/* Pedidos por estado */}
            <div className="bg-white p-6 md:p-8 rounded-[24px] border border-slate-200 shadow-sm">
                <h4 className="text-slate-800 font-black tracking-tight mb-6">Pedidos por estado de pago</h4>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} dx={-10} />
                            <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="valor" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Clientes Table */}
            <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100">
                    <h4 className="text-slate-800 font-black tracking-tight">Top Clientes</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                                <th className="p-4 pl-8">Cliente (ID)</th>
                                <th className="p-4 text-center">Compras</th>
                                <th className="p-4 text-right pr-8">Facturación Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {topClients.map((client) => (
                                <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 pl-8 font-medium text-slate-700">{client.id}</td>
                                    <td className="p-4 text-center font-bold text-emerald-600">{client.count}</td>
                                    <td className="p-4 text-right pr-8 font-black text-slate-800">${client.total.toLocaleString()}</td>
                                </tr>
                            ))}
                            {topClients.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-slate-400 italic">No hay suficientes datos de clientes.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Middle Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 md:p-8 rounded-[24px] border border-slate-200 shadow-sm">
                    <h4 className="text-slate-800 font-black tracking-tight mb-6">Ingresos por método de pago</h4>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={methodData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} tickFormatter={(val) => `$${val/1000}k`} />
                                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                                <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="bg-white p-6 md:p-8 rounded-[24px] border border-slate-200 shadow-sm">
                    <h4 className="text-slate-800 font-black tracking-tight mb-6">Facturación por cuotas (Estimado)</h4>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={installmentsData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                    {installmentsData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={GREEN_SHADES[index % GREEN_SHADES.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none'}} />
                                <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Shipping & Provinces Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 md:p-8 rounded-[24px] border border-slate-200 shadow-sm">
                    <h4 className="text-slate-800 font-black tracking-tight mb-6">Top 5 provincias (Facturación)</h4>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={provincesData.sortedByRevenue} layout="vertical" margin={{ left: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                                <Bar dataKey="total" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-[24px] border border-slate-200 shadow-sm">
                    <h4 className="text-slate-800 font-black tracking-tight mb-6">Ventas con envío pago vs gratuito</h4>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={shippingData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                                <Bar dataKey="cantidad" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    );
}

function MetricCard({ title, value, prefix = '' }: { title: string, value: number, prefix?: string }) {
    return (
        <div className="bg-white p-6 md:p-8 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden group">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 relative z-10">{title}</h4>
            <p className="text-3xl font-black text-slate-800 tracking-tighter relative z-10">
                {prefix}{value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            {/* Decorative background graph simulation */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full text-emerald-500 fill-current">
                    <path d="M0,40 Q10,30 20,40 T40,20 T60,35 T80,10 T100,30 L100,40 Z" />
                </svg>
            </div>
        </div>
    );
}
