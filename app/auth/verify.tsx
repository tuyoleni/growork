import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AuthNavRow } from '@/components/ui/AuthNavRow';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import ScreenContainer from '@/components/ScreenContainer';

export default function VerifyScreen() {
  const { email, username } = useLocalSearchParams<{ email: string; userId: string; username?: string }>();
  const [error] = useState<string | null>(null);
  const router = useRouter();

  // Personalized welcome message
  const displayName = username || email;

  return (
    <ScreenContainer>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.formGroup}>
          <ThemedText style={styles.title}>Welcome, {displayName}!</ThemedText>
          <ThemedText style={styles.subtitle}>Your account has been created successfully.</ThemedText>
          <ThemedText style={styles.verifyingText}>Continue to grow with us.</ThemedText>
          {error && <ThemedText style={styles.error}>{error}</ThemedText>}
        </ThemedView>
        <AuthNavRow
          onNext={() => router.replace('/(tabs)')}
          nextLabel="Continue to grow with us"
        />
      </ThemedView>
    </ScreenContainer>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  verifyingText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  error: {
    marginTop: 16,
    color: '#e53935',
  },
}); 