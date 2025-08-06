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
import { Animated, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useBottomSheetManager } from '@/components/content/BottomSheetManager';
import { DocumentType } from '@/types';
import { UserType } from '@/types/enums';
import { Feather } from '@expo/vector-icons';

const CATEGORY_OPTIONS = ['Documents', 'Companies', 'Media'];

export default function Profile() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedProfileType, setSelectedProfileType] = useState<'user' | 'company'>('user');
  const textColor = useThemeColor({}, 'text');
  const mutedText = useThemeColor({}, 'mutedText');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'backgroundSecondary');
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
    onEdit: () => router.push('/profile/edit-profile'),
  };

  const handleProfileTypeChange = (type: 'user' | 'company') => {
    setSelectedProfileType(type);
    setSelectedIndex(0); // Reset to first tab when switching
  };

  return (
    <ScreenContainer>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ThemedView style={styles.container}>
          <ProfileHeader {...headerProps} />

          {/* Profile Type Switcher */}
          <ThemedView style={styles.profileTypeContainer}>
            <ThemedView style={styles.profileTypeSwitcher}>
              <Pressable
                style={({ pressed }) => [
                  styles.profileTypeButton,
                  selectedProfileType === 'user' && { backgroundColor: cardBg },
                  { borderColor }
                ]}
                onPress={() => handleProfileTypeChange('user')}
              >
                <Feather
                  name="user"
                  size={16}
                  color={selectedProfileType === 'user' ? textColor : mutedText}
                />
                <ThemedText
                  style={[
                    styles.profileTypeText,
                    { color: selectedProfileType === 'user' ? textColor : mutedText }
                  ]}
                >
                  Personal
                </ThemedText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.profileTypeButton,
                  selectedProfileType === 'company' && { backgroundColor: cardBg },
                  { borderColor }
                ]}
                onPress={() => handleProfileTypeChange('company')}
              >
                <Feather
                  name="briefcase"
                  size={16}
                  color={selectedProfileType === 'company' ? textColor : mutedText}
                />
                <ThemedText
                  style={[
                    styles.profileTypeText,
                    { color: selectedProfileType === 'company' ? textColor : mutedText }
                  ]}
                >
                  Company
                </ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>

          {/* Action Buttons */}
          <ThemedView style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/profile/edit-profile')}
            >
              <ThemedText style={[styles.editButtonText, { color: textColor }]}>
                Edit Profile
              </ThemedText>
              <Feather name="chevron-right" size={16} color={mutedText} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('settings' as any)}
            >
              <ThemedText style={[styles.settingsButtonText, { color: textColor }]}>
                Settings
              </ThemedText>
              <Feather name="settings" size={16} color={mutedText} />
            </TouchableOpacity>
          </ThemedView>

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
  profileTypeContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  profileTypeSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  profileTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  profileTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginHorizontal: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 100,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categorySection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  contentSection: {
    marginTop: 16,
    flex: 1,
  },
});