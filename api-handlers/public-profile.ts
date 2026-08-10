import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../lib/firebase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const uid = req.query.uid as string | undefined;
        const slug = req.query.slug as string | undefined;

        if (uid) {
            const userRef = adminDb.collection('users').doc(uid);
            const userSnap = await userRef.get();

            if (!userSnap.exists) {
                return res.status(404).json({ error: 'Usuario no encontrado.' });
            }

            const data = userSnap.data();

            const sanitizedData = {
                uid: userSnap.id,
                displayName: data?.displayName,
                avatar: data?.avatar,
                store: data?.store,
                reputation: data?.reputation,
                createdAt: data?.createdAt,
                initials: data?.initials,
                sellerStatus: data?.sellerStatus,
                successfulSales: data?.successfulSales,
                verificationBadges: data?.verificationBadges
            };

            return res.status(200).json(sanitizedData);
        } else if (slug) {
            const usersRef = adminDb.collection('users');
            const querySnapshot = await usersRef
                .where('store.slug', '==', slug)
                .where('store.isActive', '==', true)
                .limit(1)
                .get();

            if (querySnapshot.empty) {
                return res.status(404).json({ error: 'Tienda no encontrada.' });
            }

            const docSnap = querySnapshot.docs[0];
            const data = docSnap.data();

            const sanitizedData = {
                uid: docSnap.id,
                displayName: data?.displayName,
                avatar: data?.avatar,
                store: data?.store,
                reputation: data?.reputation,
                createdAt: data?.createdAt,
                initials: data?.initials,
                sellerStatus: data?.sellerStatus,
                successfulSales: data?.successfulSales,
                verificationBadges: data?.verificationBadges
            };

            return res.status(200).json(sanitizedData);
        }

        return res.status(400).json({ error: 'Falta uid o slug en la consulta.' });

    } catch (error: any) {
        console.error("Public Profile API Error:", error);
        return res.status(500).json({ error: error.message || 'Error interno al obtener el perfil.' });
    }
}
