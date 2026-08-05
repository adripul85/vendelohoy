import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentMethods = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-light-50">
            <div className="max-w-[1440px] mx-auto px-6 py-12">
                <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-dark-800 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Volver
                </button>

                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h1 className="text-4xl font-black text-dark-800 tracking-tighter mb-4">Medios de Pago</h1>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        Infraestructura financiera segura y flexible.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {/* MERCADO PAGO */}
                    <div className="bg-white p-8 rounded-[40px] border border-light-200 shadow-premium flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
                        <div className="size-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-4xl font-black">qr_code_2</span>
                        </div>
                        <h3 className="text-xl font-black text-dark-800 mb-2">Mercado Pago</h3>
                        <p className="text-xs font-medium text-gray-500 leading-relaxed mb-6">
                            Pagos instantáneos con dinero en cuenta, tarjetas de crédito y débito. La opción más rápida para liberar tu pedido.
                        </p>
                        <span className="px-4 py-2 bg-blue-100/50 text-blue-700 text-[9px] font-black uppercase tracking-widest rounded-xl">Recomendado</span>
                    </div>

                    {/* TRANSFER */}
                    <div className="bg-white p-8 rounded-[40px] border border-light-200 shadow-premium flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
                        <div className="size-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-4xl font-black">account_balance</span>
                        </div>
                        <h3 className="text-xl font-black text-dark-800 mb-2">Transferencia Bancaria</h3>
                        <p className="text-xs font-medium text-gray-500 leading-relaxed mb-6">
                            Transferencias directas CBU/CVU. Ideal para montos grandes. La acreditación puede demorar hasta 24hs hábiles.
                        </p>
                        <span className="px-4 py-2 bg-emerald-100/50 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-xl">Sin Comisiones Extra</span>
                    </div>

                    {/* CASH */}
                    <div className="bg-white p-8 rounded-[40px] border border-light-200 shadow-premium flex flex-col items-center text-center group hover:-translate-y-1 transition-transform">
                        <div className="size-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-6 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-4xl font-black">payments</span>
                        </div>
                        <h3 className="text-xl font-black text-dark-800 mb-2">Efectivo (Puntos de Pago)</h3>
                        <p className="text-xs font-medium text-gray-500 leading-relaxed mb-6">
                            Rapipago o PagoFácil. Genera un cupón y paga en efectivo. La acreditación es inmediata una vez realizado el pago.
                        </p>
                        <span className="px-4 py-2 bg-amber-100/50 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-xl">Accesible</span>
                    </div>
                </div>

                {/* ESCROW INFO */}
                <div className="bg-dark-800 rounded-[40px] p-4 md:p-12 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 size-96 bg-red-600/20 blur-[100px] rounded-full -mr-20 -mt-20"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-12">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="size-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-2xl text-red-500">lock</span>
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tight">Sistema Escrow Activo</h2>
                            </div>
                            <p className="text-sm font-medium text-gray-300 leading-relaxed mb-8">
                                Independientemente del medio de pago que elijas, <strong>tu dinero nunca va directamente al vendedor</strong>.
                                Permanece en nuestra bóveda segura (Escrow) hasta que confirmas que recibiste el producto correctamente.
                            </p>
                            <button onClick={() => navigate('/escrow-info')} className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20">
                                Entender Más
                            </button>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-sm">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Flujo de Fondos</h4>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <span className="size-8 rounded-full bg-white text-dark-800 flex items-center justify-center font-black text-xs">1</span>
                                    <p className="text-xs font-bold">Realizas el pago por tu medio preferido.</p>
                                </div>
                                <div className="w-0.5 h-6 bg-white/10 ml-4"></div>
                                <div className="flex items-center gap-4">
                                    <span className="size-8 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-xs">2</span>
                                    <p className="text-xs font-bold">Vendelo Hoy! custodia el dinero.</p>
                                </div>
                                <div className="w-0.5 h-6 bg-white/10 ml-4"></div>
                                <div className="flex items-center gap-4">
                                    <span className="size-8 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-xs">3</span>
                                    <p className="text-xs font-bold">Recibes el producto y liberas el pago.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PaymentMethods;
