import React from 'react';
import { Pressable, Animated } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface NewPostsIndicatorProps {
  visible: boolean;
  onPress: () => void;
  message?: string;
  style?: any;
}

export default function NewPostsIndicator({ 
  visible, 
  onPress, 
  message = "New posts available • Tap to see",
  style 
}: NewPostsIndicatorProps) {
  if (!visible) return null;

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 100,
        backgroundColor: '#007AFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      }, style]}
    >
      <Pressable onPress={onPress}>
        <ThemedText style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
          {message}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}
