import { Profile, UserType } from '@/types';
import { supabase, CACHE_TTL } from '@/utils/superbase';
import type { User, Session, RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache key constants
const CACHE_KEYS = {
  PROFILE: 'user_profile_cache',
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use refs to track whether we've already loaded profile data
  const profileLoaded = useRef(false);
  const profileFetching = useRef(false);
  const profileSubscription = useRef<RealtimeChannel | null>(null);

  // Load profile from cache
  const loadProfileFromCache = async (userId: string): Promise<Profile | null> => {
    try {
      const cachedProfileString = await AsyncStorage.getItem(`${CACHE_KEYS.PROFILE}_${userId}`);
      if (cachedProfileString) {
        const { profile, timestamp } = JSON.parse(cachedProfileString);
        // Check if cache is still valid (less than cache TTL old)
        if (Date.now() - timestamp < CACHE_TTL.PROFILE) {
          console.log('Using cached profile data');
          return profile;
        }
      }
      return null;
    } catch (e) {
      console.error('Error loading profile from cache:', e);
      return null;
    }
  };

  // Save profile to cache
  const saveProfileToCache = async (userId: string, profileData: Profile) => {
    try {
      await AsyncStorage.setItem(
        `${CACHE_KEYS.PROFILE}_${userId}`,
        JSON.stringify({
          profile: profileData,
          timestamp: Date.now()
        })
      );
    } catch (e) {
      console.error('Error saving profile to cache:', e);
    }
  };



  // Setup real-time subscription for profile changes
  const setupProfileSubscription = useCallback((userId: string) => {
    if (!userId) {
      console.log('No user ID provided for profile subscription');
      return;
    }

    // Prevent duplicate subscriptions for the same user
    if (profileSubscription.current && profileSubscription.current.subscribe) {
      console.log('Profile subscription already exists for user:', userId);
      return;
    }

    // Clean up existing subscription
    if (profileSubscription.current) {
      try {
        profileSubscription.current.unsubscribe();
      } catch (error) {
        console.warn('Error cleaning up profile subscription:', error);
      }
      profileSubscription.current = null;
    }

    // Create new subscription
    profileSubscription.current = supabase
      .channel(`profile-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log('Profile updated via real-time:', payload);
          const updatedProfile = payload.new as Profile;

          // Update local state immediately
          setProfile(updatedProfile);
          profileLoaded.current = true;

          // Update cache
          saveProfileToCache(userId, updatedProfile);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        () => {
          console.log('Profile deleted via real-time');
          setProfile(null);
          profileLoaded.current = false;
        }
      )
      .subscribe((status) => {
        console.log('Profile subscription status:', status);

        // Handle subscription status changes
        if (status === 'CHANNEL_ERROR') {
          console.warn('Profile subscription channel error - will retry on next auth change');
        } else if (status === 'CLOSED') {
          console.log('Profile subscription closed');
        } else if (status === 'SUBSCRIBED') {
          console.log('Profile subscription established successfully');
        }
      });
  }, []);

  // Fetch user profile efficiently
  const fetchUserProfile = async (userId: string, force = false) => {
    // Prevent concurrent profile fetches
    if (profileFetching.current) return;

    try {
      profileFetching.current = true;

      // Skip if we've already loaded the profile and not forcing a refresh
      if (profileLoaded.current && !force) return;

      // Try to load from cache first
      const cachedProfile = await loadProfileFromCache(userId);
      if (cachedProfile && !force) {
        setProfile(cachedProfile);
        profileLoaded.current = true;
        return;
      }

      // If not in cache or force refresh, fetch from API
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn('Error fetching profile:', profileError.message);
        setError(profileError.message);
        setProfile(null);
      } else {
        console.log('Profile loaded from API');
        setProfile(profileData);
        profileLoaded.current = true;

        // Cache the profile for future use
        saveProfileToCache(userId, profileData);
      }
    } catch (err: any) {
      console.error('Error in fetchUserProfile:', err.message);
      setError(err.message);
    } finally {
      profileFetching.current = false;
    }
  };

  // Update user profile
  const updateProfile = useCallback(async (profileData: Partial<Profile>) => {
    if (!user) {
      setError('No user logged in');
      return { error: 'No user logged in' };
    }

    try {
      setLoading(true);
      setError(null);

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        return { error: updateError };
      }

      // Update local state
      setProfile(updatedProfile);
      profileLoaded.current = true;

      // Update cache
      saveProfileToCache(user.id, updatedProfile);

      return { profile: updatedProfile };
    } catch (err: any) {
      console.error('Error updating profile:', err.message);
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch user and profile on mount
  useEffect(() => {
    const getUserAndSession = async () => {
      try {
        setLoading(true);
        setError(null);

        // First check for an existing session (this uses the cached token internally)
        const { data: sessionData } = await supabase.auth.getSession();

        // If we have a session, get the user
        if (sessionData?.session) {
          console.log('Found existing session in useAuth');

          // Get user from session to avoid additional network request
          const sessionUser = sessionData.session.user;
          setUser(sessionUser);
          setSession(sessionData.session);

          // Fetch the user's profile if we have a user
          if (sessionUser) {
            // First try to get it from cache (non-blocking)
            fetchUserProfile(sessionUser.id);
            // Setup real-time subscription for profile changes
            setupProfileSubscription(sessionUser.id);
          }
        } else {
          // No session found
          console.log('No session found in useAuth');
          setUser(null);
          setProfile(null);
          setSession(null);
        }
      } catch (err: any) {
        console.error('Error in getUserAndSession:', err.message);
        setError(err.message);
        setUser(null);
        setProfile(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    getUserAndSession();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed in useAuth hook:', event);

      if (event === 'SIGNED_IN') {
        // When the user signs in, update the session and user
        setSession(newSession);
        if (newSession?.user) {
          setUser(newSession.user);
          // Fetch profile (with cache)
          fetchUserProfile(newSession.user.id);
          // Setup real-time subscription for profile changes
          setupProfileSubscription(newSession.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        // When the user signs out, clear their data
        setUser(null);
        setProfile(null);
        setSession(null);
        profileLoaded.current = false;

        // Clean up profile subscription
        if (profileSubscription.current) {
          profileSubscription.current.unsubscribe();
          profileSubscription.current = null;
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // When the token is refreshed, update the session and user
        setSession(newSession);
        if (newSession?.user) {
          setUser(newSession.user);
        }
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
      // Clean up profile subscription on unmount
      if (profileSubscription.current) {
        profileSubscription.current.unsubscribe();
        profileSubscription.current = null;
      }
    };
  }, [setupProfileSubscription]);

  // Sign up
  const signUp = useCallback(async (
    email: string,
    password: string,
    username: string,
    name: string,
    surname: string,
    avatar_url: string | null = null
  ) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return { error };
    }
    const user = data.user;
    if (!user) {
      setError('No user returned from signUp');
      setLoading(false);
      return { error: 'No user returned from signUp' };
    }
    // Create profile as UserType.User with all new fields
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: user.id,
        username,
        name,
        surname,
        avatar_url,
        bio: '',
        user_type: UserType.User,
        website: null,
        phone: null,
        location: null,
        profession: null,
        experience_years: null,
        education: null,
        skills: null,
      },
    ]);
    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return { error: profileError };
    }
    setLoading(false);
    return { user };
  }, []);

  // Sign in (single declaration, no persistSession!)
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Signing in user:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error('Sign in error:', error.message);
        setError(error.message);
        return { error };
      }

      console.log('Sign in successful, session established');

      // Update state
      setUser(data.user);
      setSession(data.session);

      // Fetch the user's profile in the background (non-blocking)
      if (data.user) fetchUserProfile(data.user.id, true);

      return { user: data.user };
    } catch (err: any) {
      console.error('Unexpected error during sign in:', err.message);
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Clean up notification tokens before signing out
      if (user?.id) {
        // await cleanupNotificationTokens(user.id);
      }
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
        return { error };
      }
      return { error: null };
    } catch (err: any) {
      console.error('Error during sign out:', err);
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    user,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refresh: async () => {
      try {
        setLoading(true);
        setError(null);

        // Refresh the session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          setUser(null);
          setProfile(null);
          setSession(null);
          return;
        }

        if (session) {
          setSession(session);
          setUser(session.user);

          // Fetch profile in the background with force refresh
          if (session.user) {
            fetchUserProfile(session.user.id, true);
          }
        } else {
          setUser(null);
          setProfile(null);
          setSession(null);
        }
      } catch (err: any) {
        console.error('Error refreshing auth state:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },

    // Add a method to refresh just the profile
    refreshProfile: async () => {
      if (user) {
        return fetchUserProfile(user.id, true);
      }
    },
  };
}
