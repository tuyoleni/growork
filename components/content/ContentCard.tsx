import React, { useEffect, useState } from 'react';
import { Platform, Image, Pressable, StyleSheet, useColorScheme, View, ViewStyle, ActivityIndicator } from 'react-native';
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

type Variant = 'job' | 'news' | 'sponsored';
export interface ContentCardProps {
  variant: Variant;
  title: string; // e.g. company name
  postTitle: string; // new, the post's main title
  username: string;  // new, the user's username
  name: string;      // new, the user's display name
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

export default function ContentCard(props: ContentCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const { isLiked, toggleLike } = useLikes();
  const { isBookmarked, toggleBookmark } = useAppContext();

  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function syncState() {
      if (!props.id) {
        setLiked(false);
        setBookmarked(false);
        return;
      }
      const isLikedValue = await isLiked(props.id);
      if (!cancelled) setLiked(!!isLikedValue);
      if (!cancelled) setBookmarked(isBookmarked(props.id));
    }
    syncState();
    return () => { cancelled = true; };
  }, [props.id, isLiked, isBookmarked]);

  const handleLike = async () => {
    if (!props.id) return;
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLiked((curr) => !curr);
    await toggleLike(props.id);
    props.onPressHeart?.();
  };

  const handleBookmark = async () => {
    if (!props.id) return;
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBookmarked((curr) => !curr);
    await toggleBookmark(props.id);
    props.onPressBookmark?.();
  };

  const { openCommentSheet } = useBottomSheetManager();
  const handleComment = () => {
    if (props.id) {
      openCommentSheet(props.id);
      props.onPressMessage?.();
    }
  };

  const handleJobPress = () => {
    if (props.variant === 'job') {
      const id = props.jobId || props.id;
      if (id) {
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        router.push(`/post/${id}`);
      }
    }
  };

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
      <Feather name={name} size={18} color={color || iconColor} />
    </Pressable>
  );

  const renderIconActions = () => (
    <View style={styles.iconActions}>
      <IconButton
        name="heart"
        filled={liked}
        color={liked ? '#ef4444' : iconColor}
        onPress={handleLike}
      />
      <IconButton name="message-circle" onPress={handleComment} />
      <IconButton
        name={bookmarked ? "bookmark" : "bookmark"}
        color={bookmarked ? tintColor : iconColor}
        onPress={handleBookmark}
      />
      <IconButton name="share" onPress={props.onPressShare} />
    </View>
  );

  const renderSubtleCTA = () => {
    if (props.variant === 'job') {
      return (
        <Pressable
          style={styles.subtleCTA}
          onPress={handleJobPress}>
          <ThemedText style={[styles.subtleCTAText, { color: tintColor }]}>
            View Job
          </ThemedText>
        </Pressable>
      );
    }
    if (props.variant === 'sponsored') {
      return (
        <Pressable
          style={styles.subtleCTA}
          onPress={() => {
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            props.onPressLearnMore?.();
          }}>
          <ThemedText style={[styles.subtleCTAText, { color: tintColor }]}>
            Learn More
          </ThemedText>
        </Pressable>
      );
    }
    return null;
  };

  const renderMainImage = () => {
    if (!props.mainImage) return null;

    return (
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: props.mainImage }}
          style={styles.mainImage}
          resizeMode="cover"
          onLoadStart={() => {
            setImageLoading(true);
            setImageError(false);
          }}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
          accessibilityLabel={`Image for ${props.postTitle || 'post'}`}
        />
        {imageLoading && (
          <View style={styles.imageLoadingContainer}>
            <ActivityIndicator size="small" color={tintColor} />
          </View>
        )}
        {imageError && (
          <View style={styles.imageErrorContainer}>
            <Feather name="image" size={24} color={mutedTextColor} />
            <ThemedText style={[styles.imageErrorText, { color: mutedTextColor }]}>
              Image unavailable
            </ThemedText>
          </View>
        )}
      </View>
    );
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
          <View style={styles.headerContent}>
            <View style={styles.companyRow}>
              <ThemedText style={styles.companyName} type="defaultSemiBold">
                {props.name}
              </ThemedText>
              {props.isVerified && (
                <Feather name="check-circle" size={14} color={tintColor} style={styles.verifiedIcon} />
              )}
            </View>
            <ThemedText style={[styles.username, { color: mutedTextColor }]}>
              @{props.username}
            </ThemedText>
          </View>
          {/* Subtle indicator for post type - only show for sponsored */}
          {props.variant === 'sponsored' && (
            <View style={styles.sponsoredIndicator}>
              <ThemedText style={[styles.sponsoredText, { color: mutedTextColor }]}>
                Sponsored
              </ThemedText>
            </View>
          )}
        </View>

        {/* Post Title */}
        {props.postTitle && (
          <ThemedText style={styles.postTitle}>
            {props.postTitle}
          </ThemedText>
        )}

        {/* Main Image, if present */}
        {renderMainImage()}

        {/* Description */}
        <ThemedText style={styles.description}>
          {props.description}
        </ThemedText>

        {/* Actions */}
        <View style={styles.actionsRow}>
          {renderIconActions()}
          {renderSubtleCTA()}
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
    paddingVertical: 16,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  companyName: {
    fontSize: 15,
    fontWeight: '600',
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  username: {
    fontSize: 13,
    fontWeight: '400',
  },
  sponsoredIndicator: {
    alignSelf: 'flex-start',
  },
  sponsoredText: {
    fontSize: 11,
    fontWeight: '400',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  mainImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 20,
    paddingBottom: 12,
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
    gap: 16,
  },
  iconButton: {
    padding: 4,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtleCTA: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  subtleCTAText: {
    fontWeight: '500',
    fontSize: 13,
  },
  cardPressable: {
    borderRadius: 8,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  imageLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    zIndex: 1,
  },
  imageErrorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    zIndex: 1,
  },
  imageErrorText: {
    marginTop: 8,
    fontSize: 13,
  },
});
