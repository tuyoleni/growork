import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

export type JobCardProps = {
  companyName: string;
  companyImage: string;
  isVerified?: boolean;
  jobDescription: string;
  mainImage: string;
  jobId?: string;
  industry?: string;
  onPressHeart?: () => void;
  onPressMessage?: () => void;
  onPressShare?: () => void;
  onPressBookmark?: () => void;
  onPressApply?: () => void;
  onPressMore?: () => void;
};

export default function JobCard({
  companyName = 'Google',
  companyImage = 'https://res.cloudinary.com/subframe/image/upload/v1711417543/shared/nbgwxuig538r8ym0f6nu.png',
  isVerified = true,
  jobDescription = 'Senior Product Designer - Join our team in creating the next generation of design tools. Remote position available.',
  mainImage = 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
  jobId,
  industry,
  onPressHeart,
  onPressMessage,
  onPressShare,
  onPressBookmark,
  onPressApply,
  onPressMore,
}: JobCardProps) {
  const router = useRouter();
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <ThemedView style={[styles.card, { borderBottomColor: borderColor }]}> 
      {/* Header */}
      <View style={styles.headerRow}>
        <Image source={{ uri: companyImage }} style={styles.avatar} />
        <View style={styles.companyRow}>
          <ThemedText style={styles.companyName} type="defaultSemiBold">{companyName}</ThemedText>
          {isVerified && (
            <Feather name="shield" size={20} color={tintColor} style={{ marginLeft: 4 }} />
          )}
          {industry && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6 }}>
              <Feather name="layers" size={16} color={iconColor} />
              <ThemedText style={{ fontSize: 12, marginLeft: 4, color: iconColor }}>{industry}</ThemedText>
            </View>
          )}
        </View>
        <Pressable style={styles.iconButton} hitSlop={8} onPress={() => {
          if (process.env.EXPO_OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPressMore && onPressMore();
        }}>
          <Feather name="more-horizontal" size={20} color={iconColor} />
        </Pressable>
        {/* Dropdown menu placeholder */}
      </View>
      {/* Main Image */}
      <Image source={{ uri: mainImage }} style={styles.mainImage} resizeMode="cover" />
      {/* Description and Actions */}
      <View style={styles.body}>
        <ThemedText style={styles.description}>{jobDescription}</ThemedText>
        <View style={styles.actionsRow}>
          <View style={styles.iconActions}>
            <Pressable style={styles.iconButton} hitSlop={8} onPress={() => {
              if (process.env.EXPO_OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onPressHeart && onPressHeart();
            }}>
              <Feather name="heart" size={20} color={iconColor} />
            </Pressable>
            <Pressable style={styles.iconButton} hitSlop={8} onPress={() => {
              if (process.env.EXPO_OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onPressMessage && onPressMessage();
            }}>
              <Feather name="message-circle" size={20} color={iconColor} />
            </Pressable>
            <Pressable style={styles.iconButton} hitSlop={8} onPress={() => {
              if (process.env.EXPO_OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onPressShare && onPressShare();
            }}>
            <Feather name="share" size={20} color={iconColor} />
          </Pressable>
            <Pressable style={styles.iconButton} hitSlop={8} onPress={() => {
              if (process.env.EXPO_OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onPressBookmark && onPressBookmark();
            }}>
              <Feather name="bookmark" size={20} color={iconColor} />
            </Pressable>
          </View>
          <Pressable style={[styles.applyButton, { backgroundColor: textColor }]} onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            if (jobId) {
              router.push(`/post/${jobId}`);
            } else {
              onPressApply && onPressApply();
            }
          }}>
            <ThemedText style={[styles.applyButtonText, { color: backgroundColor }]}>View Details</ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 8,
  },
  companyRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  companyName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: '100%',
    height: 400,
    borderRadius: 4,
    marginBottom: 12,
  },
  body: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 12,
  },
  description: {
    fontSize: 15,
    marginBottom: 8,
  },
  actionsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applyButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  applyButtonText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
});