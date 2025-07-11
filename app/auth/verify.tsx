import { AuthNavRow } from '@/components/ui/AuthNavRow';
import { supabase } from '@/utils/superbase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function VerifyScreen() {
  const router = useRouter();
  const { email, userId } = useLocalSearchParams<{ email: string; userId: string }>();
  const [verifying, setVerifying] = useState(true);
  const [verificationMsg, setVerificationMsg] = useState('Check your email to verify your account...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;
    const interval = 3000;
    async function poll() {
      while (!cancelled && attempts < maxAttempts) {
        await new Promise(res => setTimeout(res, interval));
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email_confirmed_at) {
          setVerifying(false);
          setVerificationMsg('');
          router.replace('/(tabs)');
          return;
        }
        attempts++;
      }
      if (!cancelled) {
        setVerificationMsg('Still waiting for verification. Please check your email and refresh this page.');
        setVerifying(false);
      }
    }
    poll();
    return () => { cancelled = true; };
  }, [router]);

  const handleCancel = async () => {
    setError(null);
    try {
      if (userId) {
        // Delete user from auth and profiles
        await supabase.from('profiles').delete().eq('id', userId);
        // Supabase does not allow deleting auth.users from client, so just sign out
        await supabase.auth.signOut();
      }
      router.replace('/auth/login');
    } catch (e: any) {
      setError(e.message || 'Failed to cancel registration');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={24}
      >
        <View style={styles.container}>
          <View style={styles.formGroup}>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>We sent a verification link to:</Text>
            <Text style={styles.email}>{email}</Text>
            {verifying && <ActivityIndicator size="large" color="#2563eb" style={{ marginVertical: 24 }} />}
            <Text style={styles.verifyingText}>{verificationMsg}</Text>
            {error && <Text style={styles.error}>{error}</Text>}
          </View>
          <AuthNavRow
            onBack={handleCancel}
            centerLabel=""
          />
        </View>
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
    backgroundColor: '#fff',
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
    color: '#374151',
    marginBottom: 8,
  },
  email: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2563eb',
    marginBottom: 24,
  },
  verifyingText: {
    color: '#2563eb',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  error: {
    color: 'red',
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