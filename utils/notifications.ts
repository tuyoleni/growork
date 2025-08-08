import * as Notifications from 'expo-notifications';

// Notification types
export enum NotificationType {
    POST_LIKE = 'post_like',
    POST_COMMENT = 'post_comment',
    POST_BOOKMARK = 'post_bookmark',
    COMMENT_LIKE = 'comment_like',
    APPLICATION_STATUS = 'application_status',
    COMPANY_STATUS = 'company_status',
}

// Send push notification using Expo's push service
export async function sendPushNotification(expoPushToken: string, title: string, body: string, data?: any) {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });
}

// Schedule a local notification
export async function scheduleLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data: data || {},
        },
        trigger: null, // null means show immediately
    });
}

// Handle notification response
export function handleNotificationResponse(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;

    console.log('Notification response:', {
        actionIdentifier: response.actionIdentifier,
        data,
    });
}

// Send notification when application status changes
export async function sendApplicationStatusNotification(
    userId: string,
    status: string,
    jobTitle: string
) {
    const title = 'Application Status Update';
    const body = `Your application for "${jobTitle}" has been ${status}`;
    await sendPushNotification(userId, title, body, {
        type: NotificationType.APPLICATION_STATUS,
        status,
        jobTitle,
    });
}