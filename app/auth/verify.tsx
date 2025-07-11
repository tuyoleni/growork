import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AuthNavRow } from '@/components/ui/AuthNavRow';
import { Colors } from '@/constants/Colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, useColorScheme } from 'react-native';

export default function VerifyScreen() {
  const { email, username } = useLocalSearchParams<{ email: string; userId: string; username?: string }>();
  const [error] = useState<string | null>(null);
  const scheme = useColorScheme() ?? 'light';
  const color = Colors[scheme];
  const router = useRouter();

  // Personalized welcome message
  const displayName = username || email;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.background }}>
      <ThemedView style={[styles.container, { backgroundColor: color.background }]}> 
        <ThemedView style={styles.formGroup}>
          <ThemedText style={[styles.title, { color: color.text }]}>Welcome, {displayName}!</ThemedText>
          <ThemedText style={[styles.subtitle, { color: color.mutedText }]}>Your account has been created successfully.</ThemedText>
          <ThemedText style={[styles.verifyingText, { color: color.tint }]}>Continue to grow with us.</ThemedText>
          {error && <ThemedText style={[styles.error, { color: '#e53935' }]}>{error}</ThemedText>}
        </ThemedView>
        <AuthNavRow
          onNext={() => router.replace('/(tabs)')}
          nextLabel="Continue to grow with us"
        />
      </ThemedView>
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
  },
  bottomRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    marginHorizontal: 'auto',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingHorizontal: 16,
    zIndex: 10,
  },
}); 