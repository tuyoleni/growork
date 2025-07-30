import { Post, Comment, Like, PostType } from '@/types';
import { supabase } from '@/utils/superbase';
import { useEffect, useState, useCallback } from 'react';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (type?: PostType) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch posts first with basic data
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (type) {
        query = query.eq('type', type);
      }
      
      const { data: postsData, error: postsError } = await query;
      
      if (postsError) {
        throw postsError;
      }
      
      // Process posts to get user profiles
      if (postsData && postsData.length > 0) {
        // Get all user IDs from posts (filter out null values)
        const userIds = [...new Set(postsData.map(post => post.user_id))].filter(Boolean);
        
        // Fetch profiles for these users
        let profilesData = [];
        if (userIds.length > 0) {
          const { data, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);
          
          if (profilesError) {
            console.warn('Error fetching profiles:', profilesError);
            // Continue anyway, we'll just show posts without profile data
          }
          
          profilesData = data || [];
        }
        
        // Create a map of user_id -> profile
        const profilesMap = profilesData.reduce((map, profile) => {
          map[profile.id] = profile;
          return map;
        }, {});
        
        // For each post, fetch likes and comments
        const postsWithData = await Promise.all(postsData.map(async (post) => {
          // Fetch likes for this post
          const { data: likesData, error: likesError } = await supabase
            .from('likes')
            .select('id, user_id')
            .eq('post_id', post.id);
          
          if (likesError) {
            console.warn(`Error fetching likes for post ${post.id}:`, likesError);
          }
          
          // Fetch comments for this post
          const { data: commentsData, error: commentsError } = await supabase
            .from('comments')
            .select('id, user_id, content, created_at')
            .eq('post_id', post.id)
            .order('created_at', { ascending: false });
          
          if (commentsError) {
            console.warn(`Error fetching comments for post ${post.id}:`, commentsError);
          }
          
          // Return post with profile, likes, and comments
          return {
            ...post,
            profiles: profilesMap[post.user_id] || null, // Changed from profile to profiles to match other components
            likes: likesData || [],
            comments: commentsData || []
          };
        }));
        
        setPosts(postsWithData);
      } else {
        setPosts([]);
      }
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const addPost = useCallback(async (postData: Partial<Post>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Refresh the posts
      fetchPosts();
      return { data, error: null };
    } catch (err: any) {
      console.error('Error adding post:', err);
      setError(err.message);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [fetchPosts]);

  const likePost = useCallback(async (postId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('likes')
        .insert([{ post_id: postId, user_id: userId }]);
      
      if (error) {
        throw error;
      }
      
      // Refresh the posts
      fetchPosts();
      return { error: null };
    } catch (err: any) {
      console.error('Error liking post:', err);
      return { error: err };
    }
  }, [fetchPosts]);

  const unlikePost = useCallback(async (postId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      
      if (error) {
        throw error;
      }
      
      // Refresh the posts
      fetchPosts();
      return { error: null };
    } catch (err: any) {
      console.error('Error unliking post:', err);
      return { error: err };
    }
  }, [fetchPosts]);

  const addComment = useCallback(async (postId: string, userId: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{ post_id: postId, user_id: userId, content }])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Refresh the posts
      fetchPosts();
      return { data, error: null };
    } catch (err: any) {
      console.error('Error adding comment:', err);
      return { data: null, error: err };
    }
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    fetchPosts,
    addPost,
    likePost,
    unlikePost,
    addComment,
  };
}