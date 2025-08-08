import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/utils/superbase';
import { sendNotification, NotificationType } from '@/utils/notifications';

export function useApplicationNotifications() {
    const { user } = useAuth();

    // Send notification when application status changes
    const notifyApplicationStatusChange = useCallback(async (
        applicationId: string,
        applicantId: string,
        newStatus: string,
        postOwnerId?: string
    ) => {
        if (!user?.id) return;

        try {
            // Get application details with post and profile info
            const { data: application } = await supabase
                .from('applications')
                .select(`
                    id,
                    posts!inner(id, title, user_id),
                    profiles!inner(id, name, surname)
                `)
                .eq('id', applicationId)
                .single();

            if (application && application.posts && application.profiles) {
                // Handle the case where posts and profiles might be arrays
                const post = Array.isArray(application.posts) ? application.posts[0] : application.posts;
                const profile = Array.isArray(application.profiles) ? application.profiles[0] : application.profiles;

                if (post && profile) {
                    const postOwnerName = `${profile.name} ${profile.surname}`;
                    const title = `Application status updated`;
                    const body = `Your application for "${post.title}" is now ${newStatus}`;

                    await sendNotification(
                        applicantId,
                        title,
                        body,
                        NotificationType.APPLICATION_STATUS,
                        {
                            type: 'application_status',
                            applicationId,
                            postId: post.user_id,
                            newStatus,
                            postOwnerName,
                        }
                    );
                }
            }
        } catch (error) {
            console.error('Error sending application status notification:', error);
        }
    }, [user?.id]);

    // Send notification when someone applies to your job
    const notifyNewApplication = useCallback(async (
        applicationId: string,
        postOwnerId: string,
        applicantName: string,
        jobTitle: string
    ) => {
        if (!user?.id || user.id === postOwnerId) return; // Don't notify yourself

        try {
            const title = `New application received`;
            const body = `${applicantName} applied to your job "${jobTitle}"`;

            await sendNotification(
                postOwnerId,
                title,
                body,
                NotificationType.APPLICATION_STATUS,
                {
                    type: 'application_status',
                    applicationId,
                    applicantName,
                    jobTitle,
                }
            );
        } catch (error) {
            console.error('Error sending new application notification:', error);
        }
    }, [user?.id]);

    return {
        notifyApplicationStatusChange,
        notifyNewApplication,
    };
} 