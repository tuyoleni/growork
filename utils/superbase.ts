
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

// Storage constants
export const STORAGE_BUCKETS = {
  POSTS: 'posts',
  AVATARS: 'avatars',
  DOCUMENTS: 'documents'
};

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SESSION: 1000 * 60 * 60, // 1 hour
  PROFILE: 1000 * 60 * 10, // 10 minutes
  POSTS: 1000 * 60 * 5,    // 5 minutes
  COMMENTS: 1000 * 60 * 2  // 2 minutes
};

// Simple in-memory cache
const memoryCache = new Map();

// Enhanced AsyncStorage implementation with caching to reduce requests
const cachedAsyncStorage = {
  getItem: async (key: string) => {
    try {
      // Check memory cache first
      if (memoryCache.has(key)) {
        const { value, expiry } = memoryCache.get(key);
        // If cache is still valid, return it
        if (expiry > Date.now()) {
          return value;
        }
        // Cache expired, remove it
        memoryCache.delete(key);
      }
      
      // Not in memory cache, get from AsyncStorage
      const value = await AsyncStorage.getItem(key);
      
      // If it's an auth token, cache it in memory for quick access
      if (key.includes('auth-token') && value) {
        memoryCache.set(key, {
          value,
          expiry: Date.now() + CACHE_TTL.SESSION
        });
      }
      
      return value;
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
      
      // Also update memory cache for auth tokens
      if (key.includes('auth-token')) {
        memoryCache.set(key, {
          value,
          expiry: Date.now() + CACHE_TTL.SESSION
        });
      }
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
      
      // Also remove from memory cache
      if (memoryCache.has(key)) {
        memoryCache.delete(key);
      }
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  },
};

// Create Supabase client with optimized configuration for React Native
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    auth: {
      storage: cachedAsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    // Optimize network settings
    global: {
      fetch: (...args) => fetch(...args),
    },
    // Increase timeout for slow networks
    realtime: {
      timeout: 60000 // 60 seconds
    }
  })

// Helper to get public URL for a file
export const getPublicUrl = (bucket: string, filePath: string) => {
  return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
};

// Shared function for image uploads to reduce code duplication
export const uploadImage = async ({
  bucket = STORAGE_BUCKETS.POSTS,
  userId,
  uri,
  fileNamePrefix = 'image'
}: {
  bucket: string,
  userId: string,
  uri: string,
  fileNamePrefix?: string
}) => {
  try {
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${fileNamePrefix}_${userId}_${new Date().getTime()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    // Fetch the image and convert to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Upload the blob directly instead of using FormData
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
      });
      
    if (error) throw error;
    
    // Return the public URL
    return getPublicUrl(bucket, filePath);
  } catch (error) {
    console.error(`Error uploading to ${bucket}:`, error);
    return null;
  }
};

// Helper function to completely clear all Supabase session data
export const clearAllSupabaseData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const supabaseKeys = keys.filter((key) => 
      key.includes('supabase') || 
      key.includes('sb-') ||
      key.startsWith('supabase.')
    );
    
    if (supabaseKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseKeys);
      console.log('Cleared Supabase session data');
    }
  } catch (error) {
    console.error('Error clearing Supabase data:', error);
  }
};
        