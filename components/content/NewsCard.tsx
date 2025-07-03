import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

type NewsCardProps = {
  sourceName: string;
  sourceImage: string;
  badgeText?: string;
  badgeVariant?: 'error' | 'info' | 'success';
  newsImage: string;
  headline: string;
  onPressHeart?: () => void;
  onPressMessage?: () => void;
  onPressShare?: () => void;
  onPressBookmark?: () => void;
  onPressMore?: () => void;
};

const badgeColors = {
  error: { background: '#ef4444', text: '#fff' },
  info: { background: '#2563eb', text: '#fff' },
  success: { background: '#22c55e', text: '#fff' },
};

export default function NewsCard({
  sourceName,
  sourceImage,
  badgeText,
  badgeVariant = 'error',
  newsImage,
  headline,
  onPressHeart,
  onPressMessage,
  onPressShare,
  onPressBookmark,
  onPressMore,
}: NewsCardProps) {
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const badge = badgeColors[badgeVariant];

  return (
    <ThemedView style={[styles.card, { borderBottomColor: borderColor }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Image source={{ uri: sourceImage }} style={styles.avatar} />
        <View style={styles.sourceRow}>
          <ThemedText style={styles.sourceName} type="defaultSemiBold">{sourceName}</ThemedText>
          {badgeText && (
            <View style={[styles.badge, { backgroundColor: badge.background }]}>
              <ThemedText style={[styles.badgeText, { color: badge.text }]}>{badgeText}</ThemedText>
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
      </View>
      {/* News Image */}
      <Image source={{ uri: newsImage }} style={styles.mainImage} resizeMode="cover" />
      {/* Headline and Actions */}
      <View style={styles.body}>
        <ThemedText style={styles.headline}>{headline}</ThemedText>
        <View style={styles.actionsRow}>
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
  sourceRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 12,
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
    borderRadius: 8,
    marginBottom: 12,
  },
  body: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 12,
  },
  headline: {
    fontSize: 15,
    marginBottom: 8,
  },
  actionsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});