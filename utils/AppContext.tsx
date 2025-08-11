import { useAuth } from '../hooks/auth';
import { useAds } from '../hooks/search';
import { useApplications } from '../hooks/applications';
import { useBookmarks, useCommentLikes, usePosts } from '../hooks/posts';
import { Ad, Application, Post, Profile } from '../types';
import React, { createContext, useContext, ReactNode, useEffect } from 'react';

// Import the BookmarkState type from useInteractions
interface BookmarkState {
  loading: boolean;
  error: string | null;
  isBookmarked: boolean;
  bookmarks: string[];
  bookmarkedItems: any[];
}

interface AppContextType {
  // Authentication
  user: any | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<any>;
  updateProfile: (updates: Partial<Profile>) => Promise<any>;

  // Posts
  posts: Post[];
  postsLoading: boolean;
  postsError: string | null;
  postsRefreshing: boolean;
  refreshPosts: () => Promise<void>;
  clearPostsError: () => void;

  // Applications
  applications: Application[];
  applicationsLoading: boolean;
  applicationsError: string | null;
  fetchApplications: () => Promise<void>;
  addApplication: (applicationData: Partial<Application>) => Promise<any>;

  // Ads
  ads: Ad[];
  adsLoading: boolean;
  adsError: string | null;
  fetchAds: (status?: any) => Promise<void>;
  addAd: (adData: Partial<Ad>) => Promise<any>;
  recordAdImpression: (adId: string, userId: string) => Promise<any>;

  // Bookmarks
  bookmarks: string[];
  bookmarksLoading: boolean;
  bookmarksError: string | null;
  toggleBookmark: (postId: string) => Promise<any>;
  checkBookmarkStatus: (postId: string) => Promise<any>;
  initializePost: (postId: string) => Promise<any>;
  bookmarkStates: Record<string, BookmarkState>;

  // Comment Likes
  commentLikesLoading: boolean;
  commentLikesError: string | null;
  isCommentLiked: (commentId: string) => Promise<boolean>;
  likeComment: (commentId: string) => Promise<any>;
  unlikeComment: (commentId: string) => Promise<any>;
  toggleCommentLike: (commentId: string) => Promise<any>;
  getCommentLikeCount: (commentId: string) => Promise<number>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Use the individual hooks to create a unified context
  const auth = useAuth();
  const postsHook = usePosts();
  const applicationsHook = useApplications(auth.user?.id);
  const adsHook = useAds();
  const bookmarksHook = useBookmarks();
  const commentLikesHook = useCommentLikes();

  // Initialize state when user changes
  useEffect(() => {
    if (auth.user) {
      postsHook.refresh();
      applicationsHook.fetchApplications();
      adsHook.fetchAds();
      // Note: bookmarks are now managed per-post through useInteractions
    }
  }, [auth.user, postsHook, applicationsHook, adsHook]);

  const value: AppContextType = {
    // Auth state and methods
    user: auth.user,
    profile: auth.profile,
    isAuthenticated: !!auth.user,
    isLoading: auth.loading,
    signOut: auth.signOut,
    updateProfile: auth.updateProfile,

    // Posts state and methods
    posts: postsHook.posts,
    postsLoading: postsHook.loading,
    postsError: postsHook.error,
    postsRefreshing: postsHook.refreshing,
    refreshPosts: postsHook.refresh,
    clearPostsError: postsHook.clearError,

    // Applications state and methods
    applications: applicationsHook.applications,
    applicationsLoading: applicationsHook.loading,
    applicationsError: applicationsHook.error,
    fetchApplications: applicationsHook.fetchApplications,
    addApplication: applicationsHook.addApplication,

    // Ads state and methods
    ads: adsHook.ads,
    adsLoading: adsHook.loading,
    adsError: adsHook.error,
    fetchAds: adsHook.fetchAds,
    addAd: adsHook.addAd,
    recordAdImpression: adsHook.recordAdImpression,

    // Bookmarks state and methods
    bookmarks: [], // Legacy support - use bookmarkStates instead
    bookmarksLoading: bookmarksHook.loading,
    bookmarksError: bookmarksHook.error,
    toggleBookmark: bookmarksHook.toggleBookmark,
    checkBookmarkStatus: bookmarksHook.checkBookmarkStatus,
    initializePost: bookmarksHook.initializePost,
    bookmarkStates: bookmarksHook.bookmarkStates,

    // Comment Likes state and methods
    commentLikesLoading: commentLikesHook.loading,
    commentLikesError: commentLikesHook.error,
    isCommentLiked: async (commentId: string) => commentLikesHook.isLiked(),
    likeComment: commentLikesHook.likeComment,
    unlikeComment: commentLikesHook.unlikeComment,
    toggleCommentLike: commentLikesHook.toggleCommentLike,
    getCommentLikeCount: async () => 0, // Not implemented in current hook
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}