import { Application, ApplicationStatus } from '@/types';
import { supabase } from '@/utils/supabase';
import { useCallback, useEffect, useState } from 'react';
import { sendApplicationStatusNotification } from '@/utils/notifications';

export function useApplications(userId?: string) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setApplications(data || []);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // New function to fetch applications for posts created by the current user
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

      // Fetch applications for these posts
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
          ),
          profiles!applications_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            bio
          )
        `)
        .in('post_id', postIds)
        .order('created_at', { ascending: false });

      if (applicationsError) {
        throw applicationsError;
      }

      setApplications(applicationsData || []);
    } catch (err: any) {
      console.error('Error fetching applications for my posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchApplications();
    }
  }, [fetchApplications, userId]);

  const addApplication = useCallback(async (applicationData: Partial<Application>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .insert([applicationData])
        .select();

      if (error) {
        throw error;
      }

      // Refresh the applications
      fetchApplications();
      return { data, error: null };
    } catch (err: any) {
      console.error('Error adding application:', err);
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [fetchApplications]);

  const updateApplicationStatus = useCallback(async (applicationId: string, status: ApplicationStatus) => {
    try {
      // First, get the application details to send notification
      const { data: applicationData, error: fetchError } = await supabase
        .from('applications')
        .select(`
          *,
          posts (
            id,
            title
          ),
          profiles (
            id,
            username,
            full_name
          )
        `)
        .eq('id', applicationId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Update the application status
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) {
        throw error;
      }

      // Send notification to the applicant
      if (applicationData) {
        const jobTitle = applicationData.posts?.title || 'a job';

        await sendApplicationStatusNotification(
          applicationData.user_id,
          status,
          jobTitle
        );
      }

      // Refresh the applications
      fetchApplications();
      return { error: null };
    } catch (err: any) {
      console.error('Error updating application status:', err);
      return { error: err };
    }
  }, [fetchApplications]);

  const checkIfApplied = useCallback(async (userId: string, postId: string) => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { hasApplied: !!data, error: null };
    } catch (err: any) {
      console.error('Error checking if applied:', err);
      return { hasApplied: false, error: err };
    }
  }, []);

  return {
    applications,
    loading,
    error,
    fetchApplications,
    fetchApplicationsForMyPosts,
    addApplication,
    updateApplicationStatus,
    checkIfApplied,
  };
}