import { useState, useCallback, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import { User, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Profile } from '../../types';

export function useAuthOperations() {
  const profileLoaded = useRef(false);
  const profileFetching = useRef(false);

  // Fetch user profile from database
  const fetchUserProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (profileFetching.current) return null;
    
    try {
      profileFetching.current = true;
      
      // First try to get from cache
      const cachedProfile = await AsyncStorage.getItem(`profile_${userId}`);
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        profileLoaded.current = true;
        return parsed;
      }

      // Fetch from database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (profile) {
        // Cache the profile
        await AsyncStorage.setItem(`profile_${userId}`, JSON.stringify(profile));
        profileLoaded.current = true;
        return profile;
      }

      return null;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    } finally {
      profileFetching.current = false;
    }
  }, []);

  // Update user profile
  const updateUserProfile = useCallback(async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
    try {
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return null;
      }

      if (updatedProfile) {
        // Update cache
        await AsyncStorage.setItem(`profile_${userId}`, JSON.stringify(updatedProfile));
        return updatedProfile;
      }

      return null;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return null;
    }
  }, []);

  // Clear profile cache
  const clearProfileCache = useCallback(async (userId: string) => {
    try {
      await AsyncStorage.removeItem(`profile_${userId}`);
      profileLoaded.current = false;
    } catch (error) {
      console.error('Error clearing profile cache:', error);
    }
  }, []);

  // Check if profile is loaded
  const isProfileLoaded = useCallback(() => profileLoaded.current, []);

  return {
    fetchUserProfile,
    updateUserProfile,
    clearProfileCache,
    isProfileLoaded,
  };
}
