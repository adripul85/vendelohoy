import React, { useEffect } from 'react';

const CookiesPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-white font-sans text-dark-charcoal max-w-[800px] mx-auto min-h-screen py-24 px-6">
            <h1 className="text-4xl font-black mb-2 text-dark-900 font-display">POLÍTICA DE COOKIES</h1>
            <p className="text-sm text-gray-500 mb-12 font-bold tracking-widest uppercase">Última actualización: 2026</p>

            <div className="prose prose-slate max-w-none space-y-10">
                <p className="text-lg text-gray-600 font-medium">
                    Vendelo Hoy! utiliza cookies para mejorar la experiencia de navegación de los usuarios.
                </p>

                <section>
                    <h2 className="text-2xl font-bold text-dark-800 mb-4">¿Qué son las cookies?</h2>
                    <p className="text-gray-600">
                        Las cookies son pequeños archivos que se almacenan en el dispositivo del usuario cuando visita un sitio web. Permiten recordar información sobre la navegación y mejorar el funcionamiento del sitio.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-dark-800 mb-6">Tipos de cookies utilizadas</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-light-50 p-6 rounded-3xl border border-light-200">
                            <h3 className="text-lg font-bold text-dark-800 mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary-500">cookie</span>
                                Cookies esenciales
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Son necesarias para el funcionamiento básico del sitio y permiten que el usuario navegue y utilice sus funciones.
                            </p>
                        </div>

                        <div className="bg-light-50 p-6 rounded-3xl border border-light-200">
                            <h3 className="text-lg font-bold text-dark-800 mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary-500">analytics</span>
                                Cookies de análisis
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Nos ayudan a comprender cómo los usuarios utilizan la plataforma para mejorar el servicio.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                    <h2 className="text-xl font-bold text-dark-800 mb-4">Control de cookies</h2>
                    <div className="space-y-4 text-gray-600">
                        <p>El usuario puede configurar su navegador para bloquear o eliminar cookies en cualquier momento.</p>
                        <p className="text-sm italic text-gray-500">Sin embargo, algunas funciones del sitio pueden verse afectadas si se deshabilitan.</p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-dark-800 mb-4">Cambios en la política de cookies</h2>
                    <p className="text-gray-600">
                        Vendelo Hoy! puede actualizar esta política en cualquier momento para reflejar cambios en el funcionamiento del sitio.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default CookiesPolicy;
