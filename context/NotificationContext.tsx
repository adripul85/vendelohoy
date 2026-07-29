import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface Notification {
    id: number;
    type: 'success' | 'info' | 'error' | 'warning';
    title: string;
    message: string;
    icon: string;
}

interface NotificationContextType {
    notify: (n: Omit<Notification, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within a NotificationProvider');
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const notify = useCallback((n: Omit<Notification, 'id'>) => {
        setNotifications(prev => {
            if (prev.some(item => item.title === n.title && item.message === n.message)) {
                return prev;
            }
            return [...prev, { ...n, id: Date.now() + Math.floor(Math.random() * 1000) }];
        });
    }, []);

    const dismiss = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ notify }}>
            <div className="fixed top-24 right-6 z-[100] w-full max-w-sm pointer-events-none flex flex-col items-end">
                {notifications.map(n => <NotificationItem key={n.id} notification={n} onDismiss={dismiss} />)}
            </div>
            {children}
        </NotificationContext.Provider>
    );
};

const NotificationItem: React.FC<{ notification: Notification; onDismiss: (id: number) => void }> = ({ notification, onDismiss }) => {
    const styles = {
        success: 'bg-blue-50 text-blue-900 border-blue-100',
        info: 'bg-indigo-50 text-indigo-900 border-indigo-100',
        warning: 'bg-amber-50 text-amber-900 border-amber-100',
        error: 'bg-red-50 text-red-900 border-red-100',
    };

    useEffect(() => {
        const timer = setTimeout(() => onDismiss(notification.id), 5000);
        return () => clearTimeout(timer);
    }, [notification.id, onDismiss]);

    return (
        <div className={`flex items-start gap-4 p-5 rounded-2xl border shadow-premium mb-4 cursor-pointer transition-all hover:scale-[1.02] pointer-events-auto ${styles[notification.type]}`}
            onClick={() => onDismiss(notification.id)}>
            <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${notification.type === 'success' ? 'bg-blue-600 text-white' : 'bg-white'}`}>
                <span className="material-symbols-outlined text-xl">{notification.icon}</span>
            </div>
            <div>
                <h4 className="font-black text-sm leading-none mb-1">{notification.title}</h4>
                <p className="font-bold text-xs opacity-70 leading-tight">{notification.message}</p>
            </div>
        </div>
    );
};
