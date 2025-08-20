import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Post } from '@/types/posts';
import { useDataFetching } from '../data';

export function useCompanyPosts(companyId: string) {
    const fetchCompanyPosts = useCallback(async (): Promise<Post[]> => {
        try {

            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select(`
          *,
          likes(id, user_id),
          comments(id, user_id, content, created_at)
        `)
                .or(`criteria->>companyId.eq.${companyId},user_id.eq.${companyId}`)
                .order('created_at', { ascending: false });

            if (postsError) {
                console.error('Error fetching company posts:', postsError);
                throw postsError;
            }

            return postsData || [];
        } catch (error) {
            console.error('Error fetching company posts:', error);
            throw error;
        }
    }, [companyId]);

    const {
        data: posts,
        loading,
        error,
        refreshing,
        refresh,
        clearError
    } = useDataFetching(fetchCompanyPosts, {
        autoFetch: true,
        refreshOnMount: true
    });

    return {
        posts,
        loading,
        error,
        refreshing,
        refresh,
        clearError
    };
}
