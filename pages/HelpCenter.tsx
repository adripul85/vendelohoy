import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const HELP_CATEGORIES = [
  {
    id: 'publicar',
    title: 'Cómo publicar un artículo',
    icon: 'post_add',
    articles: [
      {
        id: 'pasos-publicar',
        title: 'Pasos para publicar tu producto gratis',
        content: `
          <p class="mb-4">Publicar en <strong>Vendelo Hoy</strong> es rápido, fácil y 100% gratuito. No cobramos comisiones por venta.</p>
          <ol class="list-decimal pl-5 space-y-2 mb-4 text-sm">
            <li>Ingresá a tu cuenta y hacé clic en el botón <strong>"Publicar"</strong> en el menú principal.</li>
            <li>Elegí un buen título. La fórmula ideal es: <strong>Producto + Marca + Modelo + Detalles importantes</strong>. Por ejemplo: <em>"Bicicleta Mountain Bike Trek Marlin 5 Rodado 29"</em>.</li>
            <li>Seleccioná la categoría correspondiente.</li>
            <li>Agregá un precio competitivo. Si querés vender más rápido, investigá los precios de artículos similares.</li>
            <li>Completá la descripción siendo lo más honesto y detallista posible sobre el estado del producto.</li>
            <li>Subí fotos claras y publicá.</li>
          </ol>
          <p class="text-sm">¡Listo! Tu producto ya estará visible para toda la comunidad.</p>
        `
      },
      {
        id: 'fotos',
        title: 'Consejos para subir fotos y destacar tu producto',
        content: `
          <p class="mb-4">Una buena foto es la clave para vender más rápido. Seguí estos consejos:</p>
          <ul class="list-disc pl-5 space-y-2 mb-4 text-sm">
            <li><strong>Buena iluminación:</strong> Sacá las fotos de día con luz natural. Evitá usar flash si no es necesario.</li>
            <li><strong>Fondo neutro:</strong> Usá una pared blanca, una sábana lisa o una cartulina para que nada distraiga la atención del producto.</li>
            <li><strong>Múltiples ángulos:</strong> Mostrá el producto de frente, de atrás, y hacé acercamientos a detalles importantes.</li>
            <li><strong>Estado real:</strong> Si el producto tiene algún rayón o detalle, mostralo en las fotos. La honestidad evita reclamos y devoluciones.</li>
            <li><strong>Sin datos personales:</strong> No incluyas números de teléfono, marcas de agua ni links en las imágenes. Todo se coordina por WhatsApp una vez iniciado el trato.</li>
          </ul>
        `
      }
    ]
  },
  {
    id: 'comprar',
    title: 'Cómo comprar y pagar',
    icon: 'shopping_bag',
    articles: [
      {
        id: 'pagos-entregas',
        title: 'Cómo funcionan las entregas y los pagos',
        content: `
          <p class="mb-4">En <strong>Vendelo Hoy</strong> priorizamos el contacto humano y la seguridad de ambas partes.</p>
          <h4 class="font-bold mb-2 text-sm text-primary">Coordinación por WhatsApp y Encuentros Presenciales</h4>
          <p class="text-sm mb-4">A diferencia de otras plataformas, nosotros no gestionamos envíos automáticos. Una vez que decidís comprar un artículo, se abre un chat directo de WhatsApp con el vendedor. Allí coordinan un lugar público y seguro para realizar la entrega cara a cara (por ejemplo: un shopping, una plaza concurrida, o una estación).</p>
          
          <h4 class="font-bold mb-2 text-sm text-primary">Pagos Seguros (Sistema Escrow)</h4>
          <p class="text-sm mb-4">Si decidís usar nuestro sistema de pagos integrado, tu dinero estará protegido. Funciona así:</p>
          <ol class="list-decimal pl-5 space-y-2 mb-4 text-sm">
            <li>Pagás el producto a través de la plataforma.</li>
            <li><strong>El dinero queda retenido y seguro</strong> en nuestra cuenta. El vendedor no lo recibe de inmediato.</li>
            <li>Te encontrás con el vendedor, revisás el producto y te asegurás de que esté todo en orden.</li>
            <li>Al confirmar la recepción en la plataforma, <strong>liberamos el dinero al vendedor</strong>.</li>
            <li>Si el producto no es lo que esperabas en el momento del encuentro, cancelás el trato y te devolvemos el 100% de tu dinero.</li>
          </ol>
        `
      }
    ]
  },
  {
    id: 'costos',
    title: 'Costos y Comisiones',
    icon: 'payments',
    articles: [
      {
        id: 'comisiones',
        title: '¿Cuánto cuesta vender?',
        content: `
          <p class="mb-4">En <strong>Vendelo Hoy</strong> somos transparentes con nuestros costos operativos:</p>
          <ul class="list-disc pl-5 space-y-4 mb-4 text-sm">
            <li><strong>Publicar es gratis:</strong> Podés subir todos los artículos que quieras sin pagar nada.</li>
            <li><strong>Comisión por Venta Segura (Escrow): 10%</strong>. Esta tarifa se deduce automáticamente de tus ganancias al momento de liberar los fondos. Cubre el servicio de retención segura de dinero, mediación y soporte.</li>
            <li><strong>Cargos de Mercado Pago:</strong> Al procesar los pagos a través de Mercado Pago, aplican las comisiones vigentes de su pasarela, las cuales son retenidas directamente por ellos.</li>
          </ul>
          <p class="text-sm mt-4">Podés revisar el detalle completo en nuestra sección de <a href="/legal/costs" class="text-primary font-bold hover:underline">Términos y Costos</a>.</p>
        `
      }
    ]
  },
  {
    id: 'seguridad',
    title: 'Seguridad y Confianza',
    icon: 'shield',
    articles: [
      {
        id: 'reglas-convivencia',
        title: 'Reglas de convivencia y productos prohibidos',
        content: `
          <p class="mb-4">Para mantener una comunidad segura y confiable, tenemos ciertas reglas:</p>
          <ul class="list-disc pl-5 space-y-2 mb-4 text-sm">
            <li>El respeto mutuo es obligatorio en los chats y encuentros.</li>
            <li><a href="/legal/prohibited" class="font-bold text-primary hover:underline">Artículos prohibidos:</a> No se pueden publicar armas, medicamentos, réplicas falsificadas, ni servicios ilegales. Las publicaciones que infrinjan esto serán eliminadas permanentemente.</li>
            <li>Evitá enviar dinero por transferencias directas antes de ver el producto si no conocés al vendedor. Usá nuestro sistema de pago seguro siempre que sea posible.</li>
            <li>Revisá bien el producto en el punto de encuentro antes de confirmar la entrega.</li>
          </ul>
        `
      }
    ]
  }
];

