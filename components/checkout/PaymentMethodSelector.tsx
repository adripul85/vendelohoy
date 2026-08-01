import React from 'react';
import { PaymentMethod } from '../../lib/transactions';

interface Props {
    selectedMethod: PaymentMethod;
    onSelect: (method: PaymentMethod) => void;
}

const PaymentMethodSelector: React.FC<Props> = ({ selectedMethod, onSelect }) => {
    return (
        <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Selecciona tu método de pago</h3>

            {/* Mercado Pago */}
            <div
                onClick={() => onSelect('MERCADO_PAGO')}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 hover:shadow-md ${selectedMethod === 'MERCADO_PAGO'
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-border-light bg-white hover:border-gray-300'
                    }`}
            >
                <div className="size-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 p-1">
                    <img
                        src="https://logotipoz.com/wp-content/uploads/2021/10/version-horizontal-large-logo-mercado-pago.webp"
                        alt="Mercado Pago"
                        className="w-full object-contain"
                    />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-dark-charcoal text-sm">Mercado Pago</h4>
                            <span className="text-[7px] font-black uppercase tracking-[0.2em] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <span className="material-symbols-outlined text-[10px]">verified_user</span>
                                Protegido
                            </span>
                        </div>
                        {selectedMethod === 'MERCADO_PAGO' && <span className="material-symbols-outlined text-blue-600 text-sm">check_circle</span>}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Tarjetas de crédito, débito y dinero en cuenta. Acreditación instantánea.
                    </p>
                </div>
            </div>



            {/* Transferencia */}
            <div
                onClick={() => onSelect('TRANSFER')}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 hover:shadow-md ${selectedMethod === 'TRANSFER'
                    ? 'border-dark-charcoal bg-gray-50'
                    : 'border-border-light bg-white hover:border-gray-300'
                    }`}
            >
                <div className="size-10 rounded-full bg-light-50 border border-border-light flex items-center justify-center shrink-0 text-dark-charcoal">
                    <span className="material-symbols-outlined">account_balance</span>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-dark-charcoal text-sm">Transferencia Bancaria</h4>
                            <span className="text-[7px] font-black uppercase tracking-[0.2em] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <span className="material-symbols-outlined text-[10px]">handshake</span>
                                Trato Directo
                            </span>
                        </div>
                        {selectedMethod === 'TRANSFER' && <span className="material-symbols-outlined text-dark-charcoal text-sm">check_circle</span>}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Transfiere directamente al vendedor. El procesamiento depende de las entidades bancarias.
                    </p>
                </div>
            </div>

            {/* Efectivo */}
            <div
                onClick={() => onSelect('CASH')}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 hover:shadow-md ${selectedMethod === 'CASH'
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-border-light bg-white hover:border-gray-300'
                    }`}
            >
                <div className="size-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 text-amber-600">
                    <span className="material-symbols-outlined">payments</span>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-dark-charcoal text-sm">Efectivo / Punto de Encuentro</h4>
                            <span className="text-[7px] font-black uppercase tracking-[0.2em] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <span className="material-symbols-outlined text-[10px]">handshake</span>
                                Trato Directo
                            </span>
                        </div>
                        {selectedMethod === 'CASH' && <span className="material-symbols-outlined text-amber-600 text-sm">check_circle</span>}
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                        Acuerdas el pago directamente con el vendedor al momento de la entrega.
                    </p>
                </div>
            </div>

            <div className={`p-4 rounded-xl flex gap-3 items-start border mt-6 transition-all ${selectedMethod === 'MERCADO_PAGO' || selectedMethod === 'MODO' ? 'bg-primary-50 border-primary-100' : 'bg-amber-50 border-amber-200'}`}>
                <span className={`material-symbols-outlined shrink-0 ${selectedMethod === 'MERCADO_PAGO' || selectedMethod === 'MODO' ? 'text-primary-600' : 'text-amber-600'}`}>
                    {selectedMethod === 'MERCADO_PAGO' || selectedMethod === 'MODO' ? 'verified_user' : 'warning'}
                </span>
                <p className={`text-[11px] font-bold leading-relaxed ${selectedMethod === 'MERCADO_PAGO' || selectedMethod === 'MODO' ? 'text-primary-800' : 'text-amber-800'}`}>
                    {selectedMethod === 'MERCADO_PAGO' || selectedMethod === 'MODO'
                        ? <strong>Tu compra está bajo protocolo de Pago Protegido. No liberamos el dinero al vendedor hasta que confirmes la recepción.</strong>
                        : <strong>Advertencia: Los pagos directos (Transferencia/Efectivo) no cuentan con el servicio de custodia de Pago Protegido. Realiza estas transacciones solo con vendedores de confianza.</strong>
                    }
                </p>
            </div>

        </div>
    );
};

export default PaymentMethodSelector;
