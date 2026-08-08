import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export const generateProductDescription = async (
  title: string,
  category: string,
  condition: string,
  brand?: string,
  model?: string
): Promise<string> => {
  if (!genAI) {
    throw new Error("VITE_GEMINI_API_KEY no está configurada en .env.local");
  }

  const modelInstance = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Eres un experto copywriter de e-commerce persuasivo y vendedor.
Tu objetivo es escribir una descripción de producto atractiva que impulse la conversión.
Debe tener un tono profesional, entusiasta, confiable y estar bien estructurada con viñetas o pequeños párrafos para fácil lectura.
Usa emojis de forma elegante pero moderada (máximo 2 o 3 en total).

Datos del producto:
- Título: ${title || 'Sin especificar'}
- Categoría: ${category || 'Variedad'}
- Condición: ${condition || 'Usado'}
${brand ? `- Marca: ${brand}` : ''}
${model ? `- Modelo: ${model}` : ''}

Por favor, no incluyas el precio, solo los beneficios, posibles características, por qué es una excelente oportunidad y un call-to-action final (ej: "¡Aprovecha esta oportunidad antes de que se agote!").
Escribe solo la descripción, sin saludos ni aclaraciones previas.`;

  try {
    const result = await modelInstance.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error: any) {
    console.error("Error generando descripción con Gemini:", error);
    
    // Handle rate limit (429) with a user-friendly message
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      const retryMatch = error.message.match(/retry in (\d+)/i);
      const seconds = retryMatch ? retryMatch[1] : '30';
      throw new Error(`Límite de uso alcanzado. Esperá ${seconds} segundos e intentá de nuevo. (Cuota gratuita de Google AI)`);
    }
    
    throw new Error(error.message || "Error al conectar con la IA.");
  }
};
