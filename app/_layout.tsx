import FlashBar from '@/components/ui/Flash';
import GlobalBottomSheet, { GlobalBottomSheetProps } from '@/components/GlobalBottomSheet';
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

function useProtectedRoute() {
  const { session, initialLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (initialLoading) return;
    const currentPath = segments.join('/');
    const isAuthRoute = segments.some(segment => segment === 'auth');
    const isTabsRoute = segments.some(segment => segment === '(tabs)');
    if (!session?.user && !isAuthRoute) router.replace('/auth/login');
    else if (session?.user && !isTabsRoute) router.replace('/(tabs)');
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

  // Use proper typing for the bottom sheet ref and props
  const sheetRef = useRef<BottomSheetModal>(null);
  const [sheetProps, setSheetProps] = useState<Partial<GlobalBottomSheetProps> | null>(null);

  // Add proper type to the props parameter
  const openGlobalSheet = (props: Partial<GlobalBottomSheetProps>) => {
    setSheetProps(props);
    setTimeout(() => sheetRef.current?.present(), 0);
  };

  useEffect(() => {
    let isMounted = true;
    const getInitialSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
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
      } catch (error) {
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
      <BottomSheetModalProvider>
        <ActionSheetProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AuthContext.Provider value={{ session, initialLoading }}>
              <AppProvider>
                <AuthGate />
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <FlashBar />
                <GlobalBottomSheet
                  body={undefined} snapPoints={[]} ref={sheetRef}
                  {...(sheetProps || {})}
                  onDismiss={() => setSheetProps(null)} />
              </AppProvider>
            </AuthContext.Provider>
          </ThemeProvider>
        </ActionSheetProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}