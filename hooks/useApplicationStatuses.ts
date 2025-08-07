import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/utils/superbase';
import { useAuth } from './useAuth';
import { Application } from '@/types/applications';

export function useApplicationStatuses(postIds?: string[]) {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const checkApplicationStatuses = useCallback(async () => {
        if (!user || !postIds || postIds.length === 0) {
            setApplications([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('applications')
                .select('*')
                .eq('user_id', user.id)
                .in('post_id', postIds);

            if (error) {
                throw error;
            }

            setApplications(data || []);
        } catch (err: any) {
            console.error('Error checking application statuses:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, postIds]);

    useEffect(() => {
        checkApplicationStatuses();
    }, [checkApplicationStatuses]);

    const hasApplied = useCallback((postId: string) => {
        return applications.some(app => app.post_id === postId);
    }, [applications]);

    const getApplication = useCallback((postId: string) => {
        return applications.find(app => app.post_id === postId) || null;
    }, [applications]);

    return {
        applications,
        hasApplied,
        getApplication,
        loading,
        error,
        checkApplicationStatuses,
    };
} 