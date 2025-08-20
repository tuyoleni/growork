import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Post } from '@/types/posts';
import { useDataFetching } from '../data';

export function useCompanyPosts(companyId: string) {
    const fetchCompanyPosts = useCallback(async (): Promise<Post[]> => {
        try {
            // First, get the company to find the user_id (company owner)
            const { data: companyData, error: companyError } = await supabase
                .from('companies')
                .select('user_id')
                .eq('id', companyId)
                .single();

            if (companyError) {
                console.error('Error fetching company:', companyError);
                throw companyError;
            }

            if (!companyData) {
                console.error('Company not found');
                return [];
            }

            const companyUserId = companyData.user_id;

            // Fetch posts that belong to this company:
            // 1. Job posts where criteria->companyId matches the company ID
            // 2. News posts created by the company owner (user_id)
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select(`
                    *,
                    likes(id, user_id),
                    comments(id, user_id, content, created_at)
                `)
                .or(`criteria->>companyId.eq.${companyId},user_id.eq.${companyUserId}`)
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
