import React, { useState, useEffect, useMemo } from 'react';
import { fetchAnalyticsRange, DailyAnalytics, getOnlineUsersCount } from '../../lib/trafficStats';
import { UserProfile } from '../../lib/users';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6'];

interface AdminAnalyticsProps {
    users: UserProfile[];
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ users }) => {
    const [analytics, setAnalytics] = useState<DailyAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<7 | 30 | 90>(30);
    const [onlineUsers, setOnlineUsers] = useState(0);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [data, online] = await Promise.all([
                    fetchAnalyticsRange(range),
                    getOnlineUsersCount()
                ]);
                setAnalytics(data);
                setOnlineUsers(online);
            } catch (e) {
                console.error('Error loading analytics:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [range]);

    // ─── Computed metrics ────────────────────────────────────────────
    const today = analytics[analytics.length - 1];
    const totalViewsToday = today?.totalViews || 0;
    const uniqueToday = today?.uniqueVisitors || 0;

    const totalViewsRange = useMemo(() => analytics.reduce((sum, d) => sum + d.totalViews, 0), [analytics]);
    const totalUniquesRange = useMemo(() => analytics.reduce((sum, d) => sum + d.uniqueVisitors, 0), [analytics]);

    // ─── Computed user stats ─────────────────────────────────────────
    const userStats = useMemo(() => {
        const sorted = [...users].sort((a, b) => {
            const dateA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
            const dateB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
            return dateA - dateB;
        });
        const oldest = sorted.length > 0 ? sorted[0] : null;
        const newest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
        return { total: sorted.length, oldest, newest };
    }, [users]);

    // Last 7 days subset
    const last7 = useMemo(() => analytics.slice(-7), [analytics]);
    const totalViews7 = useMemo(() => last7.reduce((sum, d) => sum + d.totalViews, 0), [last7]);

    // ─── Trend chart data ────────────────────────────────────────────
    const trendData = useMemo(() => analytics.map(d => ({
        date: d.date.slice(5), // MM-DD
        fullDate: d.date,
        Visitas: d.totalViews,
        Únicos: d.uniqueVisitors,
    })), [analytics]);

    // ─── Aggregate pages across range ────────────────────────────────
    const topPages = useMemo(() => {
        const merged: Record<string, number> = {};
        analytics.forEach(d => {
            Object.entries(d.pages).forEach(([path, count]) => {
                merged[path] = (merged[path] || 0) + count;
            });
        });
        return Object.entries(merged)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([path, views]) => ({
                path: path.replace(/__id__/g, '*').replace(/__slug__/g, '*').replace(/__uid__/g, '*'),
                views,
            }));
    }, [analytics]);

    // ─── Aggregate sources ───────────────────────────────────────────
    const sourcesData = useMemo(() => {
        const merged: Record<string, number> = {};
        analytics.forEach(d => {
            Object.entries(d.sources).forEach(([source, count]) => {
                merged[source] = (merged[source] || 0) + count;
            });
        });
        return Object.entries(merged)
            .sort((a, b) => b[1] - a[1])
            .map(([name, value]) => ({ name, value }));
    }, [analytics]);

    // ─── Aggregate devices ───────────────────────────────────────────
    const devicesData = useMemo(() => {
        const merged: Record<string, number> = {};
        analytics.forEach(d => {
            Object.entries(d.devices).forEach(([device, count]) => {
                merged[device] = (merged[device] || 0) + count;
            });
        });
        const labels: Record<string, string> = { desktop: 'Escritorio', mobile: 'Celular', tablet: 'Tablet' };
        return Object.entries(merged).map(([name, value]) => ({
            name: labels[name] || name,
            value,
        }));
    }, [analytics]);

    // ─── Aggregate hourly ────────────────────────────────────────────
    const hourlyData = useMemo(() => {
        const merged: Record<string, number> = {};
        for (let i = 0; i < 24; i++) merged[String(i)] = 0;
        analytics.forEach(d => {
            Object.entries(d.hourly).forEach(([h, count]) => {
                merged[h] = (merged[h] || 0) + count;
            });
        });
        return Object.entries(merged)
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([hour, views]) => ({
                hour: `${hour.padStart(2, '0')}hs`,
                views,
            }));
    }, [analytics]);

    // ─── Custom tooltip ──────────────────────────────────────────────
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-xl p-4 min-w-[160px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                {payload.map((entry: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs font-bold text-slate-600">{entry.name}</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">{entry.value?.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="size-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando analytics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* ─── Range Selector ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Analíticas del Sitio</h3>
                    <p className="text-xs font-bold text-slate-400">Datos de tráfico global de la plataforma</p>
                </div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    {([7, 30, 90] as const).map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${range === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {r} días
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── User KPI Cards ────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="size-11 rounded-2xl flex items-center justify-center bg-green-50 text-green-600 transition-transform group-hover:scale-110">
                            <span className="material-symbols-outlined text-xl font-black">wifi</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">En Línea (5 min)</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">{onlineUsers}</p>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="size-11 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
                            <span className="material-symbols-outlined text-xl font-black">groups</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuarios Totales</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">{userStats.total}</p>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="size-11 rounded-2xl flex items-center justify-center bg-purple-50 text-purple-600 transition-transform group-hover:scale-110">
                            <span className="material-symbols-outlined text-xl font-black">person_add</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuario Más Nuevo</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight truncate" title={userStats.newest?.displayName || 'N/A'}>
                        {userStats.newest?.displayName || 'N/A'}
                    </p>
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="size-11 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600 transition-transform group-hover:scale-110">
                            <span className="material-symbols-outlined text-xl font-black">history</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuario Más Antiguo</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight truncate" title={userStats.oldest?.displayName || 'N/A'}>
                        {userStats.oldest?.displayName || 'N/A'}
                    </p>
                </div>
            </div>

            {/* ─── KPI Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Visitas Hoy', value: totalViewsToday, icon: 'visibility', color: 'bg-indigo-50 text-indigo-600' },
                    { label: 'Únicos Hoy', value: uniqueToday, icon: 'person', color: 'bg-cyan-50 text-cyan-600' },
                    { label: 'Visitas (7 días)', value: totalViews7, icon: 'trending_up', color: 'bg-emerald-50 text-emerald-600' },
                    { label: `Total (${range}d)`, value: totalViewsRange, icon: 'monitoring', color: 'bg-amber-50 text-amber-600' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`size-11 rounded-2xl flex items-center justify-center ${kpi.color} transition-transform group-hover:scale-110`}>
                                <span className="material-symbols-outlined text-xl font-black">{kpi.icon}</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tight">{kpi.value.toLocaleString()}</p>
                    </div>
                ))}
            </div>

            {/* ─── Trend Chart ───────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                    <span className="material-symbols-outlined text-sm text-indigo-500 mr-2 align-middle">show_chart</span>
                    Tendencia de Tráfico
                </h4>
                <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorUnicos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 800 }} />
                            <Area type="monotone" dataKey="Visitas" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVisitas)" />
                            <Area type="monotone" dataKey="Únicos" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUnicos)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ─── Two columns: Pages + Sources ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top Pages */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                        <span className="material-symbols-outlined text-sm text-indigo-500 mr-2 align-middle">web</span>
                        Páginas Más Visitadas
                    </h4>
                    {topPages.length > 0 ? (
                        <div className="space-y-3">
                            {topPages.map((page, i) => {
                                const maxViews = topPages[0]?.views || 1;
                                const pct = Math.round((page.views / maxViews) * 100);
                                return (
                                    <div key={i} className="group">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-slate-700 truncate max-w-[70%]">{page.path}</span>
                                            <span className="text-xs font-black text-slate-900">{page.views.toLocaleString()}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-8">Sin datos de páginas aún</p>
                    )}
                </div>

                {/* Traffic Sources */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                        <span className="material-symbols-outlined text-sm text-indigo-500 mr-2 align-middle">share</span>
                        Fuentes de Tráfico
                    </h4>
                    {sourcesData.length > 0 ? (
                        <div className="flex flex-col items-center">
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={sourcesData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={90}
                                            paddingAngle={3}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {sourcesData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3 mt-4">
                                {sourcesData.map((s, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        <div className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-[10px] font-bold text-slate-500">{s.name}</span>
                                        <span className="text-[10px] font-black text-slate-700">{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-8">Sin datos de fuentes aún</p>
                    )}
                </div>
            </div>

            {/* ─── Two columns: Devices + Hourly ─────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Devices */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                        <span className="material-symbols-outlined text-sm text-indigo-500 mr-2 align-middle">devices</span>
                        Dispositivos
                    </h4>
                    {devicesData.length > 0 ? (
                        <div className="flex flex-col items-center">
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={devicesData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={90}
                                            paddingAngle={3}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {devicesData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                                {devicesData.map((d, i) => {
                                    const total = devicesData.reduce((s, x) => s + x.value, 0);
                                    const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                                    return (
                                        <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                                            <div className="size-3 rounded-full" style={{ backgroundColor: COLORS[(i + 3) % COLORS.length] }} />
                                            <span className="text-xs font-black text-slate-700">{d.name}</span>
                                            <span className="text-xs font-bold text-slate-400">{pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-8">Sin datos de dispositivos aún</p>
                    )}
                </div>

                {/* Hourly Activity */}
                <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                        <span className="material-symbols-outlined text-sm text-indigo-500 mr-2 align-middle">schedule</span>
                        Actividad por Hora
                    </h4>
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="hour" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={2} />
                                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="views" name="Visitas" radius={[6, 6, 0, 0]} maxBarSize={24}>
                                    {hourlyData.map((entry, i) => (
                                        <Cell key={i} fill={entry.views > 0 ? '#6366f1' : '#e2e8f0'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ─── Summary stats ──────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-3xl border border-indigo-100/50 p-6 md:p-8">
                <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-indigo-500 text-2xl mt-0.5">info</span>
                    <div>
                        <p className="text-sm font-black text-slate-900 mb-1">Resumen del período ({range} días)</p>
                        <p className="text-xs font-bold text-slate-500 leading-relaxed">
                            Total de visitas: <span className="text-indigo-600 font-black">{totalViewsRange.toLocaleString()}</span> •
                            Visitantes únicos: <span className="text-cyan-600 font-black">{totalUniquesRange.toLocaleString()}</span> •
                            Promedio diario: <span className="text-emerald-600 font-black">{analytics.length > 0 ? Math.round(totalViewsRange / analytics.length).toLocaleString() : 0}</span> visitas/día
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
