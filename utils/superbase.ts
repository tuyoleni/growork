
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

// Custom storage implementation that allows manual control
const customStorage = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value)
    } catch {
      // Handle error silently
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key)
    } catch {
      // Handle error silently
    }
  },
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    auth: {
      storage: customStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })

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
        