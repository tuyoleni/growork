import FlashBar from "@/components/ui/Flash";
import { AppProvider } from "@/utils/AppContext";
import { NotificationProvider } from "@/components/NotificationProvider";
import { supabase, handleAuthError } from "@/utils/supabase";
import { setOpenGlobalSheet } from "@/utils/globalSheet";
import { AuthErrorHandler } from "@/components/AuthErrorHandler";

import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import {
  BottomSheetModalProvider,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import React, {
  useEffect,
  useState,
  createContext,
  useContext,
  useRef,
} from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import SimpleBottomSheet from "@/components/GlobalBottomSheet";
import { CommentsBottomSheetWithContext } from "@/components/content/comments/CommentsBottomSheet";
import { useColorScheme } from "react-native";
import { CommentsBottomSheetProvider } from "@/hooks/ui/useBottomSheet";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "@/components/ErrorBoundary";

interface AuthContextType {
  session: Session | null;
  initialLoading: boolean;
}
export const AuthContext = createContext<AuthContextType>({
  session: null,
  initialLoading: true,
});
export function useAuth() {
  return useContext(AuthContext);
}

function useProtectedRoute() {
  const { session, initialLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (initialLoading) return;
    const isAuthRoute = segments.some((segment) => segment === "auth");
    const isProfileRoute = segments.some((segment) => segment === "profile");
    const isApplicationsRoute = segments.some(
      (segment) => segment === "applications"
    );
    const isBookmarksRoute = segments.some(
      (segment) => segment === "bookmarks"
    );

    // Allow public access to main content (home, search, post viewing)
    // Only protect user-specific routes
    if (
      !session?.user &&
      (isProfileRoute || isApplicationsRoute || isBookmarksRoute)
    ) {
      router.replace("/auth/login");
    } else if (session?.user && isAuthRoute) {
      router.replace("/(tabs)");
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
      <Stack.Screen name="notifications" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function AppContent() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  console.log("Font loading status:", loaded);
  const [session, setSession] = useState<Session | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => {
    setAuthError(null);
  };

  // Keep the splash screen visible while we fetch resources
  useEffect(() => {
    const preventAutoHide = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
      } catch (error) {
        console.error("Error preventing auto hide:", error);
      }
    };
    preventAutoHide();
  }, []);

  const sheetRef = useRef<BottomSheetModal>(null);
  const [sheetProps, setSheetProps] = useState<{
    children: React.ReactNode;
    snapPoints?: string[];
    onDismiss?: () => void;
    dynamicSnapPoint?: boolean;
    dynamicOptions?: {
      minHeight?: number;
      maxHeight?: number;
      padding?: number;
    };
  } | null>(null);

  // Expose openGlobalSheet globally
  const openGlobalSheet = (props: {
    children: React.ReactNode;
    snapPoints?: string[];
    onDismiss?: () => void;
    dynamicSnapPoint?: boolean;
    dynamicOptions?: {
      minHeight?: number;
      maxHeight?: number;
      padding?: number;
    };
  }) => {
    console.log("openGlobalSheet called with props:", props);
    setSheetProps(props);

    // Check if we have snap points or dynamic snap point is enabled
    if (
      (props.snapPoints && props.snapPoints.length > 0) ||
      props.dynamicSnapPoint
    ) {
      // Use a more robust approach to ensure the sheet is presented
      const presentSheet = () => {
        console.log(
          "Attempting to present bottom sheet, ref:",
          sheetRef.current
        );
        if (sheetRef.current) {
          try {
            sheetRef.current.present();
            console.log("Bottom sheet presented successfully");
          } catch (error) {
            console.error("Error presenting bottom sheet:", error);
          }
        } else {
          console.error("Bottom sheet ref is null, retrying...");
          // Retry after a short delay
          setTimeout(presentSheet, 50);
        }
      };

      // Initial attempt
      setTimeout(presentSheet, 100);
    } else {
      console.warn(
        "Cannot open bottom sheet: snapPoints array is empty and dynamicSnapPoint is not enabled"
      );
    }
  };

  useEffect(() => {
    // Ensure the global sheet is set after component is mounted
    const timer = setTimeout(() => {
      setOpenGlobalSheet(openGlobalSheet);
      console.log("Global sheet function set");
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const getInitialSession = async () => {
      try {
        // Add safety check for environment variables
        if (
          !process.env.EXPO_PUBLIC_SUPABASE_URL ||
          !process.env.EXPO_PUBLIC_SUPABASE_KEY
        ) {
          console.error("Missing Supabase environment variables");
          if (isMounted) {
            setAuthError("App configuration error. Please contact support.");
            setInitialLoading(false);
          }
          return;
        }

        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        // Handle session error
        if (sessionError) {
          const { shouldSignOut, userMessage } = await handleAuthError(
            sessionError
          );
          console.error("Session error:", userMessage);
          if (shouldSignOut) {
            if (isMounted) {
              setSession(null);
              setAuthError(userMessage);
            }
          }
          return;
        }

        if (currentSession) {
          // Try to refresh the session to validate the tokens
          const {
            data: { user },
            error: refreshError,
          } = await supabase.auth.refreshSession();

          if (refreshError) {
            // Handle refresh token error
            const { shouldSignOut, userMessage } = await handleAuthError(
              refreshError
            );
            console.error("Session refresh error:", userMessage);
            if (shouldSignOut) {
              if (isMounted) {
                setSession(null);
                setAuthError(userMessage);
              }
            }
          } else if (user) {
            if (isMounted) setSession(currentSession);
          }
        } else {
          if (isMounted) setSession(null);
        }
      } catch (error) {
        // Handle unexpected errors
        const { shouldSignOut, userMessage } = await handleAuthError(error);
        console.error("Unexpected auth error:", userMessage);
        if (shouldSignOut) {
          if (isMounted) {
            setSession(null);
            setAuthError(userMessage);
          }
        }
      } finally {
        if (isMounted) {
          setInitialLoading(false);
          console.log("Session loading completed");
        }
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state change:", event);

      // Handle specific auth events
      if (event === "TOKEN_REFRESHED") {
        console.log("Token refreshed successfully");
        if (isMounted) clearAuthError();
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out");
        if (isMounted) {
          setSession(null);
          clearAuthError();
        }
      } else if (event === "SIGNED_IN") {
        console.log("User signed in");
        if (isMounted) {
          setSession(currentSession);
          clearAuthError();
        }
      }

      // Update session state
      if (isMounted) setSession(currentSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Hide splash screen once everything is ready
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const hideSplashScreen = async () => {
      if (loaded && !initialLoading) {
        try {
          await SplashScreen.hideAsync();
          console.log("Splash screen hidden successfully");
        } catch (error) {
          console.error("Error hiding splash screen:", error);
        }
      } else {
        // Set a timeout to hide splash screen after 3 seconds if loading takes too long
        timeout = setTimeout(async () => {
          try {
            await SplashScreen.hideAsync();
            console.log("Splash screen hidden after timeout");
          } catch (error) {
            console.error("Error hiding splash screen:", error);
          }
        }, 3000);
      }
    };

    hideSplashScreen();

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [loaded, initialLoading]);

  if (!loaded || initialLoading) {
    console.log(
      "App still loading - loaded:",
      loaded,
      "initialLoading:",
      initialLoading
    );
    return null; // Return null to keep splash screen visible
  }

  // Show auth error handler if there's an auth error
  if (authError) {
    return (
      <AuthErrorHandler
        error={authError}
        onRetry={clearAuthError}
        onSignIn={clearAuthError}
      />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ActionSheetProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <AuthContext.Provider value={{ session, initialLoading }}>
              <AppProvider>
                <NotificationProvider>
                  <BottomSheetModalProvider>
                    <AuthGate />
                    <StatusBar
                      style={colorScheme === "dark" ? "light" : "dark"}
                    />
                    <FlashBar />

                    {sheetProps && (
                      <SimpleBottomSheet
                        ref={sheetRef}
                        snapPoints={sheetProps.snapPoints}
                        onDismiss={() => setSheetProps(null)}
                        dynamicSnapPoint={sheetProps.dynamicSnapPoint}
                        dynamicOptions={sheetProps.dynamicOptions}
                      >
                        {sheetProps.children}
                      </SimpleBottomSheet>
                    )}

                    {/* Comments Bottom Sheet - now managed by context */}
                    <CommentsBottomSheetWithContext />
                  </BottomSheetModalProvider>
                </NotificationProvider>
              </AppProvider>
            </AuthContext.Provider>
          </ThemeProvider>
        </ActionSheetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <CommentsBottomSheetProvider>
        <AppContent />
      </CommentsBottomSheetProvider>
    </ErrorBoundary>
  );
}
