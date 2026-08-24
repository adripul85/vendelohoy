import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../lib/firebase-admin.js';

const SOCIAL_BOT_AGENTS = [
    'facebookexternalhit',
    'twitterbot',
    'whatsapp',
    'telegrambot',
    'linkedinbot',
    'pinterestbot',
    'slackbot',
    'discordbot',
    'vkshare',
    'googlebot'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isSocialBot = SOCIAL_BOT_AGENTS.some(bot => userAgent.includes(bot));

    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || '';
    
    if (!host) {
        return res.status(400).send('Bad Request');
    }

    let baseUrl = `${proto}://${host}`;

    try {
        // Fetch static index.html from vercel edge cache
        const fetchRes = await fetch(`${baseUrl}/index.html`);
        let html = await fetchRes.text();

        // If bot, and requesting product or shop route
        if (isSocialBot && req.query.id) {
            const productId = req.query.id as string;
            const docRef = adminDb.collection('items').doc(productId);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                const data = docSnap.data() as any;
                const title = `${data.title} | deOportunidades`;
                const description = data.description || 'Encuentra este y otros productos increíbles en deOportunidades.';
                const imageUrl = data.images && data.images.length > 0 ? data.images[0] : `${baseUrl}/logo.png`;
                const url = `${baseUrl}/product/${productId}`;

                const metaTags = `
                    <title>${title}</title>
                    <meta name="description" content="${description}" />
                    <meta property="og:title" content="${title}" />
                    <meta property="og:description" content="${description}" />
                    <meta property="og:image" content="${imageUrl}" />
                    <meta property="og:url" content="${url}" />
                    <meta property="og:type" content="product" />
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:title" content="${title}" />
                    <meta name="twitter:description" content="${description}" />
                    <meta name="twitter:image" content="${imageUrl}" />
                `;

                html = html.replace('</head>', `${metaTags}\n</head>`);
            }
        } else if (isSocialBot && req.query.slug) {
            const slug = req.query.slug as string;
            const shopQuery = await adminDb.collection('users').where('storeSlug', '==', slug).limit(1).get();
            let shopData = null;
            
            if (!shopQuery.empty) {
                shopData = shopQuery.docs[0].data();
            } else {
                const userDoc = await adminDb.collection('users').doc(slug).get();
                if (userDoc.exists) shopData = userDoc.data();
            }

            if (shopData) {
                const storeName = shopData.storeName || shopData.displayName || 'Vendedor';
                const title = `Tienda de ${storeName} | deOportunidades`;
                const description = shopData.bio || `Descubre los productos que ${storeName} tiene a la venta en deOportunidades.`;
                const imageUrl = shopData.photoURL || `${baseUrl}/logo.png`;
                const url = `${baseUrl}/shop/${slug}`;

                const metaTags = `
                    <title>${title}</title>
                    <meta name="description" content="${description}" />
                    <meta property="og:title" content="${title}" />
                    <meta property="og:description" content="${description}" />
                    <meta property="og:image" content="${imageUrl}" />
                    <meta property="og:url" content="${url}" />
                    <meta property="og:type" content="profile" />
                    <meta name="twitter:card" content="summary" />
                    <meta name="twitter:title" content="${title}" />
                    <meta name="twitter:description" content="${description}" />
                    <meta name="twitter:image" content="${imageUrl}" />
                `;

                html = html.replace('</head>', `${metaTags}\n</head>`);
            }
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
        return res.status(200).send(html);
        
    } catch (error) {
        console.error('Error generating SEO proxy HTML:', error);
        res.redirect('/');
    }
}
