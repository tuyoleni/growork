import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLikes } from '@/hooks/useLikes';
import { useAppContext } from '@/utils/AppContext';
import { useCustomCommentsBottomSheet } from '../../hooks/useCustomCommentsBottomSheet';


interface PostInteractionBarProps {
  postId: string;
  variant?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  containerStyle?: any;
}

export default function PostInteractionBar({
  postId,
  variant = 'horizontal',
  size = 'medium', // ignored for icon size, always 20
  containerStyle,
}: PostInteractionBarProps) {
  const { isLiked, toggleLike } = useLikes();
  const { isBookmarked, toggleBookmark } = useAppContext();
  const { openCommentsSheet } = useCustomCommentsBottomSheet();

  // UI state
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Theme
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  // Force size 20 for all icons
  const iconSize = 20;

  // On mount or post change, sync state with hooks
  useEffect(() => {
    let cancelled = false;
    async function syncState() {
      if (!postId) {
        setLiked(false);
        setBookmarked(false);
        return;
      }
      // isLiked is async, isBookmarked is sync
      const isLikedValue = await isLiked(postId);
      if (!cancelled) setLiked(!!isLikedValue);
      if (!cancelled) setBookmarked(isBookmarked(postId));
    }
    syncState();
    return () => {
      cancelled = true;
    };
  }, [postId, isLiked, isBookmarked]);

  // Handle like action
  const handleLike = async () => {
    if (!postId) return;
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLiked((curr) => !curr);
    await toggleLike(postId);
  };

  // Handle bookmark action
  const handleBookmark = async () => {
    if (!postId) return;
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBookmarked((curr) => !curr);
    await toggleBookmark(postId);
  };

  // Handle comment action
  const handleComment = () => {
    if (postId) {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      openCommentsSheet(postId);
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
        <Feather name="heart" size={iconSize} color={liked ? '#f43f5e' : iconColor} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleComment}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="message-circle" size={iconSize} color={iconColor} />
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
    gap: 16,
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
});
