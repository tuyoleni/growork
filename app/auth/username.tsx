import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AuthNavRow } from '@/components/ui/AuthNavRow';
import { useFlashToast } from '@/components/ui/Flash'; // useFlashToast for toast
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/superbase';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  TextInput,
} from 'react-native';

export default function UsernameStep() {
  const router = useRouter();
  const { email, password } = useLocalSearchParams<{ email: string; password: string }>();
  const { loading } = useAuth();
  const toast = useFlashToast(); // get toast handler
  const [username, setUsername] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [isUnique, setIsUnique] = useState<boolean | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | number | null>(null);

  useEffect(() => {
    if (!username) {
      setIsUnique(null);
      setFormError(null);
      setChecking(false);
      return;
    }
    setChecking(true);
    setIsUnique(null);
    setFormError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      setChecking(false);
      if (error) {
        setFormError('Error checking username');
        setIsUnique(null);
        return;
      }
      if (data) {
        setIsUnique(false);
        setFormError('Username is already taken.');
      } else {
        setIsUnique(true);
        setFormError(null);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username]);

  const handleNext = () => {
    setFormError(null);

    if (!username) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        type: 'danger',
        title: 'Missing username',
        message: 'Please enter a username.',
      });
      return;
    }

    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        type: 'danger',
        title: 'Missing fields',
        message: 'Missing email or password.',
      });
      return;
    }

    if (isUnique === false) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        type: 'danger',
        title: 'Username taken',
        message: 'Username is already taken.',
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({ pathname: '../name', params: { email, password, username } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={24}
      >
        <ThemedView style={styles.container}>
          <ThemedView style={styles.topTextContainer}>
            <ThemedText type="title" style={styles.heading}>
              Choose a username
            </ThemedText>
            <ThemedText type="subtitle" style={styles.paragraph}>
              Pick a unique username for your account. This will be visible to others.
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.formGroup}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
            {checking && <ActivityIndicator size="small" color="#2563eb" />}
            {isUnique === true && username.length > 0 && !checking && (
              <ThemedText style={styles.available}>Username is available</ThemedText>
            )}
          </ThemedView>
          <AuthNavRow
            onBack={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            onCenter={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace('/auth/login');
            }}
            onNext={handleNext}
            centerLabel="Login instead"
            nextDisabled={loading || checking || isUnique === false}
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
    backgroundColor: '#fff',
  },
  topTextContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'flex-start',
    marginBottom: 0,
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 2,
    marginTop: 0,
    textAlign: 'left',
  },
  paragraph: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 2,
    textAlign: 'left',
    maxWidth: 340,
  },
  input: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  available: {
    color: 'green',
    marginBottom: 8,
  },
  formGroup: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: 32,
  },
});
