import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { handleNotificationResponse } from '@/utils/notifications';

// Configure default notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export function useNotificationSetup() {
    const notificationListener = useRef(null);
    const responseListener = useRef(null);

    useEffect(() => {
        registerForPushNotificationsAsync();

        // Set up notification listeners
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('Received notification:', notification);
        }) as unknown as null;

        responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse) as unknown as null;
        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);
}

async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
        console.warn('Must use physical device for Push Notifications');
        return;
    }

    // Set up Android channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return;
    }

    try {
        // Get project ID from app.json
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
            throw new Error('No project ID found in app.json');
        }

        // Get push token
        const token = await Notifications.getExpoPushTokenAsync({
            projectId
        });

        console.log('Push token:', token.data);
        return token.data;
    } catch (error) {
        console.error('Error getting push token:', error);
    }
}