import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useNotification } from '../context/NotificationContext';
import { useDialog } from '../context/DialogContext';
import { getAllUsers, updateUserVerification, updateUserRole, deleteUserByAdmin, getPlatformStats, suspendUser, getRecentTransactions, reviewUserEvidence } from '../lib/admin';
import { getReports, resolveReport, ReportData } from '../lib/interactions';
import { getPlatformSettings, PlatformSettings, updatePlatformSettings } from '../lib/settings';
import { 
    HeroSlide, 
    Coupon, 
    Broadcast, 
    CategoryBanner,
    MarketingNotification,
    getHeroSlides,
    getCoupons,
    getGlobalBroadcast,
    getCategoryBanners,
    getMarketingNotifications,
    getSeasonalCollections,
    SeasonalCollection,
    upsertHeroSlide,
    deleteHeroSlide,
    validateCoupon,
    updateGlobalBroadcast,
    upsertCategoryBanner
} from '../lib/marketing';
import { UserProfile } from '../lib/users';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminReports from '../components/admin/AdminReports';
import { MarketingHeroManager } from '../components/admin/MarketingHeroManager';
import { MarketingCouponManager } from '../components/admin/MarketingCouponManager';
import { MarketingBroadcastManager } from '../components/admin/MarketingBroadcastManager';
import { MarketingBannerManager } from '../components/admin/MarketingBannerManager';
import { MarketingNotificationManager } from '../components/admin/MarketingNotificationManager';
import { MarketingCollectionManager } from '../components/admin/MarketingCollectionManager';

