import React, { useEffect } from 'react';

const ScamPrevention = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-white font-sans text-dark-charcoal max-w-[800px] mx-auto min-h-screen py-24 px-6">
            <h1 className="text-4xl md:text-5xl font-black mb-6 text-dark-900 font-display">CONSEJOS PARA EVITAR ESTAFAS</h1>

            <p className="text-xl text-gray-600 font-medium mb-12">
                Vendelo Hoy! es una plataforma que conecta compradores y vendedores. Para realizar transacciones seguras recomendamos seguir estas buenas prácticas.
            </p>

            <div className="space-y-6">
                {[
                    {
                        title: "Verificar al vendedor",
                        desc: "Antes de comprar, conversá con el vendedor y pedí información adicional sobre el producto.",
                        icon: "verified_user",
                        color: "text-blue-500",
                        bg: "bg-blue-50",
                        border: "border-blue-100"
                    },
                    {
                        title: "Revisar el producto",
                        desc: "Siempre que sea posible, revisá el producto personalmente antes de realizar el pago.",
                        icon: "search_check",
                        color: "text-emerald-500",
                        bg: "bg-emerald-50",
                        border: "border-emerald-100"
                    },
                    {
                        title: "Evitar pagos anticipados",
                        desc: "No envíes dinero por adelantado a personas que no conocés sin verificar previamente el producto.",
                        icon: "money_off",
                        color: "text-red-500",
                        bg: "bg-red-50",
                        border: "border-red-100"
                    },
                    {
                        title: "Desconfiar de precios demasiado bajos",
                        desc: "Si una oferta parece demasiado buena para ser real, es recomendable investigar antes de realizar la compra.",
                        icon: "price_change",
                        color: "text-orange-500",
                        bg: "bg-orange-50",
                        border: "border-orange-100"
                    },
                    {
                        title: "Usar lugares públicos para encuentros",
                        desc: "Si acordás un encuentro para concretar la compra, elegí lugares públicos y seguros.",
                        icon: "location_home",
                        color: "text-purple-500",
                        bg: "bg-purple-50",
                        border: "border-purple-100"
                    },
                    {
                        title: "Cuidar tus datos personales",
                        desc: "No compartas información sensible como datos bancarios o contraseñas.",
                        icon: "shield_lock",
                        color: "text-indigo-500",
                        bg: "bg-indigo-50",
                        border: "border-indigo-100"
                    }
                ].map((tip, idx) => (
                    <div key={idx} className={`flex max-sm:flex-col items-start sm:items-center gap-6 p-6 rounded-3xl border ${tip.bg} ${tip.border}`}>
                        <div className={`w-16 h-16 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm ${tip.color}`}>
                            <span className="material-symbols-outlined text-3xl">{tip.icon}</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-dark-800 mb-2">{idx + 1}. {tip.title}</h2>
                            <p className="text-gray-700 font-medium">{tip.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-16 bg-slate-900 text-white p-8 rounded-[32px] shadow-xl">
                <h3 className="text-2xl font-black mb-4 flex items-center gap-2 text-primary-400">
                    <span className="material-symbols-outlined">warning</span>
                    Importante
                </h3>
                <div className="space-y-4 text-slate-300">
                    <p>Vendelo Hoy! no participa en las transacciones entre usuarios y no puede garantizar la veracidad de todos los anuncios publicados.</p>
                    <p className="font-bold text-white">La responsabilidad de la compra y venta recae exclusivamente en las personas involucradas en la operación.</p>
                </div>
            </div>
        </div>
    );
};

export default ScamPrevention;
