import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, limit, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { useNotification } from '../context/NotificationContext';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    createdAt: any;
    link?: string;
}

export const useFirestoreNotifications = () => {
    const { user } = useAuth();
    const { notify } = useNotification();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const initialLoadRef = useRef(true);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, `users/${user.uid}/notifications`),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!initialLoadRef.current) {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const notif = change.doc.data() as AppNotification;
                        if (!notif.read) {
                            notify({
                                title: notif.title,
                                message: notif.message,
                                type: notif.type === 'alert' ? 'error' : notif.type as any,
                                icon: notif.type === 'success' ? 'check_circle' : 'notifications_active'
                            });
                        }
                    }
                });
            } else {
                initialLoadRef.current = false;
            }

            const newNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AppNotification[];

            setNotifications(newNotifications);
            setUnreadCount(newNotifications.filter(n => !n.read).length);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const markAsRead = async (notificationId: string) => {
        if (!user) return;
        try {
            const notifRef = doc(db, `users/${user.uid}/notifications`, notificationId);
            await updateDoc(notifRef, { read: true });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        if (!user || notifications.length === 0) return;
        try {
            const batch = writeBatch(db);
            notifications.forEach(n => {
                if (!n.read) {
                    const ref = doc(db, `users/${user.uid}/notifications`, n.id);
                    batch.update(ref, { read: true });
                }
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const clearAllNotifications = async () => {
        if (!user || notifications.length === 0) return;
        try {
            const batch = writeBatch(db);
            notifications.forEach(n => {
                const ref = doc(db, `users/${user.uid}/notifications`, n.id);
                batch.delete(ref);
            });
            await batch.commit();
        } catch (error) {
            console.error("Error clearing notifications:", error);
        }
    };

    return { notifications, unreadCount, loading, markAsRead, markAllAsRead, clearAllNotifications };
};
