---
name: De Oportunidades
description: Marketplace moderno, confiable y dinámico con Escrow y Envíos Sinceros
colors:
  primary: "#4F46E5"
  primary-vibrant: "#4338CA"
  primary-container: "#E0E7FF"
  on-primary-container: "#3730A3"
  secondary: "#FF5A1F"
  secondary-container: "#FFEDD5"
  on-secondary-container: "#C2410C"
  surface: "#ffffff"
  surface-dim: "#f3f4f6"
  surface-container: "#f3f4f6"
  surface-container-high: "#e5e7eb"
  on-surface: "#111827"
  on-surface-variant: "#4b5563"
  outline: "#9CA3AF"
  error: "#DC2626"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.1
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
rounded:
  xl: "0.75rem"
  2xl: "1rem"
  3xl: "1rem"
  4xl: "1.5rem"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "16px 32px"
  button-secondary:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "16px 32px"
  input-field:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "16px 24px"
  card-gallery:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "0px"
---

# Design System: De Oportunidades

## Overview

**Creative North Star: "El Mercado Transparente y Vibrante"**

De Oportunidades combina la solidez y seriedad de un sistema financiero en garantía (Escrow) con el dinamismo y calidez de un comercio local accesible. Su estética se aleja de los marketplaces genéricos y aburridos para ofrecer una interfaz audaz, limpia y con profundidad táctil. Utiliza superficies claras ("surface-bright"), acentos intensos en índigo ("primary") y naranja vibrante ("secondary"), acompañados de micro-animaciones (flotación, reflejos glassmorphism) y sombras suaves que generan confianza y modernidad en cada paso del comprador o vendedor.

