import { useState, useCallback, useEffect } from 'react';
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

  // Track ongoing requests to prevent duplicates
  const [ongoingRequests, setOngoingRequests] = useState<Set<string>>(new Set());

  // Rate limiting - prevent too many requests in short time
  const [lastRequestTime, setLastRequestTime] = useState<Record<string, number>>({});
  const RATE_LIMIT_MS = 1000; // 1 second between requests for same post

  // Like functionality
  const [likeStates, setLikeStates] = useState<Record<string, LikeState>>({});

  // Comment functionality
  const [commentStates, setCommentStates] = useState<Record<string, CommentState>>({});

  // Bookmark functionality
  const [bookmarkStates, setBookmarkStates] = useState<Record<string, BookmarkState>>({});

  // Helper to check if request is already in progress
  const isRequestInProgress = useCallback((postId: string, type: string): boolean => {
    return ongoingRequests.has(`${postId}-${type}`);
  }, [ongoingRequests]);

  // Helper to check rate limiting
  const isRateLimited = useCallback((postId: string, type: string): boolean => {
    const key = `${postId}-${type}`;
    const lastTime = lastRequestTime[key] || 0;
    const now = Date.now();
    return (now - lastTime) < RATE_LIMIT_MS;
  }, [lastRequestTime]);

  // Helper to mark request as started/completed
  const setRequestStatus = useCallback((postId: string, type: string, inProgress: boolean) => {
    setOngoingRequests(prev => {
      const newSet = new Set(prev);
      const key = `${postId}-${type}`;
      if (inProgress) {
        newSet.add(key);
        // Update last request time
        setLastRequestTime(prev => ({ ...prev, [key]: Date.now() }));
      } else {
        newSet.delete(key);
      }
      return newSet;
    });
  }, []);

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

    // Prevent duplicate requests
    if (isRequestInProgress(postId, 'like-status')) {
      return likeStates[postId]?.isLiked || false;
    }

    // Check rate limiting
    if (isRateLimited(postId, 'like-status')) {
      return likeStates[postId]?.isLiked || false;
    }

    setRequestStatus(postId, 'like-status', true);

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user hasn't liked this post
          return false;
        }
        if (error.code === '406' || error.code === '400') {
          // Bad request - stop trying for this post
          console.warn('Stopping like status checks for post due to error:', error.message);
          return false;
        }
        console.error('Error checking like status:', error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error('Error checking like status:', err);
      return false;
    } finally {
      setRequestStatus(postId, 'like-status', false);
    }
  }, [user, likeStates, isRequestInProgress, isRateLimited, setRequestStatus]);

  const getLikeCount = useCallback(async (postId: string): Promise<number> => {
    // Prevent duplicate requests
    if (isRequestInProgress(postId, 'like-count')) {
      return likeStates[postId]?.likeCount || 0;
    }

    // Check rate limiting
    if (isRateLimited(postId, 'like-count')) {
      return likeStates[postId]?.likeCount || 0;
    }

    setRequestStatus(postId, 'like-count', true);

    try {
      const { count, error } = await supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (error) {
        if (error.code === '406' || error.code === '400') {
          console.warn('Stopping like count checks for post due to error:', error.message);
          return 0;
        }
        console.error('Error getting like count:', error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('Error getting like count:', err);
      return 0;
    } finally {
      setRequestStatus(postId, 'like-count', false);
    }
  }, [likeStates, isRequestInProgress, isRateLimited, setRequestStatus]);

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

  // Add a function to refresh like state after toggle
  const refreshLikeState = useCallback(async (postId: string) => {
    try {
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
    } catch (err) {
      console.error('Error refreshing like state:', err);
    }
  }, [checkLikeStatus, getLikeCount]);

  // Update toggleLike to refresh state after operation
  const toggleLikeWithRefresh = useCallback(async (postId: string, postOwnerId?: string) => {
    try {
      const result = await toggleLike(postId, postOwnerId);
      if (result.success) {
        // Refresh the state after successful toggle
        await refreshLikeState(postId);
      }
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to toggle like';
      return { success: false, error: errorMessage };
    }
  }, [toggleLike, refreshLikeState]);

  // BOOKMARK OPERATIONS
  const checkBookmarkStatus = useCallback(async (postId: string): Promise<boolean> => {
    if (!user) return false;

    // Prevent duplicate requests
    if (isRequestInProgress(postId, 'bookmark-status')) {
      return bookmarkStates[postId]?.isBookmarked || false;
    }

    // Check rate limiting
    if (isRateLimited(postId, 'bookmark-status')) {
      return bookmarkStates[postId]?.isBookmarked || false;
    }

    setRequestStatus(postId, 'bookmark-status', true);

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user hasn't bookmarked this post
          return false;
        }
        if (error.code === '406' || error.code === '400') {
          // Bad request - stop trying for this post
          console.warn('Stopping bookmark status checks for post due to error:', error.message);
          return false;
        }
        console.error('Error checking bookmark status:', error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error('Error checking bookmark status:', err);
      return false;
    } finally {
      setRequestStatus(postId, 'bookmark-status', false);
    }
  }, [user, bookmarkStates, isRequestInProgress, isRateLimited, setRequestStatus]);

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

    // Prevent duplicate initialization
    if (isRequestInProgress(postId, 'init')) {
      return;
    }

    // Check rate limiting
    if (isRateLimited(postId, 'init')) {
      return;
    }

    setRequestStatus(postId, 'init', true);

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

    } catch (error) {
      console.error('Error initializing post:', error);
    } finally {
      setRequestStatus(postId, 'init', false);
    }
  }, [user, checkLikeStatus, getLikeCount, checkBookmarkStatus, isRequestInProgress, isRateLimited, setRequestStatus]);

  // Cleanup function to clear ongoing requests
  const clearOngoingRequests = useCallback(() => {
    setOngoingRequests(new Set());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearOngoingRequests();
    };
  }, [clearOngoingRequests]);

  return {
    // Like operations
    likePost,
    unlikePost,
    toggleLike: toggleLikeWithRefresh,
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
    handleError,
    clearOngoingRequests,
  };
}
