import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AuthNavRow } from '@/components/ui/AuthNavRow';
import { useFlashToast } from '@/components/ui/Flash';
import { useAuth } from '@/hooks/auth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import ScreenContainer from '@/components/ScreenContainer';

export default function LoginScreen() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const toast = useFlashToast();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      toast.show({
        type: 'danger',
        title: 'Missing fields',
        message: 'Please enter both email and password.',
      });
      return;
    }

    const { error } = await signIn(email, password);
    if (error) {
      toast.show({
        type: 'danger',
        title: 'Login failed',
        message: error.message || 'Check your credentials and try again.',
      });
    }
  };

  return (
    <ScreenContainer>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.heading}>
          Welcome back
        </ThemedText>
        <ThemedText type="subtitle" style={styles.paragraph}>
          Enter your email and password to log in.
        </ThemedText>

        <ThemedView>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Login'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <AuthNavRow
          onNext={() => router.replace('/auth/email')}
          nextLabel="Register instead"
        />
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  heading: {
    marginBottom: 4,
    textAlign: 'left',
  },
  paragraph: {
    marginBottom: 12,
    maxWidth: 340,
    textAlign: 'left',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    color: '#000',
  },
  loginButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center',
  },
  loginButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
