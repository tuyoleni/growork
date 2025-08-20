import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, processLock } from '@supabase/supabase-js'
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
            lock: processLock,
        },
        global: {
            headers: {
                'X-Client-Info': 'growork-app',
            },
        },
        db: {
            schema: 'public',
        },
        realtime: {
            timeout: 20000,
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
