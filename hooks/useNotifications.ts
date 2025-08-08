import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { 
    checkNotificationPermissions, 
    requestNotificationPermissions,
    sendNotification,
    NotificationType 
} from '@/utils/notifications';

// Set notification handler (following Expo docs)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export function useNotifications() {
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
    const [permissionsGranted, setPermissionsGranted] = useState<boolean | null>(null);
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
            if (token) setExpoPushToken(token);
        });

        // Set up notification listeners
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification response received:', response);
        });

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);

    const checkPermissions = async () => {
        const granted = await checkNotificationPermissions();
        setPermissionsGranted(granted);
        return granted;
    };

    const requestPermissions = async () => {
        const granted = await requestNotificationPermissions();
        setPermissionsGranted(granted);
        return granted;
    };

    return {
        expoPushToken,
        notification,
        permissionsGranted,
        checkPermissions,
        requestPermissions,
        scheduleNotification: async (title: string, body: string, data?: any) => {
            const granted = await checkPermissions();
            if (!granted) {
                const requested = await requestPermissions();
                if (!requested) {
                    console.warn('Notification permissions not granted');
                    return;
                }
            }

            await sendNotification(
                '', // userId will be handled by the calling function
                title,
                body,
                NotificationType.POST_LIKE, // default type
                data,
                expoPushToken
            );
        },
        notifyPostBookmark: async (postId: string, postOwnerId: string, bookmarkerName: string) => {
            try {
                const granted = await checkPermissions();
                if (!granted) {
                    const requested = await requestPermissions();
                    if (!requested) {
                        console.warn('Notification permissions not granted');
                        return;
                    }
                }

                const title = 'New Bookmark';
                const body = `${bookmarkerName} bookmarked your post`;

                await sendNotification(
                    postOwnerId,
                    title,
                    body,
                    NotificationType.POST_BOOKMARK,
                    {
                        type: 'post_bookmark',
                        postId,
                        bookmarkerName,
                    },
                    expoPushToken
                );
            } catch (error) {
                console.warn('Failed to send bookmark notification:', error);
            }
        }
    };
}

async function registerForPushNotificationsAsync() {
    let token;

    if (!Device.isDevice) {
        console.warn('Must use physical device for Push Notifications');
        return;
    }

    // Create Android notification channel
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
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
            throw new Error('No project ID found in app.json');
        }

        token = await Notifications.getExpoPushTokenAsync({
            projectId
        });

        return token.data;
    } catch (error) {
        console.error('Error getting push token:', error);
    }
}