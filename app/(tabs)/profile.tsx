import CompaniesList from '@/components/profile/CompaniesList';
import DocumentsList from '@/components/profile/DocumentsList';
import FollowingGrid from '@/components/profile/FollowingGrid';
import ProfileHeader from '@/components/profile/Header';
import ScreenContainer from '@/components/ScreenContainer';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import CategorySelector from '@/components/ui/CategorySelector';
import { useFlashToast } from '@/components/ui/Flash';
import { useAuth, useThemeColor } from '@/hooks';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedAvatar } from '@/components/ui/ThemedAvatar';
import { ThemedIconButton } from '@/components/ui/ThemedIconButton';
import { calculateProfileStrength } from '@/utils/utils';

const CATEGORY_OPTIONS = ['Documents', 'Companies', 'Media'];

export default function Profile() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { profile, loading, error, isConnectionTimeoutError } = useAuth();
  const toast = useFlashToast();
  const scrollY = useRef(new Animated.Value(0)).current;
  const iconColor = useThemeColor({}, 'icon');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');

  // Show toast for connection timeout errors
  useEffect(() => {
    if (error && isConnectionTimeoutError({ message: error })) {
      toast.show({
        type: 'danger',
        title: 'Connection Error',
        message: 'Network connection issue. Please check your internet connection and try again.',
      });
    }
  }, [error, isConnectionTimeoutError, toast]);

  // If loading, you can show a loader or return null
  if (loading) return null;


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

  // Calculate profile strength and format user details
  const profileStrength = calculateProfileStrength(profile);

  // Build subtitle
  const subtitleParts = [];
  if (profile?.profession) subtitleParts.push(profile.profession);
  if (profile?.location) subtitleParts.push(profile.location);
  const subtitle = subtitleParts.length > 0 ? subtitleParts.join(' • ') : 'No profession or location set';

  // Compose header props from profile or fallback
  const headerProps = {
    name: profile ? `${profile.name} ${profile.surname}` : 'User',
    avatarUrl: profile && profile.avatar_url ? profile.avatar_url : placeholderAvatar,
    status: 'Available',
    subtitle: subtitle,
    bio: profile?.bio || undefined,
    profileStrength: `Profile Strength: ${profileStrength.level} (${profileStrength.percentage}%)`,
    profileStrengthDescription: profileStrength.description,
    stats: [
      { label: 'Following', value: 0 }, // TODO: Replace with real data
      { label: 'Channels', value: 0 },  // TODO: Replace with real data
    ],
    onEdit: () => router.push('/settings'),
  };

  // Animated values for header collapse
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 60],
    extrapolate: 'clamp',
  });

  const mainHeaderOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const mainHeaderTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  return (
    <ScreenContainer>
      {/* Compact Header */}
      <Animated.View
        style={[
          styles.compactHeader,
          {
            opacity: headerOpacity,
            height: headerHeight,
            backgroundColor: `${backgroundColor}E6`, // 90% opacity
            borderBottomColor: borderColor,
          }
        ]}
      >
        <View style={styles.compactHeaderContent}>
          <View style={styles.compactHeaderLeft}>
            <ThemedAvatar
              size={32}
              image={headerProps.avatarUrl}
            />
            <View style={styles.compactUserInfo}>
              <ThemedText style={[styles.compactUsername, { color: textColor }]}>
                {profile && profile.username ? `@${profile.username}` : 'User'}
              </ThemedText>
              {profile && profile.profession && (
                <ThemedText style={[styles.compactProfession, { color: mutedTextColor }]}>
                  {profile.profession}
                </ThemedText>
              )}
            </View>
          </View>
          <ThemedIconButton
            icon={<Feather name="settings" size={20} color={iconColor} />}
            onPress={() => router.push('/settings')}
          />
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <ThemedView style={styles.container}>
          <Animated.View
            style={[
              styles.mainHeaderContainer,
              {
                opacity: mainHeaderOpacity,
                transform: [{ translateY: mainHeaderTranslateY }],
              }
            ]}
          >
            <ProfileHeader {...headerProps} />
          </Animated.View>

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
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: 1,
    justifyContent: 'center',
  },
  compactHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  compactHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactAvatar: {
    borderRadius: 16,
  },
  compactUsername: {
    fontSize: 16,
    fontWeight: '600',
  },
  compactUserInfo: {
    flexDirection: 'column',
    gap: 2,
  },
  compactProfession: {
    fontSize: 12,
    fontWeight: '400',
  },
  compactSettingsButton: {
    padding: 8,
  },
  mainHeaderContainer: {
    width: '100%',
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