import { useState, useCallback } from 'react';
import { supabase } from '@/utils/superbase';
import { useAuth } from './useAuth';
import { useInteractionNotifications } from './notifications/useInteractionNotifications';

export function useLikes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const { notifyPostLike } = useInteractionNotifications();

  // Check if a post is liked by the current user
  const isLiked = useCallback(async (postId: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is fine
        console.error('Error checking like status:', error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error('Error checking like status:', err);
      return false;
    }
  }, [user]);

  // Like a post
  const likePost = useCallback(async (postId: string, postOwnerId?: string) => {
    if (!user) {
      setError('You must be logged in to like a post');
      return { success: false, error: 'Authentication required' };
    }

    try {
      setLoading(true);
      setError(null);

      // Check if already liked
      const alreadyLiked = await isLiked(postId);

      if (alreadyLiked) {
        return { success: true, error: null }; // Already liked, no need to do it again
      }

      // Add like
      const { error } = await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      // Send notification if post owner is different from current user
      if (postOwnerId && postOwnerId !== user.id && profile) {
        const likerName = profile.name && profile.surname
          ? `${profile.name} ${profile.surname}`
          : profile.username || 'Someone';

        await notifyPostLike(postId, postOwnerId, likerName);
      }

      return { success: true, error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to like post';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, isLiked, profile, notifyPostLike]);

  // Unlike a post
  const unlikePost = useCallback(async (postId: string) => {
    if (!user) {
      setError('You must be logged in to unlike a post');
      return { success: false, error: 'Authentication required' };
    }

    try {
      setLoading(true);
      setError(null);

      // Check if liked first
      const liked = await isLiked(postId);

      if (!liked) {
        return { success: true, error: null }; // Not liked, no need to unlike
      }

      // Remove like
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to unlike post';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, isLiked]);

  // Toggle like status (like if not liked, unlike if liked)
  const toggleLike = useCallback(async (postId: string, postOwnerId?: string) => {
    if (!user) {
      setError('You must be logged in to like/unlike a post');
      return { success: false, error: 'Authentication required' };
    }

    try {
      const liked = await isLiked(postId);
      if (liked) {
        return unlikePost(postId);
      } else {
        return likePost(postId, postOwnerId);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to toggle like';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [user, isLiked, likePost, unlikePost]);

  // Get like count for a post
  const getLikeCount = useCallback(async (postId: string) => {
    try {
      const { count, error } = await supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (error) {
        console.error('Error getting like count:', error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('Error getting like count:', err);
      return 0;
    }
  }, []);

  return {
    loading,
    error,
    isLiked,
    likePost,
    unlikePost,
    toggleLike,
    getLikeCount,
  };
}