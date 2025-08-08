import React, { createContext, useContext } from 'react';
import { useNotificationSetup } from '@/hooks/useNotificationSetup';
import { usePushNotifications } from '@/hooks/usePushNotifications';

type NotificationContextType = {
    sendNotification: (title: string, body: string, data?: any) => Promise<void>;
    showLocalNotification: (title: string, body: string, data?: any) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType>({
    sendNotification: async () => { },
    showLocalNotification: async () => { },
});

export function useNotifications() {
    return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    // Set up notification system
    useNotificationSetup();

    // Get notification functionality
    const { sendNotification, showLocalNotification } = usePushNotifications();

    return (
        <NotificationContext.Provider value={{ sendNotification, showLocalNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}