import React, { useEffect } from 'react';

const PrivacyPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-white font-sans text-dark-charcoal max-w-[800px] mx-auto min-h-screen py-24 px-6">
            <h1 className="text-4xl font-black mb-2 text-dark-900 font-display">POLÍTICA DE PRIVACIDAD</h1>
            <p className="text-sm text-gray-500 mb-12 font-bold tracking-widest uppercase">Última actualización: 2026</p>

            <div className="prose prose-slate max-w-none space-y-10">
                <p className="text-lg text-gray-600 font-medium">
                    En Vendelo Hoy! respetamos la privacidad de nuestros usuarios y nos comprometemos a proteger los datos personales que puedan ser recopilados a través del uso de la plataforma.
                </p>

                <div className="grid gap-6">
                    <section className="bg-light-50 p-8 rounded-[32px] border border-light-200 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 text-[120px] font-black leading-none text-light-200/50 pointer-events-none select-none z-0">1</div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-dark-800 mb-4">Información que recopilamos</h2>
                            <p className="mb-4 text-gray-600">Podemos recopilar la siguiente información cuando el usuario utiliza el sitio:</p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-600 font-medium marker:text-primary-500 mb-4">
                                <li>Nombre o alias</li>
                                <li>Dirección de correo electrónico</li>
                                <li>Información incluida en los anuncios publicados</li>
                                <li>Datos técnicos de navegación (dirección IP, navegador, dispositivo)</li>
                            </ul>
                            <p className="text-sm text-gray-500 italic">Estos datos se recopilan únicamente con el objetivo de mejorar el funcionamiento del servicio.</p>
                        </div>
                    </section>

                    <section className="bg-light-50 p-8 rounded-[32px] border border-light-200 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 text-[120px] font-black leading-none text-light-200/50 pointer-events-none select-none z-0">2</div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-dark-800 mb-4">Uso de la información</h2>
                            <p className="mb-4 text-gray-600">La información recopilada puede ser utilizada para:</p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-600 font-medium marker:text-primary-500 mb-6">
                                <li>permitir la publicación de anuncios</li>
                                <li>facilitar la comunicación entre usuarios</li>
                                <li>mejorar la experiencia de uso del sitio</li>
                                <li>prevenir actividades fraudulentas o abusivas</li>
                            </ul>
                            <div className="bg-primary-50 text-primary-800 p-4 rounded-xl font-bold">
                                Vendelo Hoy! no vende ni comparte información personal con terceros con fines comerciales.
                            </div>
                        </div>
                    </section>

                    <section className="bg-light-50 p-8 rounded-[32px] border border-light-200 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 text-[120px] font-black leading-none text-light-200/50 pointer-events-none select-none z-0">3</div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-dark-800 mb-4">Seguridad de la información</h2>
                            <p className="text-gray-600 mb-4">Implementamos medidas razonables para proteger la información de los usuarios contra accesos no autorizados o usos indebidos.</p>
                            <p className="text-gray-500 italic text-sm">Sin embargo, ningún sistema en internet puede garantizar seguridad absoluta.</p>
                        </div>
                    </section>

                    <section className="bg-light-50 p-8 rounded-[32px] border border-light-200 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 text-[120px] font-black leading-none text-light-200/50 pointer-events-none select-none z-0">4</div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-dark-800 mb-4">Enlaces a terceros</h2>
                            <p className="text-gray-600">El sitio puede contener enlaces a páginas externas. Vendelo Hoy! no es responsable de las políticas de privacidad de esos sitios.</p>
                        </div>
                    </section>

                    <section className="bg-light-50 p-8 rounded-[32px] border border-light-200 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 text-[120px] font-black leading-none text-light-200/50 pointer-events-none select-none z-0">5</div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-dark-800 mb-4">Derechos del usuario</h2>
                            <p className="text-gray-600">El usuario puede solicitar la modificación o eliminación de sus datos personales comunicándose a través de los medios de contacto disponibles en la plataforma.</p>
                        </div>
                    </section>

                    <section className="bg-light-50 p-8 rounded-[32px] border border-light-200 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 text-[120px] font-black leading-none text-light-200/50 pointer-events-none select-none z-0">6</div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-dark-800 mb-4">Cambios en la política de privacidad</h2>
                            <p className="text-gray-600">Vendelo Hoy! podrá actualizar esta política cuando sea necesario para reflejar cambios en el servicio o en la legislación vigente.</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
