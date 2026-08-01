import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { updateTransactionStatus } from '../../lib/transactions';

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [processing, setProcessing] = useState(true);

    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');
    const externalReference = searchParams.get('external_reference');

    useEffect(() => {
        async function updateTransaction() {
            if (!externalReference) {
                setProcessing(false);
                return;
            }

            if (status === 'approved') {
                await updateTransactionStatus(externalReference, 'PAID_HELD');
                // Notify seller about the sale
                try {
                    const { getTransaction } = await import('../../lib/transactions');
                    const txData = await getTransaction(externalReference);
                    if (txData?.sellerId) {
                        const { sendNotification } = await import('../../lib/interactions');
                        await sendNotification(txData.sellerId, {
                            title: '🎉 ¡Nueva Venta!',
                            message: `Tu producto "${txData.itemTitle || 'Producto'}" se vendió por $${txData.amount?.toLocaleString() || '0'}. Los fondos están en garantía hasta que confirmes la entrega.`,
                            type: 'success',
                            link: `/dashboard`
                        });
                    }
                } catch (e) { console.error('Error notifying seller:', e); }
            } else if (status === 'pending') {
                await updateTransactionStatus(externalReference, 'PENDING_PAYMENT');
            }

            setProcessing(false);
        }

        updateTransaction();
    }, [externalReference, status]);

    if (processing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-light-50">
                <div className="text-center">
                    <div className="size-20 border-4 border-primary-vibrant border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-xl shadow-primary-500/10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Verificando Liquidación...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-light-50 p-6">
            <div className="max-w-md w-full bg-white rounded-[48px] shadow-premium border border-light-200 p-12 text-center relative overflow-hidden animate-in zoom-in duration-700">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-red-400"></div>

                {/* Success Icon */}
                <div className="size-28 bg-emerald-50 text-emerald-500 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-sm border border-emerald-100 animate-bounce">
                    <span className="material-symbols-outlined text-6xl font-black">verified</span>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-black text-dark-800 mb-4 uppercase tracking-tight">
                    {status === 'approved' ? '¡Pago Exitoso!' : 'Pago Pendiente'}
                </h1>

                {/* Message */}
                <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase tracking-wider mb-10 px-4">
                    {status === 'approved'
                        ? 'Tu dinero ya está seguro. Lo mantendremos protegido hasta que confirmes que recibiste el producto.'
                        : 'Tu pago se está procesando. Te avisaremos apenas se confirme.'}
                </p>

                {/* Payment Details */}
                {paymentId && (
                    <div className="bg-light-50 p-6 rounded-3xl mb-10 border border-light-200 group">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 mb-3 block">
                            Código de Referencia (Mercado Pago)
                        </p>
                        <p className="text-xs font-black font-mono text-dark-800 group-hover:text-primary-vibrant transition-colors">
                            {paymentId}
                        </p>
                    </div>
                )}

                {/* Trust Badge */}
                <div className="bg-primary-50 p-5 rounded-2xl border border-primary-100 mb-10 flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-xl text-primary-vibrant font-black">verified_user</span>
                    <span className="text-[9px] font-black text-primary-900 uppercase tracking-widest">Compra 100% Protegida</span>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/dashboard?tab=purchases')}
                        className="w-full bg-dark-800 text-white py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl shadow-dark-800/10 active:scale-95"
                    >
                        Ir a Mis Compras
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full border-2 border-light-200 text-dark-800 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-light-50 transition-all active:scale-95"
                    >
                        Volver al Inicio
                    </button>
                </div>

                <p className="mt-12 text-[8px] font-black text-gray-300 uppercase tracking-[0.5em]">Vendelo Hoy! 🎯</p>
            </div>
        </div>
    );
}
