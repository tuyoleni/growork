import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useColorScheme,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '@/hooks/useAuth';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ScreenContainer from '@/components/ScreenContainer';
import { supabase } from '@/utils/superbase';
import { UserType } from '@/types/enums';

interface ProfileStats {
  posts: number;
  followers: number;
  following: number;
  applications: number;
  bookmarks: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const tintColor = useThemeColor({}, 'tint');
  const [stats, setStats] = useState<ProfileStats>({
    posts: 0,
    followers: 0,
    following: 0,
    applications: 0,
    bookmarks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfileStats();
    }
  }, [user]);

  const fetchProfileStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch applications count
      const { count: applicationsCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch bookmarks count
      const { count: bookmarksCount } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        posts: postsCount || 0,
        followers: 0, // Placeholder - would need followers table
        following: 0, // Placeholder - would need following table
        applications: applicationsCount || 0,
        bookmarks: bookmarksCount || 0,
      });
    } catch (error: any) {
      console.error('Error fetching profile stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/profile/edit-profile');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleViewPosts = () => {
    // Navigate to user's posts
    console.log('View posts');
  };

  const handleViewApplications = () => {
    // Navigate to applications
    console.log('View applications');
  };

  const handleViewBookmarks = () => {
    router.push('/(tabs)/bookmarks');
  };

  if (!profile) {
    return (
      <ScreenContainer>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ThemedText style={[styles.loadingText, { color: mutedTextColor }]}>
            Loading profile...
          </ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <ThemedView style={[styles.header, { borderBottomColor: borderColor }]}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.headerTitle}>Profile</ThemedText>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSettings}
          >
            <Feather name="settings" size={20} color={textColor} />
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <ThemedView style={styles.profileHeader}>
          <View style={styles.avatarSection}>
            <Image
              source={{
                uri: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&size=120`
              }}
              style={styles.avatar}
            />
            <TouchableOpacity
              style={[styles.editAvatarButton, { backgroundColor: tintColor }]}
              onPress={handleEditProfile}
            >
              <Feather name="camera" size={16} color={backgroundColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName}>
              {profile.name} {profile.surname}
            </ThemedText>
            {profile.profession && (
              <ThemedText style={[styles.profileProfession, { color: mutedTextColor }]}>
                {profile.profession}
              </ThemedText>
            )}
            {profile.location && (
              <ThemedText style={[styles.profileLocation, { color: mutedTextColor }]}>
                <Feather name="map-pin" size={12} color={mutedTextColor} /> {profile.location}
              </ThemedText>
            )}
            {profile.user_type === UserType.Professional && profile.experience_years && (
              <ThemedText style={[styles.profileExperience, { color: mutedTextColor }]}>
                <Feather name="clock" size={12} color={mutedTextColor} /> {profile.experience_years} years experience
              </ThemedText>
            )}
          </View>

          <TouchableOpacity
            style={[styles.editProfileButton, { borderColor }]}
            onPress={handleEditProfile}
          >
            <Feather name="edit-3" size={16} color={textColor} />
            <ThemedText style={[styles.editProfileText, { color: textColor }]}>
              Edit Profile
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Bio Section */}
        {profile.bio && (
          <ThemedView style={styles.bioSection}>
            <ThemedText style={styles.bioText}>{profile.bio}</ThemedText>
          </ThemedView>
        )}

        {/* Stats Section */}
        <ThemedView style={styles.statsSection}>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} onPress={handleViewPosts}>
              <ThemedText style={styles.statNumber}>{stats.posts}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>Posts</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{stats.followers}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>Followers</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{stats.following}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>Following</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Quick Actions */}
        <ThemedView style={styles.quickActionsSection}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionCard, { borderColor }]}
              onPress={handleViewApplications}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: tintColor + '20' }]}>
                <Feather name="briefcase" size={20} color={tintColor} />
              </View>
              <ThemedText style={styles.quickActionTitle}>Applications</ThemedText>
              <ThemedText style={[styles.quickActionSubtitle, { color: mutedTextColor }]}>
                {stats.applications} applications
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { borderColor }]}
              onPress={handleViewBookmarks}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: tintColor + '20' }]}>
                <Feather name="bookmark" size={20} color={tintColor} />
              </View>
              <ThemedText style={styles.quickActionTitle}>Bookmarks</ThemedText>
              <ThemedText style={[styles.quickActionSubtitle, { color: mutedTextColor }]}>
                {stats.bookmarks} saved
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { borderColor }]}
              onPress={() => router.push('/profile/documents')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: tintColor + '20' }]}>
                <Feather name="folder" size={20} color={tintColor} />
              </View>
              <ThemedText style={styles.quickActionTitle}>Documents</ThemedText>
              <ThemedText style={[styles.quickActionSubtitle, { color: mutedTextColor }]}>
                Manage CV & files
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { borderColor }]}
              onPress={() => router.push('/profile/companies')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: tintColor + '20' }]}>
                <Feather name="briefcase" size={20} color={tintColor} />
              </View>
              <ThemedText style={styles.quickActionTitle}>Companies</ThemedText>
              <ThemedText style={[styles.quickActionSubtitle, { color: mutedTextColor }]}>
                Manage companies
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Skills Section */}
        {profile.skills && profile.skills.length > 0 && (
          <ThemedView style={styles.skillsSection}>
            <ThemedText style={styles.sectionTitle}>Skills</ThemedText>
            <View style={styles.skillsContainer}>
              {profile.skills.map((skill, index) => (
                <View key={index} style={[styles.skillChip, { backgroundColor: tintColor + '20' }]}>
                  <ThemedText style={[styles.skillText, { color: tintColor }]}>
                    {skill}
                  </ThemedText>
                </View>
              ))}
            </View>
          </ThemedView>
        )}

        {/* Contact Info */}
        {(profile.website || profile.phone) && (
          <ThemedView style={styles.contactSection}>
            <ThemedText style={styles.sectionTitle}>Contact</ThemedText>
            {profile.website && (
              <TouchableOpacity style={styles.contactItem}>
                <Feather name="globe" size={16} color={mutedTextColor} />
                <ThemedText style={[styles.contactText, { color: tintColor }]}>
                  {profile.website}
                </ThemedText>
              </TouchableOpacity>
            )}
            {profile.phone && (
              <TouchableOpacity style={styles.contactItem}>
                <Feather name="phone" size={16} color={mutedTextColor} />
                <ThemedText style={[styles.contactText, { color: tintColor }]}>
                  {profile.phone}
                </ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
  profileHeader: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileProfession: {
    fontSize: 16,
    marginBottom: 8,
  },
  profileLocation: {
    fontSize: 14,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileExperience: {
    fontSize: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bioSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  quickActionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  skillsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contactSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  contactText: {
    fontSize: 14,
  },
});
