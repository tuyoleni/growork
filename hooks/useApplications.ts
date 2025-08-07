import { Application, ApplicationStatus } from '@/types';
import { supabase } from '@/utils/superbase';
import { useCallback, useEffect, useState } from 'react';

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
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);
      
      if (error) {
        throw error;
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
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error;
      }
      
      return { hasApplied: !!data, error: null };
    } catch (err: any) {
      console.error('Error checking application status:', err);
      return { hasApplied: false, error: err };
    }
  }, []);

  return {
    applications,
    loading,
    error,
    fetchApplications,
    addApplication,
    updateApplicationStatus,
    checkIfApplied,
  };
}