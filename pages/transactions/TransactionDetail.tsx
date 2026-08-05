import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../lib/auth';
import { getTransaction, TransactionData, releaseFunds } from '../../lib/transactions';
import { useNotification } from '../../context/NotificationContext';

const TransactionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { notify } = useNotification();

    const [transaction, setTransaction] = useState<TransactionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [scanMode, setScanMode] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);

    useEffect(() => {
        if (id) fetchTransaction();
    }, [id]);

    const fetchTransaction = async () => {
        if (!id) return;
        const data = await getTransaction(id);
        setTransaction(data);
        setLoading(false);
    };

    const handleRelease = async () => {
        if (!id || !manualCode) return;

        const result = await releaseFunds(id, manualCode.toUpperCase());
        if (result.success) {
            notify({ type: 'success', title: 'Fondos Liberados', message: 'El pago ha sido transferido exitosamente al vendedor.', icon: 'check_circle' });
            fetchTransaction();
            setScanMode(false);
        } else {
            notify({ type: 'error', title: 'Código Inválido', message: result.error as string || 'La clave de seguridad proporcionada es incorrecta.', icon: 'error' });
        }
    };

    const handleGenerateLabel = async () => {
        if (!id || !transaction) return;
        setIsGeneratingLabel(true);
        try {
            const { generateShippingLabel } = await import('../../lib/shipping');
            const { trackingNumber, labelUrl } = await generateShippingLabel(id, transaction.sellerId, transaction.buyerId);
            
            // Update Firestore Document directly for mock API simplicity
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('../../lib/firebase');
            await updateDoc(doc(db, 'transactions', id), {
                trackingNumber,
                labelUrl,
                status: 'SHIPPED',
                updatedAt: new Date()
            });

            notify({ type: 'success', title: 'Etiqueta Generada', message: 'La etiqueta está lista para imprimir.', icon: 'local_shipping' });
            fetchTransaction();
        } catch (error) {
            notify({ type: 'error', title: 'Error', message: 'No se pudo generar la etiqueta de envío.', icon: 'error' });
        }
        setIsGeneratingLabel(false);
    };

    if (loading) return <div className="p-6 md:p-20 text-center"><div className="size-12 border-4 border-primary-vibrant border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Sincronizando Libro Contable...</p></div>;
    if (!transaction || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-light-50">
                <div className="text-center">
                    <h3 className="text-xl font-black text-dark-800 uppercase">Transacción No Encontrada</h3>
                    <button onClick={() => navigate('/')} className="btn-primary mt-6">Volver al Inicio</button>
                </div>
            </div>
        );
    }

    const isBuyer = user.uid === transaction.buyerId;
    const isSeller = user.uid === transaction.sellerId;
    const isCompleted = transaction.status === 'COMPLETED';

    return (
        <main className="max-w-3xl mx-auto px-6 py-16 min-h-screen">
            <div className="bg-white rounded-[40px] border border-light-200 shadow-premium overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700">

                {/* Header */}
                <div className={`p-4 md:p-10 md:p-14 text-white text-center relative overflow-hidden transition-colors duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-dark-800'}`}>
                    <div className="absolute top-0 right-0 size-48 bg-white/10 blur-3xl -mr-10 -mt-10"></div>
                    <h1 className="text-3xl font-black uppercase tracking-tight mb-3 relative z-10">
                        {isCompleted ? 'Trato Finalizado' : 'Protocolo de Entrega'}
                    </h1>
                    <p className="opacity-70 text-[10px] font-black uppercase tracking-[0.2em] relative z-10">
                        {isCompleted
                            ? 'Los fondos han sido acreditados al vendedor.'
                            : isBuyer ? 'Presenta esta clave de autenticación al vendedor.' : 'Escanea la clave del comprador para desbloquear los fondos.'}
                    </p>
                </div>

                <div className="p-4 md:p-10 md:p-16 flex flex-col items-center gap-6 md:gap-12">

                    {isBuyer && !isCompleted && (
                        <div className="flex flex-col items-center gap-8 animate-in zoom-in duration-700">
                            <div className="bg-white p-6 rounded-[40px] border-4 border-dashed border-primary-50 shadow-inner group">
                                <div className="transition-transform duration-500 group-hover:scale-105">
                                    <QRCodeSVG value={transaction.qrCode || ''} size={220} fgColor="#2222FF" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-3">Tu Clave de Seguridad</p>
                                <div className="bg-light-50 px-8 py-4 rounded-2xl border border-light-200">
                                    <p className="text-4xl font-black text-dark-800 tracking-[0.3em] font-mono">{transaction.qrCode}</p>
                                </div>
                            </div>
                            <div className="bg-primary-50 p-6 rounded-3xl text-center max-w-sm border border-primary-100/50">
                                <p className="text-[10px] text-primary-900 font-bold uppercase leading-relaxed tracking-wider">
                                    ⚠️ Solo revela este código una vez que hayas inspeccionado y recibido el activo. La validación es irreversible.
                                </p>
                            </div>
                        </div>
                    )}

                    {isSeller && !isCompleted && (
                        <div className="w-full max-w-sm space-y-10">
                            {!scanMode ? (
                                <button
                                    onClick={() => setScanMode(true)}
                                    className="w-full py-20 bg-light-50 border-4 border-dashed border-light-200 rounded-[40px] flex flex-col items-center justify-center gap-6 hover:bg-primary-50 hover:border-primary-100 transition-all group shadow-sm active:scale-95"
                                >
                                    <div className="size-20 bg-white rounded-[32px] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-4xl text-primary-vibrant font-black">qr_code_scanner</span>
                                    </div>
                                    <span className="font-black text-dark-800 uppercase tracking-[0.2em] text-xs">Iniciar Escáner</span>
                                </button>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 ml-1">Entrada de Autorización Manual</label>
                                    <div className="flex flex-col gap-4">
                                        <input
                                            type="text"
                                            value={manualCode}
                                            onChange={(e) => setManualCode(e.target.value)}
                                            placeholder="XXXX XXXX"
                                            className="w-full p-6 bg-light-50 border-2 border-transparent focus:border-primary-100 rounded-2xl font-mono text-center text-3xl font-black uppercase tracking-[0.4em] outline-none transition-all text-primary-vibrant"
                                            maxLength={8}
                                        />
                                        <button
                                            onClick={handleRelease}
                                            className="w-full bg-primary-vibrant text-white py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-500/20 active:scale-95 transition-all"
                                        >
                                            Autorizar Liquidación
                                        </button>
                                    </div>
                                    <button onClick={() => setScanMode(false)} className="text-[10px] font-black text-gray-300 uppercase tracking-widest w-full text-center hover:text-dark-800 transition-colors">Abortar Protocolo</button>
                                </div>
                            )}
                            <p className="text-center text-[10px] font-bold text-gray-300 uppercase leading-relaxed tracking-widest px-4">
                                Validar la clave del comprador confirma la entrega del activo y activa la acreditación inmediata de los fondos.
                            </p>
                        </div>
                    )}

                    {/* VENDEDOR - ENVIO POR CORREO */}
                    {isSeller && !isCompleted && transaction?.deliveryMethod === 'correo_argentino' && transaction?.status === 'PAID_HELD' && (
                        <div className="w-full max-w-sm space-y-10 animate-in fade-in slide-in-from-bottom-4">
                             <div className="bg-primary/5 p-8 rounded-[32px] border border-primary/20 text-center">
                                 <span className="material-symbols-outlined text-4xl text-primary mb-4 font-black">local_shipping</span>
                                 <h3 className="text-sm font-black uppercase text-primary tracking-widest mb-2">Envío Nacional</h3>
                                 <p className="text-[10px] font-bold text-on-surface-variant mb-6">Debes imprimir la etiqueta y despachar el paquete en una sucursal de Correo Argentino.</p>
                                 <button
                                     onClick={handleGenerateLabel}
                                     disabled={isGeneratingLabel}
                                     className="w-full bg-primary text-on-primary py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                                 >
                                     {isGeneratingLabel ? 'Generando...' : 'Generar Etiqueta'}
                                 </button>
                             </div>
                        </div>
                    )}

                    {isSeller && transaction?.trackingNumber && (
                        <div className="w-full max-w-sm bg-surface-container-low p-6 rounded-[24px] border border-outline-variant/50 text-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block mb-1">Tracking Number</span>
                            <span className="text-lg font-mono font-black text-on-surface">{transaction.trackingNumber}</span>
                            {transaction.status === 'SHIPPED' && (
                                <p className="text-[10px] font-bold text-primary mt-3 uppercase tracking-widest">El paquete está en camino.</p>
                            )}
                        </div>
                    )}

                    {isCompleted && (
                        <div className="text-center space-y-10 animate-in zoom-in duration-700">
                            <div className="size-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto shadow-sm border border-emerald-100">
                                <span className="material-symbols-outlined text-5xl font-black">verified</span>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-dark-800 uppercase tracking-tight mb-3">Protocolo Exitoso</h3>
                                <p className="text-sm font-bold text-gray-400">El intercambio seguro de activos ha sido finalizado.</p>
                            </div>
                            <button onClick={() => navigate('/')} className="px-4 md:px-12 py-4 border-2 border-light-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-dark-800 hover:bg-light-50 transition-all active:scale-95">
                                Volver al Centro Central
                            </button>
                        </div>
                    )}

                    {!isCompleted && (
                        <div className="flex items-center gap-3 opacity-20 grayscale scale-75">
                            <span className="material-symbols-outlined text-lg">shield_lock</span>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em]">Prueba de Garantía de Seguridad</p>
                        </div>
                    )}

                </div>
            </div>
        </main>
    );
};

export default TransactionDetail;
