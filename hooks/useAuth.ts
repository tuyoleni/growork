import { Profile, UserType } from '@/types';
import { supabase } from '@/utils/superbase';
import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user and profile on mount
  useEffect(() => {
    const getUserAndProfile = async () => {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        setError(error.message);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser(user);
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profileError) {
          setError(profileError.message);
          setProfile(null);
        } else {
          setProfile(profile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    };
    getUserAndProfile();
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUserAndProfile();
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

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
    // Create profile as UserType.User
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: user.id,
        username,
        name,
        surname,
        avatar_url,
        bio: '',
        user_type: UserType.User,
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

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return { error };
    }
    setLoading(false);
    return { user: data.user };
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
      setLoading(false);
      return { error };
    }
    setLoading(false);
    return { error: null };
  }, []);

  return {
    user,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    refresh: async () => {
      setLoading(true);
      setError(null);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        setError(error.message);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser(user);
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profileError) {
          setError(profileError.message);
          setProfile(null);
        } else {
          setProfile(profile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    },
  };
} 