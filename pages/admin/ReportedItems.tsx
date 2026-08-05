import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { getReports, resolveReport, ReportData } from '../../lib/interactions';
import { useNotification } from '../../context/NotificationContext';
import { format } from 'date-fns';

export default function ReportedItems() {
    const { user, userProfile } = useAuth();
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [reports, setReports] = useState<(ReportData & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && userProfile?.role !== 'admin') {
            navigate('/dashboard');
            return;
        }
        loadReports();
    }, [user, userProfile]);

    const loadReports = async () => {
        setLoading(true);
        const data = await getReports();
        setReports(data);
        setLoading(false);
    };

    const handleResolve = async (reportId: string, status: ReportData['status']) => {
        const result = await resolveReport(reportId, status);
        if (result.success) {
            notify({ type: 'success', title: 'Reporte Actualizado', message: `El reporte ha sido marcado como ${status}.`, icon: 'check_circle' });
            loadReports();
        } else {
            notify({ type: 'error', title: 'Error', message: 'No se pudo actualizar el reporte.', icon: 'error' });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'resolved': return 'bg-green-100 text-green-700 border-green-200';
            case 'dismissed': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'reviewed': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    if (loading) return <div className="p-4 md:p-10 text-center">Cargando reportes...</div>;

    return (
        <div className="min-h-screen bg-light-50 p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-6 mb-12">
                    <button
                        onClick={() => navigate('/admin')}
                        className="size-12 bg-white rounded-xl flex items-center justify-center border border-light-200 shadow-sm hover:bg-light-100 transition-all"
                    >
                        <span className="material-symbols-outlined text-dark-800">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-dark-800 uppercase tracking-tight">Reportes de Brecha</h1>
                        <p className="text-sm font-bold text-gray-400 mt-1">Gestión de denuncias y seguridad del protocolo</p>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] shadow-premium border border-light-200 overflow-hidden">
                    {reports.length === 0 ? (
                        <div className="p-6 md:p-20 text-center opacity-50">
                            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">verified_user</span>
                            <h3 className="text-xl font-black text-dark-800 uppercase tracking-widest">Sin Reportes Pendientes</h3>
                            <p className="text-sm font-bold text-gray-400 mt-2">Todo parece estar en orden en la red.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-light-50 border-b border-light-200">
                                    <tr>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Fecha</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Tipo</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Motivo</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 w-1/3">Descripción</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Estado</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-light-100">
                                    {reports.map((report) => (
                                        <tr key={report.id} className="hover:bg-light-50/50 transition-colors group">
                                            <td className="p-6 text-xs font-bold text-gray-500 whitespace-nowrap">
                                                {format(report.createdAt?.toDate() || new Date(), 'dd/MM/yyyy HH:mm')}
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${report.targetType === 'product' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                    {report.targetType === 'product' ? 'Producto' : 'Usuario'}
                                                </span>
                                            </td>
                                            <td className="p-6 font-bold text-dark-800 text-sm">
                                                {report.reason}
                                            </td>
                                            <td className="p-6">
                                                <p className="text-xs font-medium text-gray-600 line-clamp-2 hover:line-clamp-none transition-all">
                                                    {report.description || 'Sin detalles adicionales.'}
                                                </p>
                                                <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                                    <span className="material-symbols-outlined text-sm">person</span>
                                                    Reportado por: {report.reporterName}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(report.status)}`}>
                                                    {report.status === 'pending' ? 'Pendiente' :
                                                        report.status === 'resolved' ? 'Resuelto' :
                                                            report.status === 'dismissed' ? 'Descartado' : 'Revisado'}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-100 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={`/${report.targetType === 'product' ? 'product' : 'profile'}/${report.targetId}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 text-gray-400 hover:text-primary-vibrant hover:bg-primary-50 rounded-lg transition-all"
                                                        title="Ver Objetivo"
                                                    >
                                                        <span className="material-symbols-outlined">visibility</span>
                                                    </a>
                                                    {report.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleResolve(report.id, 'resolved')}
                                                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                                title="Resolver (Aceptar Reporte)"
                                                            >
                                                                <span className="material-symbols-outlined">check_circle</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleResolve(report.id, 'dismissed')}
                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                title="Descartar (Falso Positivo)"
                                                            >
                                                                <span className="material-symbols-outlined">cancel</span>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
