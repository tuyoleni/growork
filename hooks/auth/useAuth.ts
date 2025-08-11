import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { useAuthOperations } from './useAuthOperations';
import type { Profile } from '../../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    fetchUserProfile,
    updateUserProfile,
    forceRefreshProfile,
    isProfileLoaded
  } = useAuthOperations();

  // Use refs to store the latest values to avoid dependency issues
  const userRef = useRef<User | null>(null);
  const fetchUserProfileRef = useRef(fetchUserProfile);

  // Update refs when values change
  useEffect(() => {
    userRef.current = user;
    fetchUserProfileRef.current = fetchUserProfile;
  });

  // Handle auth state changes
  const onAuthStateChange = useCallback(async (event: string, newSession: Session | null) => {
    if (event === 'SIGNED_IN' && newSession) {
      setSession(newSession);
      setUser(newSession.user);

      // Fetch the user's profile if we have a user
      if (newSession.user) {
        const userProfile = await fetchUserProfileRef.current(newSession.user.id);
        if (userProfile) {
          setProfile(userProfile);
        }
      }
    } else if (event === 'SIGNED_OUT') {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  }, []); // Empty dependency array since we use refs

  // Initialize auth state
  useEffect(() => {
    setLoading(true);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);

        // Fetch profile if we have a user
        if (session.user) {
          fetchUserProfileRef.current(session.user.id).then(userProfile => {
            if (userProfile) {
              setProfile(userProfile);
            }
          });
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(onAuthStateChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [onAuthStateChange]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user?.id) return null;

    try {
      const updatedProfile = await updateUserProfile(user.id, updates);
      if (updatedProfile) {
        setProfile(updatedProfile);

        // Force refresh profile to ensure cache is updated
        const freshProfile = await forceRefreshProfile(user.id);
        if (freshProfile) {
          setProfile(freshProfile);
        }
      }
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  }, [user?.id, updateUserProfile, forceRefreshProfile]);

  // Force refresh profile (useful for components to call when they need fresh data)
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const freshProfile = await forceRefreshProfile(user.id);
      if (freshProfile) {
        setProfile(freshProfile);
      }
      return freshProfile;
    } catch (error) {
      console.error('Error refreshing profile:', error);
      return null;
    }
  }, [user?.id, forceRefreshProfile]);

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    updateProfile,
    refreshProfile,
    isProfileLoaded: isProfileLoaded(),
  };
}
