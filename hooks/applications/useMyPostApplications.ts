import { Application, ApplicationStatus } from '@/types';
import { supabase } from '@/utils/supabase';
import { useCallback, useState } from 'react';
import { sendNotification } from '@/utils/notifications';

export interface ApplicationWithDetails extends Application {
  posts: {
    id: string;
    title: string;
    type: string;
    industry: string;
    criteria: any;
  };
  profiles: {
    id: string;
    username: string;
    name: string;
    surname: string;
    avatar_url: string | null;
    bio: string | null;
  };
}

export function useMyPostApplications() {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplicationsForMyPosts = useCallback(async (currentUserId: string) => {
    try {
      setLoading(true);
      setError(null);

      // First, get all posts created by the current user
      const { data: myPosts, error: postsError } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', currentUserId);

      if (postsError) {
        console.error('Posts query error:', postsError);
        throw postsError;
      }

      if (!myPosts || myPosts.length === 0) {
        setApplications([]);
        return;
      }

      const postIds = myPosts.map(post => post.id);

      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('*')
        .in('post_id', postIds)
        .order('created_at', { ascending: false });

      if (applicationsError) {
        console.error('Applications query error:', applicationsError);
        throw applicationsError;
      }

      // Now get the posts data separately
      const { data: postsData, error: postsDataError } = await supabase
        .from('posts')
        .select('id, title, type, industry, criteria')
        .in('id', postIds);

      if (postsDataError) {
        console.error('Posts data query error:', postsDataError);
      }

      // Create a map of posts
      const postsMap = (postsData || []).reduce((acc: any, post: any) => {
        acc[post.id] = post;
        return acc;
      }, {});

      // Get user IDs from applications to fetch profiles separately
      const userIds = applicationsData
        ?.map((app: any) => app.user_id)
        .filter(Boolean) || [];

      // Fetch profiles for these users
      let profilesData = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        if (profilesError) {
          console.error('Profiles query error:', profilesError);
        }

        profilesData = profiles || [];
      }

      // Create a map of user profiles
      const profilesMap = profilesData.reduce((acc: any, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      // Combine applications with their posts and profiles
      const applicationsWithProfiles = applicationsData?.map((app: any) => ({
        ...app,
        posts: postsMap[app.post_id] || null,
        profiles: profilesMap[app.user_id] || null
      })) || [];

      setApplications(applicationsWithProfiles);
    } catch (err: any) {
      console.error('Error fetching applications for my posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateApplicationStatus = useCallback(async (applicationId: string, status: ApplicationStatus) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) {
        throw error;
      }

      // Send notification to the applicant
      try {
        // Get application details to find the applicant
        const { data: applicationData } = await supabase
          .from('applications')
          .select(`
            user_id,
            posts (
              title
            )
          `)
          .eq('id', applicationId)
          .single();

        if (applicationData) {
          const jobTitle = applicationData.posts?.[0]?.title || 'your application';
          const statusText = status.charAt(0).toUpperCase() + status.slice(1);

          await sendNotification(
            applicationData.user_id,
            'Application Status Update',
            `Your application for "${jobTitle}" has been ${statusText}`,
            'application_status',
            { applicationId, status, jobTitle }
          );
        }
      } catch (notificationError) {
        console.error('Failed to send application status notification:', notificationError);
        // Don't fail the status update if notification fails
      }

      // Update the local state
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status } : app
        )
      );

      return { error: null };
    } catch (err: any) {
      console.error('Error updating application status:', err);
      return { error: err };
    }
  }, []);

  const filterApplicationsByStatus = useCallback((status?: ApplicationStatus) => {
    if (!status) return applications;
    return applications.filter(app => app.status === status);
  }, [applications]);

  const filterApplicationsByPost = useCallback((postId: string) => {
    return applications.filter(app => app.post_id === postId);
  }, [applications]);

  return {
    applications,
    loading,
    error,
    fetchApplicationsForMyPosts,
    updateApplicationStatus,
    filterApplicationsByStatus,
    filterApplicationsByPost,
  };
} 