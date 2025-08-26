import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';
import { supabaseRequest } from './supabaseRequest';

// Notification types - using string literals to match the database schema
export enum NotificationType {
    POST_LIKE = 'post_like',
    POST_COMMENT = 'post_comment',
    POST_BOOKMARK = 'post_bookmark',
    COMMENT_LIKE = 'comment_like',
    APPLICATION_STATUS = 'application_status',
    COMPANY_STATUS = 'company_status',
}

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

// Check notification permissions
export async function checkNotificationPermissions(): Promise<boolean> {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Error checking notification permissions:', error);
        return false;
    }
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
    try {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
}

// Send push notification using Expo's push service
export async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
    try {
        const message = {
            to: expoPushToken,
            sound: 'default',
            title,
            body,
            data: data || {},
        };

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            throw new Error(`Push notification failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending push notification:', error);
        throw error;
    }
}

// Schedule a local notification
export async function scheduleLocalNotification(title: string, body: string, data?: any) {
    try {
        const hasPermission = await checkNotificationPermissions();
        if (!hasPermission) {
            console.warn('Notification permissions not granted');
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data || {},
            },
            trigger: null, // null means show immediately
        });
    } catch (error) {
        console.error('Error scheduling local notification:', error);
        throw error;
    }
}

// Save notification to database
export async function saveNotificationToDatabase(
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: any
) {
    try {
        await supabaseRequest<void>(
            async () => {
                const { error, status } = await supabase
                    .from('notifications')
                    .insert({
                        user_id: userId,
                        title,
                        body,
                        type,
                        data: data || {},
                    });
                return { data: null, error, status };
            },
            { logTag: 'notifications:save' }
        );
    } catch (error) {
        console.error('Error saving notification to database:', error);
        throw error;
    }
}

// Send notification and save to database
export async function sendNotification(
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: any,
    expoPushToken?: string
) {
    try {
        console.log('📱 Sending notification:', { userId, title, body, type, data });
        
        // Save to database first
        await saveNotificationToDatabase(userId, title, body, type, data);
        console.log('✅ Notification saved to database');

        // Send push notification if token is provided
        if (expoPushToken) {
            await sendPushNotification(expoPushToken, title, body, data);
            console.log('✅ Push notification sent');
        } else {
            // Fallback to local notification
            await scheduleLocalNotification(title, body, data);
            console.log('✅ Local notification scheduled');
        }
    } catch (error) {
        console.error('❌ Error sending notification:', error);
        throw error;
    }
}

// Handle notification response
export function handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;

    console.log('Notification response:', {
        actionIdentifier: response.actionIdentifier,
        data,
    });

    // Handle different notification types
    if (data?.type === NotificationType.POST_LIKE && data?.postId) {
        // Navigate to post
        // This would be handled by the navigation system
    } else if (data?.type === NotificationType.APPLICATION_STATUS && data?.applicationId) {
        // Navigate to application
        // This would be handled by the navigation system
    }
}

// Send notification when application status changes
export async function sendApplicationStatusNotification(
    userId: string,
    status: string,
    jobTitle: string,
    expoPushToken?: string
) {
    const title = 'Application Status Update';
    const body = `Your application for "${jobTitle}" has been ${status}`;

    await sendNotification(
        userId,
        title,
        body,
        NotificationType.APPLICATION_STATUS,
        { status, jobTitle },
        expoPushToken
    );
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
    try {
        await supabaseRequest<void>(
            async () => {
                const { error, status } = await supabase
                    .from('notifications')
                    .update({ read: true })
                    .eq('id', notificationId);
                return { data: null, error, status };
            },
            { logTag: 'notifications:markRead' }
        );
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string) {
    try {
        await supabaseRequest<void>(
            async () => {
                const { error, status } = await supabase
                    .from('notifications')
                    .update({ read: true })
                    .eq('user_id', userId)
                    .eq('read', false);
                return { data: null, error, status };
            },
            { logTag: 'notifications:markAllRead' }
        );
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
}

// Test notification function
export async function sendTestNotification(userId: string) {
    try {
        console.log('🧪 Sending test notification to user:', userId);
        
        await sendNotification(
            userId,
            'Test Notification',
            'This is a test notification to verify the system is working!',
            'test',
            { test: true, timestamp: new Date().toISOString() }
        );
        
        console.log('✅ Test notification sent successfully');
        return true;
    } catch (error) {
        console.error('❌ Test notification failed:', error);
        return false;
    }
}

// Get notifications for a user
export async function getNotifications(userId: string, limit = 50) {
    try {
        const { data } = await supabaseRequest<any[]>(
            async () => {
                const { data, error, status } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(limit);
                return { data, error, status };
            },
            { logTag: 'notifications:list' }
        );

        return data || [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
}