import { Post } from '@/types';
import { supabase } from '@/utils/superbase';
import { useCallback, useState } from 'react';

export function usePosts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPostById = useCallback(async (postId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch the post by ID
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (postError) {
        throw postError;
      }
      
      if (!post) {
        throw new Error('Post not found');
      }
      
      // Fetch the user profile for this post
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', post.user_id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
        console.warn('Error fetching profile:', profileError);
        // Continue anyway, we'll just show the post without profile data
      }
      
      // Return post with profile data
      return { 
        data: {
          ...post,
          profiles: profile || null,
          company_name: post.company_name || (profile ? `${profile.name || ''} ${profile.surname || ''}`.trim() : 'Anonymous'),
          company_image: post.company_image || profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.company_name || 'Company')}&size=128`
        }, 
        error: null 
      };
    } catch (err: any) {
      console.error('Error fetching post by ID:', err);
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getPostById,
  };
}