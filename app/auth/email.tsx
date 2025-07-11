import { ThemedInput } from '@/components/ThemedInput';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AuthNavRow } from '@/components/ui/AuthNavRow';
import { useFlashToast } from '@/components/ui/Flash'; // ✅ useFlashToast
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
} from 'react-native';

export default function EmailStep() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const toast = useFlashToast(); // ✅ grab flash message handler
  const router = useRouter();

  const handleNext = () => {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        type: 'danger',
        title: 'Missing fields',
        message: 'Please enter both email and password.',
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: './username',
      params: { email, password },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={24}
      >
        <ThemedView style={styles.container}>
          <ThemedView style={styles.topTextContainer}>
            <ThemedText type="title" style={styles.heading}>
              Sign up with your email
            </ThemedText>
            <ThemedText type="subtitle" style={styles.paragraph}>
              Enter your email and password to get started.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <ThemedInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </ThemedView>

          <AuthNavRow
            onBack={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace('/auth/login');
            }}
            backLabel="Login instead"
            onNext={handleNext}
            nextLabel="Next"
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
  topTextContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'flex-start',
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'left',
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'left',
    maxWidth: 340,
  },
  input: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  formGroup: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: 32,
  },
});
