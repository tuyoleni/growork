import { useAuth } from '@/hooks/useAuth';
import { useAds } from '@/hooks/useAds';
import { useApplications } from '@/hooks/useApplications';
import { usePosts } from '@/hooks/usePosts';
import { Ad, Application, Document, Post, Profile } from '@/types';
import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';

interface AppContextType {
  // Authentication
  user: any | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, username: string, name: string, surname: string) => Promise<any>;
  signOut: () => Promise<any>;
  refreshAuth: () => Promise<void>;
  
  // Posts
  posts: Post[];
  postsLoading: boolean;
  postsError: string | null;
  fetchPosts: (type?: any) => Promise<void>;
  addPost: (postData: Partial<Post>) => Promise<any>;
  likePost: (postId: string, userId: string) => Promise<any>;
  unlikePost: (postId: string, userId: string) => Promise<any>;
  
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Use the individual hooks to create a unified context
  const auth = useAuth();
  const postsHook = usePosts();
  const applicationsHook = useApplications(auth.user?.id);
  const adsHook = useAds();

  // Initialize state when user changes
  useEffect(() => {
    if (auth.user) {
      postsHook.fetchPosts();
      applicationsHook.fetchApplications();
      adsHook.fetchAds();
    }
  }, [auth.user]);

  const value: AppContextType = {
    // Auth state and methods
    user: auth.user,
    profile: auth.profile,
    isAuthenticated: !!auth.user,
    isLoading: auth.loading,
    authError: auth.error,
    signIn: auth.signIn,
    signUp: auth.signUp,
    signOut: auth.signOut,
    refreshAuth: auth.refresh,
    
    // Posts state and methods
    posts: postsHook.posts,
    postsLoading: postsHook.loading,
    postsError: postsHook.error,
    fetchPosts: postsHook.fetchPosts,
    addPost: postsHook.addPost,
    likePost: postsHook.likePost,
    unlikePost: postsHook.unlikePost,
    
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