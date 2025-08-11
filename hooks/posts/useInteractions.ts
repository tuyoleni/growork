import { useState, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '../auth/useAuth';
import { Post } from '@/types/posts';
import { Application } from '@/types/applications';

export interface BookmarkedItem {
  id: string;
  type: 'post' | 'application';
  data: Post | Application;
  bookmarked_at: string;
}

export interface InteractionState {
  loading: boolean;
  error: string | null;
}

export interface LikeState extends InteractionState {
  isLiked: boolean;
  likeCount: number;
}

export interface CommentState extends InteractionState {
  comments: any[];
}

export interface BookmarkState extends InteractionState {
  isBookmarked: boolean;
  bookmarks: string[];
  bookmarkedItems: BookmarkedItem[];
}

// Unified hook for all post interactions
export function useInteractions() {
  const { user, profile } = useAuth();

  // Like functionality
  const [likeStates, setLikeStates] = useState<Record<string, LikeState>>({});

  // Comment functionality
  const [commentStates, setCommentStates] = useState<Record<string, CommentState>>({});

  // Bookmark functionality
  const [bookmarkStates, setBookmarkStates] = useState<Record<string, BookmarkState>>({});

  // Generic error handler
  const handleError = useCallback((postId: string, type: 'like' | 'comment' | 'bookmark', error: string) => {
    const setState = type === 'like' ? setLikeStates :
      type === 'comment' ? setCommentStates :
        setBookmarkStates;

    setState((prev: any) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        loading: false,
        error
      }
    }));
  }, []);

  // Generic loading handler
  const setLoading = useCallback((postId: string, type: 'like' | 'comment' | 'bookmark', loading: boolean) => {
    const setState = type === 'like' ? setLikeStates :
      type === 'comment' ? setCommentStates :
        setBookmarkStates;

    setState((prev: any) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        loading,
        error: null
      }
    }));
  }, []);

  // LIKE OPERATIONS
  const checkLikeStatus = useCallback(async (postId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking like status:', error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error('Error checking like status:', err);
      return false;
    }
  }, [user]);

  const getLikeCount = useCallback(async (postId: string): Promise<number> => {
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

  const likePost = useCallback(async (postId: string, postOwnerId?: string) => {
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      setLoading(postId, 'like', true);

      // Check if already liked
      const alreadyLiked = await checkLikeStatus(postId);
      if (alreadyLiked) {
        setLoading(postId, 'like', false);
        return { success: true, error: null };
      }

      // Add like
      const { error } = await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (error) {
        handleError(postId, 'like', error.message);
        return { success: false, error: error.message };
      }

      // Update local state
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

      // TODO: Send notification when notification system is ready
      // if (postOwnerId && postOwnerId !== user.id && profile) {
      //   await notifyPostLike(postId, postOwnerId, profile);
      // }

      return { success: true, error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to like post';
      handleError(postId, 'like', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [user, profile, checkLikeStatus, getLikeCount, setLoading, handleError]);

  const unlikePost = useCallback(async (postId: string) => {
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      setLoading(postId, 'like', true);

      // Check if liked first
      const liked = await checkLikeStatus(postId);
      if (!liked) {
        setLoading(postId, 'like', false);
        return { success: true, error: null };
      }

      // Remove like
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) {
        handleError(postId, 'like', error.message);
        return { success: false, error: error.message };
      }

      // Update local state
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
      const errorMessage = err.message || 'Failed to unlike post';
      handleError(postId, 'like', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [user, checkLikeStatus, getLikeCount, setLoading, handleError]);

  const toggleLike = useCallback(async (postId: string, postOwnerId?: string) => {
    try {
      const liked = await checkLikeStatus(postId);
      if (liked) {
        return unlikePost(postId);
      } else {
        return likePost(postId, postOwnerId);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to toggle like';
      return { success: false, error: errorMessage };
    }
  }, [checkLikeStatus, likePost, unlikePost]);

  // BOOKMARK OPERATIONS
  const checkBookmarkStatus = useCallback(async (postId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking bookmark status:', error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error('Error checking bookmark status:', err);
      return false;
    }
  }, [user]);

  const toggleBookmark = useCallback(async (postId: string) => {
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      setLoading(postId, 'bookmark', true);

      const isBookmarked = await checkBookmarkStatus(postId);

      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) {
          handleError(postId, 'bookmark', error.message);
          return { success: false, error: error.message };
        }

        setBookmarkStates(prev => ({
          ...prev,
          [postId]: {
            loading: false,
            error: null,
            isBookmarked: false,
            bookmarks: [],
            bookmarkedItems: []
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
          handleError(postId, 'bookmark', error.message);
          return { success: false, error: error.message };
        }

        setBookmarkStates(prev => ({
          ...prev,
          [postId]: {
            loading: false,
            error: null,
            isBookmarked: true,
            bookmarks: [],
            bookmarkedItems: []
          }
        }));
      }

      return { success: true, error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to toggle bookmark';
      handleError(postId, 'bookmark', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [user, checkBookmarkStatus, setLoading, handleError]);

  // Initialize post state
  const initializePost = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      // Initialize like state
      const [isLiked, likeCount] = await Promise.all([
        checkLikeStatus(postId),
        getLikeCount(postId)
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

      // Initialize bookmark state
      const isBookmarked = await checkBookmarkStatus(postId);
      setBookmarkStates(prev => ({
        ...prev,
        [postId]: {
          loading: false,
          error: null,
          isBookmarked,
          bookmarks: [],
          bookmarkedItems: []
        }
      }));
    } catch (err) {
      console.error('Error initializing post state:', err);
    }
  }, [user, checkLikeStatus, getLikeCount, checkBookmarkStatus]);

  return {
    // Like operations
    likePost,
    unlikePost,
    toggleLike,
    checkLikeStatus,
    getLikeCount,

    // Bookmark operations
    toggleBookmark,
    checkBookmarkStatus,

    // State management
    likeStates,
    bookmarkStates,
    initializePost,

    // Utility
    setLoading,
    handleError
  };
}
