import CompaniesList from '@/components/profile/CompaniesList';
import DocumentsList from '@/components/profile/DocumentsList';
import FollowingGrid from '@/components/profile/FollowingGrid';
import ProfileHeader from '@/components/profile/Header';
import ScreenContainer from '@/components/ScreenContainer';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import CategorySelector from '@/components/ui/CategorySelector';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { useBottomSheetManager } from '@/components/content/BottomSheetManager';
import { DocumentType } from '@/types';

const CATEGORY_OPTIONS = ['Documents', 'Companies', 'Media'];

export default function Profile() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textColor = useThemeColor({}, 'text');
  const mutedText = useThemeColor({}, 'mutedText');
  const router = useRouter();
  const { profile, loading, user } = useAuth();

  // Debug: log profile and user data
  console.log('Profile:', profile);
  console.log('User:', user);

  // Placeholder image for avatar, use name or username if available
  const avatarName = profile
    ? profile.name
      ? encodeURIComponent(profile.name)
      : profile.username
        ? encodeURIComponent(profile.username)
        : 'User'
    : 'User';
  const placeholderAvatar =
    `https://ui-avatars.com/api/?name=${avatarName}&background=cccccc&color=222222&size=256`;

  // If loading, you can show a loader or return null
  if (loading) return null;

  // Compose header props from profile or fallback
  const headerProps = {
    name: profile ? `${profile.name} ${profile.surname}` : 'User',
    avatarUrl: profile && profile.avatar_url ? profile.avatar_url : placeholderAvatar,
    status: 'Available',
    subtitle: profile && profile.username ? `@${profile.username}` : 'No username',
    profileStrength: 'Profile Strength: Excellent',
    profileStrengthDescription: 'Your profile is optimized for job searching',
    stats: [
      { label: 'Following', value: 0 }, // TODO: Replace with real data
      { label: 'Channels', value: 0 },  // TODO: Replace with real data
    ],
    onEdit: () => router.push('/profile/profile-settings'),
  };

  return (
    <ScreenContainer>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ThemedView style={styles.container}>
          <ProfileHeader {...headerProps} />
          <TouchableOpacity
            style={{ marginTop: 12, alignSelf: 'flex-end', marginRight: 16 }}
            onPress={() => router.push('/profile/profile-settings')}
          >
            <ThemedText style={{ color: textColor, fontWeight: 'bold' }}>Edit Profile</ThemedText>
          </TouchableOpacity>
          
          <ThemedView style={styles.categorySection}>
          <CategorySelector
            options={CATEGORY_OPTIONS}
            selectedIndex={selectedIndex}
            onChange={setSelectedIndex}
          />
          </ThemedView>

          <ThemedView style={styles.contentSection}>
          {selectedIndex === 0 && <DocumentsList />}
          {selectedIndex === 1 && <CompaniesList />}
          {selectedIndex === 2 && <FollowingGrid />}
          </ThemedView>
        </ThemedView>
      </Animated.ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categorySection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  contentSection: {
    flex: 1,
    paddingTop: 8,
  },
  documentFilterSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  documentFilterSelector: {
    paddingHorizontal: 0,
  },
});