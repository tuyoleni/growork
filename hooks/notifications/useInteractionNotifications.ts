import { useCallback } from 'react';
import { sendNotification, checkNotificationPermissions, requestNotificationPermissions } from '@/utils/notifications';

export function useInteractionNotifications() {
    const notifyPostComment = useCallback(async (
        postId: string,
        postOwnerId: string,
        commenterName: string,
        commentContent: string
    ) => {
        try {
            // Check if notifications are permitted
            let hasPermission = await checkNotificationPermissions();
            if (!hasPermission) {
                hasPermission = await requestNotificationPermissions();
                if (!hasPermission) {
                    console.warn('Notification permissions not granted');
                    return;
                }
            }

            const title = 'New Comment';
            const body = `${commenterName} commented on your post: "${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}"`;

            await sendNotification(
                postOwnerId,
                title,
                body,
                'post_comment',
                {
                    type: 'post_comment',
                    postId,
                    commenterName,
                }
            );
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
            let hasPermission = await checkNotificationPermissions();
            if (!hasPermission) {
                hasPermission = await requestNotificationPermissions();
                if (!hasPermission) {
                    console.warn('Notification permissions not granted');
                    return;
                }
            }

            const title = 'New Like';
            const body = `${likerName} liked your comment`;

            await sendNotification(
                commentOwnerId,
                title,
                body,
                'comment_like',
                {
                    type: 'comment_like',
                    commentId,
                    likerName,
                }
            );
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
            let hasPermission = await checkNotificationPermissions();
            if (!hasPermission) {
                hasPermission = await requestNotificationPermissions();
                if (!hasPermission) {
                    console.warn('Notification permissions not granted');
                    return;
                }
            }

            const title = 'New Like';
            const body = `${likerName} liked your post`;

            await sendNotification(
                postOwnerId,
                title,
                body,
                'post_like',
                {
                    type: 'post_like',
                    postId,
                    likerName,
                }
            );
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