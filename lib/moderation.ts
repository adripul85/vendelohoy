export interface ModerationResult {
    isClean: boolean;
    flags: string[];
    reason: string;
}

const FORBIDDEN_WORDS = [
    'arma', 'droga', 'replica', 'pirata', 'falso', 'estafa', 'fraude'
];

// Patrones precisos de telefonos argentinos para evitar falsos positivos con modelos o especificaciones
const PHONE_PATTERNS = [
    // 1. Con codigo internacional (+54 9 11 ... o +54 11 ...)
    /\+54\s?9?\s?0?\d{1,4}\s?[-.]?\s?\d{3,4}\s?[-.]?\s?\d{4}\b/,
    // 2. Buenos Aires AMBA (011 o 15 seguido de 8 digitos reales de telefono)
    /\b(?:011|15)\s?[-.]?\s?\d{4}\s?[-.]?\s?\d{4}\b/,
    /\b(?:011|15)\s?[-.]?\s?\d{8}\b/,
    // 3. Ciudades principales (221, 351, 341, etc) con 7 digitos
    /\b0?(?:221|223|261|299|341|342|351|381|387)\s?[-.]?\s?(?:15\s?[-.]?\s?)?\d{3}\s?[-.]?\s?\d{4}\b/,
    // 4. Frase explicita de contacto con numeros (ej: "mi cel es...", "wsp al 11...", "llamame al...")
    /(?:cel|celu|tel|telefono|celular|whatsapp|wpp|wsp|llamame|comunicate|escribime|mi\s*num(?:ero)?|mi\s*nro)(?:\s+al|\s*:|\s+a|\s+por)?\s*[:\s]*\+?[0-9\s.-]{8,15}\b/i
];

// Enlaces externos (ignora enlaces internos)
const LINK_REGEX = /(?:https?:\/\/|www\.)(?!vendelohoy\.)[^\s]+|([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})/i;

// Redes sociales y mensajeria externa
const SOCIAL_REGEX = /(@[a-zA-Z][a-zA-Z0-9_]{2,})|(?:instagram\.com\/[^\s]+)|(?:facebook\.com\/[^\s]+)|(?:wa\.me\/[^\s]+)|(?:t\.me\/[^\s]+)|(?:\b(?:whatsapp|wpp|wsp|telegram)\b(?!\s*compatible|\s*notificaciones))/i;

// Direcciones fisicas solo antes del pago en salas de canje
const ADDRESS_EVASION_WORDS = [
    'mi direccion es', 'vivo en calle', 'entre calles', 'esquina'
];

export function scanContent(text: string, isTradePreFee: boolean = false): ModerationResult {
    if (!text) return { isClean: true, flags: [], reason: '' };

    // Limpiar etiquetas HTML para no evaluar atributos o estilos de TinyMCE
    const plainText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plainText) return { isClean: true, flags: [], reason: '' };

    const flags: string[] = [];
    const lowerText = plainText.toLowerCase();

    for (const word of FORBIDDEN_WORDS) {
        // Coincidencia exacta de palabra o rodeada de espacios
        const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
        if (wordRegex.test(lowerText)) {
            flags.push(`Palabra Prohibida (${word})`);
        }
    }

    const hasPhone = PHONE_PATTERNS.some(regex => regex.test(plainText));
    if (hasPhone) {
        flags.push('Número de Teléfono o Contacto externo detectado');
    }

    if (LINK_REGEX.test(plainText)) {
        flags.push('Enlace Externo o Email prohibido');
    }

    if (SOCIAL_REGEX.test(plainText)) {
        flags.push('Mención a Redes Sociales o WhatsApp');
    }

    if (isTradePreFee) {
        for (const addrWord of ADDRESS_EVASION_WORDS) {
            if (lowerText.includes(addrWord)) {
                flags.push('Dirección Física (Desbloqueable tras abonar el Fee de Garantía)');
            }
        }
    }

    const isClean = flags.length === 0;
    return {
        isClean,
        flags: Array.from(new Set(flags)),
        reason: isClean ? '' : 'Protocolo de Seguridad: ' + Array.from(new Set(flags)).join(', ')
    };
}