export default function HelpCenter() {
  const [activeCategory, setActiveCategory] = useState(HELP_CATEGORIES[0].id);
  const [activeArticle, setActiveArticle] = useState<string | null>(HELP_CATEGORIES[0].articles[0].id);

  const currentCategoryObj = HELP_CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen pb-20">
      {/* Header Banner */}
      <div className="bg-surface-bright pt-12 pb-24 px-6 relative overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 bg-mesh-aura opacity-30 pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Link to="/" className="text-slate-400 hover:text-on-surface transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Volver al inicio</span>
              </Link>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mb-4">
              ¿En qué podemos <span className="text-primary">ayudarte?</span>
            </h1>
            <p className="text-on-surface-variant max-w-xl text-lg">
              Encontrá guías, consejos y respuestas a las preguntas más frecuentes de nuestra comunidad.
            </p>
          </div>
          
          <div className="w-full md:w-auto relative hidden md:block">
             <div className="size-48 bg-primary-container rounded-full flex items-center justify-center animate-float">
                <span className="material-symbols-outlined text-8xl text-primary">support_agent</span>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar / Categories */}
          <div className="lg:col-span-4 bg-white rounded-3xl shadow-premium border border-slate-100 p-4 sticky top-24">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 px-4 pt-2">Categorías</h3>
            <div className="flex flex-col gap-2">
              {HELP_CATEGORIES.map(category => {
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                        setActiveCategory(category.id);
                        setActiveArticle(category.articles[0]?.id || null);
                    }}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${isActive ? 'bg-primary text-white shadow-md' : 'hover:bg-surface-container text-on-surface-variant'}`}
                  >
                    <span className="material-symbols-outlined">{category.icon}</span>
                    <span className="font-bold">{category.title}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-8 px-4 pb-2">
                <div className="bg-surface-container rounded-2xl p-5 border border-slate-100">
                    <h4 className="font-bold text-sm text-on-surface mb-2">¿Necesitás ayuda con una compra?</h4>
                    <p className="text-xs text-on-surface-variant mb-4">Si tuviste un problema con un pedido o entrega, podés gestionarlo desde el Centro de Resolución.</p>
                    <Link to="/resolution-center" className="text-[11px] font-black uppercase tracking-widest text-primary hover:text-primary-vibrant flex items-center gap-1">
                        Ir al Centro de Resolución <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                </div>
            </div>
          </div>

          {/* Articles */}
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden min-h-[500px]">
            {currentCategoryObj && (
                <div className="flex flex-col h-full">
                    {/* Article Headers */}
                    <div className="border-b border-slate-100 p-2 flex overflow-x-auto hide-scrollbar">
                        {currentCategoryObj.articles.map(article => {
                            const isArticleActive = activeArticle === article.id;
                            return (
                                <button
                                    key={article.id}
                                    onClick={() => setActiveArticle(article.id)}
                                    className={`px-6 py-4 whitespace-nowrap text-sm font-bold transition-colors border-b-2 ${isArticleActive ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-on-surface hover:bg-slate-50'}`}
                                >
                                    {article.title}
                                </button>
                            );
                        })}
                    </div>
                    
                    {/* Article Content */}
                    <div className="p-8 md:p-12">
                        <AnimatePresence mode="wait">
                            {currentCategoryObj.articles.map(article => {
                                if (article.id !== activeArticle) return null;
                                return (
                                    <motion.div
                                        key={article.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="prose prose-slate max-w-none"
                                    >
                                        <h2 className="text-2xl font-black text-on-surface mb-6 font-display leading-tight">{article.title}</h2>
                                        <div 
                                            className="text-on-surface-variant leading-relaxed space-y-4"
                                            dangerouslySetInnerHTML={{ __html: article.content }} 
                                        />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
