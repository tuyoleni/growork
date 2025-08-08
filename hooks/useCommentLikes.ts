import { useState, useCallback } from 'react';
import { supabase } from '@/utils/superbase';
import { useAuth } from './useAuth';
import { useInteractionNotifications } from './notifications/useInteractionNotifications';


// For use with 'comment_likes' table
export function useCommentLikes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const { notifyCommentLike } = useInteractionNotifications();

  // Is this comment liked by this user?
  const isLiked = useCallback(async (commentId: string) => {
    if (!user) return false;
    try {
      const { data, error } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, that's ok
        return false;
      }
      return !!data;
    } catch {
      return false;
    }
  }, [user]);

  // Like a comment
  const likeComment = useCallback(async (commentId: string, commentOwnerId?: string) => {
    if (!user) {
      setError('You must be logged in to like a comment');
      return { success: false, error: 'Authentication required' };
    }
    try {
      setLoading(true);
      setError(null);

      // Check if already liked
      const alreadyLiked = await isLiked(commentId);
      if (alreadyLiked) return { success: true, error: null };

      const { error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
        });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      // Send notification if comment owner is different from current user
      if (commentOwnerId && commentOwnerId !== user.id && profile) {
        const likerName = profile.name && profile.surname
          ? `${profile.name} ${profile.surname}`
          : profile.username || 'Someone';

        await notifyCommentLike(commentId, commentOwnerId, likerName);
      }

      return { success: true, error: null };
    } catch (err: any) {
      const message = err.message || 'Failed to like comment';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [user, isLiked, profile, notifyCommentLike]);

  // Unlike a comment
  const unlikeComment = useCallback(async (commentId: string) => {
    if (!user) {
      setError('You must be logged in to unlike a comment');
      return { success: false, error: 'Authentication required' };
    }
    try {
      setLoading(true);
      setError(null);

      const liked = await isLiked(commentId);
      if (!liked) return { success: true, error: null };

      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      const message = err.message || 'Failed to unlike comment';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [user, isLiked]);

  // Toggle like (like or unlike) for a comment
  const toggleLike = useCallback(async (commentId: string) => {
    if (!user) {
      setError('You must be logged in to like/unlike a comment');
      return { success: false, error: 'Authentication required' };
    }
    try {
      const liked = await isLiked(commentId);
      if (liked) {
        return await unlikeComment(commentId);
      } else {
        return await likeComment(commentId);
      }
    } catch (err: any) {
      const message = err.message || 'Failed to toggle like';
      setError(message);
      return { success: false, error: message };
    }
  }, [user, isLiked, likeComment, unlikeComment]);

  // Number of likes on this comment
  const getLikeCount = useCallback(async (commentId: string) => {
    try {
      const { count, error } = await supabase
        .from('comment_likes')
        .select('id', { count: 'exact', head: true })
        .eq('comment_id', commentId);

      if (error) {
        return 0;
      }
      return count || 0;
    } catch {
      return 0;
    }
  }, []);

  return {
    loading,
    error,
    isLiked,
    likeComment,
    unlikeComment,
    toggleLike,
    getLikeCount,
  };
}
