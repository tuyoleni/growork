import { useCallback, useState } from 'react';
import { supabase } from '@/utils/superbase';
import { Post } from '@/types';

export interface MyPost extends Post {
  applications_count: number;
  is_active: boolean;
}

export function useMyPosts() {
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyPosts = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          applications!inner(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postsError) {
        throw postsError;
      }

      // Transform the data to include applications count
      const transformedPosts = postsData?.map((post: any) => ({
        ...post,
        applications_count: post.applications?.[0]?.count || 0,
        is_active: post.status === 'active'
      })) || [];

      setPosts(transformedPosts);
    } catch (err: any) {
      console.error('Error fetching my posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePostStatus = useCallback(async (postId: string, status: 'active' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ status })
        .eq('id', postId);

      if (error) {
        throw error;
      }

      // Update local state
      setPosts(prev =>
        prev.map(post =>
          post.id === postId ? { ...post, status, is_active: status === 'active' } : post
        )
      );

      return { error: null };
    } catch (err: any) {
      console.error('Error updating post status:', err);
      return { error: err };
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        throw error;
      }

      // Remove from local state
      setPosts(prev => prev.filter(post => post.id !== postId));

      return { error: null };
    } catch (err: any) {
      console.error('Error deleting post:', err);
      return { error: err };
    }
  }, []);

  const filterPostsByStatus = useCallback((status?: 'active' | 'inactive') => {
    if (!status) return posts;
    return posts.filter(post => {
      if ('status' in post) {
        return post.status === status;
      }
      if ('is_active' in post) {
        return (status === 'active' && post.is_active) || (status === 'inactive' && !post.is_active);
      }
      return false;
    });
  }, [posts]);

  const filterPostsByType = useCallback((type?: string) => {
    if (!type) return posts;
    return posts.filter(post => post.type === type);
  }, [posts]);

  const filterPostsByIndustry = useCallback((industry?: string) => {
    if (!industry) return posts;
    return posts.filter(post => post.industry === industry);
  }, [posts]);

  return {
    posts,
    loading,
    error,
    fetchMyPosts,
    updatePostStatus,
    deletePost,
    filterPostsByStatus,
    filterPostsByType,
    filterPostsByIndustry,
  };
} 