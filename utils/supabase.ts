import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

export const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_KEY!,
    {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
        global: {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        },
        db: {
            schema: 'public',
        },
    })

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

// Simple retry utility for non-406 errors
export const withRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    baseDelay: number = 1000
): Promise<T> => {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;

            // Don't retry 406 errors (they're usually permanent)
            if (error.code === '406' || error.code === '400') {
                throw error;
            }

            console.warn(`Attempt ${attempt} failed:`, error.message);

            if (attempt === maxRetries) {
                throw error;
            }

            // Exponential backoff
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
};
