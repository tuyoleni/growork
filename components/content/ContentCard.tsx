import React, { useEffect, useState } from 'react';
import { Platform, Image, Pressable, StyleSheet, useColorScheme, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuth } from '@/hooks/useAuth';
import { useLikes } from '@/hooks/useLikes';
import { useAppContext } from '@/utils/AppContext';
import { useBottomSheetManager } from '@/components/content/BottomSheetManager';
import Comments from '@/components/content/comments/Comment';

type Variant = 'job' | 'news' | 'sponsored';
export interface ContentCardProps {
  variant: Variant;
  title: string;
  avatarImage: string;
  mainImage?: string;
  description: string;
  badgeText?: string;
  badgeVariant?: 'error' | 'info' | 'success';
  isVerified?: boolean;
  industry?: string;
  onPressHeart?: () => void;
  onCommentPress?: () => void; 
  onPressMessage?: () => void;
  onPressShare?: () => void;
  onPressBookmark?: () => void;
  onPressApply?: () => void;
  onPressLearnMore?: () => void;
  onPressMore?: () => void;
  style?: ViewStyle;
  id?: string;
  jobId?: string;
}

const badgeColors = (theme: any) => ({
  error: { background: theme.mutedText, text: theme.background },
  info: { background: theme.tint, text: theme.background },
  success: { background: theme.icon, text: theme.background },
});

