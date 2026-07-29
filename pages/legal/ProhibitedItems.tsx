
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PROHIBITED_CATEGORIES = [
    {
        icon: 'science',
        title: 'Sustancias Ilegales',
        color: 'red',
        items: [
            'Estupefacientes y sustancias prohibidas por ley',
            'Equipos para cultivo, mantenimiento o consumo de sustancias ilegales',
            'Precursores químicos controlados',
        ]
    },
    {
        icon: 'gavel',
        title: 'Armas, Municiones y Explosivos',
        color: 'red',
        items: [
            'Armas de fuego (de cualquier calibre, deportivas, de colección, antiguas)',
            'Armas blancas (excepto cuchillos de uso doméstico, industrial o agrícola)',
            'Municiones, balas, cartuchos y silenciadores',
            'Kits o piezas para fabricar armas',
            'Material explosivo, incluidos fuegos artificiales',
            'Lanzallamas y dispositivos incendiarios',
        ]
    },
    {
        icon: 'local_pharmacy',
        title: 'Medicamentos y Productos para la Salud',
        color: 'amber',
        items: [
            'Medicamentos con o sin receta médica',
            'Suplementos dietarios no autorizados por ANMAT',
            'Productos con efecto adelgazante no regulados',
            'Equipamiento médico profesional sin habilitación',
            'Productos de estética invasiva',
            'Anteojos y lentes de contacto recetados',
        ]
    },
    {
        icon: 'copyright',
        title: 'Propiedad Intelectual',
        color: 'purple',
        items: [
            'Copias piratas de software, videojuegos, música o películas',
            'Productos falsificados o réplicas de marcas registradas',
            'E-books sin autorización del titular de derechos',
            'Claves o accesos a contenido digital sin licencia',
            'Fotografías y contenido protegido sin autorización',
        ]
    },
    {
        icon: 'warning',
        title: 'Materiales Peligrosos',
        color: 'orange',
        items: [
            'Sustancias inflamables, corrosivas o tóxicas',
            'Materiales explosivos o radioactivos',
            'Gases a presión y sustancias asfixiantes',
            'Peróxido de hidrógeno en concentraciones no permitidas',
            'Productos contaminantes o infecciosos',
        ]
    },
    {
        icon: 'currency_exchange',
        title: 'Productos y Servicios Financieros',
        color: 'emerald',
        items: [
            'Monedas y billetes de curso legal (locales o extranjeros)',
            'Servicios financieros, seguros o inversiones',
            'Loterías, rifas y productos de azar',
            'Criptoactivos sin regulación comprobable',
            'Servicios de evasión fiscal o lavado de dinero',
        ]
    },
    {
        icon: 'person_off',
        title: 'Contenido para Adultos y Datos Personales',
        color: 'pink',
        items: [
            'Material pornográfico o servicios sexuales',
            'Ropa interior usada',
            'Contenido que promueva violencia o discriminación',
            'Listas de correo y bases de datos personales',
            'Documentos legales con información sensible de terceros',
        ]
    },
    {
        icon: 'devices',
        title: 'Electrónica y Señales',
        color: 'blue',
        items: [
            'Celulares reportados como robados o en lista negra (IMEI bloqueado)',
            'Decodificadores, antenas y dispositivos para robar señal',
            'Inhibidores de frecuencia (jammers)',
            'Programas o servicios de hacking',
            'Equipos de vigilancia/espionaje ilegales',
        ]
    },
    {
        icon: 'museum',
        title: 'Patrimonio Cultural y Artículos Robados',
        color: 'yellow',
        items: [
            'Artículos de procedencia ilícita (robados)',
            'Patrimonio histórico, cultural o arqueológico',
            'Restos paleontológicos',
            'Órganos, restos humanos o derivados',
        ]
    },
    {
        icon: 'pets',
        title: 'Animales y Especies Protegidas',
        color: 'green',
        items: [
            'Especies en peligro de extinción o protegidas por ley',
            'Animales silvestres sin documentación de criadero habilitado',
            'Productos derivados de fauna silvestre (pieles, marfil, etc.)',
            'Nota: solo se permiten mascotas domésticas comunes con documentación',
        ]
    },
    {
        icon: 'confirmation_number',
        title: 'Entradas y Reventa',
        color: 'indigo',
        items: [
            'Reventa de entradas para espectáculos o eventos deportivos',
            'Copias no autorizadas de entradas o tickets',
            'Pases o acreditaciones falsificadas',
        ]
    },
    {
        icon: 'directions_car',
        title: 'Vehículos sin Documentación',
        color: 'slate',
        items: [
            'Vehículos sin título de propiedad o documentación habilitante',
            'Autopartes con número de serie adulterado',
            'Productos para vehículos que infrinjan leyes de tránsito',
        ]
    },
];

