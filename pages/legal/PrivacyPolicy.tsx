import React, { useEffect } from 'react';

const PrivacyPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-white font-sans text-dark-charcoal max-w-[800px] mx-auto min-h-screen py-12 sm:py-24 px-4 sm:px-6">
            <h1 className="text-4xl font-black mb-2 text-dark-900 font-display">POLÍTICA DE PRIVACIDAD</h1>
            <p className="text-xs sm:text-sm text-gray-500 mb-8 sm:mb-12 font-bold tracking-widest uppercase">Última actualización: 2026</p>

            <div className="prose prose-slate max-w-none space-y-10">
                <p className="text-lg text-gray-600 font-medium">
                    En Vendelo Hoy! respetamos la privacidad de nuestros usuarios y nos comprometemos a proteger los datos personales que se recopilan a través del uso de la plataforma, en línea con la Ley 25.326 de Protección de Datos Personales de la República Argentina.
                </p>

                <div className="grid gap-6">
                    <section className="bg-light-50 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-light-200 relative overflow-hidden">
                        <div className="absolute -right-2 -top-2 text-[70px] sm:text-[120px] font-black leading-none text-light-200/50 pointer-events-none select-none z-0">1</div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-dark-800 mb-4">Información que recopilamos</h2>
                            <p className="mb-4 text-gray-600">Recopilamos distintos tipos de información según cómo el usuario utiliza la plataforma:</p>
                            <p className="font-bold text-dark-800 mb-2">Datos de cuenta</p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-600 font-medium marker:text-primary-500 mb-4">
                                <li>Nombre o alias</li>
                                <li>Dirección de correo electrónico</li>
                                <li>Información incluida en los anuncios publicados</li>
                                <li>Datos técnicos de navegación (dirección IP, navegador, dispositivo)</li>
                            </ul>
                            <p className="font-bold text-dark-800 mb-2">Datos de verificación de identidad (KYC)</p>
                            <p className="mb-4 text-gray-600">Cuando el usuario opta por operar con el sistema de Comercio Seguro (escrow), podemos solicitar documentación de identidad y otros datos necesarios para verificar quién es, con el fin de prevenir fraudes.</p>
                            <p className="font-bold text-dark-800 mb-2">Datos financieros y de transacción</p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-600 font-medium marker:text-primary-500 mb-4">
                                <li>Registro de las operaciones realizadas (montos, fechas, estado de la transacción)</li>
                                <li>Datos de cobro necesarios para acreditar fondos al vendedor (por ejemplo, CBU o alias)</li>
                                <li>Comunicaciones enviadas dentro del chat de compra/venta o de mediación de disputas</li>
                            </ul>
                            <p className="text-sm text-gray-500 italic">No almacenamos números completos de tarjetas de crédito ni datos sensibles de pago: esa información es procesada directamente por nuestro proveedor de pagos, MercadoPago.</p>
                        </div>
                    </section>

                    <section className="bg-light-50 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-light-200 relative overflow-hidden">
                        <div className="absolute -right-2 -top-2 text-[70px] sm:text-[120px] font-black leading-none text-light-200/50 pointer-events-none select-none z-0">2</div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-dark-800 mb-4">Uso de la información</h2>
                            <p className="mb-4 text-gray-600">La información recopilada puede ser utilizada para:</p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-600 font-medium marker:text-primary-500 mb-6">
                                <li>permitir la publicación de anuncios y la comunicación entre usuarios,</li>
                                <li>procesar pagos y operar el sistema de custodia de fondos (escrow),</li>
                                <li>verificar la identidad de los usuarios que operan con Comercio Seguro,</li>
                                <li>mediar en disputas entre comprador y vendedor,</li>
                                <li>prevenir actividades fraudulentas o abusivas,</li>
                                <li>cumplir obligaciones legales y regulatorias aplicables,</li>
                                <li>mejorar la experiencia de uso del sitio.</li>
                            </ul>
                            <div className="bg-primary-50 text-primary-800 p-4 rounded-xl font-bold">
                                Vendelo Hoy! no vende información personal a terceros con fines comerciales o publicitarios.
                            </div>
                        </div>
                    </section>

                    <section className="bg-light-50 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-light-200 relative overflow-hidden">
                        <div className="absolute -right-2 -top-2 text-[70px] sm:text-[120px] font-black leading-none text-light-200/50 pointer-events-none select-none z-0">3</div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-dark-800 mb-4">Con quién compartimos información</h2>
                            <p className="mb-4 text-gray-600">Para poder prestar el servicio, compartimos ciertos datos con terceros proveedores, únicamente en la medida necesaria para su función:</p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-600 font-medium marker:text-primary-500 mb-4">
                                <li><strong>MercadoPago (MercadoLibre S.R.L.):</strong> procesa los pagos y transferencias de la plataforma. Le compartimos los datos de la operación (monto, comprador, vendedor) necesarios para ejecutar el cobro y el pago.</li>
                                <li><strong>Google LLC / Firebase:</strong> aloja nuestra infraestructura (base de datos, autenticación y almacenamiento de archivos). Esto implica que los datos personales pueden ser transferidos y almacenados en servidores ubicados fuera de la Argentina, incluyendo Estados Unidos.</li>
                            </ul>
                            <p className="text-sm text-gray-500 italic">Estos proveedores tienen sus propias políticas de privacidad y están sujetos a sus propias medidas de seguridad y cumplimiento normativo.</p>
                        </div>
                    </section>

                    <section className="bg-light-50 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-light-200 relative overflow-hidden">
                        <div className="absolute -right-2 -top-2 text-[70px] sm:text-[120px] font-black leading-none text-light-200/50 pointer-events-none select-none z-0">4</div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-dark-800 mb-4">Conservación de los datos</h2>
                            <p className="text-gray-600 mb-4">Conservamos los datos de cuenta mientras el usuario mantenga su perfil activo en la plataforma. Los datos de transacciones y verificación de identidad (KYC) se conservan durante el plazo adicional que exijan las obligaciones legales, contables o de prevención de fraude aplicables, incluso después de que el usuario elimine su cuenta.</p>
                        </div>
                    </section>

                    <section className="bg-light-50 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-light-200 relative overflow-hidden">
                        <div className="absolute -right-2 -top-2 text-[70px] sm:text-[120px] font-black leading-none text-light-200/50 pointer-events-none select-none z-0">5</div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-dark-800 mb-4">Seguridad de la información</h2>
                            <p className="text-gray-600 mb-4">Implementamos medidas razonables (control de acceso, reglas de seguridad en nuestra base de datos, uso de proveedores certificados) para proteger la información de los usuarios contra accesos no autorizados o usos indebidos.</p>
                            <p className="text-gray-500 italic text-sm">Sin embargo, ningún sistema en internet puede garantizar seguridad absoluta.</p>
                        </div>
                    </section>

                    <section className="bg-light-50 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-light-200 relative overflow-hidden">
                        <div className="absolute -right-2 -top-2 text-[70px] sm:text-[120px] font-black leading-none text-light-200/50 pointer-events-none select-none z-0">6</div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-dark-800 mb-4">Enlaces a terceros</h2>
                            <p className="text-gray-600">El sitio puede contener enlaces a páginas externas, incluyendo la pasarela de pago de MercadoPago. Vendelo Hoy! no es responsable de las políticas de privacidad de esos sitios.</p>
                        </div>
                    </section>

                    <section className="bg-light-50 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-light-200 relative overflow-hidden">
                        <div className="absolute -right-2 -top-2 text-[70px] sm:text-[120px] font-black leading-none text-light-200/50 pointer-events-none select-none z-0">7</div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-dark-800 mb-4">Derechos del usuario</h2>
                            <p className="text-gray-600 mb-4">De acuerdo con la Ley 25.326, el usuario tiene derecho a acceder, rectificar, actualizar y solicitar la supresión de sus datos personales (derechos ARCO), así como a oponerse a determinados usos de su información.</p>
                            <p className="text-gray-600 mb-4">Estos derechos pueden ejercerse comunicándose a través de los medios de contacto disponibles en la plataforma. Ten en cuenta que algunos datos (por ejemplo, historial de transacciones o verificación de identidad) pueden no ser eliminables de forma inmediata si existe una obligación legal de conservarlos.</p>
                            <p className="text-sm text-gray-500 italic">La Agencia de Acceso a la Información Pública (AAIP), órgano de control de la Ley 25.326, tiene la atribución de atender reclamos relacionados con el incumplimiento de las normas de protección de datos personales.</p>
                        </div>
                    </section>

                    <section className="bg-light-50 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-light-200 relative overflow-hidden">
                        <div className="absolute -right-2 -top-2 text-[70px] sm:text-[120px] font-black leading-none text-light-200/50 pointer-events-none select-none z-0">8</div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-dark-800 mb-4">Uso por menores de edad</h2>
                            <p className="text-gray-600">La plataforma está destinada a personas mayores de 18 años. No recopilamos deliberadamente datos de menores de edad. Si detectamos una cuenta creada por un menor sin la autorización correspondiente, podrá ser suspendida.</p>
                        </div>
                    </section>

                    <section className="bg-light-50 p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-light-200 relative overflow-hidden">
                        <div className="absolute -right-2 -top-2 text-[70px] sm:text-[120px] font-black leading-none text-light-200/50 pointer-events-none select-none z-0">9</div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold text-dark-800 mb-4">Cambios en la política de privacidad</h2>
                            <p className="text-gray-600">Vendelo Hoy! podrá actualizar esta política cuando sea necesario para reflejar cambios en el servicio o en la legislación vigente. Los cambios relevantes serán informados a los usuarios por los medios disponibles en la plataforma.</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