export default function ContentCard(props: ContentCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const mutedTextColor = useThemeColor({}, 'mutedText');

  const { user } = useAuth();
  const { isLiked, toggleLike } = useLikes();
  const { isBookmarked, toggleBookmark } = useAppContext();

  // UI state
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // On mount or post/user change, sync state to hooks
  useEffect(() => {
    let cancelled = false;
    async function syncState() {
      if (!props.id) {
        setLiked(false);
        setBookmarked(false);
        return;
      }
      // isLiked is async, isBookmarked is sync
      const isLikedValue = await isLiked(props.id);
      if (!cancelled) setLiked(!!isLikedValue);
      if (!cancelled) setBookmarked(isBookmarked(props.id));
    }
    syncState();
    return () => { cancelled = true; };
  }, [props.id, isLiked, isBookmarked]);

  // Like logic via your hooks
  const handleLike = async () => {
    if (!props.id) return;
    // haptic feedback
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Optimistic UI
    setLiked((curr) => !curr);
    await toggleLike(props.id);
    props.onPressHeart?.();
  };

  // Bookmark logic via your hooks
  const handleBookmark = async () => {
    if (!props.id) return;
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Optimistic UI
    setBookmarked((curr) => !curr);
    await toggleBookmark(props.id);
    props.onPressBookmark?.();
  };

  // Message/Comments
  const { openCommentSheet } = useBottomSheetManager();
  const handleComment = () => {
    if (props.id) {
      openCommentSheet(props.id);
      props.onPressMessage?.();
    }
  };
  
  // Navigate to job details
  const handleJobPress = () => {
    if (props.variant === 'job') {
      const id = props.jobId || props.id;
      if (id) {
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        console.log('Navigating to job details with ID:', id);
        
        // Use a more straightforward navigation approach
        router.push(`/post/${id}`);
      } else {
        console.warn('No job ID available for navigation');
      }
    }
  };

  // Badge
  const renderBadge = () => {
    if (props.variant === 'news' && props.badgeText) {
      const badgeStyle = badgeColors(theme)[props.badgeVariant || 'error'];
      return (
        <View style={[styles.badge, { backgroundColor: badgeStyle.background, opacity: 0.7 }]}>
          <ThemedText style={[styles.badgeText, { color: badgeStyle.text }]}>
            {props.badgeText}
          </ThemedText>
        </View>
      );
    }
    if (props.variant === 'sponsored') {
      return (
        <ThemedText style={[styles.sponsoredLabel, { color: mutedTextColor }]}>
          Sponsored
        </ThemedText>
      );
    }
    return null;
  };

  // IconButton - your own simple mini-component
  const IconButton = ({
    name,
    filled,
    color,
    onPress,
  }: {
    name: keyof typeof Feather.glyphMap;
    filled?: boolean;
    color?: string;
    onPress?: () => void;
  }) => (
    <Pressable style={styles.iconButton} hitSlop={8} onPress={onPress}>
      <Feather name={name} size={20} color={color || iconColor} />
    </Pressable>
  );

  const renderIconActions = () => (
    <>
      <IconButton
        name="heart"
        filled={liked}
        color={liked ? 'red' : iconColor}
        onPress={handleLike}
      />
      <IconButton name="message-circle" onPress={handleComment} />
      <IconButton name="share" onPress={props.onPressShare} />
      <IconButton
        name="bookmark"
        filled={bookmarked}
        color={bookmarked ? tintColor : iconColor}
        onPress={handleBookmark}
      />
    </>
  );

  // CTA for jobs/sponsored
  const renderCTAButton = () => {
    if (props.variant === 'job') {
      return (
        <Pressable
          style={[styles.applyButton, { backgroundColor: textColor }]}onPress={handleJobPress}>
          <ThemedText style={[styles.applyButtonText, { color: backgroundColor }]}>
            View Details
          </ThemedText>
        </Pressable>
      );
    }
    if (props.variant === 'sponsored') {
      return (
        <Pressable
          style={[styles.learnMoreButton, { backgroundColor: textColor }]}
          onPress={() => {
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            props.onPressLearnMore?.();
          }}>
          <ThemedText style={[styles.learnMoreButtonText, { color: backgroundColor }]}>
            Learn More
          </ThemedText>
        </Pressable>
      );
    }
    return null;
  };

  return (
    <ThemedView style={[styles.card, { borderBottomColor: borderColor }, props.style]}>
      <Pressable 
        style={[{ flex: 1 }, props.variant === 'job' && styles.cardPressable]}
        onPress={props.variant === 'job' ? handleJobPress : undefined}
        android_ripple={props.variant === 'job' ? { color: borderColor, borderless: false } : undefined}
        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Image source={{ uri: props.avatarImage }} style={styles.avatar} />
          <View style={styles.companyRow}>
            <ThemedText style={styles.companyName} type="defaultSemiBold">
              {props.title}
            </ThemedText>
            {renderBadge()}
            {props.variant === 'job' && props.isVerified && (
              <Feather name="shield" size={16} color={tintColor} style={{ marginLeft: 4 }} />
            )}
            {props.variant === 'job' && props.industry && (
              <ThemedText style={[styles.sponsoredLabel, { color: mutedTextColor }]}>
                {props.industry}
              </ThemedText>
            )}
          </View>
          <IconButton name="more-horizontal" onPress={props.onPressMore} />
        </View>

        {/* Main Image, if present */}
        {props.mainImage && (
          <Image
            source={{ uri: props.mainImage }}
            style={styles.mainImage}
            resizeMode="cover"
          />
        )}

        {/* Description and actions row */}
        <View style={styles.body}>
          <ThemedText style={styles.description}>{props.description}</ThemedText>
          <View style={styles.actionsRow}>
            <View style={styles.iconActions}>{renderIconActions()}</View>
            {renderCTAButton()}
          </View>
        </View>
      </Pressable>
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
    paddingVertical: 12,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 6,
  },
  companyRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  companyName: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 3,
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  iconButton: {
    padding: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: '100%',
    height: 300,
    borderRadius: 4,
    marginBottom: 8,
  },
  body: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 8,
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
    gap: 6,
  },
  applyButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  applyButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  learnMoreButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  learnMoreButtonText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  sponsoredLabel: {
    fontSize: 10,
    marginLeft: 3,
    fontWeight: '400',
  },
  cardPressable: {
    borderRadius: 6,
  },
});