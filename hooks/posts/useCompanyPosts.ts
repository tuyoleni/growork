import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { supabaseRequest } from '@/utils/supabaseRequest';
import { Post } from '@/types/posts';
import { useDataFetching } from '../data';

export function useCompanyPosts(companyId: string) {
    const fetchCompanyPosts = useCallback(async (): Promise<any[]> => {
        try {
            // First, get the company to find the user_id (company owner)
            const { data: companyData } = await supabaseRequest<any>(
                async () => {
                    const { data, error, status } = await supabase
                        .from('companies')
                        .select('user_id')
                        .eq('id', companyId)
                        .single();
                    return { data, error, status };
                },
                { logTag: 'companies:getOwner' }
            );

            if (!companyData) {
                console.error('Company not found');
                return [];
            }

            const companyUserId = companyData.user_id;

            // Fetch posts that belong to this company:
            // 1. Job posts where criteria->companyId matches the company ID
            // 2. News posts created by the company owner (user_id)
            const { data: postsData } = await supabaseRequest<any[]>(
                async () => {
                    const { data, error, status } = await supabase
                        .from('posts')
                        .select(`
                            *,
                            likes(id, user_id),
                            comments(id, user_id, content, created_at)
                        `)
                        .or(`criteria->>companyId.eq.${companyId},user_id.eq.${companyUserId}`)
                        .order('created_at', { ascending: false });
                    return { data, error, status };
                },
                { logTag: 'posts:listForCompany' }
            );

            const posts = postsData || [];

            // Batch-fetch author profiles for these posts
            const userIds = Array.from(new Set(posts.map((p: any) => p.user_id).filter(Boolean)));
            let profilesById: Record<string, any> = {};
            if (userIds.length) {
                const { data: profiles } = await supabaseRequest<any[]>(
                    async () => {
                        const { data, error, status } = await supabase
                            .from('profiles')
                            .select('*')
                            .in('id', userIds);
                        return { data, error, status };
                    },
                    { logTag: 'profiles:listForCompanyPosts' }
                );
                for (const p of profiles || []) {
                    if (p?.id) profilesById[p.id] = p;
                }
            }

            // Attach profiles to posts for downstream author rendering
            const withProfiles = posts.map((p: any) => ({
                ...p,
                profiles: profilesById[p.user_id] || null,
            }));

            return withProfiles;
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
