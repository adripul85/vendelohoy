/**
 * Text processing utilities for VendeloHoy
 * Handles decoding of HTML entities (&oacute;, &ntilde;, &aacute;, etc.) and HTML stripping for clean Spanish text display.
 */

export const decodeHtmlEntities = (text: string): string => {
    if (!text) return '';

    // 1. Try DOM decoding if in browser environment
    if (typeof document !== 'undefined') {
        try {
            const txt = document.createElement('textarea');
            txt.innerHTML = text;
            let decoded = txt.value;

            // Handle double-encoded entities if present (e.g. &amp;oacute;)
            if (decoded.includes('&') && decoded.includes(';')) {
                txt.innerHTML = decoded;
                decoded = txt.value;
            }
            return decoded;
        } catch (e) {
            // Fallback to regex below
        }
    }

    // 2. Comprehensive Regex fallback for Spanish accents and standard HTML entities
    return text
        .replace(/&amp;/g, '&')
        .replace(/&aacute;/g, 'á').replace(/&Aacute;/g, 'Á')
        .replace(/&eacute;/g, 'é').replace(/&Eacute;/g, 'É')
        .replace(/&iacute;/g, 'í').replace(/&Iacute;/g, 'Í')
        .replace(/&oacute;/g, 'ó').replace(/&Oacute;/g, 'Ó')
        .replace(/&uacute;/g, 'ú').replace(/&Uacute;/g, 'Ú')
        .replace(/&ntilde;/g, 'ñ').replace(/&Ntilde;/g, 'Ñ')
        .replace(/&uuml;/g, 'ü').replace(/&Uuml;/g, 'Ü')
        .replace(/&deg;/g, '°')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
};

/**
 * Strips HTML tags AND decodes HTML entities for plain text previews
 */
export const stripHtmlAndDecode = (html: string): string => {
    if (!html) return '';
    const stripped = html.replace(/<[^>]+>/g, '');
    return decodeHtmlEntities(stripped);
};
