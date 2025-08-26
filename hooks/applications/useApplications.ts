import { Application, ApplicationStatus } from '@/types';
import { supabase } from '@/utils/supabase';
import { supabaseRequest } from '@/utils/supabaseRequest';
import { useCallback, useEffect, useState, useRef } from 'react';
import { sendApplicationStatusNotification } from '@/utils/notifications';

export function useApplications(userId?: string) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await supabaseRequest<Application[]>(
        async () => {
          let query = supabase
            .from('applications')
            .select('*')
            .order('created_at', { ascending: false });
          if (userId) query = query.eq('user_id', userId);
          const { data, error, status } = await query;
          return { data, error, status };
        },
        { logTag: 'applications:list' }
      );

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
      const { data: myPosts } = await supabaseRequest<{ id: string }[]>(
        async () => {
          const { data, error, status } = await supabase
            .from('posts')
            .select('id')
            .eq('user_id', currentUserId);
          return { data, error, status };
        },
        { logTag: 'posts:mine' }
      );

      if (!myPosts || myPosts.length === 0) {
        setApplications([]);
        return;
      }

      // Get all post IDs created by the user
      const postIds = myPosts.map(post => post.id);

      // Fetch applications for these posts
      const { data: applicationsData } = await supabaseRequest<any[]>(
        async () => {
          const { data, error, status } = await supabase
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
          return { data, error, status };
        },
        { logTag: 'applications:byPosts' }
      );

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
  }, [userId, fetchApplications]);

  const addApplication = useCallback(async (applicationData: Partial<Application>) => {
    try {
      setLoading(true);
      const { data } = await supabaseRequest<Application[]>(
        async () => {
          const { data, error, status } = await supabase
            .from('applications')
            .insert([applicationData])
            .select();
          return { data, error, status };
        },
        { logTag: 'applications:create' }
      );

      // Refresh the applications by calling fetchApplications directly
      // instead of depending on it in the dependency array
      try {
        setLoading(true);
        setError(null);

        const { data: refreshData } = await supabaseRequest<Application[]>(
          async () => {
            let query = supabase
              .from('applications')
              .select('*')
              .order('created_at', { ascending: false });
            if (userId) query = query.eq('user_id', userId);
            const { data, error, status } = await query;
            return { data, error, status };
          },
          { logTag: 'applications:list:refresh' }
        );

        setApplications(refreshData || []);
      } catch (err: any) {
        console.error('Error refreshing applications:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Error adding application:', err);
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateApplicationStatus = useCallback(async (applicationId: string, status: ApplicationStatus) => {
    try {
      // First, get the application details to send notification
      const { data: applicationData } = await supabaseRequest<any>(
        async () => {
          const { data, error, status: httpStatus } = await supabase
            .from('applications')
            .select('*')
            .eq('id', applicationId)
            .single();
          return { data, error, status: httpStatus };
        },
        { logTag: 'applications:get' }
      );

      // Fetch post and profile data separately
      let postData = null;
      let profileData = null;

      if (applicationData) {
        try {
          // Fetch post data
          const { data: post } = await supabaseRequest<any>(
            async () => {
              const { data, error, status: httpStatus } = await supabase
                .from('posts')
                .select('id, title')
                .eq('id', applicationData.post_id)
                .single();
              return { data, error, status: httpStatus };
            },
            { logTag: 'posts:get' }
          );
          if (post) postData = post;

          // Fetch profile data
          const { data: profile } = await supabaseRequest<any>(
            async () => {
              const { data, error, status: httpStatus } = await supabase
                .from('profiles')
                .select('id, username, name, surname')
                .eq('id', applicationData.user_id)
                .single();
              return { data, error, status: httpStatus };
            },
            { logTag: 'profiles:get' }
          );
          if (profile) profileData = profile;
        } catch (err) {
          console.warn('Error fetching related data:', err);
        }
      }

      // Update the application status
      await supabaseRequest<null>(
        async () => {
          const { data, error, status: httpStatus } = await supabase
            .from('applications')
            .update({ status })
            .eq('id', applicationId);
          return { data: null, error, status: httpStatus };
        },
        { logTag: 'applications:updateStatus' }
      );

      // Send notification to the applicant
      if (applicationData) {
        const jobTitle = postData?.title || 'a job';
        const applicantName = `${profileData?.name} ${profileData?.surname}`;

        await sendApplicationStatusNotification(
          applicationData.user_id,
          status,
          jobTitle,
          applicantName
        );
      }
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

        const { data: refreshData, error: refreshError } = await query;

        if (refreshError) {
          throw refreshError;
        }

        setApplications(refreshData || []);
      } catch (err: any) {
        console.error('Error refreshing applications:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }

      return { error: null };
    } catch (err: any) {
      console.error('Error updating application status:', err);
      return { error: err };
    }
  }, [userId]);

  const checkIfApplied = useCallback(async (userId: string, postId: string) => {
    try {
      const { data } = await supabaseRequest<{ id: string } | null>(
        async () => {
          const { data, error, status } = await supabase
            .from('applications')
            .select('id')
            .eq('user_id', userId)
            .eq('post_id', postId)
            .maybeSingle();
          return { data, error, status };
        },
        { logTag: 'applications:check' }
      );

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