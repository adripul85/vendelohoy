import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../lib/firebase-admin.js'; // Asumiendo que existe o se adaptará

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, state, error } = req.query;

    // Redirigir de vuelta a settings si hay error o falta data
    if (error || !code || !state) {
        console.error("MP OAuth Error:", error || "Faltan parámetros (code o state)");
        return res.redirect(302, '/settings?mp_error=true');
    }

    const uid = state as string; // El UID del usuario que enviamos en el 'state'
    const clientId = process.env.MP_APP_ID || '';
    const clientSecret = process.env.MP_CLIENT_SECRET || '';
    
    // NOTA: Para Vercel (Production/Preview) la URL host dinámicamente o fijarla
    const redirectUri = `https://${req.headers.host}/api/mercadopago-oauth`;

    try {
        // Intercambiar código por Access Token
        const response = await fetch('https://api.mercadopago.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'authorization_code',
                code: code as string,
                redirect_uri: redirectUri
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("MP OAuth Token Fetch Error:", data);
            return res.redirect(302, '/settings?mp_error=auth_failed');
        }

        // Guardar las claves en el perfil (Firestore Admin Mode)
        await adminDb.collection('users').doc(uid).update({
            "mercadoPagoOAuth": {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                publicKey: data.public_key,
                userId: data.user_id,
                expiresIn: data.expires_in,
                updatedAt: new Date()
            },
            // Auto-completar algunos datos opcionales de reputacion/status
            updatedAt: new Date()
        });

        // Redirigir con exito
        return res.redirect(302, '/settings?mp_success=true');
        
    } catch (err) {
        console.error("MP OAuth Exception:", err);
        return res.redirect(302, '/settings?mp_error=server_error');
    }
}
