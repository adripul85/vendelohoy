import { db, auth } from './firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export interface SearchAlert {
    id?: string;
    uid: string;
    query: string;
    category?: string;
    maxPrice?: number;
    active: boolean;
    createdAt: any;
}

export const saveSearchAlert = async (alertData: Omit<SearchAlert, 'id' | 'createdAt' | 'uid'>) => {
    if (!auth.currentUser) throw new Error('Debes iniciar sesión para guardar alertas');
    
    // Check if it already exists
    const alertsRef = collection(db, 'search_alerts');
    const q = query(alertsRef, where('uid', '==', auth.currentUser.uid), where('query', '==', alertData.query.toLowerCase()));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
        throw new Error('Ya tienes una alerta guardada para esta búsqueda');
    }

    const newAlert = {
        ...alertData,
        uid: auth.currentUser.uid,
        query: alertData.query.toLowerCase(),
        createdAt: serverTimestamp()
    };

    await addDoc(alertsRef, newAlert);
    return true;
};

export const deleteSearchAlert = async (alertId: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'search_alerts', alertId));
};

export const getUserSearchAlerts = async (uid: string) => {
    const alertsRef = collection(db, 'search_alerts');
    const q = query(alertsRef, where('uid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SearchAlert));
};

export const notifySearchAlerts = async (productId: string, productTitle: string, productCategory: string, productPrice: number) => {
    try {
        const alertsRef = collection(db, 'search_alerts');
        const q = query(alertsRef, where('active', '==', true));
        const snap = await getDocs(q);
        
        const notificationsRef = collection(db, 'notifications');
        const titleLower = productTitle.toLowerCase();
        
        for (const docSnap of snap.docs) {
            const alert = docSnap.data() as SearchAlert;
            
            // Check if matches
            let matches = true;
            if (alert.query && !titleLower.includes(alert.query)) {
                matches = false;
            }
            if (alert.category && alert.category !== productCategory) {
                matches = false;
            }
            if (alert.maxPrice && productPrice > alert.maxPrice) {
                matches = false;
            }
            
            if (matches) {
                // Send notification
                await addDoc(notificationsRef, {
                    userId: alert.uid,
                    title: '¡Nueva coincidencia para tu búsqueda!',
                    message: `Se acaba de publicar: ${productTitle} a $${productPrice.toLocaleString()}`,
                    link: `/item/${productId}`,
                    read: false,
                    createdAt: serverTimestamp(),
                    type: 'SEARCH_ALERT',
                    icon: 'notifications_active'
                });
            }
        }
    } catch (error) {
        console.error('Error notifying search alerts:', error);
    }
};
