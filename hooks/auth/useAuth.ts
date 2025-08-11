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
    clearProfileCache,
    isProfileLoaded
  } = useAuthOperations();

  // Use refs to store the latest values to avoid dependency issues
  const userRef = useRef<User | null>(null);
  const fetchUserProfileRef = useRef(fetchUserProfile);
  const clearProfileCacheRef = useRef(clearProfileCache);

  // Update refs when values change
  useEffect(() => {
    userRef.current = user;
    fetchUserProfileRef.current = fetchUserProfile;
    clearProfileCacheRef.current = clearProfileCache;
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

      // Clear profile cache
      if (userRef.current?.id) {
        await clearProfileCacheRef.current(userRef.current.id);
      }
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
      }
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  }, [user?.id, updateUserProfile]);

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    updateProfile,
    isProfileLoaded: isProfileLoaded(),
  };
}
