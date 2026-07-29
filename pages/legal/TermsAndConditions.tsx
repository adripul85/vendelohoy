import React, { useEffect } from 'react';

const TermsAndConditions = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-white font-sans text-dark-charcoal max-w-[800px] mx-auto min-h-screen py-24 px-6">
            <h1 className="text-4xl font-black mb-2 text-dark-900 font-display">TÉRMINOS Y CONDICIONES DE USO</h1>
            <p className="text-sm text-gray-500 mb-12 font-bold tracking-widest uppercase">Última actualización: 2026</p>

            <div className="prose prose-slate max-w-none space-y-8">
                <p className="text-lg text-gray-600 font-medium">
                    Bienvenido a Vendelo Hoy!. Al acceder y utilizar este sitio web, el usuario acepta los presentes Términos y Condiciones. Si no está de acuerdo con alguno de ellos, deberá abstenerse de utilizar la plataforma.
                </p>

                <section>
                    <h2 className="text-2xl font-bold text-dark-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">1</span>
                        Descripción del servicio
                    </h2>
                    <div className="bg-light-50 p-6 rounded-2xl border border-light-200 space-y-4">
                        <p>Vendelo Hoy! es una plataforma digital que permite a los usuarios publicar anuncios para comprar, vender o intercambiar productos entre particulares.</p>
                        <p>La plataforma actúa únicamente como intermediario tecnológico para facilitar el contacto entre usuarios y no participa en las transacciones realizadas entre ellos.</p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-dark-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">2</span>
                        Publicación de anuncios
                    </h2>
                    <div className="bg-light-50 p-6 rounded-2xl border border-light-200 space-y-4">
                        <p>Los usuarios pueden publicar anuncios de productos o servicios bajo su exclusiva responsabilidad.</p>
                        <p className="font-bold">El usuario se compromete a:</p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600 marker:text-primary-500">
                            <li>Proporcionar información veraz y precisa.</li>
                            <li>No publicar contenido engañoso o fraudulento.</li>
                            <li>No ofrecer productos prohibidos por la legislación vigente.</li>
                            <li>No publicar contenido ofensivo, ilegal o que infrinja derechos de terceros.</li>
                        </ul>
                        <p className="text-sm text-gray-500 italic mt-4">La plataforma se reserva el derecho de eliminar cualquier publicación que incumpla estas condiciones.</p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-dark-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">3</span>
                        Responsabilidad de las transacciones
                    </h2>
                    <div className="bg-light-50 p-6 rounded-2xl border border-light-200 border-l-4 border-l-red-500 space-y-4">
                        <p className="font-bold text-dark-800">Las operaciones de compra y venta se realizan exclusivamente entre los usuarios.</p>
                        <p>Vendelo Hoy! no interviene en:</p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600">
                            <li>la negociación entre comprador y vendedor</li>
                            <li>el pago de los productos</li>
                            <li>la entrega o envío de los mismos</li>
                        </ul>
                        <p className="font-medium text-red-600 bg-red-50 p-4 rounded-xl mt-4">Por lo tanto, la plataforma no se responsabiliza por incumplimientos, fraudes, daños o conflictos derivados de las transacciones realizadas entre usuarios.</p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-dark-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">4</span>
                        Contenido publicado por los usuarios
                    </h2>
                    <div className="bg-light-50 p-6 rounded-2xl border border-light-200 space-y-4">
                        <p>Cada usuario es responsable del contenido que publica.</p>
                        <p>Al publicar un anuncio, el usuario declara que tiene derecho a vender el producto ofrecido y que la información proporcionada es verídica.</p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-dark-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">5</span>
                        Eliminación o suspensión de cuentas
                    </h2>
                    <div className="bg-light-50 p-6 rounded-2xl border border-light-200 space-y-4">
                        <p>La plataforma podrá eliminar publicaciones o suspender cuentas que:</p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-600">
                            <li>infrinjan estos términos</li>
                            <li>generen actividades sospechosas</li>
                            <li>afecten el correcto funcionamiento del sitio</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-dark-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">6</span>
                        Modificaciones del servicio
                    </h2>
                    <div className="bg-light-50 p-6 rounded-2xl border border-light-200 space-y-4">
                        <p>Vendelo Hoy! se reserva el derecho de modificar, suspender o actualizar el servicio en cualquier momento sin previo aviso.</p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-dark-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">7</span>
                        Aceptación de los términos
                    </h2>
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 space-y-4">
                        <p className="font-bold text-emerald-800 text-lg">El uso de la plataforma implica la aceptación plena de estos Términos y Condiciones.</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default TermsAndConditions;
