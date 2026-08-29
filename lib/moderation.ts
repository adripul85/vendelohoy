export interface ModerationResult {
    isClean: boolean;
    flags: string[];
    reason: string;
}

const FORBIDDEN_WORDS = [
    'arma', 'droga', 'réplica', 'pirata', 'falso', 'estafa', 'fraude'
];

const PHONE_REGEX = /(\+?54\s?9?)?(\s?0?11|\s?0?15|\s?0?[2-9]\d{2})\s?-?\s?\d{4}\s?-?\s?\d{4}/g;
const LINK_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})/gi;
const SOCIAL_REGEX = /(@[a-zA-Z0-9_]+)|(instagram\.com\/[^\s]+)|(facebook\.com\/[^\s]+)|(wa\.me\/[^\s]+)|(t\.me\/[^\s]+)/gi;

export function scanContent(text: string): ModerationResult {
    if (!text) return { isClean: true, flags: [], reason: '' };

    const flags: string[] = [];
    const lowerText = text.toLowerCase();

    for (const word of FORBIDDEN_WORDS) {
        if (lowerText.includes(word)) {
            flags.push('Palabra Prohibida (' + word + ')');
        }
    }

    if (PHONE_REGEX.test(text)) {
        flags.push('Posible Número de Teléfono (Evite compartir contactos)');
    }

    if (LINK_REGEX.test(text)) {
        flags.push('Enlace Externo o Email prohibido');
    }

    if (SOCIAL_REGEX.test(text)) {
        flags.push('Mención a Redes Sociales');
    }

    const isClean = flags.length === 0;
    return {
        isClean,
        flags: Array.from(new Set(flags)),
        reason: isClean ? '' : 'Detectado: ' + Array.from(new Set(flags)).join(', ')
    };
}
