import React from 'react';
import { StyleSheet, TouchableOpacity, Platform, Text, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';

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
  style,
}: ApplyButtonProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const palette = Colors[scheme];

  // Button background
  const backgroundColor = variant === 'primary' ? palette.tint : palette.background;
  // Text color logic: white for all variants in dark, standard palette otherwise
  const textColor =
    scheme === 'dark'
      ? '#fff'
      : variant === 'primary'
      ? palette.background
      : palette.text;
  const borderColor = palette.border;

  // Compact size options
  const buttonSizes = {
    small: { paddingVertical: 6, paddingHorizontal: 12 },
    medium: { paddingVertical: 8, paddingHorizontal: 16 },
    large: { paddingVertical: 10, paddingHorizontal: 18 },
  };

  const fontSizes = {
    small: 13,
    medium: 15,
    large: 16,
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
          borderColor: variant === 'secondary' ? borderColor : undefined,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <Text
        style={[
          styles.buttonText,
          {
            color: textColor,
            fontSize: fontSizes[size],
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  buttonText: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
