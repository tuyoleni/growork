import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLikes } from '@/hooks/useLikes';
import { useAppContext } from '@/utils/AppContext';
import { useBottomSheetManager } from '@/components/content/BottomSheetManager';

interface PostInteractionBarProps {
  postId: string;
  onPressShare?: () => void;
  variant?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  containerStyle?: any;
}

export default function PostInteractionBar({ 
  postId, 
  onPressShare, 
  variant = 'horizontal',
  size = 'medium',
  containerStyle
}: PostInteractionBarProps) {
  const { isLiked, toggleLike } = useLikes();
  const { isBookmarked, toggleBookmark } = useAppContext();
  const { openCommentSheet } = useBottomSheetManager();

  // UI state
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Theme
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  
  // Icon sizes based on the size prop
  const iconSizes = {
    small: 18,
    medium: 20,
    large: 24
  };
  
  const iconSize = iconSizes[size];

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
    return () => { cancelled = true; };
  }, [postId, isLiked, isBookmarked]);

  // Handle like action
  const handleLike = async () => {
    if (!postId) return;
    
    // haptic feedback
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Optimistic UI update
    setLiked((curr) => !curr);
    await toggleLike(postId);
  };

  // Handle bookmark action
  const handleBookmark = async () => {
    if (!postId) return;
    
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Optimistic UI update
    setBookmarked((curr) => !curr);
    await toggleBookmark(postId);
  };

  // Handle comment action
  const handleComment = () => {
    if (postId) {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      openCommentSheet(postId);
    }
  };

  // Handle share action
  const handleShare = () => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPressShare) onPressShare();
  };

  return (
    <View style={[
      variant === 'horizontal' ? styles.horizontalContainer : styles.verticalContainer,
      containerStyle
    ]}>
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={handleLike}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather 
          name="heart" 
          size={iconSize} 
          color={liked ? "#f43f5e" : iconColor} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.iconButton}
        onPress={handleComment}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather 
          name="message-circle" 
          size={iconSize} 
          color={iconColor} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.iconButton}
        onPress={handleShare}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather 
          name="share-2" 
          size={iconSize} 
          color={iconColor} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.iconButton}
        onPress={handleBookmark}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather 
          name="bookmark" 
          size={iconSize} 
          color={bookmarked ? tintColor : iconColor} 
        />
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