const COLOR_MAP: Record<string, { bg: string, text: string, border: string, light: string }> = {
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', light: 'bg-red-500/10' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', light: 'bg-amber-500/10' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', light: 'bg-purple-500/10' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', light: 'bg-orange-500/10' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', light: 'bg-emerald-500/10' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100', light: 'bg-pink-500/10' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', light: 'bg-blue-500/10' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100', light: 'bg-yellow-500/10' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', light: 'bg-green-500/10' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', light: 'bg-indigo-500/10' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', light: 'bg-slate-500/10' },
};

const ProhibitedItems = () => {
    const navigate = useNavigate();
    const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-light-50">
            <div className="max-w-[1440px] mx-auto px-6 py-12">
                <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-dark-800 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Volver
                </button>

                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-14 bg-red-100 rounded-2xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-red-600 text-3xl">block</span>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-dark-800 tracking-tighter">Artículos Prohibidos</h1>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Política de publicación y comercio seguro</p>
                        </div>
                    </div>
                </div>

                {/* Warning Banner */}
                <div className="bg-red-600 text-white p-8 rounded-[32px] mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />
                    <div className="relative z-10 flex items-start gap-4">
                        <span className="material-symbols-outlined text-4xl mt-1">shield</span>
                        <div>
                            <h2 className="text-xl font-black mb-2 tracking-tight">Compromiso con la Seguridad</h2>
                            <p className="text-sm font-medium text-red-100 leading-relaxed max-w-3xl">
                                En <strong>Vendelo Hoy!</strong>, priorizamos la seguridad de nuestra comunidad.
                                Los artículos listados a continuación están <strong>estrictamente prohibidos</strong> en nuestra plataforma.
                                Las publicaciones que infrinjan estas políticas serán eliminadas de forma inmediata y la cuenta del
                                vendedor podrá ser suspendida temporal o permanentemente.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {PROHIBITED_CATEGORIES.map((cat, idx) => {
                        const colors = COLOR_MAP[cat.color] || COLOR_MAP.red;
                        const isExpanded = expandedCategory === idx;

                        return (
                            <div
                                key={idx}
                                className={`bg-white rounded-3xl border ${colors.border} overflow-hidden transition-all hover:shadow-lg cursor-pointer group`}
                                onClick={() => setExpandedCategory(isExpanded ? null : idx)}
                            >
                                <div className="p-6 flex items-center gap-4">
                                    <div className={`size-12 ${colors.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                                        <span className={`material-symbols-outlined ${colors.text} text-2xl`}>{cat.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-black text-dark-800 tracking-tight">{cat.title}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cat.items.length} restricciones</p>
                                    </div>
                                    <span className={`material-symbols-outlined text-gray-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </div>

                                {isExpanded && (
                                    <div className={`px-6 pb-6 animate-in slide-in-from-top-1 duration-200`}>
                                        <div className={`${colors.light} rounded-2xl p-4 space-y-2`}>
                                            {cat.items.map((item, i) => (
                                                <div key={i} className="flex items-start gap-2.5">
                                                    <span className={`material-symbols-outlined text-xs ${colors.text} mt-1`}>do_not_disturb_on</span>
                                                    <span className="text-xs font-medium text-gray-600 leading-relaxed">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Consequences Section */}
                <div className="mt-16 max-w-4xl mx-auto">
                    <h2 className="text-2xl font-black text-dark-800 mb-6 flex items-center gap-3 tracking-tight">
                        <span className="material-symbols-outlined text-red-600">error</span>
                        Consecuencias por Infracción
                    </h2>
                    <div className="bg-white p-8 rounded-[32px] border border-light-200 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="text-center p-6 bg-amber-50 rounded-2xl border border-amber-100">
                                <div className="size-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-amber-600 text-3xl">warning</span>
                                </div>
                                <h4 className="font-black text-dark-800 mb-1 text-sm">1ª Infracción</h4>
                                <p className="text-xs font-medium text-gray-500">Eliminación inmediata de la publicación y advertencia formal.</p>
                            </div>
                            <div className="text-center p-6 bg-orange-50 rounded-2xl border border-orange-100">
                                <div className="size-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-orange-600 text-3xl">timer</span>
                                </div>
                                <h4 className="font-black text-dark-800 mb-1 text-sm">2ª Infracción</h4>
                                <p className="text-xs font-medium text-gray-500">Suspensión temporal de la cuenta por 30 días.</p>
                            </div>
                            <div className="text-center p-6 bg-red-50 rounded-2xl border border-red-100">
                                <div className="size-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-red-600 text-3xl">gavel</span>
                                </div>
                                <h4 className="font-black text-dark-800 mb-1 text-sm">3ª Infracción</h4>
                                <p className="text-xs font-medium text-gray-500">Suspensión permanente y posibles acciones legales.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Report Section */}
                <div className="mt-12 bg-white p-10 rounded-[40px] border border-light-200 text-center">
                    <h3 className="text-lg font-black text-dark-800 uppercase tracking-tight mb-2">¿Viste algo sospechoso?</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Ayudanos a mantener la comunidad segura reportando publicaciones prohibidas.</p>
                    <button
                        onClick={() => navigate('/messages')}
                        className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                    >
                        Reportar una Publicación
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProhibitedItems;
