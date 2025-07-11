import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AuthNavRow } from '@/components/ui/AuthNavRow';
import { useFlashToast } from '@/components/ui/Flash';
import { useAuth } from '@/hooks/useAuth';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export default function OverviewStep() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signUp, loading } = useAuth();
  const toast = useFlashToast();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [error, setError] = useState<string | null>(null);

  const handleEdit = (step: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: `./${step}`, params });
  };

  const handleConfirm = async () => {
    setError(null);
    const { email, password, username, name, surname, avatar_url } = params as any;

    if (!email || !password || !username || !name || !surname) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        type: 'danger',
        title: 'Missing fields',
        message: 'Please complete all required fields.',
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { error, user } = await signUp(email, password, username, name, surname, avatar_url);

    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        type: 'danger',
        title: 'Registration failed',
        message: typeof error === 'object' && error && 'message' in error ? error.message : String(error),
      });
      return;
    }

    if (!user?.id) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        type: 'danger',
        title: 'Verification error',
        message: 'Could not get user id for verification.',
      });
      return;
    }

    toast.show({
      type: 'success',
      title: 'Registration successful',
      message: 'Please verify your email.',
    });

    router.replace({ pathname: './verify', params: { email, userId: user.id } });
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={24}
      >
        <ThemedView style={styles.container}>
          <ThemedView style={styles.formGroup}>
            <ThemedText style={styles.label}>
              Email: <ThemedText style={styles.value}>{params.email}</ThemedText>
            </ThemedText>
            <ThemedText style={styles.label}>
              Username: <ThemedText style={styles.value}>{params.username}</ThemedText>
            </ThemedText>
            <ThemedText style={styles.label}>
              Name: <ThemedText style={styles.value}>{params.name}</ThemedText>
            </ThemedText>
            <ThemedText style={styles.label}>
              Surname: <ThemedText style={styles.value}>{params.surname}</ThemedText>
            </ThemedText>
            <ThemedText style={styles.label}>Profile Picture:</ThemedText>

            {params.avatar_url ? (
              <Image source={{ uri: params.avatar_url as string }} style={[styles.avatar, { backgroundColor: isDark ? '#333' : '#eee' }]} />
            ) : (
              <ThemedView style={[styles.avatar, styles.avatarPlaceholder]}>
                <ThemedText style={{ opacity: 0.5 }}>No Photo</ThemedText>
              </ThemedView>
            )}

            {loading && (
              <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
            )}

            <TouchableOpacity onPress={() => handleEdit('email')}>
              <ThemedText type="link">Edit Email</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleEdit('username')}>
              <ThemedText type="link">Edit Username</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleEdit('name')}>
              <ThemedText type="link">Edit Name</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleEdit('profile-picture')}>
              <ThemedText type="link">Edit Profile Picture</ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <AuthNavRow
            onBack={handleCancel}
            onNext={handleConfirm}
            centerLabel=""
          />
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  formGroup: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 2,
  },
  value: {
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
