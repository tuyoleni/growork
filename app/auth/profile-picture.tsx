import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AuthNavRow } from '@/components/ui/AuthNavRow';
import { useFlashToast } from '@/components/ui/Flash'; // use your toast hook
import { Colors } from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  useColorScheme,
} from 'react-native';

export default function ProfilePictureStep() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const toast = useFlashToast(); // grab flash toast handler
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const scheme = useColorScheme() ?? 'light';
  const color = Colors[scheme];

  const pickImage = async () => {
    try {
      setUploading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.show({
        type: 'danger',
        title: 'Image error',
        message: 'Could not pick image.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: './overview', params: { ...params, avatar_url: image || '' } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={24}
      >
        <ThemedView style={styles.container}>
          <ThemedText type="subtitle" style={[styles.paragraph, { color: color.text }]}>
            You can upload a photo now or skip and add one later in your profile settings.
          </ThemedText>
          <ThemedView style={styles.formGroup}>
            {image ? (
              <Image
                source={{ uri: image }}
                style={[styles.avatar, { backgroundColor: color.backgroundSecondary }]}
              />
            ) : (
              <ThemedView style={[styles.avatar, styles.avatarPlaceholder]}>
                <ThemedText style={{ color: color.iconSecondary }}>No Photo</ThemedText>
              </ThemedView>
            )}
            {uploading && <ActivityIndicator size="large" color={color.tint} />}
          </ThemedView>
          <AuthNavRow
            onBack={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace('/auth/login');
            }}
            onCenter={pickImage}
            onNext={handleNext}
            centerLabel=""
            centerDisabled={uploading}
            nextDisabled={uploading}
            centerIcon={<Feather name="image" size={24} color={color.tint} />}
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
  paragraph: {
    fontSize: 16,
    marginBottom: 2,
    textAlign: 'center',
    maxWidth: 340,
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
  formGroup: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginTop: 32,
  },
});
