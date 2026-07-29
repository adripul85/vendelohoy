
import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsAndCosts = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-light-50">
            <div className="max-w-[1440px] mx-auto px-6 py-12">
                <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-dark-800 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Volver
                </button>

                <h1 className="text-4xl font-black text-dark-800 tracking-tighter mb-4">Costos y Tarifas</h1>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-12">Transparencia total en operación de mercado seguro</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">

                    {/* SELLING FEES */}
                    <div className="bg-white p-10 rounded-[40px] border border-light-200 shadow-premium group hover:shadow-premium-lg transition-all">
                        <div className="mb-8 size-20 rounded-[32px] bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                            <span className="material-symbols-outlined text-4xl">percent</span>
                        </div>
                        <h2 className="text-2xl font-black text-dark-800 mb-4 tracking-tight">Comisión por Venta</h2>
                        <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-6xl font-black text-red-600 tracking-tighter">10%</span>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">del total</span>
                        </div>
                        <p className="text-sm font-medium text-gray-500 leading-relaxed mb-8">
                            Esta tarifa se deduce automáticamente al liberar los fondos. Cubre la protección Escrow, verificación de identidad y soporte de mediación 24/7.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-green-500 font-bold">check_circle</span>
                                <span className="text-xs font-bold text-dark-800">Protección contra Contracargos</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-green-500 font-bold">check_circle</span>
                                <span className="text-xs font-bold text-dark-800">Custodia Segura de Fondos</span>
                            </li>
                        </ul>
                    </div>

                    {/* CANCELLATION PENALTY */}
                    <div className="bg-dark-800 p-10 rounded-[40px] border border-dark-900 shadow-premium relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="mb-8 size-20 rounded-[32px] bg-white/10 text-white flex items-center justify-center border border-white/5">
                                <span className="material-symbols-outlined text-4xl">cancel_presentation</span>
                            </div>
                            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">Penalización por Cancelación</h2>
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-6xl font-black text-white tracking-tighter">3%</span>
                                <span className="text-xs font-black text-white/40 uppercase tracking-widest">del total</span>
                            </div>
                            <p className="text-sm font-medium text-gray-400 leading-relaxed mb-8">
                                Aplicable al vendedor si cancela una orden ya pagada sin causa justificada. Esto compensa los costos operativos y la mala experiencia del comprador.
                            </p>
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
                                <span className="material-symbols-outlined text-red-500">warning</span>
                                <p className="text-[10px] text-red-400 font-bold leading-relaxed">
                                    Si tu saldo es insuficiente, el monto quedará registrado como deuda en tu cuenta.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* PRIVACY & TERMS SECTION */}
                <div className="max-w-4xl mx-auto space-y-12">
                    <section>
                        <h2 className="text-2xl font-black text-dark-800 mb-6 flex items-center gap-3">
                            <span className="material-symbols-outlined text-red-600">policy</span>
                            Política de Privacidad
                        </h2>
                        <div className="bg-white p-10 rounded-[40px] border border-light-200 shadow-sm space-y-6 text-sm text-gray-600 leading-relaxed font-medium">
                            <p>
                                En <strong>Vendelo Hoy!</strong>, su privacidad es un pilar fundamental de nuestra arquitectura. Utilizamos encriptación de extremo a extremo para todos los datos sensibles.
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Datos Recopilados:</strong> Información de identidad (KYC), registros de transacciones y comunicaciones en el chat de mediación.</li>
                                <li><strong>Uso de Datos:</strong> Exclusivamente para facilitar transacciones, prevenir fraudes y cumplir con regulaciones legales vigentes.</li>
                                <li><strong>No Venta:</strong> Nunca vendemos sus datos personales a terceros. Su información transaccional es confidencial.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-dark-800 mb-6 flex items-center gap-3">
                            <span className="material-symbols-outlined text-red-600">gavel</span>
                            Términos y Condiciones
                        </h2>
                        <div className="bg-white p-10 rounded-[40px] border border-light-200 shadow-sm space-y-6 text-sm text-gray-600 leading-relaxed font-medium">
                            <p>
                                Al operar en la plataforma, usted acepta someterse a nuestro <strong>Protocolo de Comercio Seguro</strong>.
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Obligación de Entrega:</strong> El vendedor debe despachar el producto exacto descrito en un plazo no mayor a 5 días hábiles.</li>
                                <li><strong>Política de Reembolso:</strong> Los fondos se mantienen en garantía hasta que el comprador confirma la recepción conforme (o pasadas 48 horas de la entrega confirmada por correo).</li>
                                <li><strong>Conducta:</strong> Prohibido el comercio de artículos ilegales, estafas o comportamiento abusivo. La violación resultará en la suspensión inmediata (Ban-Hammer).</li>
                            </ul>
                        </div>
                    </section>
                </div>


                <div className="mt-12 bg-white p-10 rounded-[40px] border border-light-200 text-center">
                    <h3 className="text-lg font-black text-dark-800 uppercase tracking-tight mb-2">¿Dudas sobre un cobro?</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Nuestro equipo de finanzas está disponible para auditar tu caso.</p>
                    <button className="bg-light-100 text-dark-800 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-light-200 transition-colors">Contactar Soporte</button>
                </div>

            </div>
        </div>
    );
};

export default TermsAndCosts;
