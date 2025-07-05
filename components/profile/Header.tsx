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
  const textColor = useThemeColor({}, 'text');
  const subtitleColor = useThemeColor({}, 'mutedText');
  const cardBg = useThemeColor({}, 'backgroundSecondary');
  const pressedBg = useThemeColor({}, 'backgroundTertiary');
  const accentColor = '#a5b4fc'; // Soft pastel indigo
  const successColor = '#86efac'; // Soft pastel green

  return (
    <ThemedView style={[styles.container, { borderBottomColor: borderColor, backgroundColor }]}> 
      {/* Top Row: Avatar + Edit Button */}
      <ThemedView style={styles.topRow}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            { 
              backgroundColor: pressed ? pressedBg : backgroundColor, 
              borderColor: borderColor,
              shadowColor: theme.shadow,
            },
          ]}
          hitSlop={8}
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onEdit && onEdit();
          }}
        >
          <Feather name="edit-2" size={16} color={iconColor} />
        </Pressable>
      </ThemedView>
      
      {/* Name and Status */}
      <ThemedView style={styles.infoSection}>
        <ThemedView style={styles.nameRow}>
          <ThemedText style={[styles.name, { color: textColor }]}>{name}</ThemedText>
          <ThemedView style={[styles.badge, { backgroundColor: successColor, borderColor: successColor }]}> 
            <ThemedText style={[styles.badgeText, { color: '#374151' }]}>{status}</ThemedText>
          </ThemedView>
        </ThemedView>
        <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</ThemedText>
      </ThemedView>
      
      {/* Profile Strength Card */}
      <ThemedView style={[styles.profileStrengthCard, { borderColor: borderColor }]}> 
        <ThemedView style={[styles.strengthIconWrap, { backgroundColor: accentColor, borderColor: accentColor }]}> 
          <Feather name="shield" size={16} color="#374151" />
        </ThemedView>
        <ThemedView style={styles.strengthTextWrap}>
          <ThemedText style={[styles.strengthTitle, { color: textColor }]}>{profileStrength}</ThemedText>
          <ThemedText style={[styles.strengthSubtitle, { color: subtitleColor }]}>{profileStrengthDescription}</ThemedText>
        </ThemedView>
      </ThemedView>
      
      {/* Stats Row */}
      <ThemedView style={[styles.statsRow, { borderTopColor: borderColor }]}> 
        {stats.map((stat) => (
                  <ThemedView key={stat.label} style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: textColor }]}>{stat.value}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: subtitleColor }]}>{stat.label}</ThemedText>
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
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 20,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  iconButton: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  nameRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontWeight: '500',
    fontSize: 11,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  profileStrengthCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  strengthIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  strengthTextWrap: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  strengthTitle: {
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 2,
  },
  strengthSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 20,
  },
  statItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
});

export default ProfileHeader;
