import FlashBar from '@/components/ui/Flash';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AppProvider } from '@/utils/AppContext';
import { supabase, clearAllSupabaseData } from '@/utils/superbase';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, createContext, useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

// AuthContext and useAuth
interface AuthContextType {
  session: Session | null;
  initialLoading: boolean;
}
export const AuthContext = createContext<AuthContextType>({ session: null, initialLoading: true });
export function useAuth() {
  return useContext(AuthContext);
}

function useProtectedRoute() {
  const { session, initialLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (initialLoading) return;
    
    const currentPath = segments.join('/');
    console.log('Current path:', currentPath);
    console.log('Session:', session);
    console.log('Segments:', segments);
    
    // Check if we're on an auth route (login, register, etc.)
    const isAuthRoute = segments.some(segment => segment === 'auth');
    // Check if we're on the main app route
    const isTabsRoute = segments.some(segment => segment === '(tabs)');
    
    console.log('Is auth route:', isAuthRoute);
    console.log('Is tabs route:', isTabsRoute);
    
    if (!session?.user && !isAuthRoute) {
      console.log('Redirecting to login - no session and not on auth route');
      router.replace('/auth/login');
    } else if (session?.user && !isTabsRoute) {
      console.log('Redirecting to tabs - has session and not on tabs route');
      router.replace('/(tabs)');
    }
  }, [session, initialLoading, router, segments]);
}

function AuthGate() {
  useProtectedRoute();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [session, setSession] = useState<Session | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    clearAllSupabaseData(); // DEVELOPMENT ONLY
  }, []);

  useEffect(() => {
    let isMounted = true;
    const getInitialSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Supabase getSession error:', error.message);
        }
        console.log('Initial session check:', currentSession);
        if (isMounted) {
          setSession(currentSession);
        }
      } catch (error) {
        console.error('Failed to get session (network/other error):', error);
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    };
    getInitialSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      console.log('Auth state changed:', _event, currentSession);
      if (isMounted) {
        setSession(currentSession);
      }
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!loaded || initialLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ActionSheetProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AuthContext.Provider value={{ session, initialLoading }}>
              <AppProvider>
                <AuthGate />
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <FlashBar />
              </AppProvider>
            </AuthContext.Provider>
          </ThemeProvider>
        </ActionSheetProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}