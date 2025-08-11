import { Application, ApplicationStatus } from '@/types';
import { supabase } from '@/utils/supabase';
import { useCallback, useState } from 'react';

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
    full_name: string;
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
        throw postsError;
      }

      if (!myPosts || myPosts.length === 0) {
        setApplications([]);
        return;
      }

      // Get all post IDs created by the user
      const postIds = myPosts.map(post => post.id);

      // Fetch applications for these posts with related data
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          *,
          posts (
            id,
            title,
            type,
            industry,
            criteria
          )
        `)
        .in('post_id', postIds)
        .order('created_at', { ascending: false });

      if (applicationsError) {
        throw applicationsError;
      }

      // Get user IDs from applications to fetch profiles separately
      const userIds = applicationsData
        ?.map((app: any) => app.user_id)
        .filter(Boolean) || [];

      // Fetch profiles for these users
      let profilesData = [];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        profilesData = profiles || [];
      }

      // Create a map of user profiles
      const profilesMap = profilesData.reduce((acc: any, profile: any) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      // Combine applications with their profiles
      const applicationsWithProfiles = applicationsData?.map((app: any) => ({
        ...app,
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