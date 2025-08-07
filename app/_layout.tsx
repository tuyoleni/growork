import FlashBar from '@/components/ui/Flash';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AppProvider } from '@/utils/AppContext';
import { supabase } from '@/utils/superbase';
import { setOpenGlobalSheet } from '@/utils/globalSheet';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { BottomSheetModalProvider, BottomSheetModal } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, createContext, useContext, useRef } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import SimpleBottomSheet from '@/components/GlobalBottomSheet';
import { Skeleton } from '@/components/ui/Skeleton';

interface AuthContextType {
  session: Session | null;
  initialLoading: boolean;
}
export const AuthContext = createContext<AuthContextType>({ session: null, initialLoading: true });
export function useAuth() {
  return useContext(AuthContext);
}

// Protect routes: allow public access to "post" (post detail) routes only.
function useProtectedRoute() {
  const { session, initialLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (initialLoading) return;
    const isAuthRoute = segments.some(segment => segment === 'auth');
    const isPostRoute = segments.some(segment => segment === 'post');

    if (!session?.user && !isAuthRoute && !isPostRoute) {
      router.replace('/auth/login');
    } else if (session?.user && isAuthRoute) {
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
      <Stack.Screen name="post" />
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

  const sheetRef = useRef<BottomSheetModal>(null);
  const [sheetProps, setSheetProps] = useState<{
    children: React.ReactNode;
    snapPoints: string[];
    onDismiss?: () => void;
  } | null>(null);

  // Expose openGlobalSheet globally
  const openGlobalSheet = (props: {
    children: React.ReactNode;
    snapPoints: string[];
    onDismiss?: () => void;
  }) => {
    console.log('openGlobalSheet called with props:', props);
    setSheetProps(props);

    if (props.snapPoints && props.snapPoints.length > 0) {
      // Use a more robust approach to ensure the sheet is presented
      const presentSheet = () => {
        console.log('Attempting to present bottom sheet, ref:', sheetRef.current);
        if (sheetRef.current) {
          try {
            sheetRef.current.present();
            console.log('Bottom sheet presented successfully');
          } catch (error) {
            console.error('Error presenting bottom sheet:', error);
          }
        } else {
          console.error('Bottom sheet ref is null, retrying...');
          // Retry after a short delay
          setTimeout(presentSheet, 50);
        }
      };

      // Initial attempt
      setTimeout(presentSheet, 100);
    } else {
      console.warn('Cannot open bottom sheet: snapPoints array is empty or undefined');
    }
  };

  useEffect(() => {
    // Ensure the global sheet is set after component is mounted
    const timer = setTimeout(() => {
      setOpenGlobalSheet(openGlobalSheet);
      console.log('Global sheet function set');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const getInitialSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          const { data: { user }, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            await supabase.auth.signOut();
            if (isMounted) setSession(null);
          } else if (user) {
            if (isMounted) setSession(currentSession);
          }
        } else {
          if (isMounted) setSession(null);
        }
      } catch {
        if (isMounted) setSession(null);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };

    getInitialSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (isMounted) setSession(currentSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!loaded || initialLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', padding: 20 }}>
        <View style={{ alignItems: 'center', marginTop: 100 }}>
          <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 20 }} />
          <Skeleton width={200} height={24} style={{ marginBottom: 12 }} />
          <Skeleton width={150} height={16} style={{ marginBottom: 8 }} />
          <Skeleton width={120} height={16} />
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ActionSheetProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthContext.Provider value={{ session, initialLoading }}>
            <AppProvider>
              <BottomSheetModalProvider>
                <AuthGate />
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <FlashBar />

                {sheetProps && (
                  <SimpleBottomSheet
                    ref={sheetRef}
                    snapPoints={sheetProps.snapPoints}
                    onDismiss={() => setSheetProps(null)}
                  >
                    {sheetProps.children}
                  </SimpleBottomSheet>
                )}

              </BottomSheetModalProvider>
            </AppProvider>
          </AuthContext.Provider>
        </ThemeProvider>
      </ActionSheetProvider>
    </GestureHandlerRootView>
  );
}
