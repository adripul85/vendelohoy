
import React from 'react';
import { UserRole } from '../../hooks/useEscrow';
import { TransactionStatus } from '../../lib/transactions';

interface Props {
    status: TransactionStatus;
    currentUserRole: UserRole;
    price: number;
    onUpdateStatus: (s: TransactionStatus, msg?: string) => void;
    onReleaseFunds: () => void;
    onRequestMediation: () => void;
    onCancel: () => void;
    onAcceptReturn?: () => void;
    onConfirmReturnReceipt?: () => void;
    isAmicableReturnAccepted?: boolean;
}


const EscrowActions: React.FC<Props> = ({ status, currentUserRole, price, onUpdateStatus, onReleaseFunds, onRequestMediation, onCancel, onAcceptReturn, onConfirmReturnReceipt, isAmicableReturnAccepted }) => {

    if (status === 'DISPUTED') {
        return (
            <div className="bg-red-50 p-4 md:p-10 rounded-[40px] border border-red-100 shadow-premium flex flex-col items-center gap-8 text-center animate-in fade-in duration-500">
                <div className="size-20 bg-white text-red-500 rounded-[28px] flex items-center justify-center shadow-sm border border-red-100/50">
                    <span className="material-symbols-outlined text-4xl font-black">gavel</span>
                </div>
                <div>
                    <h3 className="text-xl font-black text-dark-800 mb-3 uppercase tracking-tight">Trato en Disputa</h3>
                    <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase tracking-wider max-w-sm">
                        Un especialista en resolución está auditando la evidencia del protocolo para determinar la liquidación final.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-4 pt-8 border-t border-red-100/50 w-full mt-2">
                    {currentUserRole === 'VENDEDOR' && onAcceptReturn && (
                        <button
                            onClick={onAcceptReturn}
                            className="px-8 py-5 bg-white text-emerald-600 border-2 border-emerald-100 font-black rounded-3xl hover:bg-emerald-50 transition-all text-[9px] uppercase tracking-[0.2em] active:scale-95 shadow-sm"
                        >
                            Aceptar Devolución Amigable
                        </button>
                    )}

                    {currentUserRole === 'MEDIADOR' && (
                        <>
                            <button
                                onClick={() => onUpdateStatus('REFUNDED', '✅ Veredicto: Reembolso emitido al COMPRADOR.')}
                                className="px-8 py-5 bg-white text-red-600 border-2 border-red-200 font-black rounded-3xl hover:bg-red-50 transition-all text-[9px] uppercase tracking-[0.2em] active:scale-95"
                            >
                                Reembolsar al Comprador
                            </button>
                            <button
                                onClick={() => onUpdateStatus('COMPLETED', '✅ Veredicto: Fondos liberados al VENDEDOR.')}
                                className="px-8 py-5 bg-red-600 text-white font-black rounded-3xl hover:bg-red-700 transition-all text-[9px] uppercase tracking-[0.2em] shadow-xl shadow-red-600/20 active:scale-95"
                            >
                                Liberar a Vendedor
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (status === 'FINALIZADO') {
        return (
            <div className="bg-primary-50 p-4 md:p-10 rounded-[40px] border border-primary-100 shadow-premium flex flex-col items-center gap-6 text-center animate-in zoom-in duration-500">
                <div className="size-16 bg-white text-primary-vibrant rounded-2xl flex items-center justify-center shadow-sm border border-primary-100/50">
                    <span className="material-symbols-outlined text-3xl font-black">verified</span>
                </div>
                <div>
                    <h3 className="text-xl font-black text-dark-800 uppercase tracking-tight">Protocol Terminated</h3>
                    <p className="text-[11px] font-bold text-primary-900 leading-relaxed uppercase tracking-wider opacity-60">Capital settlement executed. All contractual obligations have been fulfilled.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-dark-800 p-4 md:p-10 rounded-[40px] text-white shadow-premium-dark flex flex-col md:flex-row items-center justify-between gap-4 md:gap-10 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-vibrant/20 blur-[80px] rounded-full group-hover:bg-primary-vibrant/30 transition-all"></div>

            <div className="text-center md:text-left relative z-10">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-3">Protección de Garantía Activa</p>
                <h3 className="text-2xl font-black flex items-center gap-4 justify-center md:justify-start tracking-tight">
                    Capital Asegurado:
                    <span className="text-primary-vibrant font-black tracking-tighter">${price.toLocaleString()}</span>
                </h3>
            </div>

            <div className="flex flex-wrap justify-center gap-4 relative z-10 w-full md:w-auto">
                {currentUserRole === 'COMPRADOR' && status === 'SHIPPED' && !isAmicableReturnAccepted && (
                    <button
                        onClick={() => onUpdateStatus('COMPLETED', '🎉 El comprador confirmó la recepción.')}
                        className="flex-1 md:flex-none px-4 md:px-10 py-5 bg-primary-vibrant text-white font-black rounded-3xl hover:brightness-110 transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] active:scale-95"
                    >
                        <span className="material-symbols-outlined font-black">verified</span>
                        Liberar Fondos
                    </button>
                )}

                {currentUserRole === 'VENDEDOR' && status === 'PAID_HELD' && !isAmicableReturnAccepted && (
                    <button
                        onClick={() => onUpdateStatus('SHIPPED', '🚚 El vendedor confirmó el despacho del ítem.')}
                        className="flex-1 md:flex-none px-4 md:px-10 py-5 bg-primary-vibrant text-white font-black rounded-3xl hover:brightness-110 transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] active:scale-95"
                    >
                        <span className="material-symbols-outlined font-black">local_shipping</span>
                        Confirmar Despacho
                    </button>
                )}

                {currentUserRole === 'VENDEDOR' && isAmicableReturnAccepted && status === 'PAID_HELD' && onConfirmReturnReceipt && (
                    <button
                        onClick={onConfirmReturnReceipt}
                        className="flex-1 md:flex-none px-4 md:px-10 py-5 bg-emerald-600 text-white font-black rounded-3xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] active:scale-95"
                    >
                        <span className="material-symbols-outlined font-black">inventory</span>
                        Confirmar Recibo de Retorno
                    </button>
                )}

                <button
                    onClick={onRequestMediation}
                    className="flex-1 md:flex-none px-4 md:px-10 py-5 bg-white/5 text-white font-black rounded-3xl border border-white/10 hover:bg-white/10 transition-all text-[10px] uppercase tracking-[0.2em] active:scale-95"
                >
                    Iniciar Disputa
                </button>
            </div>

            {/* Cancellation Option (Only for Pending/Funded states) */}
            {(status === 'PENDING_PAYMENT' || status === 'PAID_HELD' || status === 'SHIPPED') && (
                <div className="absolute top-4 right-4 z-20">
                    <button
                        onClick={onCancel}
                        className="p-2 text-white/20 hover:text-red-500 transition-colors"
                        title="Cancelar Transacción"
                    >
                        <span className="material-symbols-outlined text-lg">cancel</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default EscrowActions;