**Key Characteristics:**
- **Transparencia Visual:** Contenedores claros con bordes sutiles y efectos de vidrio (`glass`) que refuerzan el mensaje de honestidad (Envíos Sinceros, Escrow).
- **Acentos Enérgicos:** Uso de Índigo (#4F46E5) para la acción principal y Naranja Vibrante (#FF5A1F) para promociones u ofertas destacadas (como Ofertas Flash 48Hs).
- **Profundidad Táctil:** Sombras editoriales suaves (`editorial-shadow` y `premium`) y micro-interacciones al hacer hover (`-translate-y-1`) en tarjetas de producto y botones.

## Colors

La paleta se equilibra entre blancos puros, grises modernos y dos tonos de acento con fuerte contraste para guiar la decisión del comprador sin generar saturación.

### Primary
- **Índigo Confiable** (#4F46E5): Color principal para llamadas a la acción primarias, botones de compra, confirmaciones de pago en garantía y elementos interactivos de confianza.
- **Índigo Vibrante** (#4338CA): Estado hover de botones primarios y acentos profundos.
- **Contenedor Índigo** (#E0E7FF): Fondos suaves para insignias de confianza o secciones destacadas del vendedor.

### Secondary
- **Naranja Oportunidad** (#FF5A1F): Utilizado estratégicamente para llamar la atención en promociones de tiempo limitado (Oportunidades Flash 48Hs), etiquetas de descuento y llamadas a la acción secundarias enérgicas.
- **Contenedor Naranja** (#FFEDD5): Fondos suaves para alertas amigables o destacadas promocionales.

### Neutral
- **Superficie Blanca** (#ffffff): Fondo principal de tarjetas de galería (`card-gallery`) y modales.
- **Superficie Atenuada** (#f3f4f6): Fondo global de la aplicación (`body`) que hace resaltar a las tarjetas blancas.
- **Texto Principal** (#111827): Gris oscuro casi negro para máxima legibilidad en títulos y cuerpos de texto.
- **Texto Secundario** (#4b5563): Para descripciones, notas legales de MPN o subtítulos de envíos.

### Named Rules
**The Honest Surface Rule.** Las superficies interactuables (tarjetas de producto, desglose de costos de envío o cálculo de comisiones) deben estar contenidas en fondos blancos limpios con bordes definidos (`border-slate-100` o `border-slate-200`) para transmitir orden y total claridad. Nunca ocultar costos ni desgloses en fondos opacos o confusos.

## Typography

**Display Font:** Manrope (sans-serif)
**Body Font:** Plus Jakarta Sans (sans-serif)

**Character:** La combinación de Manrope en titulares aporta una geometría moderna, profesional y contundente, mientras que Plus Jakarta Sans en el cuerpo de texto ofrece una legibilidad amable, limpia y sumamente amigable para el comercio electrónico desde móviles y computadoras.

### Hierarchy
- **Display** (700, clamp(2rem, 5vw, 3.5rem), 1.1): Para titulares principales en el Hero del Home o banners de campañas.
- **Headline** (700, 1.75rem, 1.2): Títulos de sección ("Oportunidades Flash 48Hs", "Productos Destacados").
- **Title** (600, 1.25rem, 1.3): Nombres de productos en tarjetas y modales.
- **Body** (400, 1rem, 1.5): Textos descriptivos de artículos, políticas de Escrow y detalles de envío.
- **Label** (600, 0.875rem, 1.25): Etiquetas en botones (`btn-primary`), insignias y micro-copias explicativas (como la leyenda de MPN o comisiones offline).

### Named Rules
**The Clear Price Rule.** Los importes monetarios y precios siempre deben presentarse con tipografía en peso Bold o Extra-bold y un contraste excelente contra el fondo. En caso de promociones u ofertas flash, el precio anterior y el descuento deben diferenciarse claramente con tamaño y color (gris tachado para el anterior, naranja o primary para el actual).

## Layout

El layout sigue un sistema responsivo basado en contenedores centrados con padding lateral adaptativo. Las grillas de productos se adaptan de 1 columna en móviles a 4 o 5 en pantallas de escritorio, manteniendo un espaciado uniforme (`gap-6` o `gap-8`) para permitir respirar al contenido visual.

## Elevation & Depth

El sistema emplea un modelo híbrido de capas claras ("layered") y elevación táctil en interacciones. A reposo, la mayoría de contenedores son planos con bordes sutiles; al interactuar con ellos, se elevan visual y físicamente con transformaciones de posición.

### Shadow Vocabulary
- **editorial-shadow** (`box-shadow: 0 10px 32px -4px rgba(26, 28, 30, 0.04)`): Sombras ambientales suaves para barras de confianza, navegación y paneles destacados.
- **premium** (`box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05)`): Sombra aplicada en hover sobre tarjetas de productos (`card-gallery`) para dar un efecto de despegue.
- **glass** (`box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.03)`): Acompaña a superficies con desenfoque de fondo (`backdrop-blur`) en cabeceras o banners flotantes.

### Named Rules
**The Interactive Lift Rule.** Todo elemento cliqueable principal (botones primarios y secundarios, tarjetas de productos en el Home o tienda) debe tener una retroalimentación física al hacer hover, combinando un ligero cambio en sombra (`hover:shadow-md` o `shadow-premium`) con un desplazamiento vertical hacia arriba (`-translate-y-0.5` o `-translate-y-1`).

## Shapes

Las formas son consistentemente redondeadas, amigables y contemporáneas.
- **Tarjetas y Contenedores Mayores:** `rounded-2xl` (16px) a `rounded-3xl` (16px-24px), transmitiendo suavidad y diseño actual.
- **Botones y Campos de Entrada:** `rounded-xl` (12px), uniendo ergonomía en pantallas táctiles con aspecto pulido.
- **Insignias y Etiquetas (Chips):** `rounded-full` para etiquetas pequeñas o promocionales.

## Components

### Buttons
- **Shape:** Redondeado moderno (`rounded-xl`, 12px).
- **Primary:** Fondo Índigo (#4F46E5), texto blanco en Bold (`font-bold`), padding generoso (`px-8 py-4`), con sombra discreta.
- **Hover / Focus:** Transición suave de 300ms, opacidad al 90% y elevación `-translate-y-0.5`.
- **Secondary:** Fondo Índigo claro / Naranja claro (`secondary-container`), texto en gris oscuro, borde sutil (`border-slate-200`). Ideal para acciones opcionales como "Destacar Producto".
- **Tertiary / Ghost:** Fondo transparente, texto en color primario, hover con fondo gris muy claro (`surface-container-low`).

### Cards / Containers
- **Corner Style:** `rounded-2xl` (16px).
- **Background:** Blanco puro (`bg-surface`).
- **Shadow Strategy:** Plano con borde sutil en reposo (`border-slate-100`), elevación `shadow-premium` al hacer hover.
- **Internal Padding:** `p-4` a `p-6` según jerarquía.

### Inputs / Fields
- **Style:** Fondo ligeramente atenuado (`bg-surface-container`), borde gris claro (`border-slate-200`), esquinas `rounded-xl`.
- **Focus:** El fondo pasa a blanco puro (`bg-surface`), el borde adopta el color Índigo primario y aparece un anillo de enfoque suave (`ring-2`).

## Do's and Don'ts

### Do:
- **Do** utilizar el fondo gris suave (`#f3f4f6`) para la página general para que las tarjetas de productos en blanco puro (`#ffffff`) destaquen con nitidez.
- **Do** aplicar transiciones suaves (`duration-300`) en hovers y estados interactivos de botones y tarjetas.
- **Do** mostrar explicaciones claras (leyendas explicativas, qué significa MPN, comisiones offline del 10% en ofertas flash) con tipografía de peso medio o semibold y en contenedores limpios.

### Don't:
- **Don't** mezclar colores genéricos o chillones; utilizar estrictamente la paleta basada en Índigo Confiable (#4F46E5) y Naranja Oportunidad (#FF5A1F).
- **Don't** dejar tarjetas de productos sin estado hover; el dinamismo es clave para que el marketplace se sienta vivo.
- **Don't** usar sombras negras y pesadas; emplear siempre sombras ambientales con muy baja opacidad (`rgba(0, 0, 0, 0.04)` a `0.05`).
