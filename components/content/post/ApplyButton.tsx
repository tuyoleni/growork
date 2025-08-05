import React from 'react';
import { StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import * as Haptics from 'expo-haptics';

interface ApplyButtonProps {
  onPress: () => void;
  label?: string;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export default function ApplyButton({ 
  onPress,
  label = 'Apply Now',
  variant = 'primary',
  size = 'medium',
  style
}: ApplyButtonProps) {
  const backgroundColor = useThemeColor({}, variant === 'primary' ? 'tint' : 'background');
  const textColor = useThemeColor({}, variant === 'primary' ? 'background' : 'text');
  const borderColor = useThemeColor({}, 'border');
  
  // Determine padding based on size
  const buttonSizes = {
    small: { paddingVertical: 8, paddingHorizontal: 16 },
    medium: { paddingVertical: 12, paddingHorizontal: 20 },
    large: { paddingVertical: 14, paddingHorizontal: 24 }
  };
  
  // Determine font size based on size
  const fontSizes = {
    small: 14,
    medium: 16,
    large: 18
  };
  
  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor,
          paddingVertical: buttonSizes[size].paddingVertical,
          paddingHorizontal: buttonSizes[size].paddingHorizontal,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: variant === 'secondary' ? borderColor : undefined
        },
        style
      ]}
      onPress={handlePress}
    >
      <ThemedText 
        style={[
          styles.buttonText,
          { 
            color: textColor,
            fontSize: fontSizes[size]
          }
        ]}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
});