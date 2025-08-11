import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Application } from '@/types';

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

  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (config.single && config.postIds && config.postIds.length === 1) {
        // Single application status
        const { data, error: fetchError } = await supabase
          .from('applications')
          .select('*')
          .eq('post_id', config.postIds[0])
          .single();

        if (fetchError) throw fetchError;
        setStatuses(data ? [data] : []);
      } else if (config.postIds && config.postIds.length > 0) {
        // Multiple application statuses
        const { data, error: fetchError } = await supabase
          .from('applications')
          .select('*')
          .in('post_id', config.postIds);

        if (fetchError) throw fetchError;
        setStatuses(data || []);
      } else {
        // All application statuses
        const { data, error: fetchError } = await supabase
          .from('applications')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setStatuses(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching application statuses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [config.single, config.postIds]);

  useEffect(() => {
    if (config.autoFetch !== false) {
      fetchStatuses();
    }
  }, [fetchStatuses, config.autoFetch]);

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