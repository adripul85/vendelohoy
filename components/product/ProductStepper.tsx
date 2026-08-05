
import React from 'react';

interface Props {
    currentStepIdx?: number;
}

const ProductStepper: React.FC<Props> = ({ currentStepIdx = 0 }) => {
    const steps = [
        { label: 'Acordado', icon: 'handshake', desc: 'Protocolo mutuo aceptado' },
        { label: 'Fondeado', icon: 'account_balance_wallet', desc: 'Capital asegurado en Pago Protegido' },
        { label: 'Enviado', icon: 'local_shipping', desc: 'Activo en tránsito' },
        { label: 'Entregado', icon: 'package_2', desc: 'Auditoría de calidad final' },
        { label: 'Completado', icon: 'task_alt', desc: 'Protocolo finalizado' },
    ];

    return (
        <div className="w-full py-12 mb-16 bg-light-50/50 rounded-[40px] border border-light-200/50 px-6 md:px-14 overflow-hidden shadow-inner-premium">
            <div className="flex items-center justify-between relative max-w-5xl mx-auto">
                {/* Progress Track */}
                <div className="absolute top-1/2 left-0 w-full h-1.5 bg-light-200 -translate-y-1/2 z-0 rounded-full overflow-hidden">
                    <div
                        className="absolute top-0 left-0 h-full bg-primary-vibrant transition-all duration-1000 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                        style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
                    ></div>
                </div>

                {steps.map((step, idx) => {
                    const isCompleted = idx < currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    const isUpcoming = idx > currentStepIdx;

                    return (
                        <div key={idx} className="relative z-10 flex flex-col items-center group">
                            {/* Step Node */}
                            <div className={`
                                size-14 md:size-20 rounded-3xl border-2 flex items-center justify-center transition-all duration-700 shadow-premium
                                ${isCompleted ? 'bg-primary-vibrant border-primary-vibrant text-white' : ''}
                                ${isCurrent ? 'bg-dark-800 border-dark-800 text-white scale-125 ring-8 ring-dark-800/10 z-20' : ''}
                                ${isUpcoming ? 'bg-white border-light-200 text-gray-300' : ''}
                            `}>
                                <span className={`material-symbols-outlined text-xl md:text-2xl font-black ${isCurrent ? 'animate-pulse' : ''}`}>
                                    {isCompleted ? 'check' : step.icon}
                                </span>
                            </div>

                            {/* Tooltip */}
                            <div className="absolute -top-6 md:p-16 opacity-0 group-hover:opacity-100 transition-all pointer-events-none bg-dark-900 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-2xl whitespace-nowrap z-30 shadow-2xl block">
                                {step.desc}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-dark-900 rotate-45"></div>
                            </div>

                            {/* Label */}
                            <div className={`
                                absolute -bottom-12 whitespace-nowrap text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500
                                ${isCompleted ? 'text-primary-vibrant' : ''}
                                ${isCurrent ? 'text-dark-800 scale-110' : ''}
                                ${isUpcoming ? 'text-gray-300' : ''}
                            `}>
                                {step.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProductStepper;
