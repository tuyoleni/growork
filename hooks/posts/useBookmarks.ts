import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { supabaseRequest } from '@/utils/supabaseRequest';
import { useAuth } from '../auth/useAuth';
import { useInteractions } from './useInteractions';

export interface BookmarkedItem {
  id: string;
  type: 'post' | 'application';
  data: any;
  bookmarked_at: string;
}

export function useBookmarks() {
  const { user } = useAuth();
  const { toggleBookmark, bookmarkStates, initializePost } = useInteractions();

  const [bookmarkedItems, setBookmarkedItems] = useState<BookmarkedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all bookmarked posts
  const fetchBookmarkedPosts = useCallback(async () => {
    if (!user) return [];

    try {
      const { data: bookmarks } = await supabaseRequest<any[]>(
        async () => {
          const { data, error, status } = await supabase
            .from('bookmarks')
            .select(`
              id,
              created_at,
              post_id,
              posts (
                id,
                title,
                content,
                type,
                image_url,
                created_at,
                user_id,
                criteria
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          return { data, error, status };
        },
        { logTag: 'bookmarks:list' }
      );

      // Get unique user IDs from posts
      const userIds = [...new Set(bookmarks
        .filter(bookmark => bookmark.posts)
        .map(bookmark => (bookmark.posts as any)?.user_id)
        .filter(Boolean)
      )];

      // Fetch profiles for all users
      const { data: profiles } = await supabaseRequest<any[]>(
        async () => {
          const { data, error, status } = await supabase
            .from('profiles')
            .select('id, name, surname, username, avatar_url')
            .in('id', userIds);
          return { data, error, status };
        },
        { logTag: 'profiles:listForBookmarks' }
      );

      // Create a map of user profiles
      const profileMap = new Map();
      if (profiles) {
        profiles.forEach(profile => {
          profileMap.set(profile.id, profile);
        });
      }

      return bookmarks
        .filter(bookmark => bookmark.posts) // Filter out any null posts
        .map(bookmark => ({
          id: bookmark.post_id,
          type: 'post' as const,
          data: {
            ...(bookmark.posts as any),
            profiles: profileMap.get((bookmark.posts as any).user_id) || null
          },
          bookmarked_at: bookmark.created_at
        }));
    } catch (err) {
      console.error('Error fetching bookmarked posts:', err);
      return [];
    }
  }, [user]);

  // Fetch all applications (these are automatically "bookmarked" for the user)
  const fetchApplications = useCallback(async () => {
    if (!user) return [];

    try {
      const { data: applications } = await supabaseRequest<any[]>(
        async () => {
          const { data, error, status } = await supabase
            .from('applications')
            .select(`
              id,
              created_at,
              status,
              cover_letter,
              cover_letter_id,
              resume_id,
              post_id,
              posts (
                id,
                title,
                content,
                type,
                criteria
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          return { data, error, status };
        },
        { logTag: 'applications:listForBookmarks' }
      );

      return applications.map(application => ({
        id: application.id,
        type: 'application' as const,
        data: application,
        bookmarked_at: application.created_at
      }));
    } catch (err) {
      console.error('Error fetching applications:', err);
      return [];
    }
  }, [user]);

  // Fetch all bookmarked items (posts + applications)
  const fetchBookmarkedItems = useCallback(async () => {
    if (!user) {
      setBookmarkedItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [bookmarkedPosts, applications] = await Promise.all([
        fetchBookmarkedPosts(),
        fetchApplications()
      ]);

      const allItems = [...bookmarkedPosts, ...applications];

      // Sort by bookmarked_at date (most recent first)
      allItems.sort((a, b) =>
        new Date(b.bookmarked_at).getTime() - new Date(a.bookmarked_at).getTime()
      );

      setBookmarkedItems(allItems);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookmarks');
      console.error('Error fetching bookmarked items:', err);
    } finally {
      setLoading(false);
    }
  }, [user, fetchBookmarkedPosts, fetchApplications]);

  // Refresh bookmarks
  const refreshBookmarks = useCallback(async () => {
    await fetchBookmarkedItems();
  }, [fetchBookmarkedItems]);

  // Remove bookmark (for posts only)
  const removeBookmark = useCallback(async (item: BookmarkedItem) => {
    if (item.type === 'post') {
      const result = await toggleBookmark(item.id);
      if (result.success) {
        // Remove from local state
        setBookmarkedItems(prev => prev.filter(bookmark =>
          !(bookmark.type === 'post' && bookmark.id === item.id)
        ));
      }
      return result;
    } else {
      // Applications can't be "unbookmarked" - they're automatically tracked
      console.log('Cannot remove application bookmark');
      return { success: false, error: 'Applications cannot be unbookmarked' };
    }
  }, [toggleBookmark]);

  // Initialize bookmarks when user changes
  useEffect(() => {
    fetchBookmarkedItems();
  }, [fetchBookmarkedItems]);

  return {
    bookmarkedItems,
    loading,
    error,
    toggleBookmark,
    removeBookmark,
    refreshBookmarks,
    initializePost,
    bookmarkStates
  };
}