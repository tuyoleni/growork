import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '@/hooks';
import { useLikes } from '@/hooks';
import { useAppContext } from '@/utils/AppContext';
import { useCustomCommentsBottomSheet } from '@/hooks';
import { ThemedText } from '@/components/ThemedText';


interface PostInteractionBarProps {
  postId: string;
  postOwnerId?: string;
  variant?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  containerStyle?: any;
}

export default function PostInteractionBar({
  postId,
  postOwnerId,
  variant = 'horizontal',
  size = 'medium', // ignored for icon size, always 20
  containerStyle,
}: PostInteractionBarProps) {
  const { isLiked, toggleLike, likeStates, initializePost } = useLikes();
  const { toggleBookmark, bookmarkStates } = useAppContext();
  const { openCommentsSheet } = useCustomCommentsBottomSheet();

  // UI state
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  // Theme
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  const iconSize = 20;

  useEffect(() => {
    let cancelled = false;

    async function syncState() {
      if (!postId) {
        setLiked(false);
        setBookmarked(false);
        setLikeCount(0);
        return;
      }

      // Initialize post state if not already done
      await initializePost(postId);

      // Get current like state
      const isLikedValue = await isLiked(postId);
      if (!cancelled) {
        setLiked(!!isLikedValue);
        setLikeCount(likeStates[postId]?.likeCount || 0);
      }

      // Get current bookmark state
      if (!cancelled) {
        setBookmarked(bookmarkStates[postId]?.isBookmarked || false);
      }
    }

    syncState();

    return () => {
      cancelled = true;
    };
  }, [postId, initializePost, isLiked, likeStates, bookmarkStates]);

  // Handle like action
  const handleLike = async () => {
    if (!postId) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Optimistic update
    const newLiked = !liked;
    const newLikeCount = newLiked ? likeCount + 1 : likeCount - 1;

    setLiked(newLiked);
    setLikeCount(newLikeCount);

    try {
      const result = await toggleLike(postId, postOwnerId);

      if (!result.success) {
        // Revert on failure
        setLiked(!newLiked);
        setLikeCount(likeCount);
        console.error('Like toggle failed:', result.error);
      }
    } catch (error) {
      // Revert on error
      setLiked(!newLiked);
      setLikeCount(likeCount);
      console.error('Like toggle error:', error);
    }
  };

  // Handle bookmark action
  const handleBookmark = async () => {
    if (!postId) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Optimistic update
    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked);

    try {
      const result = await toggleBookmark(postId);

      if (!result.success) {
        // Revert on failure
        setBookmarked(!newBookmarked);
        console.error('Bookmark toggle failed:', result.error);
      }
    } catch (error) {
      // Revert on error
      setBookmarked(!newBookmarked);
      console.error('Bookmark toggle error:', error);
    }
  };

  // Handle comment action
  const handleComment = () => {
    if (postId) {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      openCommentsSheet(postId, postOwnerId);
    }
  };

  // Handle share action
  const handleShare = () => {
    if (postId) {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // TODO: Implement share functionality
      console.log('Share post:', postId);
    }
  };

  return (
    <View
      style={[
        variant === 'horizontal' ? styles.horizontalContainer : styles.verticalContainer,
        containerStyle,
      ]}
    >
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleLike}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={styles.likeContainer}>
          <Feather name="heart" size={iconSize} color={liked ? '#f43f5e' : iconColor} />
          {likeCount > 0 && (
            <ThemedText style={[styles.likeCount, { color: iconColor }]}>
              {likeCount}
            </ThemedText>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleComment}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={styles.iconContainer}>
          <Feather name="message-circle" size={iconSize} color={iconColor} />
          {commentCount > 0 && (
            <ThemedText style={[styles.countText, { color: iconColor }]}>
              {commentCount}
            </ThemedText>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleShare}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="share" size={iconSize} color={iconColor} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleBookmark}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="bookmark" size={iconSize} color={bookmarked ? tintColor : iconColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verticalContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
});
