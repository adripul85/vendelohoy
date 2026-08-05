import React, { useEffect } from 'react';

const CookiesPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-white font-sans text-dark-charcoal max-w-[800px] mx-auto min-h-screen py-12 sm:py-24 px-4 sm:px-6">
            <h1 className="text-4xl font-black mb-2 text-dark-900 font-display">POLÍTICA DE COOKIES Y ALMACENAMIENTO LOCAL</h1>
            <p className="text-xs sm:text-sm text-gray-500 mb-8 sm:mb-12 font-bold tracking-widest uppercase">Última actualización: 2026</p>

            <div className="prose prose-slate max-w-none space-y-10">
                <p className="text-lg text-gray-600 font-medium">
                    Vendelo Hoy! utiliza almacenamiento local del navegador y, en su caso, cookies, para el funcionamiento del sitio, para recordar información entre sesiones y para entender cómo se usa la plataforma.
                </p>

                <section>
                    <h2 className="text-2xl font-bold text-dark-800 mb-4">¿Qué son las cookies y el almacenamiento local?</h2>
                    <p className="text-gray-600">
                        Las cookies son pequeños archivos que un sitio puede guardar en el navegador del usuario. El almacenamiento local (<code>localStorage</code> y <code>sessionStorage</code>) cumple una función similar: permite que el sitio guarde información en el dispositivo del usuario para recordarla más adelante, sin depender de una cookie tradicional. Vendelo Hoy! utiliza principalmente esta segunda técnica.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-dark-800 mb-6">Qué guardamos concretamente</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-light-50 p-4 sm:p-6 rounded-3xl border border-light-200">
                            <h3 className="text-lg font-bold text-dark-800 mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary-500">lock</span>
                                Esenciales / funcionales
                            </h3>
                            <p className="text-gray-600 text-sm mb-3">
                                Necesarias para que el sitio funcione: mantener tu sesión iniciada, recordar los productos de tu carrito, y recordar preferencias de visualización (por ejemplo, transacciones que ocultaste del panel).
                            </p>
                            <p className="text-gray-500 text-xs italic">No pueden desactivarse desde el sitio; si las bloqueás desde el navegador, funciones como el carrito o el inicio de sesión pueden dejar de funcionar.</p>
                        </div>

                        <div className="bg-light-50 p-4 sm:p-6 rounded-3xl border border-light-200">
                            <h3 className="text-lg font-bold text-dark-800 mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary-500">analytics</span>
                                Analítica propia (primera parte)
                            </h3>
                            <p className="text-gray-600 text-sm mb-3">
                                Generamos un identificador anónimo de visitante en tu navegador para registrar eventos como vistas de producto, agregados al carrito, inicio de checkout y compras, junto con el sitio de origen de la visita (por ejemplo, Google, Instagram o TikTok).
                            </p>
                            <p className="text-gray-500 text-xs italic">Esta información se usa para entender el rendimiento de las tiendas y publicaciones dentro de la plataforma, no para publicidad de terceros.</p>
                        </div>
                    </div>

                    <div className="bg-primary-50 text-primary-800 p-4 rounded-xl font-bold mt-6">
                        No utilizamos cookies de publicidad ni herramientas de analítica de terceros como Google Analytics o Meta Pixel. Todo el análisis de uso se realiza con datos propios, almacenados en nuestra propia infraestructura.
                    </div>
                </section>

                <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                    <h2 className="text-xl font-bold text-dark-800 mb-4">Control de cookies y almacenamiento local</h2>
                    <div className="space-y-4 text-gray-600">
                        <p>El usuario puede configurar su navegador para bloquear o eliminar cookies y datos de sitios almacenados en cualquier momento, o borrar manualmente el almacenamiento local del sitio desde las herramientas de desarrollador del navegador.</p>
                        <p className="text-sm italic text-gray-500">Ten en cuenta que bloquear el almacenamiento esencial puede impedir que puedas iniciar sesión, usar el carrito o completar una compra.</p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-dark-800 mb-4">Cambios en esta política</h2>
                    <p className="text-gray-600">
                        Si en el futuro incorporamos cookies de terceros (por ejemplo, para publicidad o analítica externa), actualizaremos esta política y solicitaremos el consentimiento del usuario antes de activarlas, conforme corresponda.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default CookiesPolicy;
