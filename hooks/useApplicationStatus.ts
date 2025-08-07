import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/utils/superbase';
import { useAuth } from './useAuth';
import { Application } from '@/types/applications';

export function useApplicationStatus(postId?: string) {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const checkApplicationStatus = useCallback(async () => {
    if (!user || !postId) {
      setApplication(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      setApplication(data);
    } catch (err: any) {
      console.error('Error checking application status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, postId]);

  useEffect(() => {
    checkApplicationStatus();
  }, [checkApplicationStatus]);

  return {
    application,
    hasApplied: !!application,
    loading,
    error,
    checkApplicationStatus,
  };
} 