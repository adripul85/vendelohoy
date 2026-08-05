import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PaymentFailure() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const paymentId = searchParams.get('payment_id');
    const statusDetail = searchParams.get('status_detail');

    const getErrorMessage = () => {
        switch (statusDetail) {
            case 'cc_rejected_insufficient_amount':
                return 'Fondos insuficientes en tu tarjeta';
            case 'cc_rejected_bad_filled_security_code':
                return 'Código de seguridad inválido (CVC)';
            case 'cc_rejected_bad_filled_date':
                return 'Fecha de expiración inválida';
            case 'cc_rejected_bad_filled_other':
                return 'Verifica la información de tu tarjeta';
            case 'cc_rejected_call_for_authorize':
                return 'Autorización de pago requerida por el banco';
            case 'cc_rejected_card_disabled':
                return 'Esta tarjeta ha sido inhabilitada';
            case 'cc_rejected_duplicated_payment':
                return 'Transacción duplicada detectada';
            case 'cc_rejected_high_risk':
                return 'Rechazado por protocolo de riesgo';
            default:
                return 'La transacción no pudo ser completada en este momento.';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-light-50 p-6">
            <div className="max-w-md w-full bg-white rounded-[48px] shadow-premium border border-light-200 p-4 md:p-12 text-center relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-400"></div>

                {/* Error Icon */}
                <div className="size-28 bg-red-50 text-red-500 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-sm border border-red-100">
                    <span className="material-symbols-outlined text-6xl font-black">error</span>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-black text-dark-800 mb-4 uppercase tracking-tight">
                    Pago Rechazado
                </h1>

                {/* Error Message */}
                <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase tracking-wider mb-10 px-4">
                    {getErrorMessage()}
                </p>

                {/* Payment ID */}
                {paymentId && (
                    <div className="bg-light-50 p-6 rounded-3xl mb-10 border border-light-200 group">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 mb-3 block">
                            Referencia de Intento
                        </p>
                        <p className="text-xs font-black font-mono text-dark-800 group-hover:text-red-500 transition-colors">
                            {paymentId}
                        </p>
                    </div>
                )}

                {/* Help Box */}
                <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100/50 mb-10 text-left">
                    <div className="flex items-start gap-4">
                        <span className="material-symbols-outlined text-red-500 font-black">verified</span>
                        <div>
                            <p className="text-[10px] font-black text-red-900 mb-3 uppercase tracking-widest">Resoluciones</p>
                            <ul className="text-[10px] text-red-800 space-y-2 font-bold uppercase tracking-tight opacity-70">
                                <li>• Verificar credenciales de facturación</li>
                                <li>• Comprobar disponibilidad de saldo</li>
                                <li>• Seleccionar proveedor alternativo</li>
                                <li>• Contactar al banco emisor</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full bg-dark-800 text-white py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl shadow-dark-800/10 active:scale-95"
                    >
                        Reintentar
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full border-2 border-light-200 text-dark-800 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-light-50 transition-all active:scale-95"
                    >
                        Volver al Mercado
                    </button>
                </div>

                <p className="mt-12 text-[8px] font-black text-gray-300 uppercase tracking-[0.5em]">Vendelo Hoy! 🎯 SecLayer V4.5</p>
            </div>
        </div>
    );
}
