import FlashBar from '@/components/ui/Flash';
import GlobalBottomSheet, { GlobalBottomSheetProps } from '@/components/GlobalBottomSheet';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AppProvider } from '@/utils/AppContext';
import { supabase } from '@/utils/superbase';
import { setOpenGlobalSheet } from '@/utils/globalSheet';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, createContext, useContext, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

interface AuthContextType {
  session: Session | null;
  initialLoading: boolean;
}
export const AuthContext = createContext<AuthContextType>({ session: null, initialLoading: true });
export function useAuth() { return useContext(AuthContext); }

// Protect routes: allow public access to "post" (post detail) routes only.
function useProtectedRoute() {
  const { session, initialLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (initialLoading) return;
    
    const isAuthRoute = segments.some(segment => segment === 'auth');
    const isPostRoute = segments.some(segment => segment === 'post');

    // Only redirect unauthenticated users from routes that are NOT post or auth
    // "post" routes are accessible to public, and "auth" routes are for login/sign-up
    if (!session?.user && !isAuthRoute && !isPostRoute) {
      router.replace('/auth/login');
    } else if (session?.user && isAuthRoute) {
      // Authenticated users shouldn't see login routes
      router.replace('/(tabs)');
    }
    // Public users can visit /post/[id], but need login for other app routes
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
  const [sheetProps, setSheetProps] = useState<Partial<GlobalBottomSheetProps> | null>(null);

  const openGlobalSheet = (props: Partial<GlobalBottomSheetProps>) => {
    setSheetProps(props);
    if (props.snapPoints && props.snapPoints.length > 0) {
      setTimeout(() => {
        if (sheetRef.current) {
          sheetRef.current.present();
        }
      }, 100);
    } else {
      console.warn('Cannot open bottom sheet: snapPoints array is empty or undefined');
    }
  };

  useEffect(() => {
    setOpenGlobalSheet(openGlobalSheet);
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

    return () => { isMounted = false; subscription.unsubscribe(); };
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
      <ActionSheetProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthContext.Provider value={{ session, initialLoading }}>
            <AppProvider>
              <BottomSheetModalProvider>
                <AuthGate />
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <FlashBar />
                <GlobalBottomSheet
                  ref={sheetRef}
                  body={sheetProps?.body || <></>}
                  snapPoints={sheetProps?.snapPoints || ['50%']}
                  header={sheetProps?.header}
                  footer={sheetProps?.footer}
                  onDismiss={() => setSheetProps(null)}
                />
              </BottomSheetModalProvider>
            </AppProvider>
          </AuthContext.Provider>
        </ThemeProvider>
      </ActionSheetProvider>
    </GestureHandlerRootView>
  );
}
