import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../../components/SEO';
import { TRADE_PROTECTION_FEE } from '../../lib/trades';

export const ProtectedTradesInfo: React.FC = () => {
    return (
        <div className="bg-slate-50 min-h-screen font-body pb-24">
            <SEO 
                title="Canjes y Permutas Protegidas | Vendelo Hoy!" 
                description="Conocé cómo funciona el sistema seguro de intercambio y permutas de productos usados con garantía en VendeloHoy." 
            />

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white py-20 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent pointer-events-none"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-black uppercase tracking-widest mb-6">
                        <span className="material-symbols-outlined text-base">sync_alt</span>
                        Innovación Exclusiva
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter uppercase mb-6 leading-tight">
                        Canjes y Permutas <span className="text-purple-400">100% Protegidas</span>
                    </h1>
                    <p className="text-base md:text-lg text-purple-100 font-medium max-w-2xl mx-auto leading-relaxed">
                        Cambiá lo que ya no usás por lo que querés tener, sin miedo a estafas. La plataforma actúa como intermediario seguro y custodia cualquier diferencia económica.
                    </p>
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-20 space-y-12">
                
                {/* 4 Steps Section */}
                <div className="bg-white rounded-[36px] p-8 md:p-12 border border-slate-200 shadow-xl">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight text-center mb-10">
                        ¿Cómo Funciona Paso a Paso?
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="size-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xl mb-4 border border-purple-100">
                                1
                            </div>
                            <h3 className="font-black text-slate-900 text-base mb-2">Proponé el Canje</h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                Elegí qué artículo ofrecés de tus publicaciones o cargá tus fotos, y agregá una diferencia en dinero si hiciera falta.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="size-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xl mb-4 border border-purple-100">
                                2
                            </div>
                            <h3 className="font-black text-slate-900 text-base mb-2">Acuerdo en la Sala</h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                Negociá en la sala privada. El vendedor puede aceptar, contraofertar o rechazar la propuesta.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="size-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xl mb-4 border border-purple-100">
                                3
                            </div>
                            <h3 className="font-black text-slate-900 text-base mb-2">Pago de Garantía</h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                Ambas partes abonan el Fee de Intermediación (${TRADE_PROTECTION_FEE.toLocaleString()}). Esto activa la garantía y desbloquea los datos de entrega.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="size-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xl mb-4 border border-purple-100">
                                4
                            </div>
                            <h3 className="font-black text-slate-900 text-base mb-2">Doble QR / Envío</h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                Al encontrarse en persona, se escanean mutuamente los Códigos QR para confirmar la conformidad y cerrar el trato.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Security Protocol Box */}
                <div className="bg-gradient-to-r from-purple-950 to-indigo-950 text-white rounded-[36px] p-8 md:p-12 shadow-xl border border-purple-800/40">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="size-24 bg-purple-600/30 border border-purple-400/30 rounded-3xl flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-5xl text-purple-300">security</span>
                        </div>
                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Protocolo Anti-Evasión</span>
                            <h3 className="text-2xl font-black uppercase tracking-tight">¿Por qué se bloquean los teléfonos antes de pagar?</h3>
                            <p className="text-xs md:text-sm text-purple-200 leading-relaxed font-medium">
                                Para evitar que los usuarios sean llevados fuera de la plataforma donde ocurren el 99% de las estafas (comprobantes truchos de transferencia, citas peligrosas y robos), nuestro sistema escanea y bloquea automáticamente teléfonos, links y direcciones físicas hasta que el canje queda formalmente registrado y con garantía pagada.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ Grid */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight text-center">
                        Preguntas Frecuentes sobre Permutas
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h4 className="font-black text-slate-900 text-sm mb-2">¿Qué pasa si el otro usuario no se presenta?</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Si el intercambio presencial no se concreta o una parte no asiste, podés cancelar el canje y el depósito de garantía en dinero se reintegra según las políticas de resolución.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h4 className="font-black text-slate-900 text-sm mb-2">¿Cómo funciona la diferencia de dinero?</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Si acordás entregar tu producto + $20.000, ese dinero queda retenido en Mercado Pago (Escrow) de forma segura. Solo se transfiere al vendedor cuando ambos escanean el código QR.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h4 className="font-black text-slate-900 text-sm mb-2">¿Qué hago si el producto tiene una falla oculta?</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Revisá siempre el artículo antes de mostrar o escanear el código QR. Si no coincide con las fotos o no funciona, no escanees el código y abrí una disputa desde la sala de canje.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h4 className="font-black text-slate-900 text-sm mb-2">¿Puedo permutar por envíos a otras provincias?</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Sí, podés seleccionar la modalidad "Por Envío". La plataforma emite las guías y retiene la confirmación hasta que ambos paquetes figuren entregados por Correo Argentino.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Call to action */}
                <div className="bg-white rounded-[36px] p-8 text-center border border-purple-200 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 uppercase mb-2">¿Listo para renovar tus cosas?</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                        Explorá los productos con el cartel "Acepta Permuta" o publicá tu artículo hoy mismo.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link to="/search" className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-600/30">
                            Explorar Artículos con Canje
                        </Link>
                        <Link to="/publish" className="px-6 py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all">
                            Publicar con Permuta
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};
export default ProtectedTradesInfo;
