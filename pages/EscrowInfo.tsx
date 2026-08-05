import React from 'react';
import { Link } from 'react-router-dom';

const PagoProtegidoInfo = () => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center size-20 bg-primary-50 rounded-[32px] mb-8 shadow-sm">
                    <span className="material-symbols-outlined text-4xl text-primary-vibrant font-black">shield_lock</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-black text-dark-800 mb-6 uppercase tracking-tighter">Sistema de Garantía Pago Protegido</h1>
                <p className="text-lg font-bold text-gray-400 max-w-2xl mx-auto">Tu dinero nunca va directamente al vendedor. Descubre cómo protegemos cada transacción hasta que tengas el producto en tus manos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-4 md:p-12 left-[16%] right-[16%] h-1 bg-gradient-to-r from-primary-100 via-primary-200 to-primary-100 -z-10"></div>

                {[
                    {
                        step: "01",
                        title: "Pago Protegido",
                        desc: "Al pagar, el dinero se deposita en una bóveda segura de la plataforma, no en la cuenta del vendedor.",
                        icon: "account_balance_wallet"
                    },
                    {
                        step: "02",
                        title: "Verificación",
                        desc: "El vendedor envía el producto. Tienes 48hs para inspeccionarlo y confirmar que es lo que pediste.",
                        icon: "inventory_2"
                    },
                    {
                        step: "03",
                        title: "Liberación",
                        desc: "Solo cuando das tu aprobación (o pasadas las 48hs sin reclamos), liberamos los fondos al vendedor.",
                        icon: "payments"
                    }
                ].map((item, i) => (
                    <div key={i} className="bg-white p-8 rounded-[40px] border border-light-200 shadow-premium relative group hover:-translate-y-2 transition-transform duration-500">
                        <div className="size-24 bg-light-50 rounded-3xl flex items-center justify-center mb-6 mx-auto group-hover:bg-primary-vibrant transition-colors duration-500 shadow-inner">
                            <span className="material-symbols-outlined text-4xl text-dark-800 group-hover:text-white transition-colors duration-500">{item.icon}</span>
                        </div>
                        <div className="absolute top-8 right-8 text-[10px] font-black text-gray-200 uppercase tracking-widest">Paso {item.step}</div>
                        <h3 className="text-xl font-black text-dark-800 mb-3 text-center uppercase tracking-tight">{item.title}</h3>
                        <p className="text-sm font-bold text-gray-400 text-center leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>

            <div className="bg-dark-800 rounded-[48px] p-4 md:p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 size-[500px] bg-primary-vibrant/20 blur-[150px] -mr-32 -mt-32 rounded-full"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-12">
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">Garantía de Satisfacción</h2>
                        <p className="text-gray-300 font-bold mb-8 leading-relaxed">
                            Si el producto no llega, es diferente a lo publicado o está dañado, puedes iniciar una <span className="text-white border-b-2 border-primary-vibrant">Disputa</span>.
                            Nuestro equipo de mediación ("El Juez") revisará el caso y, si tienes razón, te devolveremos el 100% de tu dinero.
                        </p>
                        <Link to="/" className="inline-flex items-center gap-3 bg-white text-dark-800 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-light-100 transition-all active:scale-95">
                            Entendido, Volver
                        </Link>
                    </div>
                    <div className="size-64 bg-white/5 backdrop-blur-sm rounded-[40px] border border-white/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-8xl text-primary-vibrant drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]">security</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PagoProtegidoInfo;
