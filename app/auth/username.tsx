import { ThemedInput } from '@/components/ThemedInput';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AuthNavRow } from '@/components/ui/AuthNavRow';
import { useFlashToast } from '@/components/ui/Flash'; // useFlashToast for toast
import { Colors } from '@/constants/Colors';
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
  useColorScheme,
  View,
} from 'react-native';

export default function UsernameStep() {
  const router = useRouter();
  const { email, password } = useLocalSearchParams<{ email: string; password: string }>();
  const { loading, signUp } = useAuth();
  const toast = useFlashToast(); // get toast handler
  const [username, setUsername] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [isUnique, setIsUnique] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | number | null>(null);
  const scheme = useColorScheme() ?? 'light';
  const color = Colors[scheme];
  const errorColor = '#e53935'; // fallback red for error
  const [submitting, setSubmitting] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

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

  const handleNext = async () => {
    setFormError(null);
    setSignupError(null);

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

    if (!name || !surname) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        type: 'danger',
        title: 'Missing fields',
        message: 'Please enter both first name and surname.',
      });
      return;
    }

    setSubmitting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { error, user } = await signUp(email, password, username, name, surname, '');
      if (error) {
        setSignupError(typeof error === 'object' && error && 'message' in error ? error.message : String(error));
        toast.show({
          type: 'danger',
          title: 'Registration failed',
          message: typeof error === 'object' && error && 'message' in error ? error.message : String(error),
        });
        setSubmitting(false);
        return;
      }
      if (!user?.id) {
        setSignupError('Could not get user id for verification.');
        toast.show({
          type: 'danger',
          title: 'Verification error',
          message: 'Could not get user id for verification.',
        });
        setSubmitting(false);
        return;
      }
      // Pass username and email to verify screen
      router.push({ pathname: './verify', params: { email, userId: user.id, username } });
      // Trigger push notification after 3 seconds
      setTimeout(async () => {
        const Notifications = await import('expo-notifications');
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Welcome, ${username || email}!`,
            body: 'Your account has been created. Continue to grow with us.',
          },
          trigger: null,
        });
      }, 3000);
    } catch (e: any) {
      setSignupError(e.message || 'Unknown error');
      toast.show({
        type: 'danger',
        title: 'Registration error',
        message: e.message || 'Unknown error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={24}
      >
        <ThemedView style={[styles.container, { backgroundColor: color.background }]}>
          <ThemedView style={styles.topTextContainer}>
            <ThemedText type="title" style={[styles.heading, { color: color.text }]}>
              Choose a username
            </ThemedText>
            <ThemedText type="subtitle" style={[styles.paragraph, { color: color.mutedText }]}>
              Pick a unique username for your account. This will be visible to others.
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.formGroup}>
            <View style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: color.backgroundSecondary,
                    color: color.text,
                    borderColor: formError ? errorColor : color.border,
                  },
                ]}
                placeholder="Username"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                placeholderTextColor={color.mutedText}
              />
              {checking && (
                <ActivityIndicator
                  size="small"
                  color={color.tint}
                  style={{ position: 'absolute', right: 12, top: '50%', marginTop: -10 }}
                />
              )}
            </View>
            {isUnique === false && username.length > 0 && !checking && (
              <ThemedText style={[styles.available, { color: errorColor }]}>Username is already taken</ThemedText>
            )}
            {isUnique === true && username.length > 0 && !checking && (
              <ThemedText style={[styles.available, { color: color.tint }]}>Username is available</ThemedText>
            )}
            {/* Name and Surname fields */}
            <ThemedInput
              style={styles.input}
              placeholder="First Name"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
              placeholderTextColor={color.mutedText}
            />
            <ThemedInput
              style={styles.input}
              placeholder="Surname"
              autoCapitalize="words"
              value={surname}
              onChangeText={setSurname}
              placeholderTextColor={color.mutedText}
            />
          </ThemedView>
          <AuthNavRow
            onBack={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            backLabel="Back"
            onCenter={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace('/auth/login');
            }}
            centerLabel="Login instead"
            onNext={handleNext}
            nextLabel="Next"
            nextDisabled={loading || submitting || checking || isUnique === false || !name || !surname}
          />
        {signupError && (
          <ThemedText style={{ color: '#e53935', marginTop: 8 }}>{signupError}</ThemedText>
        )}
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
    marginBottom: 2,
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
  available: {
    marginBottom: 8,
  },
  formGroup: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: 32,
  },
});
