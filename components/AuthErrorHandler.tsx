import React, { useState } from "react";
import { View, Alert } from "react-native";
import { useRouter } from "expo-router";
import ThemedButton from "./ui/ThemedButton";
import { ThemedText } from "./ThemedText";
import { useThemeColor } from "@/hooks";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from "@/constants/DesignSystem";
import { clearAllSupabaseData } from "@/utils/supabase";

interface AuthErrorHandlerProps {
  error: string;
  onRetry?: () => void;
  onSignIn?: () => void;
}

export const AuthErrorHandler: React.FC<AuthErrorHandlerProps> = ({
  error,
  onRetry,
  onSignIn,
}) => {
  const router = useRouter();
  const [isHandlingError, setIsHandlingError] = useState(false);
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");

  const handleSignOutAndRestart = async () => {
    if (isHandlingError) return;

    setIsHandlingError(true);
    try {
      // Clear all stored auth data
      await clearAllSupabaseData();

      // Show confirmation
      Alert.alert(
        "Session Cleared",
        "Your session has been cleared. Please sign in again.",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate to login screen
              router.replace("/auth/login");
            },
          },
        ]
      );
    } catch (clearError) {
      console.error("Error clearing session:", clearError);
      Alert.alert("Error", "Failed to clear session. Please restart the app.");
    } finally {
      setIsHandlingError(false);
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry action - refresh the current screen
      router.replace("/");
    }
  };

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      router.replace("/auth/login");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: Spacing.lg,
        backgroundColor,
      }}
    >
      <View
        style={{
          backgroundColor: Colors.gray50,
          borderRadius: BorderRadius.xl,
          padding: Spacing.xl,
          alignItems: "center",
          maxWidth: 400,
          width: "100%",
        }}
      >
        {/* Error Icon */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: BorderRadius.full,
            backgroundColor: Colors.error,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: Spacing.lg,
          }}
        >
          <ThemedText
            style={{
              fontSize: Typography["3xl"],
              color: Colors.white,
              fontWeight: Typography.bold,
            }}
          >
            ⚠️
          </ThemedText>
        </View>

        {/* Error Title */}
        <ThemedText
          style={{
            fontSize: Typography.xl,
            fontWeight: Typography.bold,
            color: textColor,
            textAlign: "center",
            marginBottom: Spacing.md,
          }}
        >
          Authentication Error
        </ThemedText>

        {/* Error Message */}
        <ThemedText
          style={{
            fontSize: Typography.base,
            color: Colors.gray600,
            textAlign: "center",
            lineHeight: Typography.lineHeight.relaxed,
            marginBottom: Spacing.xl,
          }}
        >
          {error}
        </ThemedText>

        {/* Action Buttons */}
        <View style={{ gap: Spacing.sm, width: "100%" }}>
          <ThemedButton
            title="Sign In Again"
            onPress={handleSignIn}
            style={{ backgroundColor: Colors.primary }}
            textStyle={{ color: Colors.white }}
          />

          {onRetry && (
            <ThemedButton
              title="Try Again"
              onPress={handleRetry}
              variant="outline"
            />
          )}

          <ThemedButton
            title="Clear Session & Restart"
            onPress={handleSignOutAndRestart}
            variant="outline"
            disabled={isHandlingError}
          />
        </View>
      </View>
    </View>
  );
};

export default AuthErrorHandler;
