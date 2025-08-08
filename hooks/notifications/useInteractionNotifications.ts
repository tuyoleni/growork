import { useCallback } from 'react';
import * as Notifications from 'expo-notifications';

// Helper function to check notification permissions
async function checkNotificationPermissions() {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
}

export function useInteractionNotifications() {
    const notifyPostComment = useCallback(async (
        postId: string,
        postOwnerId: string,
        commenterName: string,
        commentContent: string
    ) => {
        try {
            // Check if notifications are permitted
            const hasPermission = await checkNotificationPermissions();
            if (!hasPermission) {
                console.warn('Notification permissions not granted');
                return;
            }

            const title = 'New Comment';
            const body = `${commenterName} commented on your post: "${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}"`;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: {
                        type: 'post_comment',
                        postId,
                        commenterName,
                    },
                },
                trigger: null,
            });
        } catch (error) {
            console.warn('Failed to send post comment notification:', error);
        }
    }, []);

    const notifyCommentLike = useCallback(async (
        commentId: string,
        commentOwnerId: string,
        likerName: string
    ) => {
        try {
            // Check if notifications are permitted
            const hasPermission = await checkNotificationPermissions();
            if (!hasPermission) {
                console.warn('Notification permissions not granted');
                return;
            }

            const title = 'New Like';
            const body = `${likerName} liked your comment`;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: {
                        type: 'comment_like',
                        commentId,
                        likerName,
                    },
                },
                trigger: null,
            });
        } catch (error) {
            console.warn('Failed to send comment like notification:', error);
        }
    }, []);

    const notifyPostLike = useCallback(async (
        postId: string,
        postOwnerId: string,
        likerName: string
    ) => {
        try {
            // Check if notifications are permitted
            const hasPermission = await checkNotificationPermissions();
            if (!hasPermission) {
                console.warn('Notification permissions not granted');
                return;
            }

            const title = 'New Like';
            const body = `${likerName} liked your post`;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: {
                        type: 'post_like',
                        postId,
                        likerName,
                    },
                },
                trigger: null,
            });
        } catch (error) {
            console.warn('Failed to send post like notification:', error);
        }
    }, []);

    return {
        notifyPostComment,
        notifyCommentLike,
        notifyPostLike,
    };
}