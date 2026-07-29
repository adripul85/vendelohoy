import React, { useEffect } from 'react';

const LegalNotice = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-white font-sans text-dark-charcoal max-w-[800px] mx-auto min-h-screen py-24 px-6">
            <h1 className="text-4xl font-black mb-12 text-dark-900 font-display">AVISO LEGAL</h1>

            <div className="prose prose-slate max-w-none space-y-8">
                <p className="text-lg text-gray-600 font-medium">
                    Este sitio web es una plataforma digital destinada a facilitar el contacto entre personas interesadas en comprar, vender o intercambiar productos.
                </p>

                <section className="bg-light-50 p-8 rounded-[32px] border border-light-200">
                    <h2 className="text-2xl font-bold text-dark-800 mb-4 border-b border-light-200 pb-4">Naturaleza de la plataforma</h2>
                    <div className="space-y-4 text-gray-600">
                        <p>Vendelo Hoy! funciona exclusivamente como un espacio de publicación de anuncios clasificados.</p>
                        <p className="font-bold text-dark-800">La plataforma no participa en las transacciones entre usuarios ni actúa como vendedor, comprador, intermediario financiero o representante de ninguna de las partes.</p>
                    </div>
                </section>

                <section className="bg-light-50 p-8 rounded-[32px] border border-light-200">
                    <h2 className="text-2xl font-bold text-dark-800 mb-4 border-b border-light-200 pb-4">Responsabilidad sobre los anuncios</h2>
                    <div className="space-y-4 text-gray-600">
                        <p>Los usuarios son los únicos responsables del contenido que publican, incluyendo la descripción de los productos, precios, imágenes y condiciones de venta.</p>
                        <div className="bg-red-50 p-6 rounded-2xl mt-6">
                            <p className="font-bold text-red-800 mb-2">Vendelo Hoy! no garantiza:</p>
                            <ul className="list-disc pl-6 space-y-2 text-red-700">
                                <li>la veracidad de los anuncios</li>
                                <li>la calidad de los productos</li>
                                <li>la identidad de los usuarios</li>
                                <li>el cumplimiento de las operaciones acordadas</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="bg-light-50 p-8 rounded-[32px] border border-light-200">
                    <h2 className="text-2xl font-bold text-dark-800 mb-4 border-b border-light-200 pb-4">Uso del sitio</h2>
                    <div className="space-y-4 text-gray-600">
                        <p>El usuario acepta utilizar la plataforma de manera responsable y conforme a la legislación vigente.</p>
                        <p className="font-medium text-dark-800">Queda prohibida la publicación de contenido ilegal, fraudulento o que infrinja derechos de terceros.</p>
                    </div>
                </section>

                <section className="bg-light-50 p-8 rounded-[32px] border border-light-200 border-l-4 border-l-orange-500">
                    <h2 className="text-2xl font-bold text-dark-800 mb-4 border-b border-light-200 pb-4">Limitación de responsabilidad</h2>
                    <div className="space-y-4 text-gray-600">
                        <p>Vendelo Hoy! no será responsable por daños directos o indirectos derivados del uso de la plataforma o de las transacciones realizadas entre usuarios.</p>
                    </div>
                </section>

                <section className="bg-light-50 p-8 rounded-[32px] border border-light-200">
                    <h2 className="text-2xl font-bold text-dark-800 mb-4 border-b border-light-200 pb-4">Contacto</h2>
                    <div className="space-y-4 text-gray-600">
                        <p>Para consultas relacionadas con el uso del sitio, los usuarios pueden comunicarse a través de los canales de contacto disponibles en la plataforma.</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default LegalNotice;
