import { ThemedInput } from '@/components/ThemedInput';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AuthNavRow } from '@/components/ui/AuthNavRow';
import { useFlashToast } from '@/components/ui/Flash';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
} from 'react-native';

export default function NameStep() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const toast = useFlashToast();

  const handleNext = () => {
    if (!name || !surname) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        type: 'danger',
        title: 'Missing fields',
        message: 'Please enter both name and surname.',
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({
      pathname: '../profile-picture',
      params: { ...params, name, surname },
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
              What's your name?
            </ThemedText>
            <ThemedText type="subtitle" style={styles.paragraph}>
              Enter your first and last name as they will appear on your profile.
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.formGroup}>
            <ThemedInput
              placeholder="First Name"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
            <ThemedInput
              placeholder="Surname"
              autoCapitalize="words"
              value={surname}
              onChangeText={setSurname}
            />
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
  formGroup: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: 32,
  },
});
