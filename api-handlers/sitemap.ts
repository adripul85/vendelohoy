import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

// Verificamos si estamos en Vercel (que usa process.env)
const isVercel = !!process.env.VERCEL;

// Vercel y Node leen process.env. Vite lee import.meta.env, así que necesitamos este fallback
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // En Vercel, req.headers.host te da el dominio actual exacto
        const host = req.headers.host || 'vendelohoy.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // Página principal
        xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

        // Páginas estáticas importantes
        const staticPages = ['/search', '/legal/terms', '/legal/privacy'];
        for (const page of staticPages) {
            xml += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        }

        // Productos dinámicos (solo activos)
        // Optimizamos obteniendo solo los productos que están activos
        const itemsRef = collection(db, "items");
        const q = query(itemsRef, where("status", "==", "active"));
        const itemsSnapshot = await getDocs(q);

        itemsSnapshot.forEach((doc) => {
            const updatedAt = doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString();
            xml += `  <url>\n    <loc>${baseUrl}/product/${doc.id}</loc>\n    <lastmod>${updatedAt.split('T')[0]}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
        });

        xml += `</urlset>`;

        // Cache por 1 hora en Vercel CDN para no consultar Firestore constantemente
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        res.setHeader('Content-Type', 'text/xml');
        res.status(200).send(xml);
    } catch (error) {
        console.error("Sitemap generation error:", error);
        res.status(500).send("Error generando sitemap");
    }
}
