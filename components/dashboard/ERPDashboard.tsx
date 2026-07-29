import React, { useState, useMemo, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TransactionData } from '../../lib/transactions';
import { ItemData } from '../../lib/items';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface ERPDashboardProps {
    sales: any[];
    items: (ItemData & { id: string })[];
    storeId?: string;
}

export default function ERPDashboard({ sales, items, storeId }: ERPDashboardProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'sales' | 'visits' | 'realtime'>('overview');

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((acc, sale) => acc + (sale.amountProduct || sale.amount || 0), 0);
    const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);

    useEffect(() => {
        if (!storeId) return;
        
        const q = query(
            collection(db, 'store_events'),
            where('storeId', '==', storeId),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const events = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRealtimeEvents(events);
        });

        return () => unsubscribe();
    }, [storeId]);

    const activeUsers = useMemo(() => {
        const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
        const recentEvents = realtimeEvents.filter(e => e.timestamp && e.timestamp.toMillis() > fiveMinsAgo);
        const uniqueVisitors = new Set(recentEvents.map(e => e.visitorId));
        return uniqueVisitors.size;
    }, [realtimeEvents]);

    const visitorsBySource = useMemo(() => {
        const sources = realtimeEvents.reduce((acc, curr) => {
            acc[curr.source] = (acc[curr.source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const total = Object.values(sources).reduce((a, b) => a + b, 0);
        
        return [
            { name: 'Google (Orgánico)', color: 'bg-emerald-500', count: sources['Google (Orgánico)'] || 0 },
            { name: 'Instagram', color: 'bg-pink-500', count: sources['Instagram'] || 0 },
            { name: 'Directo', color: 'bg-blue-500', count: sources['Directo'] || 0 },
            { name: 'Referral', color: 'bg-orange-500', count: sources['Referral'] || 0 }
        ].map(s => ({ ...s, percent: total > 0 ? Math.round((s.count / total) * 100) : 0 }));
    }, [realtimeEvents]);

    const getEventDetails = (type: string, data: any) => {
        switch (type) {
            case 'page_view': return { title: `Visita a producto "${data.productTitle || 'Desconocido'}"`, icon: 'visibility', color: 'text-emerald-500 bg-emerald-50' };
            case 'add_to_cart': return { title: `Agregado al carrito "${data.productTitle || 'Desconocido'}"`, icon: 'shopping_cart', color: 'text-blue-500 bg-blue-50' };
            case 'checkout_start': return { title: 'Inicio de Checkout', icon: 'credit_card', color: 'text-purple-500 bg-purple-50' };
            default: return { title: 'Evento desconocido', icon: 'info', color: 'text-gray-500 bg-gray-50' };
        }
    };

    const visitsData = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => ({
            name: format(subDays(new Date(), 6 - i), 'EEEE', { locale: es }),
            visitas: Math.floor(Math.random() * 500) + 100,
            ventas: Math.floor(Math.random() * 50) + 5
        }));
    }, []);

    const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-6 py-4 font-black text-sm uppercase tracking-widest transition-all ${
                activeTab === id 
                ? 'text-primary border-b-4 border-primary bg-primary/5' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-b-4 border-transparent'
            }`}
        >
            {label}
        </button>
    );

    const MetricCard = ({ title, value, previousValue, prefix = '' }: { title: string, value: number, previousValue?: number, prefix?: string }) => {
        const variation = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
        return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">{title}</h4>
                <div className="text-4xl font-black text-slate-800 mb-4 tracking-tighter">
                    {prefix}{value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </div>
                {previousValue !== undefined && (
                    <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mismo periodo</span>
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md ${variation >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {variation > 0 ? '+' : ''}{variation.toFixed(2)}%
                        </span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col bg-white rounded-[32px] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-slate-100 overflow-hidden mb-8">
            <div className="flex flex-wrap border-b border-slate-200 bg-white">
                <TabButton id="overview" label="Visión general" />
                <TabButton id="products" label="Productos" />
                <TabButton id="sales" label="Ventas y clientes" />
                <TabButton id="visits" label="Visitas" />
                <TabButton id="realtime" label="Tiempo real" />
            </div>

            <div className="p-6 md:p-10 bg-slate-50/50 min-h-[600px]">
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            <MetricCard title="Visitas únicas" value={2451} previousValue={1950} />
                            <MetricCard title="Ventas" value={totalSales} previousValue={Math.floor(totalSales * 0.8)} />
                            <MetricCard title="Facturación" value={totalRevenue} previousValue={totalRevenue * 0.75} prefix="$" />
                            <MetricCard title="Ticket Promedio" value={avgTicket} previousValue={avgTicket * 0.9} prefix="$" />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm h-[450px]">
                                <h4 className="text-slate-800 font-black tracking-tight mb-8 text-xl">Comportamiento del visitante</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'Visitas', value: 2451 },
                                        { name: 'Carritos Creados', value: 840 },
                                        { name: 'Checkout Iniciado', value: 420 },
                                        { name: 'Pedidos Pagos', value: totalSales || 150 },
                                    ]} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fontWeight: 'bold' }} />
                                        <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'}} />
                                        <Bar dataKey="value" fill="#4F46E5" radius={[0, 8, 8, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm h-[450px]">
                                <h4 className="text-slate-800 font-black tracking-tight mb-8 text-xl">Tráfico vs Ventas</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={visitsData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                        <defs>
                                            <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} dy={10} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'}} />
                                        <Area type="monotone" dataKey="visitas" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorVisitas)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm col-span-2 h-[450px]">
                                <h4 className="text-slate-800 font-black tracking-tight mb-8 text-xl">Top 5 Productos Vendidos</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={items.slice(0, 5).map(i => ({ name: i.title.substring(0, 15) + '...', ventas: Math.floor(Math.random() * 20) + 1 }))} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} dy={10} />
                                        <YAxis />
                                        <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                                        <Bar dataKey="ventas" fill="#10B981" radius={[8, 8, 0, 0]} barSize={60} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm h-[450px] flex flex-col">
                                <h4 className="text-slate-800 font-black tracking-tight mb-6 text-xl">Stock de Mercadería</h4>
                                <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                    {items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors">
                                            <span className="text-sm font-bold text-slate-700 truncate w-32">{item.title}</span>
                                            <span className="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg">{item.quantity || 1} u.</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sales' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <MetricCard title="Pedidos Creados" value={totalSales + 12} />
                             <MetricCard title="Pedidos Pagos" value={totalSales} />
                             <MetricCard title="Facturación Total" value={totalRevenue} prefix="$" />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm h-[450px]">
                                <h4 className="text-slate-800 font-black tracking-tight mb-8 text-xl">Ingresos por Método de Pago</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={[
                                            { name: 'Mercado Pago', value: totalRevenue * 0.6 || 60 },
                                            { name: 'Tarjeta de Crédito', value: totalRevenue * 0.3 || 30 },
                                            { name: 'Transferencia', value: totalRevenue * 0.1 || 10 }
                                        ]} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                                            {COLORS.map((color, index) => (
                                                <Cell key={`cell-${index}`} fill={color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm h-[450px]">
                                <h4 className="text-slate-800 font-black tracking-tight mb-8 text-xl">Evolución de Facturación</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={visitsData} margin={{bottom: 20}}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} dy={10} />
                                        <YAxis />
                                        <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                                        <Bar dataKey="ventas" fill="#F59E0B" radius={[8, 8, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'visits' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm h-[450px]">
                                <h4 className="text-slate-800 font-black tracking-tight mb-8 text-xl">Accesos por Dispositivo</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { name: 'Mobile', value: 65 },
                                        { name: 'Desktop', value: 30 },
                                        { name: 'Tablet', value: 5 }
                                    ]} margin={{bottom: 20}}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} dy={10} />
                                        <YAxis />
                                        <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                                        <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} barSize={80} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm h-[450px]">
                                <h4 className="text-slate-800 font-black tracking-tight mb-8 text-xl">Distribución de Visitas (Redes)</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={visitsData} margin={{bottom: 20}}>
                                         <defs>
                                            <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#EC4899" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold' }} dy={10} />
                                        <YAxis />
                                        <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                                        <Area type="monotone" dataKey="visitas" stroke="#EC4899" strokeWidth={4} fillOpacity={1} fill="url(#colorV)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                         </div>
                    </div>
                )}

                {activeTab === 'realtime' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-gradient-to-r from-primary to-primary-vibrant p-10 rounded-[32px] text-white shadow-2xl shadow-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-sm font-black tracking-widest uppercase opacity-80 mb-3">Usuarios Activos (Últimos 5 min)</h3>
                                <div className="flex items-baseline gap-4">
                                    <p className="text-7xl font-black">{activeUsers}</p>
                                    <span className="text-lg font-bold opacity-80">navegando ahora</span>
                                </div>
                            </div>
                            <div className="size-24 rounded-full bg-white/10 flex items-center justify-center relative">
                                <div className="absolute inset-0 border-4 border-white/20 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                                <span className="material-symbols-outlined text-5xl">sensors</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm">
                                <h4 className="text-slate-800 font-black tracking-tight mb-8 text-xl">Visitantes por Origen (En vivo)</h4>
                                <div className="space-y-6">
                                    {visitorsBySource.map((source, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <span className="font-bold text-slate-700 text-sm w-36">{source.name}</span>
                                            <div className="flex-1 mx-6 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${source.color} rounded-full transition-all duration-1000`} style={{ width: `${source.percent}%` }}></div>
                                            </div>
                                            <span className="font-black text-slate-900">{source.percent}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm">
                                <h4 className="text-slate-800 font-black tracking-tight mb-8 text-xl">Eventos Recientes</h4>
                                <div className="space-y-4">
                                    {realtimeEvents.length === 0 ? (
                                        <p className="text-sm text-slate-500 font-medium">Aún no hay eventos recientes.</p>
                                    ) : (
                                        realtimeEvents.slice(0, 5).map((ev, i) => {
                                            const details = getEventDetails(ev.type, ev);
                                            return (
                                                <div key={i} className="flex gap-5 items-center p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                                    <div className={`size-10 rounded-xl flex items-center justify-center ${details.color}`}>
                                                        <span className="material-symbols-outlined text-[20px]">{details.icon}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h5 className="font-bold text-slate-700">{details.title}</h5>
                                                        <span className="text-xs font-bold text-slate-400">
                                                            {ev.timestamp ? formatDistanceToNow(ev.timestamp.toDate(), { addSuffix: true, locale: es }) : 'Justo ahora'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}       </div>
                        </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