export default function AdminDashboard() {
    const { user, userProfile } = useAuth();
    const { notify } = useNotification();
    const { showConfirm, showAlert } = useDialog();
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'finance' | 'disputes' | 'reports' | 'marketing' | 'config' | 'operations'>('users');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [disputes, setDisputes] = useState<any[]>([]);
    const [reports, setReports] = useState<(ReportData & { id: string })[]>([]);
    const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
    const [disputeMessages, setDisputeMessages] = useState<any[]>([]);
    const [disputeEvidence, setDisputeEvidence] = useState<any[]>([]);
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [financialLogs, setFinancialLogs] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [recentSales, setRecentSales] = useState<any[]>([]);

    // Marketing State
    const [marketingSubTab, setMarketingSubTab] = useState<'hero' | 'coupons' | 'broadcast' | 'banners' | 'notifications' | 'collections'>('hero');
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
    const [catBanners, setCatBanners] = useState<CategoryBanner[]>([]);
    const [marketingNotifications, setMarketingNotifications] = useState<MarketingNotification[]>([]);
    const [seasonalCollections, setSeasonalCollections] = useState<SeasonalCollection[]>([]);

    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectionInput, setShowRejectionInput] = useState(false);

    useEffect(() => {
        if (!user || (userProfile?.role !== 'admin' && userProfile?.role !== 'moderator')) {
            navigate('/');
            notify({
                type: 'error',
                title: 'Acceso Denegado',
                message: 'No posees las credenciales requeridas para este sector.',
                icon: 'lock'
            });
            return;
        }

        loadData();
    }, [user, userProfile]);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        setFilteredUsers(
            users.filter(u =>
                u.displayName.toLowerCase().includes(term) ||
                u.email.toLowerCase().includes(term) ||
                u.uid.toLowerCase().includes(term)
            )
        );
    }, [searchTerm, users]);

    const loadData = async () => {
        setLoading(true);
        const { getDisputedTransactions, getFinancialLogs, getWithdrawalRequests } = await import('../lib/admin');
        const [
            usersData, 
            statsData, 
            disputesData, 
            settingsData, 
            reportsData, 
            logsData, 
            withdrawalsData, 
            salesData,
            heroData,
            couponsData,
            broadcastData,
            catBannersData,
            notificationsData,
            collectionsData
        ] = await Promise.all([
            getAllUsers(),
            getPlatformStats(),
            getDisputedTransactions(),
            getPlatformSettings(),
            getReports(),
            getFinancialLogs(),
            getWithdrawalRequests(),
            getRecentTransactions(),
            getHeroSlides(),
            getCoupons(),
            getGlobalBroadcast(),
            getCategoryBanners(),
            getMarketingNotifications(),
            getSeasonalCollections()
        ]);
        setUsers(usersData);
        setFilteredUsers(usersData);
        setStats(statsData);
        setDisputes(disputesData);
        setSettings(settingsData);
        setReports(reportsData);
        setFinancialLogs(logsData);
        setWithdrawals(withdrawalsData);
        setRecentSales(salesData);
        
        // Marketing
        setHeroSlides(heroData);
        setCoupons(couponsData);
        setBroadcast(broadcastData);
        setCatBanners(catBannersData);
        setMarketingNotifications(notificationsData);
        setSeasonalCollections(collectionsData);

        setLoading(false);
    };

    const handleResolveReport = async (report: ReportData & { id: string }, status: ReportData['status']) => {
        setIsUpdating(report.id);
        const result = await resolveReport(report.id, status, report.targetId, report.targetType);

        if (result.success) {
            const actionMsg = status === 'resolved' ? 'Publicación eliminada y reporte cerrado.' : 'Reporte descartado (Falsa Alarma).';
            notify({ type: 'success', title: 'Acción Completada', message: actionMsg, icon: status === 'resolved' ? 'delete' : 'verified_user' });
            setReports(prev => prev.map(r => r.id === report.id ? { ...r, status } : r));
        } else {
            notify({ type: 'error', title: 'Error', message: 'No se pudo procesar la solicitud.', icon: 'error' });
        }
        setIsUpdating(null);
    };

    const handleInspectDispute = async (dispute: any) => {
        setSelectedDispute(dispute);
        setLoading(true);
        const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');

        try {
            const [msgSnap, evSnap] = await Promise.all([
                getDocs(query(collection(db, "transactions", dispute.id, "messages"), orderBy("createdAt", "asc"))),
                getDocs(collection(db, "transactions", dispute.id, "evidence"))
            ]);

            setDisputeMessages(msgSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setDisputeEvidence(evSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error inspecting dispute:", error);
        }
        setLoading(false);
    };

    const handleResolveDispute = async (txId: string, result: 'release' | 'refund') => {
        const { releaseFunds, adminRefundFunds } = await import('../lib/transactions');

        setIsUpdating(txId);
        try {
            const res = result === 'release'
                ? await releaseFunds(txId)
                : await adminRefundFunds(txId, user?.uid || 'admin');

            if (res.success) {
                notify({ type: 'success', title: 'Disputa Resuelta', message: `Fondos ${result === 'release' ? 'liberados' : 'reembolsados'}.`, icon: 'gavel' });
                setDisputes(prev => prev.filter(d => d.id !== txId));
                setSelectedDispute(null);
            } else {
                notify({ type: 'error', title: 'Error', message: res.error || 'No se pudo resolver la disputa.', icon: 'error' });
            }
        } catch (error: any) {
            console.error(error);
            notify({ type: 'error', title: 'Fallo Crítico', message: error.message, icon: 'dangerous' });
        }
        setIsUpdating(null);
    };

    const handleToggleBadge = async (uid: string, badge: 'identityVerified' | 'addressVerified' | 'phoneVerified', currentVal: boolean) => {
        setIsUpdating(uid);
        const result = await updateUserVerification(uid, { [badge]: !currentVal });

        if (result.success) {
            notify({ type: 'success', title: 'Verificación Actualizada', message: 'Estado modificado exitosamente.', icon: 'verified' });
            setUsers(prev => prev.map(u => u.uid === uid ? {
                ...u,
                verificationBadges: { ...(u.verificationBadges || {}), [badge]: !currentVal }
            } : u));
            if (selectedUser?.uid === uid) {
                setSelectedUser(prev => prev ? {
                    ...prev,
                    verificationBadges: { ...(prev.verificationBadges || {}), [badge]: !currentVal }
                } : null);
            }
        }
        setIsUpdating(null);
    };

    const handleChangeRole = async (uid: string, newRole: 'admin' | 'moderator' | 'user') => {
        if (uid === user?.uid && newRole !== 'admin') {
            notify({ type: 'warning', title: 'Acción Restringida', message: 'No puedes degradar tu propio estatus administrativo.', icon: 'warning' });
            return;
        }

        setIsUpdating(uid);
        const result = await updateUserRole(uid, newRole);
        if (result.success) {
            notify({ type: 'success', title: 'Rol Actualizado', message: `Estatus del usuario cambiado a ${newRole.toUpperCase()}.`, icon: 'person' });
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
        }
        setIsUpdating(null);
    };

    const handleDeleteUser = async (uid: string) => {
        if (uid === user?.uid) {
            notify({ type: 'error', title: 'Error', message: 'Protocolo de auto-terminación restringido.', icon: 'error' });
            return;
        }

        const targetUser = users.find(u => u.uid === uid);
        const confirm1 = await showConfirm(
            "Eliminar Usuario",
            `ADVERTENCIA: ¿Eliminar permanentemente a "${targetUser?.displayName || uid}"?\n\nSe borrará:\n• Items publicados\n• Chats y mensajes\n• Reseñas y preguntas\n• Movimientos de billetera\n• Retiros y reportes\n\nSolo se conservará el EMAIL.`,
            "Eliminar Permanentemente",
            "Cancelar",
            "delete_forever"
        );
        if (!confirm1) return;

        const confirmKey = prompt('Escribe "ELIMINAR" para confirmar la eliminación total:');
        if (confirmKey !== 'ELIMINAR') return;

        setIsUpdating(uid);
        const result = await deleteUserByAdmin(uid);
        if (result.success) {
            const counts = (result as any).deletedCounts;
            notify({
                type: 'success',
                title: 'Usuario Eliminado',
                message: `Data eliminada: ${counts?.items || 0} items, ${counts?.chats || 0} chats, ${counts?.reviews || 0} reseñas, ${counts?.movements || 0} movimientos. Email preservado.`,
                icon: 'delete_forever'
            });
            setUsers(prev => prev.filter(u => u.uid !== uid));
            setSelectedUser(null);
        } else {
            notify({ type: 'error', title: 'Error', message: 'No se pudo eliminar al usuario.', icon: 'error' });
        }
        setIsUpdating(null);
    };

    const handleSuspendUser = async (uid: string, isSuspended: boolean) => {
        if (uid === user?.uid) {
            notify({ type: 'error', title: 'Error', message: 'No puedes suspender tu propia cuenta.', icon: 'error' });
            return;
        }
        setIsUpdating(uid);
        const actionMsg = isSuspended ? 'Suspender' : 'Reactivar';
        const confirmResult = await showConfirm(
            `${actionMsg} Usuario`,
            `¿${actionMsg} esta cuenta?`,
            actionMsg,
            "Cancelar",
            isSuspended ? "block" : "check_circle"
        );
        if (!confirmResult) {
            setIsUpdating(null);
            return;
        }

        const result = await suspendUser(uid, isSuspended);
        if (result.success) {
            notify({ type: 'success', title: `Usuario ${isSuspended ? 'Suspendido' : 'Reactivado'}`, message: 'Estado del nodo actualizado.', icon: isSuspended ? 'block' : 'check_circle' });
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isSuspended } : u));
            setSelectedUser(prev => prev && prev.uid === uid ? { ...prev, isSuspended } : prev);
        } else {
            notify({ type: 'error', title: 'Error', message: 'No se pudo alterar el estado del usuario.', icon: 'error' });
        }
        setIsUpdating(null);
    };

    const handleUpdateSettings = async (newSettings: Partial<PlatformSettings>) => {
        setIsUpdating('settings');
        const result = await updatePlatformSettings(newSettings);
        if (result.success) {
            setSettings(prev => prev ? { ...prev, ...newSettings } : null);
            notify({ type: 'success', title: 'Configuración Guardada', message: 'Los parámetros del sistema han sido actualizados.', icon: 'save_as' });
        } else {
            notify({ type: 'error', title: 'Error de Guardado', message: 'No se pudo actualizar la configuración.', icon: 'error' });
        }
        setIsUpdating(null);
    };

    const handleClearWalletMovements = async () => {
        const confirm1 = await showConfirm('Eliminar Movimientos', '¿ELIMINAR TODOS LOS MOVIMIENTOS? Esta acción no se puede deshacer.', 'Continuar', 'Cancelar', 'warning');
        if (!confirm1) return;
        const confirm2 = await showConfirm('Confirmación Final', 'Se borrarán todos los registros de activos en la red.', 'Eliminar', 'Cancelar', 'delete_forever');
        if (!confirm2) return;

        setIsUpdating('dev-tools');
        const { clearAllWalletMovements } = await import('../lib/admin');
        const result = await clearAllWalletMovements();
        if (result.success) {
            notify({ type: 'success', title: 'Limpieza Completada', message: 'Historial de movimientos eliminado.', icon: 'delete_sweep' });
            loadData();
        } else {
            notify({ type: 'error', title: 'Fallo', message: 'No se pudo limpiar la base de datos.', icon: 'error' });
        }
        setIsUpdating(null);
    };

    const handleResetReputations = async () => {
        const confirm1 = await showConfirm('Resetear Reputaciones', '¿RESETEAR TODAS LAS REPUTACIONES? Todos los vendedores volverán a 0 estrellas.', 'Continuar', 'Cancelar', 'warning');
        if (!confirm1) return;
        const confirm2 = await showConfirm('Confirmación Final', 'Se borrarán todas las reseñas y promedios de la plataforma.', 'Resetear', 'Cancelar', 'star_outline');
        if (!confirm2) return;

        setIsUpdating('dev-tools');
        const { resetAllUserReputations } = await import('../lib/admin');
        const result = await resetAllUserReputations();
        if (result.success) {
            notify({ type: 'success', title: 'Reputaciones Reseteadas', message: 'Rankings vueltos a origen.', icon: 'star_outline' });
            loadData();
        } else {
            notify({ type: 'error', title: 'Fallo', message: 'No se pudo resetear el ranking.', icon: 'error' });
        }
        setIsUpdating(null);
    };

    const handleHardReset = async () => {
        const confirm1 = await showConfirm('Reset de Fábrica', '¡PELIGRO EXTREMO! ¿BORRAR TODA LA BASE DE DATOS EXCEPTO ADMINS? Esta acción destruirá toda la plataforma.', 'Peligro - Continuar', 'Cancelar', 'warning');
        if (!confirm1) return;
        
        const confirmKey = prompt('Escribe "DESTRUIR TODO" para confirmar la eliminación de la base de datos:');
        if (confirmKey !== 'DESTRUIR TODO') return;

        setIsUpdating('dev-tools');
        const { hardResetDatabase } = await import('../lib/admin');
        const result = await hardResetDatabase();
        if (result.success) {
            notify({ type: 'success', title: 'Reset Completo', message: `Plataforma borrada. ${result.count} documentos eliminados.`, icon: 'delete_forever' });
            loadData();
        } else {
            notify({ type: 'error', title: 'Fallo', message: 'No se pudo resetear la base de datos.', icon: 'error' });
        }
        setIsUpdating(null);
    };

    if (loading) return <LoadingSpinner size="lg" text="Sincronizando Núcleo Administrativo..." />;

    return (
        <div className="max-w-[1440px] mx-auto px-6 py-12 min-h-screen bg-surface-dim bg-mesh-aura pb-32 relative">
            {/* Ambient Aura Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse"></div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12 px-2 relative z-10">
                <div>
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full mb-4 shadow-sm">
                        <span className="material-symbols-outlined text-sm font-black animate-spin-slow">security</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Centro de Mando Administrativo</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tight font-display mb-6">Hub de Infraestructura</h1>
                    <div className="bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/30 flex flex-wrap gap-1.5 shadow-sm">
                        {[
                            { id: 'users', label: 'Nodos de Usuario', icon: 'group' },
                            { id: 'finance', label: 'Activos Globales', icon: 'account_balance_wallet' },
                            { id: 'operations', label: 'Operaciones', icon: 'terminal' },
                            { id: 'disputes', label: 'Tribunal', icon: 'gavel' },
                            { id: 'reports', label: 'Denuncias', icon: 'flag' },
                            { id: 'config', label: 'Configuración', icon: 'settings_suggest' },
                            { id: 'marketing', label: 'Marketing Hub', icon: 'campaign' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-primary text-on-primary shadow-md -translate-y-0.5' : 'bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
                            >
                                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {activeTab === 'users' ? (
                <div className="bg-surface rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden animate-in fade-in duration-500">
                    <div className="p-6 md:p-8 border-b border-outline-variant/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container-low/40">
                        <div>
                            <h3 className="text-xl font-black text-on-surface uppercase tracking-tight font-display">Directorio de Nodos</h3>
                            <p className="text-xs font-bold text-on-surface-variant mt-0.5">Gestión de identidades, niveles de acceso y auditoría de cuentas.</p>
                        </div>
                        <div className="relative w-full md:w-[380px] group shadow-2xs rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface focus-within:border-primary transition-all">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline-variant group-focus-within:text-primary transition-colors text-lg">search</span>
                            <input
                                type="text"
                                placeholder="Filtrar por nombre, email o ID hash..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent border-none py-3 pl-11 pr-4 outline-none font-bold text-xs text-on-surface placeholder:text-outline-variant/70"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-container-low text-on-surface-variant text-[10px] font-black uppercase tracking-widest border-b border-outline-variant/30">
                                    <th className="px-8 py-5">Nodo de Identidad</th>
                                    <th className="px-8 py-5">Nivel de Acceso</th>
                                    <th className="px-8 py-5 text-center">Estado del Protocolo</th>
                                    <th className="px-8 py-5 text-right">Operaciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/20">
                                {filteredUsers.map((u) => (
                                    <tr key={u.uid} className={`hover:bg-primary/5 transition-colors ${isUpdating === u.uid ? 'opacity-50 blur-[2px]' : ''}`}>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="relative shrink-0">
                                                    <img
                                                        src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}&background=random`}
                                                        alt={u.displayName}
                                                        className="size-11 rounded-xl object-cover border border-outline-variant/30 shadow-2xs"
                                                    />
                                                    {u.profileComplete && (
                                                        <div className="absolute -bottom-1 -right-1 size-4 bg-primary rounded-full border-2 border-surface flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-[8px] text-on-primary font-black">check</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-on-surface text-sm mb-0.5 tracking-tight truncate">{u.displayName}</p>
                                                    <p className="text-[10px] text-on-surface-variant font-bold truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col gap-1.5 max-w-[170px]">
                                                <select
                                                    value={u.role || 'user'}
                                                    onChange={(e) => handleChangeRole(u.uid, e.target.value as any)}
                                                    className={`border rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer w-full ${
                                                        u.role === 'admin' ? 'bg-primary/10 text-primary border-primary/30 shadow-2xs' :
                                                        u.role === 'moderator' ? 'bg-secondary/10 text-secondary border-secondary/30 shadow-2xs' :
                                                        'bg-surface-container-low text-on-surface border-outline-variant/30'
                                                    }`}
                                                >
                                                    <option value="user">Operador</option>
                                                    <option value="moderator">Moderador</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                {u.verificationEvidence?.status === 'approved' || u.verificationStatus === 'verified' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                        <span className="size-1.5 rounded-full bg-emerald-500"></span>Verificado
                                                    </span>
                                                ) : u.verificationEvidence?.status === 'pending' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse">
                                                        <span className="size-1.5 rounded-full bg-amber-500"></span>KYC Pendiente
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant">
                                                        <span className="size-1.5 rounded-full bg-outline-variant"></span>Estándar
                                                    </span>
                                                )}
                                                <div className="flex justify-center gap-1.5 mt-0.5">
                                                    {[
                                                        { key: 'identityVerified', title: 'ID' },
                                                        { key: 'addressVerified', title: 'ADDR' },
                                                        { key: 'phoneVerified', title: 'PH' }
                                                    ].map(b => (
                                                        <div key={b.key} className={`size-2 rounded-full ${u.verificationBadges?.[b.key as keyof typeof u.verificationBadges] ? 'bg-primary shadow-2xs' : 'bg-outline-variant/40'}`} title={b.title}></div>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => setSelectedUser(u)}
                                                className="size-9 bg-surface hover:bg-primary text-on-surface hover:text-on-primary rounded-xl transition-all shadow-2xs border border-outline-variant/30 inline-flex items-center justify-center group"
                                                title="Inspeccionar Nodo"
                                            >
                                                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">monitoring</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'operations' ? (
                <div className="space-y-10 animate-in fade-in duration-500">
                    <AdminReports />

                    {(() => {
                        const completedEscrows = recentSales.filter(s => s.status === 'COMPLETED');
                        
                        let totalEscrowProfit = 0;
                        let totalPromoProfit = 0;

                        completedEscrows.forEach(sale => {
                            const productPrice = sale.amountProduct || sale.amount || 0;
                            const escrowFee = sale.amountPlatformFee || sale.platformFee || Math.round(productPrice * (settings?.escrowFeePercentage || 0.05));
                            totalEscrowProfit += escrowFee;

                            if (sale.isFlashSale || (sale.featuredFeeApplied && (sale.featuredFeeApplied === 0.1 || sale.featuredFeeApplied === 10 || sale.featuredFeeApplied >= 0.08))) {
                                const promoFee = (sale.featuredFeeApplied && sale.featuredFeeApplied > 1) ? sale.featuredFeeApplied : Math.round(productPrice * 0.10);
                                totalPromoProfit += promoFee;
                            } else if (sale.isFeatured || (sale.featuredFeeApplied && sale.featuredFeeApplied > 0)) {
                                const promoFee = (sale.featuredFeeApplied && sale.featuredFeeApplied > 1) ? sale.featuredFeeApplied : Math.round(productPrice * 0.05);
                                totalPromoProfit += promoFee;
                            }
                        });

                        const totalAdminProfit = totalEscrowProfit + totalPromoProfit;

                        return (
                            <div className="bg-surface rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-outline-variant/20 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                    <div>
                                        <h3 className="text-xl font-black text-on-surface uppercase tracking-tight font-display">Registro de Operaciones (Escrow + Destacados)</h3>
                                        <p className="text-xs font-medium text-on-surface-variant mt-1">Monitoreo de comisiones por intermediación protegida (Escrow) y ganancias por ventas Destacadas (5%) y Flash (10%).</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-2xl flex items-center gap-2.5">
                                            <span className="material-symbols-outlined text-primary text-base font-black">savings</span>
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Ganancia Total VendeloHoy</p>
                                                <p className="text-sm font-black text-primary font-display">${totalAdminProfit.toLocaleString('es-AR')}</p>
                                            </div>
                                        </div>
                                        <div className="bg-surface-container border border-outline-variant/30 px-3 py-2 rounded-2xl">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant">Escrow (Pago Protegido)</p>
                                            <p className="text-xs font-black text-emerald-600 font-display">${totalEscrowProfit.toLocaleString('es-AR')}</p>
                                        </div>
                                        <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-2xl">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-amber-700">Destacados / Flash (5% y 10%)</p>
                                            <p className="text-xs font-black text-amber-600 font-display">${totalPromoProfit.toLocaleString('es-AR')}</p>
                                        </div>
                                        <div className="px-4 py-3 bg-emerald-500/10 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shrink-0">
                                            {completedEscrows.length} Tratos Exitosos
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-surface-container-low text-on-surface-variant text-[10px] font-black uppercase tracking-widest border-b border-outline-variant/30">
                                                <th className="px-8 py-6">ID / Fecha</th>
                                                <th className="px-8 py-6">Vendedor</th>
                                                <th className="px-8 py-6">Comprador</th>
                                                <th className="px-8 py-6 text-center">Estado</th>
                                                <th className="px-8 py-6 text-right">Ganancia Admin (VendeloHoy)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-outline-variant/20">
                                            {recentSales.map((sale) => {
                                                const seller = users.find(u => u.uid === sale.sellerId);
                                                const buyer = users.find(u => u.uid === sale.buyerId);
                                                const isCompleted = sale.status === 'COMPLETED';
                                                const productPrice = sale.amountProduct || sale.amount || 0;
                                                const escrowFee = isCompleted
                                                    ? (sale.amountPlatformFee || sale.platformFee || Math.round(productPrice * (settings?.escrowFeePercentage || 0.05)))
                                                    : 0;

                                                let promoFee = 0;
                                                let promoLabel = '';
                                                if (isCompleted) {
                                                    if (sale.isFlashSale || (sale.featuredFeeApplied && (sale.featuredFeeApplied === 0.1 || sale.featuredFeeApplied === 10 || sale.featuredFeeApplied >= 0.08))) {
                                                        promoFee = (sale.featuredFeeApplied && sale.featuredFeeApplied > 1) ? sale.featuredFeeApplied : Math.round(productPrice * 0.10);
                                                        promoLabel = 'Flash (10%)';
                                                    } else if (sale.isFeatured || (sale.featuredFeeApplied && sale.featuredFeeApplied > 0)) {
                                                        promoFee = (sale.featuredFeeApplied && sale.featuredFeeApplied > 1) ? sale.featuredFeeApplied : Math.round(productPrice * 0.05);
                                                        promoLabel = 'Destacado (5%)';
                                                    }
                                                }
                                                const totalRowFee = escrowFee + promoFee;

                                                return (
                                                    <tr key={sale.id} className="hover:bg-primary/5 transition-colors">
                                                        <td className="px-8 py-5">
                                                            <p className="font-mono font-black text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md inline-block">#{sale.id.slice(0, 8)}</p>
                                                            <p className="text-[10px] font-bold text-on-surface-variant mt-1">{sale.createdAt?.toDate?.()?.toLocaleString('es-AR') || 'N/A'}</p>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <img src={seller?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller?.displayName || 'Vendedor')}&background=random`} alt="Vendedor" className="size-8 rounded-lg object-cover border border-outline-variant/30 shrink-0" />
                                                                <div className="min-w-0 max-w-[160px]">
                                                                    <p className="text-xs font-black text-on-surface truncate">{seller?.displayName || 'Vendedor'}</p>
                                                                    <p className="text-[9px] font-mono text-on-surface-variant truncate">{seller?.email || sale.sellerId?.slice(0, 10) + '...'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-3">
                                                                <img src={buyer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(buyer?.displayName || 'Comprador')}&background=random`} alt="Comprador" className="size-8 rounded-lg object-cover border border-outline-variant/30 shrink-0" />
                                                                <div className="min-w-0 max-w-[160px]">
                                                                    <p className="text-xs font-black text-on-surface truncate">{buyer?.displayName || 'Comprador'}</p>
                                                                    <p className="text-[9px] font-mono text-on-surface-variant truncate">{buyer?.email || sale.buyerId?.slice(0, 10) + '...'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                                sale.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                                                                sale.status === 'DISPUTED' ? 'bg-error/10 text-error border border-error/20' :
                                                                sale.status === 'CANCELLED' ? 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30' :
                                                                'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                                            }`}>
                                                                {sale.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5 text-right">
                                                            {isCompleted ? (
                                                                <div>
                                                                    <p className="font-black text-emerald-600 text-sm font-display">+${totalRowFee.toLocaleString('es-AR')}</p>
                                                                    <div className="flex flex-col items-end gap-1 mt-1">
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-[9px] font-mono font-bold text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant/30">
                                                                                Escrow: +${escrowFee.toLocaleString('es-AR')}
                                                                            </span>
                                                                            {promoFee > 0 && (
                                                                                <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                                                                    {promoLabel}: +${promoFee.toLocaleString('es-AR')}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-[9px] font-mono text-on-surface-variant/60">Trato: ${productPrice.toLocaleString('es-AR')}</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <p className="font-black text-on-surface-variant/40 text-sm font-display">$0</p>
                                                                    <p className="text-[9px] font-mono text-on-surface-variant/60 mt-0.5">Trato: ${productPrice.toLocaleString('es-AR')}</p>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {recentSales.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-8 py-20 text-center">
                                                        <p className="text-xs font-black text-outline-variant uppercase tracking-widest">No hay operaciones recientes.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            ) : activeTab === 'disputes' ? (
                <div className="bg-surface rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden animate-in fade-in duration-500">
                    <div className="p-8 border-b border-outline-variant/20 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">Colas de Arbitraje</h3>
                            <p className="text-xs font-bold text-on-surface-variant mt-1">Transacciones con protocolos de seguridad bloqueados por disputa.</p>
                        </div>
                        <div className="px-5 py-1.5 bg-error/10 text-error rounded-full text-[10px] font-black uppercase tracking-widest border border-error/20">
                            {disputes.length} Casos Activos
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-container-low text-on-surface-variant text-[10px] font-black uppercase tracking-widest border-b border-outline-variant/30">
                                    <th className="px-8 py-6">ID Trato</th>
                                    <th className="px-8 py-6">Monto</th>
                                    <th className="px-8 py-6">Vendedor / Comprador</th>
                                    <th className="px-8 py-6 text-right">Resolución de Arbitraje</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/20">
                                {disputes.map((d) => (
                                    <tr key={d.id} className={`hover:bg-primary/5 transition-colors ${isUpdating === d.id ? 'opacity-50 blur-[2px]' : ''}`}>
                                        <td className="px-8 py-6 font-mono font-black text-xs text-primary">#{d.id.slice(0, 8)}</td>
                                        <td className="px-8 py-6 font-black text-on-surface text-sm font-display">${d.amount?.toLocaleString()}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[10px] font-black text-on-surface uppercase tracking-wider">V: {d.sellerId?.slice(0, 10)}...</p>
                                                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">C: {d.buyerId?.slice(0, 10)}...</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleInspectDispute(d)}
                                                    className="size-10 bg-surface hover:bg-primary text-on-surface hover:text-on-primary rounded-xl transition-all shadow-sm border border-outline-variant/30 inline-flex items-center justify-center group"
                                                    title="Inspeccionar"
                                                >
                                                    <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">visibility</span>
                                                </button>
                                                <button
                                                    onClick={() => handleResolveDispute(d.id, 'refund')}
                                                    className="px-4 py-2 bg-error/10 text-error rounded-xl font-black text-[9px] uppercase tracking-wider hover:bg-error hover:text-white transition-all shadow-sm border border-error/20"
                                                >
                                                    Fallo COMPRADOR
                                                </button>
                                                <button
                                                    onClick={() => handleResolveDispute(d.id, 'release')}
                                                    className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-black text-[9px] uppercase tracking-wider hover:bg-primary hover:text-on-primary transition-all shadow-sm border border-primary/20"
                                                >
                                                    Fallo VENDEDOR
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {disputes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="size-16 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                                <span className="material-symbols-outlined text-3xl">verified_user</span>
                                            </div>
                                            <p className="text-xs font-black text-outline-variant uppercase tracking-widest">No hay disputas activas en la red.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'reports' ? (
                <div className="bg-surface rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden animate-in fade-in duration-500">
                    <div className="p-8 border-b border-outline-variant/20 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">Centro de Denuncias</h3>
                            <p className="text-xs font-bold text-on-surface-variant mt-1">Gestión de contenido reportado por la comunidad.</p>
                        </div>
                        <div className="px-5 py-1.5 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                            {reports.filter(r => r.status === 'pending').length} Pendientes
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-container-low text-on-surface-variant text-[10px] font-black uppercase tracking-widest border-b border-outline-variant/30">
                                    <th className="px-8 py-6">Tipo</th>
                                    <th className="px-8 py-6">Denunciante</th>
                                    <th className="px-8 py-6">Motivo</th>
                                    <th className="px-8 py-6 text-center">Estado</th>
                                    <th className="px-8 py-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/20">
                                {reports.map((report) => (
                                    <tr key={report.id} className={`hover:bg-primary/5 transition-colors ${isUpdating === report.id ? 'opacity-50 blur-[2px]' : ''}`}>
                                        <td className="px-8 py-6">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${report.targetType === 'product' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' : 'bg-purple-500/10 text-purple-600 border border-purple-500/20'}`}>
                                                {report.targetType === 'product' ? 'Producto' : 'Usuario'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-on-surface text-sm">{report.reporterName}</p>
                                            <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">{report.reporterId.slice(0, 8)}...</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-black text-on-surface text-xs uppercase tracking-tight">{report.reason}</p>
                                            <p className="text-[10px] text-on-surface-variant mt-0.5 max-w-xs">{report.description}</p>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${report.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                                                report.status === 'dismissed' ? 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30' :
                                                    'bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse'
                                                }`}>
                                                {report.status === 'pending' ? 'Pendiente' :
                                                    report.status === 'resolved' ? 'Resuelto' :
                                                        report.status === 'dismissed' ? 'Descartado' : report.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {report.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleResolveReport(report, 'dismissed')}
                                                        className="h-9 px-3 rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all flex items-center gap-1.5 border border-outline-variant/30"
                                                        title="Denuncia Falsa (Mantener)"
                                                    >
                                                        <span className="material-symbols-outlined text-base">close</span>
                                                        <span className="text-[9px] font-black uppercase tracking-wider hidden lg:inline">Descartar</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleResolveReport(report, 'resolved')}
                                                        className="h-9 px-3 rounded-xl bg-error/10 text-error hover:bg-error hover:text-white transition-all flex items-center gap-1.5 shadow-sm border border-error/20"
                                                        title="Denuncia Cierta (Eliminar)"
                                                    >
                                                        <span className="material-symbols-outlined text-base">delete</span>
                                                        <span className="text-[9px] font-black uppercase tracking-wider hidden lg:inline">Eliminar</span>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {reports.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="size-16 bg-surface-container-low rounded-2xl flex items-center justify-center mx-auto mb-4 border border-outline-variant/30">
                                                <span className="material-symbols-outlined text-3xl text-outline-variant">notifications_off</span>
                                            </div>
                                            <p className="text-xs font-black text-outline-variant uppercase tracking-widest">No hay denuncias activas.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'marketing' ? (
                <div className="bg-surface rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden animate-in fade-in duration-500">
                    <div className="p-8 border-b border-outline-variant/20 bg-surface-container-lowest">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="size-14 bg-primary rounded-2xl flex items-center justify-center text-on-primary shadow-md">
                                    <span className="material-symbols-outlined text-2xl font-black">campaign</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-on-surface tracking-tight font-display">Motores de Marketing</h3>
                                    <p className="text-xs font-bold text-on-surface-variant mt-1">Gestión avanzada de visibilidad y promociones.</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/30">
                                {[
                                    { id: 'hero', label: 'Home Hero', icon: 'view_carousel' },
                                    { id: 'coupons', label: 'Cupones', icon: 'confirmation_number' },
                                    { id: 'broadcast', label: 'Avisos Globales', icon: 'notification_important' },
                                    { id: 'banners', label: 'Banners Cat.', icon: 'branding_watermark' },
                                    { id: 'notifications', label: 'Notificaciones Feed', icon: 'notifications_active' },
                                    { id: 'collections', label: 'Colecciones', icon: 'auto_awesome_mosaic' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setMarketingSubTab(tab.id as any)}
                                        className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 ${marketingSubTab === tab.id ? 'bg-primary text-on-primary shadow-sm scale-105' : 'bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}
                                    >
                                        <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-12">
                        {marketingSubTab === 'hero' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <MarketingHeroManager 
                                    slides={heroSlides} 
                                    onUpdate={loadData} 
                                    isHeroEnabled={settings?.showHero || false}
                                    onToggleHero={() => handleUpdateSettings({ showHero: !settings?.showHero })}
                                />
                            </div>
                        )}
                        {marketingSubTab === 'coupons' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <MarketingCouponManager coupons={coupons} onUpdate={loadData} />
                            </div>
                        )}
                        {marketingSubTab === 'broadcast' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <MarketingBroadcastManager broadcast={broadcast} onUpdate={loadData} />
                            </div>
                        )}
                        {marketingSubTab === 'banners' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <MarketingBannerManager banners={catBanners} onUpdate={loadData} />
                            </div>
                        )}
                        {marketingSubTab === 'notifications' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <MarketingNotificationManager notifications={marketingNotifications} onUpdate={loadData} />
                            </div>
                        )}
                        {marketingSubTab === 'collections' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <MarketingCollectionManager collections={seasonalCollections} onUpdate={loadData} />
                            </div>
                        )}
                    </div>
                </div>
            ) : activeTab === 'config' ? (
                <div className="bg-white rounded-[40px] border border-light-200 shadow-premium overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700 p-12">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="size-16 bg-dark-800 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-dark-800/20">
                            <span className="material-symbols-outlined text-3xl font-black animate-spin-slow">settings</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-dark-800 uppercase tracking-tight">Variables de Entorno Global</h3>
                            <p className="text-xs font-bold text-gray-400 mt-1">Modifica los parámetros operativos de todo el marketplace en tiempo real.</p>
                        </div>
                    </div>

                    <div className="max-w-2xl">
                        <div className="bg-light-50 p-10 rounded-[40px] border border-light-200 shadow-inner">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h4 className="text-lg font-black text-dark-800 uppercase tracking-tight mb-2">Comisión de Escrow (Base)</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-sm">
                                        Porcentaje aplicado sobre el valor del ítem para cubrir costos de garantía y operación de plataforma.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-4xl font-black text-primary-vibrant tracking-tighter">
                                        {((settings?.escrowFeePercentage || 0) * 100).toFixed(0)}%
                                    </p>
                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">Valor Actual</p>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div>
                                    <label className="block text-[10px] font-black text-dark-800 uppercase tracking-widest mb-3">Ajustar Porcentaje Base (0.01 - 1.00)</label>
                                    <div className="flex gap-4">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            value={settings?.escrowFeePercentage || 0}
                                            onChange={(e) => setSettings(prev => prev ? { ...prev, escrowFeePercentage: parseFloat(e.target.value) } : null)}
                                            className="flex-1 bg-white border border-light-200 rounded-2xl px-6 py-4 font-black text-lg outline-none focus:ring-4 focus:ring-primary-100 transition-all text-center"
                                        />
                                        <button
                                            onClick={() => settings && handleUpdateSettings({ escrowFeePercentage: settings.escrowFeePercentage })}
                                            disabled={isUpdating === 'settings'}
                                            className="px-8 bg-dark-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                                        >
                                            {isUpdating === 'settings' ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">save</span>}
                                            Guardar
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-light-200/50">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h4 className="text-lg font-black text-primary-vibrant uppercase tracking-tight mb-2">Extra por "Oferta Relámpago"</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-sm">
                                                Comisión adicional aplicada si el vendedor decide destacar su producto en la portada.
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-4xl font-black text-primary-vibrant tracking-tighter">
                                                +{((settings?.featuredExtraPercentage || 0) * 100).toFixed(0)}%
                                            </p>
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">Valor Actual</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mb-6">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-dark-800 uppercase tracking-widest mb-3">Porcentaje Extra (0.01 - 0.50)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="0.5"
                                                value={settings?.featuredExtraPercentage || 0}
                                                onChange={(e) => setSettings(prev => prev ? { ...prev, featuredExtraPercentage: parseFloat(e.target.value) } : null)}
                                                className="w-full bg-white border border-light-200 rounded-2xl px-6 py-4 font-black text-lg outline-none focus:ring-4 focus:ring-primary-100 transition-all text-center"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-dark-800 uppercase tracking-widest mb-3">Duración (Horas)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="168"
                                                value={settings?.featuredDurationHours || 48}
                                                onChange={(e) => setSettings(prev => prev ? { ...prev, featuredDurationHours: parseInt(e.target.value) } : null)}
                                                className="w-full bg-white border border-light-200 rounded-2xl px-6 py-4 font-black text-lg outline-none focus:ring-4 focus:ring-primary-100 transition-all text-center"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={() => settings && handleUpdateSettings({
                                                    featuredExtraPercentage: settings.featuredExtraPercentage,
                                                    featuredDurationHours: settings.featuredDurationHours
                                                })}
                                                disabled={isUpdating === 'settings'}
                                                className="h-[60px] px-8 bg-primary-vibrant text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                                            >
                                                {isUpdating === 'settings' ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">lock_reset</span>}
                                                Aplicar
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-primary-50 p-6 rounded-3xl border border-primary-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-primary-800 uppercase tracking-widest">Total Destacados:</span>
                                            <span className="text-2xl font-black text-primary-vibrant">
                                                {(((settings?.escrowFeePercentage || 0) + (settings?.featuredExtraPercentage || 0)) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-light-200/50 grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-2xl border border-light-200">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Ejemplo: Ítem $10.000</p>
                                        <p className="text-xl font-black text-dark-800">${(10000 * (settings?.escrowFeePercentage || 0)).toLocaleString()}</p>
                                        <p className="text-[8px] text-primary-vibrant font-black uppercase tracking-widest">Fee de Plataforma</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-light-200">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Ejemplo: Ítem $150.000</p>
                                        <p className="text-xl font-black text-dark-800">${(150000 * (settings?.escrowFeePercentage || 0)).toLocaleString()}</p>
                                        <p className="text-[8px] text-primary-vibrant font-black uppercase tracking-widest">Fee de Plataforma</p>
                                    </div>
                                </div>
                            </div>

                            {/* DEV TOOLS SECTION */}
                            <div className="mt-16 pt-10 border-t border-light-200">
                                <div className="flex items-center gap-3 mb-8">
                                    <span className="material-symbols-outlined text-red-500 font-black">engineering</span>
                                    <h4 className="text-lg font-black text-dark-800 uppercase tracking-tight">Herramientas de Desarrollo (DANGER ZONE)</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-red-50 p-8 rounded-[32px] border border-red-100">
                                        <h5 className="text-[11px] font-black text-red-900 uppercase tracking-widest mb-3">Limpiar Libro Mayor</h5>
                                        <p className="text-[9px] font-bold text-red-700/60 uppercase tracking-widest leading-relaxed mb-6">
                                            Elimina permanentemente todos los registros de movimientos en las billeteras.
                                        </p>
                                        <button
                                            onClick={handleClearWalletMovements}
                                            disabled={isUpdating !== null}
                                            className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                        >
                                            {isUpdating === 'dev-tools' ? 'Procesando...' : 'Eliminar Movimientos'}
                                        </button>
                                    </div>
                                    <div className="bg-amber-50 p-8 rounded-[32px] border border-amber-100">
                                        <h5 className="text-[11px] font-black text-amber-900 uppercase tracking-widest mb-3">Resetear Rankings</h5>
                                        <p className="text-[9px] font-bold text-amber-700/60 uppercase tracking-widest leading-relaxed mb-6">
                                            Limpia las reseñas y reputaciones de todos los usuarios de la red.
                                        </p>
                                        <button
                                            onClick={handleResetReputations}
                                            disabled={isUpdating !== null}
                                            className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                        >
                                            {isUpdating === 'dev-tools' ? 'Procesando...' : 'Resetear Vendedores'}
                                        </button>
                                    </div>
                                    <div className="bg-gray-900 p-8 rounded-[32px] border border-black">
                                        <h5 className="text-[11px] font-black text-red-500 uppercase tracking-widest mb-3">DESTRUCCIÓN TOTAL</h5>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-6">
                                            Elimina toda la base de datos, chats, items y usuarios. Sólo preserva cuentas Admin.
                                        </p>
                                        <button
                                            onClick={handleHardReset}
                                            disabled={isUpdating !== null}
                                            className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-800 transition-all shadow-lg shadow-red-900/50 active:scale-95 disabled:opacity-50"
                                        >
                                            {isUpdating === 'dev-tools' ? 'Procesando...' : 'NUKE DATABASE'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-in fade-in duration-500">
                    {[
                        { label: 'Liquidez de Plataforma', val: stats?.totalAvailable, color: 'text-on-surface', icon: 'account_balance', bg: 'bg-primary/10 text-primary' },
                        { label: 'Ventas del Día', val: stats?.dailySales, color: 'text-primary', icon: 'point_of_sale', bg: 'bg-emerald-500/10 text-emerald-600' },
                        { label: 'Tratos en Garantía', val: stats?.totalInEscrow, color: 'text-on-surface', icon: 'lock_open', bg: 'bg-secondary/10 text-secondary' },
                        { label: 'Nuevos Usuarios (Hoy)', val: stats?.newUsersToday, color: 'text-amber-600', icon: 'person_add', bg: 'bg-amber-500/10 text-amber-600' },
                        { label: 'Cola de Liquidación', val: stats?.totalPending, color: 'text-orange-600', icon: 'pending_actions', bg: 'bg-orange-500/10 text-orange-600' },
                        { label: 'Valor de Infraestructura', val: stats?.totalSystemValue, color: 'text-emerald-600', icon: 'monitoring', bg: 'bg-primary/10 text-primary' }
                    ].map((card, i) => (
                        <div key={i} className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/30 shadow-2xs group hover:border-primary/50 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`size-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${card.bg}`}>
                                    <span className="material-symbols-outlined text-2xl font-black">{card.icon}</span>
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1.5">{card.label}</p>
                            <p className={`text-3xl font-black ${card.color} tracking-tight font-display`}>${card.val?.toLocaleString() || 0}</p>
                        </div>
                    ))}

                    <div className="lg:col-span-4 bg-gradient-to-br from-dark-900 via-primary-950 to-dark-950 p-10 md:p-12 rounded-3xl text-white shadow-xl relative overflow-hidden group border border-outline-variant/20">
                        <div className="absolute top-0 right-0 size-80 bg-primary/30 blur-[120px] -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000 pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full mb-4 backdrop-blur-md">
                                    <span className="size-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Analíticas Globales del Sistema</span>
                                </div>
                                <p className="text-5xl md:text-6xl font-black tracking-tight font-display text-white">${stats?.totalSystemValue?.toLocaleString() || 0}</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={async () => {
                                        setIsUpdating('audit');
                                        const { generateAuditReport } = await import('../lib/admin');
                                        const res = await generateAuditReport();
                                        if (res.success) {
                                            notify({ type: 'success', title: 'Auditoría Generada', message: `Reporte descargado. ${res.report?.totalUsers} usuarios, ${res.report?.totalTransactions} transacciones, ${res.report?.totalItems} items analizados.`, icon: 'download_done' });
                                        } else {
                                            notify({ type: 'error', title: 'Error', message: 'No se pudo generar la auditoría.', icon: 'error' });
                                        }
                                        setIsUpdating(null);
                                    }}
                                    disabled={isUpdating !== null}
                                    className="bg-white/10 hover:bg-white/20 px-6 py-3.5 rounded-2xl backdrop-blur-md text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50 text-white border border-white/15"
                                >
                                    {isUpdating === 'audit' ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">summarize</span>}
                                    Generar Auditoría
                                </button>
                                <button
                                    onClick={async () => {
                                        setIsUpdating('sync');
                                        const { runSecuritySync } = await import('../lib/admin');
                                        const res = await runSecuritySync();
                                        if (res.success) {
                                            const issueCount = res.issues?.length || 0;
                                            const fixedCount = res.fixed || 0;
                                            if (issueCount === 0) {
                                                notify({ type: 'success', title: 'Sistema Seguro', message: `${res.totalScanned} registros escaneados. Sin anomalías detectadas.`, icon: 'verified_user' });
                                            } else {
                                                notify({ type: 'warning', title: `${issueCount} Anomalía(s) Detectada(s)`, message: `${fixedCount} auto-corregidas. Detalles:\n${res.issues?.slice(0, 5).join('\n')}${issueCount > 5 ? `\n...y ${issueCount - 5} más` : ''}`, icon: 'shield' });
                                            }
                                            loadData(); // Refresh data after sync
                                        } else {
                                            notify({ type: 'error', title: 'Error', message: 'Fallo en la sincronización de seguridad.', icon: 'error' });
                                        }
                                        setIsUpdating(null);
                                    }}
                                    disabled={isUpdating !== null}
                                    className="bg-primary hover:bg-primary-vibrant text-on-primary px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isUpdating === 'sync' ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">security</span>}
                                    Sincronización de Seguridad
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Fiscal History Table (SUDO) */}
                    <div className="lg:col-span-4 bg-surface rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden mt-6">
                        <div className="p-8 border-b border-outline-variant/20 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">Libro Mayor de Ingresos (SUDO)</h3>
                                <p className="text-xs font-bold text-on-surface-variant mt-1">Historial de comisiones, penalizaciones y movimientos de plataforma.</p>
                            </div>
                            <div className="size-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20">
                                <span className="material-symbols-outlined font-black">receipt_long</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-container-low text-on-surface-variant text-[10px] font-black uppercase tracking-widest border-b border-outline-variant/30">
                                        <th className="px-8 py-6">Operación</th>
                                        <th className="px-8 py-6">Transacción</th>
                                        <th className="px-8 py-6">Monto</th>
                                        <th className="px-8 py-6">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/20">
                                    {(financialLogs || []).map((log: any) => (
                                        <tr key={log.id} className="hover:bg-primary/5 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <span className={`size-2.5 rounded-full ${log.type === 'platform_fee' ? 'bg-emerald-500 shadow-sm' : 'bg-amber-500 shadow-sm'}`}></span>
                                                    <p className="text-[10px] font-black text-on-surface uppercase tracking-wider">
                                                        {log.type === 'platform_fee' ? 'Comisión Venta' : 'Penalización Cancelación'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-mono text-[11px] text-on-surface-variant">#{log.transactionId.slice(0, 8).toUpperCase()}</td>
                                            <td className="px-8 py-6 font-black text-on-surface text-sm font-display">${log.amount?.toLocaleString()}</td>
                                            <td className="px-8 py-6 text-[11px] font-bold text-on-surface-variant">
                                                {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('es-AR') : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!financialLogs || financialLogs.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center text-xs font-bold text-outline-variant uppercase tracking-widest">
                                                No hay registros fiscales disponibles aún.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Withdrawal Requests Table (SUDO) */}
                    <div className="lg:col-span-4 bg-surface rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden mt-6">
                        <div className="p-8 border-b border-outline-variant/20 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">Solicitudes de Retiro</h3>
                                <p className="text-xs font-bold text-on-surface-variant mt-1">Órdenes de transferencia bancaria pendientes de procesamiento.</p>
                            </div>
                            <div className="size-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-500/20">
                                <span className="material-symbols-outlined font-black">account_balance</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-container-low text-on-surface-variant text-[10px] font-black uppercase tracking-widest border-b border-outline-variant/30">
                                        <th className="px-8 py-6">Usuario</th>
                                        <th className="px-8 py-6">Monto</th>
                                        <th className="px-8 py-6">Datos Bancarios</th>
                                        <th className="px-8 py-6">Estado</th>
                                        <th className="px-8 py-6">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/20">
                                    {(withdrawals || []).map((req: any) => (
                                        <tr key={req.id} className="hover:bg-primary/5 transition-colors">
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-mono font-black text-on-surface">{req.uid.slice(0, 8).toUpperCase()}</p>
                                            </td>
                                            <td className="px-8 py-6 font-black text-on-surface text-sm font-display">${req.amount.toLocaleString()}</td>
                                            <td className="px-8 py-6">
                                                <div className="text-[11px] font-bold text-on-surface-variant leading-relaxed">
                                                    <span className="text-on-surface font-black uppercase">{req.bankDetails?.bankName}</span> <br />
                                                    <span className="font-mono text-[10px]">CBU: {req.bankDetails?.cbu}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${req.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                                                    req.status === 'rejected' ? 'bg-error/10 text-error border border-error/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse'
                                                    }`}>
                                                    {req.status === 'completed' ? 'Completado' : req.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                {req.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                const confirm1 = await showConfirm('Aprobar Transferencia', '¿Confirmar que la transferencia fue realizada?', 'Confirmar', 'Cancelar', 'account_balance');
                                                                if (confirm1) {
                                                                    try {
                                                                        const { auth } = await import('../lib/firebase');
                                                                        const token = await auth.currentUser?.getIdToken();
                                                                        const response = await fetch('/api/process-payout', {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                            body: JSON.stringify({ withdrawalId: req.id })
                                                                        });
                                                                        const data = await response.json();
                                                                        if (data.success) {
                                                                            await showAlert('Pago Procesado', data.message + ' (Ref: ' + data.bankTransactionId + ')', 'check_circle');
                                                                            loadData();
                                                                        } else {
                                                                            await showAlert('Error', 'Error: ' + data.error, 'error');
                                                                        }
                                                                    } catch (e: any) {
                                                                        await showAlert('Error', 'Error conectando con la API de pagos.', 'error');
                                                                    }
                                                                }
                                                            }}
                                                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-sm"
                                                        >
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                const confirm1 = await showConfirm('Rechazar Retiro', '¿Rechazar solicitud de retiro?', 'Rechazar', 'Cancelar', 'cancel');
                                                                if (confirm1) {
                                                                    const { updateWithdrawalStatus } = await import('../lib/admin');
                                                                    const res = await updateWithdrawalStatus(req.id, 'rejected');
                                                                    if (res.success) loadData();
                                                                }
                                                            }}
                                                            className="px-4 py-2 bg-error/10 text-error rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-error hover:text-white transition-all shadow-sm border border-error/20"
                                                        >
                                                            Rechazar
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!withdrawals || withdrawals.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-xs font-bold text-outline-variant uppercase tracking-widest">
                                                No hay solicitudes de retiro pendientes.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="lg:col-span-4 bg-error/5 rounded-3xl border border-error/20 p-8 mt-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="size-12 bg-error text-white rounded-2xl flex items-center justify-center shadow-md">
                                <span className="material-symbols-outlined font-black">warning</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-error uppercase tracking-tight font-display">Zona de Peligro</h3>
                                <p className="text-xs font-bold text-error/80">Acciones destructivas e irreversibles.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-surface p-6 rounded-2xl border border-error/20 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-black text-on-surface">Eliminar Todos los Productos</p>
                                    <p className="text-[10px] font-bold text-on-surface-variant max-w-[280px] mt-0.5">Borra permanentemente todos los ítems de la base de datos.</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        const confirmKey = prompt('ESTO ELIMINARÁ TODO EL MARKETPLACE. Escribe "BORRAR TODO" para confirmar:');
                                        if (confirmKey === 'BORRAR TODO') {
                                            const { clearAllItems } = await import('../lib/admin');
                                            const res = await clearAllItems();
                                            if (res.success) {
                                                await showAlert('Éxito', `Se eliminaron ${res.count} productos.`, 'check_circle');
                                                loadData();
                                            } else {
                                                await showAlert('Error', 'Error: ' + res.error, 'error');
                                            }
                                        }
                                    }}
                                    className="px-5 py-2.5 bg-error text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-error/90 transition-all shadow-sm shrink-0"
                                >
                                    Ejecutar Limpieza
                                </button>
                            </div>

                            <div className="bg-surface p-6 rounded-2xl border border-error/20 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-black text-on-surface">Eliminar Historial Financiero</p>
                                    <p className="text-[10px] font-bold text-on-surface-variant max-w-[280px] mt-0.5">Borra transacciones, retiros y registros fiscales.</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        const confirmKey = prompt('ESTO ELIMINARÁ TODO EL HISTORIAL FINANCIERO. Escribe "BORRAR HISTORIAL" para confirmar:');
                                        if (confirmKey === 'BORRAR HISTORIAL') {
                                            const { clearAllTransactionsHistory } = await import('../lib/admin');
                                            const res = await clearAllTransactionsHistory();
                                            if (res.success) {
                                                await showAlert('Éxito', `Se eliminaron ${res.count} registros.`, 'check_circle');
                                                loadData();
                                            } else {
                                                await showAlert('Error', 'Error: ' + res.error, 'error');
                                            }
                                        }
                                    }}
                                    className="px-5 py-2.5 bg-error text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-error/90 transition-all shadow-sm shrink-0"
                                >
                                    Borrar Historial
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Detail Inspection Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-on-surface/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
                    <div className="bg-surface w-full max-w-5xl rounded-3xl shadow-2xl border border-outline-variant/30 relative overflow-hidden max-h-[88vh] flex flex-col animate-in zoom-in-95 duration-200">
                        <button onClick={() => setSelectedUser(null)} className="absolute top-5 right-5 size-9 flex items-center justify-center bg-surface-container-low hover:bg-surface-container-high rounded-xl transition-all z-20 shadow-sm border border-outline-variant/30 text-on-surface">
                            <span className="material-symbols-outlined font-black text-sm">close</span>
                        </button>

                        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
                            {/* Lateral Node Info */}
                            <div className="lg:col-span-4 bg-surface-container-low p-6 md:p-8 border-r border-outline-variant/30 flex flex-col justify-between">
                                <div>
                                    <div className="text-center mb-6">
                                        <img src={selectedUser.avatar} alt="" className="size-24 rounded-2xl mx-auto mb-4 shadow-md border-2 border-surface object-cover" />
                                        <h3 className="text-lg font-black text-on-surface mb-1 tracking-tight font-display">{selectedUser.displayName}</h3>
                                        <p className="text-xs font-bold text-on-surface-variant mb-3 truncate">{selectedUser.email}</p>
                                        <div className="inline-flex items-center gap-1.5 bg-surface px-3 py-1 rounded-lg border border-outline-variant/30 text-[9px] font-mono font-bold text-on-surface-variant shadow-2xs">
                                            UID: {selectedUser.uid.slice(0, 12)}...
                                        </div>
                                    </div>

                                    {/* Bank Details View */}
                                    {selectedUser.bankDetails && (
                                        <div className="bg-surface p-5 rounded-2xl border border-outline-variant/30 shadow-2xs mt-4">
                                            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-4">Datos de Pago (Vendedor)</p>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-[9px] text-outline-variant font-bold uppercase mb-0.5">Banco</p>
                                                        <p className="text-xs font-black text-on-surface truncate">{selectedUser.bankDetails.bankName || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-outline-variant font-bold uppercase mb-0.5">Titular</p>
                                                        <p className="text-xs font-bold text-on-surface truncate">{selectedUser.bankDetails.holderName || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-outline-variant font-bold uppercase mb-0.5">CBU / CVU</p>
                                                    <p className="text-[10px] font-mono font-bold text-on-surface bg-surface-container-low p-2.5 rounded-xl block text-center tracking-wider border border-outline-variant/20">{selectedUser.bankDetails.cbu || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-outline-variant font-bold uppercase mb-0.5">Alias</p>
                                                    <p className="text-xs font-black text-primary uppercase bg-primary/10 p-2 rounded-xl text-center border border-primary/20">{selectedUser.bankDetails.alias || 'N/A'}</p>
                                                </div>
                                                <div className="pt-2">
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(
                                                                `Banco: ${selectedUser.bankDetails?.bankName}\nCBU: ${selectedUser.bankDetails?.cbu}\nAlias: ${selectedUser.bankDetails?.alias}\nTitular: ${selectedUser.bankDetails?.holderName}`
                                                            );
                                                            notify({ type: 'success', title: 'Copiado', message: 'Datos bancarios copiados al portapapeles.', icon: 'content_copy' });
                                                        }}
                                                        className="w-full py-2.5 rounded-xl bg-primary text-on-primary text-[9px] font-black uppercase tracking-widest hover:bg-primary-vibrant transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">content_copy</span>
                                                        Copiar Datos
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 flex flex-col gap-2.5 mt-6 border-t border-outline-variant/20">
                                    <button
                                        onClick={() => handleSuspendUser(selectedUser.uid, !selectedUser.isSuspended)}
                                        className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-2xs active:scale-95 border ${selectedUser.isSuspended
                                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500 hover:text-white'
                                            }`}
                                    >
                                        {selectedUser.isSuspended ? 'Reactivar Usuario' : 'Suspender Usuario'}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(selectedUser.uid)}
                                        className="w-full bg-error/10 text-error hover:bg-error hover:text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-2xs active:scale-95 border border-error/20"
                                    >
                                        Terminar Nodo
                                    </button>
                                </div>
                            </div>

                            {/* Verification Evidence Inspection */}
                            <div className="lg:col-span-8 p-6 md:p-8 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="size-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-primary/20">
                                            <span className="material-symbols-outlined text-xl font-black">verified</span>
                                        </div>
                                        <h4 className="text-lg font-black text-on-surface uppercase tracking-tight font-display">Documentación de Evidencia</h4>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                        {[
                                            { key: 'dniFront', label: 'Frente del Documento' },
                                            { key: 'dniBack', label: 'Dorso del Documento' },
                                            { key: 'selfie', label: 'Selfie Biométrica' },
                                            { key: 'addressProof', label: 'Verificación de Residencia' }
                                        ].map(img => (
                                            <div key={img.key} className="group">
                                                <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider mb-1.5 ml-0.5 truncate">{img.label}</p>
                                                <div className="aspect-video bg-surface-container-low rounded-xl overflow-hidden border border-dashed border-outline-variant/40 group-hover:border-primary flex items-center justify-center transition-all bg-cover bg-center relative cursor-zoom-in"
                                                    onClick={() => selectedUser.verificationEvidence?.[img.key as keyof typeof selectedUser.verificationEvidence] && setZoomedImage(selectedUser.verificationEvidence[img.key as keyof typeof selectedUser.verificationEvidence] as string)}
                                                    style={{ backgroundImage: selectedUser.verificationEvidence?.[img.key as keyof typeof selectedUser.verificationEvidence] ? `none` : `none` }}>
                                                    {selectedUser.verificationEvidence?.[img.key as keyof typeof selectedUser.verificationEvidence] ? (
                                                        <img
                                                            src={selectedUser.verificationEvidence[img.key as keyof typeof selectedUser.verificationEvidence] as string}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            alt={img.label}
                                                        />
                                                    ) : (
                                                        <div className="text-center opacity-40">
                                                            <span className="material-symbols-outlined text-3xl mb-1">image_not_supported</span>
                                                            <p className="text-[8px] font-black uppercase tracking-widest text-outline-variant">Sin evidencia</p>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-on-surface/0 group-hover:bg-on-surface/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <span className="material-symbols-outlined text-surface text-2xl font-black">zoom_in</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedUser.verificationEvidence?.submittedAt && (
                                        <div className="mt-4 p-5 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Estado de Verificación</p>
                                                    <p className={`text-xs font-black mt-0.5 ${selectedUser.verificationEvidence.status === 'approved' ? 'text-emerald-600' :
                                                        selectedUser.verificationEvidence.status === 'rejected' ? 'text-error' :
                                                            selectedUser.verificationEvidence.status === 'pending' ? 'text-amber-600' : 'text-on-surface-variant'
                                                        }`}>
                                                        {selectedUser.verificationEvidence.status === 'approved' ? 'DOCUMENTACIÓN APROBADA' :
                                                            selectedUser.verificationEvidence.status === 'rejected' ? 'DOCUMENTACIÓN RECHAZADA' :
                                                                selectedUser.verificationEvidence.status === 'pending' ? 'PENDIENTE DE REVISIÓN' : 'SIN ENVÍOS'
                                                        }
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest text-right">Enviado el</p>
                                                    <p className="text-[10px] font-bold text-on-surface mt-0.5">
                                                        {selectedUser.verificationEvidence.submittedAt?.toDate ? selectedUser.verificationEvidence.submittedAt.toDate().toLocaleString() : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            {showRejectionInput ? (
                                                <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                                                    <textarea
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        placeholder="Motivo del rechazo (ej: Foto borrosa, DNI vencido...)"
                                                        className="w-full bg-surface border border-error/30 rounded-xl p-3 text-xs font-bold text-on-surface outline-none focus:ring-2 focus:ring-error/20"
                                                        rows={2}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setShowRejectionInput(false)}
                                                            className="flex-1 py-2.5 bg-surface-container-high text-on-surface-variant rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-outline-variant/20 transition-all"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (!rejectionReason) return notify({ type: 'warning', title: 'Atención', message: 'Debes ingresar un motivo.', icon: 'warning' });
                                                                setIsUpdating('kyc');
                                                                const res = await reviewUserEvidence(selectedUser.uid, 'rejected', rejectionReason);
                                                                if (res.success) {
                                                                    notify({ type: 'success', title: 'Actualizado', message: 'Documentación rechazada.', icon: 'close' });
                                                                    setSelectedUser({ ...selectedUser, verificationEvidence: { ...selectedUser.verificationEvidence!, status: 'rejected', rejectionReason } });
                                                                    setShowRejectionInput(false);
                                                                    setRejectionReason('');
                                                                    loadData();
                                                                }
                                                                setIsUpdating(null);
                                                            }}
                                                            className="flex-1 py-2.5 bg-error text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm hover:bg-error/90 transition-all"
                                                        >
                                                            Confirmar Rechazo
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setShowRejectionInput(true)}
                                                        className="flex-1 py-3 bg-error/10 text-error border border-error/20 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-error hover:text-white transition-all shadow-2xs"
                                                    >
                                                        Rechazar Evidencia
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            setIsUpdating('kyc');
                                                            const res = await reviewUserEvidence(selectedUser.uid, 'approved');
                                                            if (res.success) {
                                                                notify({ type: 'success', title: 'Éxito', message: 'Usuario verificado correctamente.', icon: 'verified' });
                                                                setSelectedUser({
                                                                    ...selectedUser,
                                                                    verificationEvidence: { ...selectedUser.verificationEvidence!, status: 'approved' },
                                                                    verificationBadges: { ...selectedUser.verificationBadges, identityVerified: true }
                                                                });
                                                                loadData();
                                                            }
                                                            setIsUpdating(null);
                                                        }}
                                                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm hover:bg-emerald-500 transition-all"
                                                    >
                                                        Aprobar Identidad
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2.5 pt-6 border-t border-outline-variant/20 mt-6">
                                    {[
                                        { key: 'identityVerified' as const, label: 'Identidad' },
                                        { key: 'addressVerified' as const, label: 'Dirección' },
                                        { key: 'phoneVerified' as const, label: 'Teléfono' }
                                    ].map(badge => (
                                        <button
                                            key={badge.key}
                                            onClick={() => handleToggleBadge(selectedUser.uid, badge.key, selectedUser.verificationBadges?.[badge.key] || false)}
                                            className={`flex-1 px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-1.5 border ${selectedUser.verificationBadges?.[badge.key]
                                                ? 'bg-primary text-on-primary border-primary shadow-sm hover:opacity-90'
                                                : 'bg-surface text-on-surface-variant border-outline-variant/30 hover:border-primary/50'}`}
                                        >
                                            <span className="material-symbols-outlined text-sm">
                                                {selectedUser.verificationBadges?.[badge.key] ? 'check_circle' : 'pending_actions'}
                                            </span>
                                            {badge.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dispute Inspection Modal */}
            {selectedDispute && (
                <div className="fixed inset-0 bg-on-surface/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
                    <div className="bg-surface w-full max-w-5xl rounded-3xl shadow-2xl border border-outline-variant/30 relative overflow-hidden max-h-[88vh] flex flex-col animate-in zoom-in-95 duration-200">
                        <button onClick={() => setSelectedDispute(null)} className="absolute top-5 right-5 size-9 flex items-center justify-center bg-surface-container-low hover:bg-surface-container-high rounded-xl transition-all z-20 shadow-sm border border-outline-variant/30 text-on-surface">
                            <span className="material-symbols-outlined font-black text-sm">close</span>
                        </button>

                        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
                            {/* Chat History */}
                            <div className="lg:col-span-5 bg-surface-container-low p-6 md:p-8 border-r border-outline-variant/30 flex flex-col h-full">
                                <div className="mb-6 p-5 bg-error/10 border border-error/20 rounded-2xl text-on-surface">
                                    <p className="text-[9px] font-black uppercase tracking-wider text-error mb-1">Motivo del Reclamo</p>
                                    <p className="text-xs font-bold text-on-surface italic">"{selectedDispute.disputeReason || 'No especificado por el usuario'}"</p>
                                </div>
                                <h3 className="text-base font-black text-on-surface uppercase tracking-tight mb-4 font-display">Auditoría de Chat</h3>
                                <div className="space-y-3 flex-1 overflow-y-auto pr-1 pb-4">
                                    {disputeMessages.map((msg, idx) => (
                                        <div key={idx} className={`p-4 rounded-2xl ${msg.role === 'sistema' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 mx-auto w-[90%] text-center' : 'bg-surface border border-outline-variant/30 shadow-2xs'}`}>
                                            <p className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant mb-1">{msg.role} - {msg.createdAt?.toDate()?.toLocaleTimeString()}</p>
                                            <p className="text-xs font-bold text-on-surface leading-relaxed">{msg.text}</p>
                                        </div>
                                    ))}
                                    {disputeMessages.length === 0 && <p className="text-center text-on-surface-variant py-12 uppercase font-black text-[9px]">Sin registros de chat</p>}
                                </div>
                            </div>

                            {/* Evidence Gallery */}
                            <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-base font-black text-on-surface uppercase tracking-tight mb-4 font-display">Evidencia de Transacción</h3>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        {disputeEvidence.map((ev, idx) => (
                                            <div key={idx} className="group relative cursor-zoom-in" onClick={() => setZoomedImage(ev.url)}>
                                                <div className="aspect-video w-full rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container-low shadow-2xs transition-all group-hover:shadow-md group-hover:border-primary">
                                                    <img src={ev.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                </div>
                                                <div className="absolute inset-0 bg-on-surface/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center p-4 text-center backdrop-blur-[2px]">
                                                    <span className="material-symbols-outlined text-surface text-2xl mb-1">zoom_in</span>
                                                    <p className="text-surface text-[9px] font-black uppercase tracking-wider">{ev.type}</p>
                                                    <p className="text-surface/80 text-[8px] font-bold uppercase mt-0.5 line-clamp-2">{ev.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {disputeEvidence.length === 0 && (
                                            <div className="col-span-2 py-20 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/40 flex flex-col items-center justify-center text-on-surface-variant">
                                                <span className="material-symbols-outlined text-4xl mb-2">no_photography</span>
                                                <p className="text-[9px] font-black uppercase tracking-wider">Sin evidencia fotográfica</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-error/5 rounded-2xl p-5 border border-error/20 flex flex-col gap-4 mt-4">
                                    <div>
                                        <h4 className="text-sm font-black text-error uppercase font-display">Resolución del Juez</h4>
                                        <p className="text-[11px] font-bold text-on-surface-variant mt-0.5">Como administrador, tu fallo es final y moverá los fondos de la cuenta de garantía.</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button onClick={() => handleResolveDispute(selectedDispute.id, 'refund')} className="flex-1 bg-surface text-error py-3 rounded-xl font-black text-[9px] uppercase tracking-wider border border-error/30 shadow-2xs hover:bg-error hover:text-white transition-all active:scale-95">Fallar a favor (Comprador - Refund)</button>
                                        <button onClick={() => handleResolveDispute(selectedDispute.id, 'release')} className="flex-1 bg-primary text-on-primary py-3 rounded-xl font-black text-[9px] uppercase tracking-wider shadow-sm hover:opacity-90 transition-all active:scale-95">Fallar a favor (Vendedor - Liberar)</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Image Zoom Modal */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 bg-on-surface/80 backdrop-blur-md z-[300] flex items-center justify-center p-6 lg:p-12 animate-in fade-in duration-200"
                    onClick={() => setZoomedImage(null)}
                >
                    <button className="absolute top-6 right-6 size-10 flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-on-surface transition-all shadow-md">
                        <span className="material-symbols-outlined text-xl font-black">close</span>
                    </button>
                    <img
                        src={zoomedImage}
                        className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain animate-in zoom-in-95 duration-300"
                        alt="Zoomed Evidence"
                    />
                </div>
            )}
        </div>
    );
}
