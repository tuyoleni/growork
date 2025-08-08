import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { sendPushNotification, scheduleLocalNotification } from '@/utils/notifications';

export function usePushNotifications() {
    const [notification, setNotification] = useState<Notifications.Notification>();
    const [pushToken, setPushToken] = useState<string>();

    useEffect(() => {
        // Listen for incoming notifications
        const subscription = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        return () => subscription.remove();
    }, []);

    // Send a push notification
    const sendNotification = async (title: string, body: string, data?: any) => {
        if (!pushToken) {
            console.warn('No push token available');
            return;
        }
        await sendPushNotification(pushToken, title, body, data);
    };

    // Schedule a local notification
    const showLocalNotification = async (title: string, body: string, data?: any) => {
        await scheduleLocalNotification(title, body, data);
    };

    return {
        notification,
        pushToken,
        setPushToken,
        sendNotification,
        showLocalNotification,
    };
}