import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Application } from '@/types';
import { useAuth } from '@/hooks/auth';

export interface ApplicationStatusConfig {
  postIds?: string[];
  single?: boolean;
  autoFetch?: boolean;
}

// Unified hook for application statuses
export function useApplicationStatus(config: ApplicationStatusConfig = {}) {
  const [statuses, setStatuses] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setStatuses([]);
        return;
      }

      if (config.single && config.postIds && config.postIds.length === 1) {
        // Single application status for current user
        const { data, error: fetchError } = await supabase
          .from('applications')
          .select('*')
          .eq('post_id', config.postIds[0])
          .eq('user_id', user.id)
          .maybeSingle(); // Use maybeSingle instead of single to avoid errors

        if (fetchError) throw fetchError;
        setStatuses(data ? [data] : []);
      } else if (config.postIds && config.postIds.length > 0) {
        // Multiple application statuses for current user
        const { data, error: fetchError } = await supabase
          .from('applications')
          .select('*')
          .in('post_id', config.postIds)
          .eq('user_id', user.id);

        if (fetchError) throw fetchError;
        setStatuses(data || []);
      } else {
        // All application statuses for current user
        const { data, error: fetchError } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setStatuses(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching application statuses:', err);
      setError(err.message);
      setStatuses([]); // Ensure statuses is empty on error
    } finally {
      setLoading(false);
    }
  }, [config.single, config.postIds, user?.id]);

  useEffect(() => {
    if (config.autoFetch !== false) {
      fetchStatuses();
    }
  }, [config.autoFetch, fetchStatuses]);

  const refresh = useCallback(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  return {
    statuses,
    loading,
    error,
    refresh
  };
}

// Specialized variants for backward compatibility
export function useApplicationStatusSingle(postId: string) {
  return useApplicationStatus({
    postIds: [postId],
    single: true,
    autoFetch: true
  });
}

export function useApplicationStatuses(postIds?: string[]) {
  return useApplicationStatus({
    postIds,
    single: false,
    autoFetch: true
  });
} 