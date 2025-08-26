import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, processLock } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'
import { checkNetworkStatus } from './networkUtils'


const withTimeout = async (
    input: RequestInfo | URL | string,
    init: RequestInit = {},
    timeoutMs = 15000
): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(input as any, { ...init, signal: controller.signal });
        return res;
    } finally {
        clearTimeout(id);
    }
}

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
            fetch: (input: RequestInfo | URL | string, init?: RequestInit) => withTimeout(input, init, 15000),
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

// Test function to verify Supabase connection
export const testSupabaseConnection = async () => {
    try {
        console.log('🔍 Testing Supabase connection...');

        // Check network connectivity first
        const networkStatus = await checkNetworkStatus();
        if (!networkStatus.isConnected) {
            console.error('❌ No internet connection detected');
            return false;
        }

        // Test basic connection by fetching a single row from a table
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);

        if (error) {
            console.error('❌ Supabase connection test failed:', error);
            return false;
        }

        console.log('✅ Supabase connection test successful');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection test error:', error);
        return false;
    }
};
