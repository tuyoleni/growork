// This hook is deprecated. Use useInteractions from './useInteractions' instead.
// Keeping for backward compatibility only.

import { useInteractions } from './useInteractions';

export interface BookmarkedItem {
  id: string;
  type: 'post' | 'application';
  data: any;
  bookmarked_at: string;
}

export function useBookmarks() {
  const {
    toggleBookmark,
    bookmarkStates,
    initializePost
  } = useInteractions();

  return {
    loading: false, // Loading state is now managed per post in useInteractions
    error: null, // Error state is now managed per post in useInteractions
    bookmarks: [], // Legacy support - use bookmarkStates instead
    bookmarkedItems: [], // Legacy support - use bookmarkStates instead
    toggleBookmark,
    initializePost,
    bookmarkStates
  };
}