import { useState, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '../auth/useAuth';

export interface InteractionState {
  loading: boolean;
  error: string | null;
}

export interface LikeState extends InteractionState {
  isLiked: boolean;
  likeCount: number;
}

export interface BookmarkState extends InteractionState {
  isBookmarked: boolean;
}

// Simplified hook for post interactions - fetches all data regardless of authentication
export function useInteractions() {
  const { user } = useAuth();

  // Like functionality
  const [likeStates, setLikeStates] = useState<Record<string, LikeState>>({});

  // Bookmark functionality
  const [bookmarkStates, setBookmarkStates] = useState<Record<string, BookmarkState>>({});

  // LIKE OPERATIONS
  const checkLikeStatus = useCallback(async (postId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      return !!data;
    } catch {
      return false;
    }
  }, [user]);

  const getLikeCount = useCallback(async (postId: string): Promise<number> => {
    try {
      const { count } = await supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId);

      return count || 0;
    } catch {
      return 0;
    }
  }, []);

  const likePost = useCallback(async (postId: string) => {
    if (!user) return { success: false, error: 'Authentication required' };

    try {
      setLikeStates(prev => ({
        ...prev,
        [postId]: { ...prev[postId], loading: true, error: null }
      }));

      const { error } = await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (error) {
        setLikeStates(prev => ({
          ...prev,
          [postId]: { ...prev[postId], loading: false, error: error.message }
        }));
        return { success: false, error: error.message };
      }

      const newLikeCount = await getLikeCount(postId);
      setLikeStates(prev => ({
        ...prev,
        [postId]: {
          loading: false,
          error: null,
          isLiked: true,
          likeCount: newLikeCount
        }
      }));

      return { success: true, error: null };
    } catch (err: any) {
      setLikeStates(prev => ({
        ...prev,
        [postId]: { ...prev[postId], loading: false, error: 'Failed to like post' }
      }));
      return { success: false, error: 'Failed to like post' };
    }
  }, [user, getLikeCount]);

  const unlikePost = useCallback(async (postId: string) => {
    if (!user) return { success: false, error: 'Authentication required' };

    try {
      setLikeStates(prev => ({
        ...prev,
        [postId]: { ...prev[postId], loading: true, error: null }
      }));

      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) {
        setLikeStates(prev => ({
          ...prev,
          [postId]: { ...prev[postId], loading: false, error: error.message }
        }));
        return { success: false, error: error.message };
      }

      const newLikeCount = await getLikeCount(postId);
      setLikeStates(prev => ({
        ...prev,
        [postId]: {
          loading: false,
          error: null,
          isLiked: false,
          likeCount: newLikeCount
        }
      }));

      return { success: true, error: null };
    } catch (err: any) {
      setLikeStates(prev => ({
        ...prev,
        [postId]: { ...prev[postId], loading: false, error: 'Failed to unlike post' }
      }));
      return { success: false, error: 'Failed to unlike post' };
    }
  }, [user, getLikeCount]);

  const toggleLike = useCallback(async (postId: string) => {
    try {
      const liked = await checkLikeStatus(postId);
      if (liked) {
        return unlikePost(postId);
      } else {
        return likePost(postId);
      }
    } catch {
      return { success: false, error: 'Failed to toggle like' };
    }
  }, [checkLikeStatus, likePost, unlikePost]);

  // BOOKMARK OPERATIONS
  const checkBookmarkStatus = useCallback(async (postId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      return !!data;
    } catch {
      return false;
    }
  }, [user]);

  const toggleBookmark = useCallback(async (postId: string) => {
    if (!user) return { success: false, error: 'Authentication required' };

    try {
      setBookmarkStates(prev => ({
        ...prev,
        [postId]: { ...prev[postId], loading: true, error: null }
      }));

      const isBookmarked = await checkBookmarkStatus(postId);

      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) {
          setBookmarkStates(prev => ({
            ...prev,
            [postId]: { ...prev[postId], loading: false, error: error.message }
          }));
          return { success: false, error: error.message };
        }

        setBookmarkStates(prev => ({
          ...prev,
          [postId]: {
            loading: false,
            error: null,
            isBookmarked: false
          }
        }));
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        if (error) {
          setBookmarkStates(prev => ({
            ...prev,
            [postId]: { ...prev[postId], loading: false, error: error.message }
          }));
          return { success: false, error: error.message };
        }

        setBookmarkStates(prev => ({
          ...prev,
          [postId]: {
            loading: false,
            error: null,
            isBookmarked: true
          }
        }));
      }

      return { success: true, error: null };
    } catch (err: any) {
      setBookmarkStates(prev => ({
        ...prev,
        [postId]: { ...prev[postId], loading: false, error: 'Failed to toggle bookmark' }
      }));
      return { success: false, error: 'Failed to toggle bookmark' };
    }
  }, [user, checkBookmarkStatus]);

  // Initialize post state - ALWAYS fetches data regardless of authentication
  const initializePost = useCallback(async (postId: string) => {
    try {
      // Always get like count (public data)
      const likeCount = await getLikeCount(postId);

      if (user) {
        // Get user-specific data if authenticated
        const [isLiked, isBookmarked] = await Promise.all([
          checkLikeStatus(postId),
          checkBookmarkStatus(postId)
        ]);

        setLikeStates(prev => ({
          ...prev,
          [postId]: {
            loading: false,
            error: null,
            isLiked,
            likeCount
          }
        }));

        setBookmarkStates(prev => ({
          ...prev,
          [postId]: {
            loading: false,
            error: null,
            isBookmarked
          }
        }));
      } else {
        // For non-authenticated users, show public data with default user states
        setLikeStates(prev => ({
          ...prev,
          [postId]: {
            loading: false,
            error: null,
            isLiked: false,
            likeCount
          }
        }));

        setBookmarkStates(prev => ({
          ...prev,
          [postId]: {
            loading: false,
            error: null,
            isBookmarked: false
          }
        }));
      }

    } catch (error) {
      console.error('Error initializing post:', error);
    }
  }, [user, checkLikeStatus, getLikeCount, checkBookmarkStatus]);

  return {
    likeStates,
    bookmarkStates,
    likePost,
    unlikePost,
    toggleLike,
    toggleBookmark,
    initializePost,
  };
}
