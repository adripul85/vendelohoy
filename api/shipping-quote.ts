import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../lib/firebase-admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { pickupAddress, dropoffAddress, provider } = req.body;

        if (!pickupAddress || !dropoffAddress) {
            return res.status(400).json({ error: 'Direcciones incompletas' });
        }

        // TODO: Reemplazar con llamadas reales a la API cuando estén las credenciales configuradas
        // Uber: POST /v1/deliveries/quote
        // Cabify: POST /api/v2/estimates
        
        console.log(`[SANDBOX] Cotizando envío por ${provider || 'generico'}`);
        console.log(`Origen:`, pickupAddress);
        console.log(`Destino:`, dropoffAddress);

        // Mock: Distancia simulada basada en un string hash (para ser determinista en pruebas)
        const combined = JSON.stringify(pickupAddress) + JSON.stringify(dropoffAddress);
        let distanceKm = 0;
        for (let i = 0; i < combined.length; i++) {
            distanceKm += combined.charCodeAt(i);
        }
        distanceKm = (distanceKm % 15) + 2; // Distancia entre 2 y 16 km

        const baseFare = provider === 'cabify' ? 1500 : 1800;
        const perKmFare = provider === 'cabify' ? 250 : 300;
        const totalFare = baseFare + (distanceKm * perKmFare);

        // Simulamos el payload real de respuesta
        return res.status(200).json({
            success: true,
            provider: provider || 'uber',
            quoteId: `qte_${Math.random().toString(36).substring(2, 9)}`,
            currency: 'ARS',
            amount: totalFare,
            estimatedDistanceKm: distanceKm,
            expiresAt: new Date(Date.now() + 15 * 60000).toISOString() // 15 minutos
        });

    } catch (error: any) {
        console.error('Error fetching quote:', error);
        return res.status(500).json({ error: 'Error al cotizar el envío' });
    }
}
