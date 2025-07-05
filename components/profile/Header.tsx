import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Image, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

export type ProfileHeaderProps = {
  name: string;
  avatarUrl: string;
  status: string;
  subtitle: string;
  profileStrength: string;
  profileStrengthDescription: string;
  stats: { label: string; value: string | number }[];
  onEdit?: () => void;
};

function ProfileHeader({
  name,
  avatarUrl,
  status,
  subtitle,
  profileStrength,
  profileStrengthDescription,
  stats,
  onEdit,
}: ProfileHeaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  const badgeBg = useThemeColor({}, 'icon');
  const badgeText = useThemeColor({}, 'background');
  const subtitleColor = useThemeColor({}, 'mutedText');
  const profileStrengthCardBg = useThemeColor({}, 'backgroundSecondary');
  const strengthIconWrapBg = useThemeColor({}, 'backgroundTertiary');
  const strengthTitleColor = useThemeColor({}, 'text');
  const pressedBg = useThemeColor({}, 'backgroundSecondary');

  return (
    <ThemedView style={[styles.container, { borderBottomColor: borderColor, backgroundColor }]}> 
      {/* Top Row: Avatar + Edit Button */}
      <ThemedView style={styles.topRow}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: pressed ? pressedBg : backgroundColor, borderColor },
          ]}
          hitSlop={8}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onEdit && onEdit();
          }}
        >
          <Feather name="edit-2" size={20} color={iconColor} />
        </Pressable>
      </ThemedView>
      {/* Name, Badge, Subtitle */}
      <ThemedView style={styles.infoSection}>
        <ThemedView style={styles.nameRow}>
          <ThemedText style={styles.name}>{name}</ThemedText>
          <ThemedView style={[styles.badge, { backgroundColor: badgeBg }]}> 
            <ThemedText style={[styles.badgeText, { color: badgeText }]}>{status}</ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</ThemedText>
      </ThemedView>
      {/* Profile Strength */}
      <ThemedView style={[styles.profileStrengthCard, { backgroundColor: profileStrengthCardBg }]}> 
        <ThemedView style={[styles.strengthIconWrap, { backgroundColor: strengthIconWrapBg }]}> 
          <Feather name="shield" size={20} color={tintColor} />
        </ThemedView>
        <ThemedView style={styles.strengthTextWrap}>
          <ThemedText style={[styles.strengthTitle, { color: strengthTitleColor }]}>{profileStrength}</ThemedText>
          <ThemedText style={styles.strengthSubtitle}>{profileStrengthDescription}</ThemedText>
        </ThemedView>
      </ThemedView>
      {/* Stats Row */}
      <ThemedView style={[styles.statsRow, { borderTopColor: borderColor }]}> 
        {stats.map((stat) => (
          <ThemedView key={stat.label} style={styles.statItem}>
            <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
            <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

ProfileHeader.defaultProps = {
  name: 'John Cooper',
  avatarUrl:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  status: 'Available',
  subtitle: 'Senior Product Designer • San Francisco',
  profileStrength: 'Profile Strength: Excellent',
  profileStrengthDescription: 'Your profile is optimized for job searching',
  stats: [
    { label: 'Following', value: 156 },
    { label: 'Channels', value: 8 },
  ],
  onEdit: undefined,
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    paddingHorizontal: 0,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 16,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  infoSection: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  nameRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  subtitle: {
    fontSize: 14,
  },
  profileStrengthCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  strengthIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  strengthTextWrap: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  strengthTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  strengthSubtitle: {
    fontSize: 12,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  statLabel: {
    fontSize: 12,
  },
});

export default ProfileHeader;
