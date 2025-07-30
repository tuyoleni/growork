import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/utils/superbase';
import { useAuth } from './useAuth';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch user's bookmarks
  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('bookmarks')
        .select('post_id')
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Extract post IDs from the data
      const bookmarkedPostIds = data?.map(bookmark => bookmark.post_id) || [];
      setBookmarks(bookmarkedPostIds);
    } catch (err: any) {
      console.error('Error fetching bookmarks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load bookmarks when user changes
  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks, user]);

  // Check if a post is bookmarked
  const isBookmarked = useCallback((postId: string) => {
    return bookmarks.includes(postId);
  }, [bookmarks]);

  // Add a bookmark
  const addBookmark = useCallback(async (postId: string) => {
    if (!user) {
      setError('You must be logged in to bookmark a post');
      return { success: false, error: 'Authentication required' };
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if already bookmarked
      if (bookmarks.includes(postId)) {
        return { success: true, error: null }; // Already bookmarked
      }
      
      // Add bookmark
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          post_id: postId,
          user_id: user.id,
        });
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setBookmarks(prev => [...prev, postId]);
      
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error adding bookmark:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, bookmarks]);

  // Remove a bookmark
  const removeBookmark = useCallback(async (postId: string) => {
    if (!user) {
      setError('You must be logged in to remove a bookmark');
      return { success: false, error: 'Authentication required' };
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if not bookmarked
      if (!bookmarks.includes(postId)) {
        return { success: true, error: null }; // Not bookmarked, nothing to do
      }
      
      // Remove bookmark
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setBookmarks(prev => prev.filter(id => id !== postId));
      
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error removing bookmark:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, bookmarks]);

  // Toggle bookmark status
  const toggleBookmark = useCallback(async (postId: string) => {
    if (isBookmarked(postId)) {
      return removeBookmark(postId);
    } else {
      return addBookmark(postId);
    }
  }, [isBookmarked, addBookmark, removeBookmark]);

  return {
    bookmarks,
    loading,
    error,
    isBookmarked,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    fetchBookmarks
  };
}