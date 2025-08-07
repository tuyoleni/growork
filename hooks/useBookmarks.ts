import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/utils/superbase';
import { useAuth } from './useAuth';
import { Post } from '@/types/posts';
import { Application } from '@/types/applications';

export interface BookmarkedItem {
  id: string;
  type: 'post' | 'application';
  data: Post | Application;
  bookmarked_at: string;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookmarkedItems, setBookmarkedItems] = useState<BookmarkedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch user's bookmarks with full data
  const fetchBookmarkedContent = useCallback(async () => {
    if (!user) {
      setBookmarks([]);
      setBookmarkedItems([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch bookmarked posts with full post data
      const { data: bookmarkedPosts, error: postsError } = await supabase
        .from('bookmarks')
        .select(`
          post_id,
          created_at,
          posts (
            id,
            user_id,
            type,
            title,
            content,
            image_url,
            industry,
            criteria,
            created_at,
            updated_at,
            is_sponsored
          )
        `)
        .eq('user_id', user.id)
        .not('post_id', 'is', null);

      if (postsError) {
        throw postsError;
      }

      // Fetch user's applications
      const { data: applications, error: applicationsError } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (applicationsError) {
        throw applicationsError;
      }

      // Combine and format the data
      const bookmarkedItems: BookmarkedItem[] = [];

      // Add bookmarked posts
      if (bookmarkedPosts) {
        bookmarkedPosts.forEach(item => {
          if (item.posts) {
            bookmarkedItems.push({
              id: item.post_id,
              type: 'post',
              data: item.posts as Post,
              bookmarked_at: item.created_at
            });
          }
        });
      }

      // Add applications (these are automatically "bookmarked" for the user)
      if (applications) {
        applications.forEach(app => {
          bookmarkedItems.push({
            id: app.id,
            type: 'application',
            data: app as Application,
            bookmarked_at: app.created_at
          });
        });
      }

      // Sort by bookmarked date (newest first)
      bookmarkedItems.sort((a, b) =>
        new Date(b.bookmarked_at).getTime() - new Date(a.bookmarked_at).getTime()
      );

      setBookmarkedItems(bookmarkedItems);

      // Extract post IDs for backward compatibility
      const bookmarkedPostIds = bookmarkedPosts?.map(item => item.post_id) || [];
      setBookmarks(bookmarkedPostIds);
    } catch (err: any) {
      console.error('Error fetching bookmarked content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load bookmarks when user changes
  useEffect(() => {
    fetchBookmarkedContent();
  }, [fetchBookmarkedContent, user]);

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

      // Refresh bookmarked content
      await fetchBookmarkedContent();

      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error adding bookmark:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, bookmarks, fetchBookmarkedContent]);

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
      setBookmarkedItems(prev => prev.filter(item => item.id !== postId));

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

  // Filter bookmarked items by type
  const getBookmarkedPosts = useCallback(() => {
    return bookmarkedItems.filter(item => item.type === 'post');
  }, [bookmarkedItems]);

  const getBookmarkedApplications = useCallback(() => {
    return bookmarkedItems.filter(item => item.type === 'application');
  }, [bookmarkedItems]);

  // Filter by post type
  const getBookmarkedByType = useCallback((postType: string) => {
    return bookmarkedItems.filter(item =>
      item.type === 'post' && (item.data as Post).type === postType
    );
  }, [bookmarkedItems]);

  return {
    bookmarks,
    bookmarkedItems,
    loading,
    error,
    isBookmarked,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    fetchBookmarkedContent,
    getBookmarkedPosts,
    getBookmarkedApplications,
    getBookmarkedByType
  };
}