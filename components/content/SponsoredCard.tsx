import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

type SponsoredCardProps = {
  companyName: string;
  companyImage: string;
  badgeText?: string;
  adImage: string;
  description: string;
  onPressHeart?: () => void;
  onPressShare?: () => void;
  onPressMore?: () => void;
  onPressLearnMore?: () => void;
};

export default function SponsoredCard({
  companyName,
  companyImage,
  badgeText = 'Sponsored',
  adImage,
  description,
  onPressHeart,
  onPressShare,
  onPressMore,
  onPressLearnMore,
}: SponsoredCardProps) {
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
          {badgeText && (
            <View style={[styles.badge, { backgroundColor: tintColor }]}>
              <ThemedText style={[styles.badgeText, { color: backgroundColor }]}>{badgeText}</ThemedText>
            </View>
          )}
        </View>
        <Pressable style={styles.iconButton} hitSlop={8} onPress={onPressMore}>
          <Feather name="more-horizontal" size={20} color={iconColor} />
        </Pressable>
      </View>
      {/* Ad Image */}
      <Image source={{ uri: adImage }} style={styles.mainImage} resizeMode="cover" />
      {/* Description and Actions */}
      <View style={styles.body}>
        <ThemedText style={styles.description}>{description}</ThemedText>
        <View style={styles.actionsRow}>
          <View style={styles.iconActions}>
            <Pressable style={styles.iconButton} hitSlop={8} onPress={onPressHeart}>
              <Feather name="heart" size={20} color={iconColor} />
            </Pressable>
            <Pressable style={styles.iconButton} hitSlop={8} onPress={onPressShare}>
              <Feather name="share" size={20} color={iconColor} />
            </Pressable>
          </View>
          <Pressable style={[styles.learnMoreButton, { backgroundColor: textColor }]} onPress={onPressLearnMore}>
            <ThemedText style={[styles.learnMoreButtonText, { color: backgroundColor }]}>Learn More</ThemedText>
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
    width: 32,
    height: 32,
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
  learnMoreButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  learnMoreButtonText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
});