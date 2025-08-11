import React from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks';
import { useTextToSpeech } from '@/hooks';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface TextToSpeechButtonProps {
  text: string;
  title?: string;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export const TextToSpeechButton: React.FC<TextToSpeechButtonProps> = ({
  text,
  title = 'Listen',
  size = 'medium',
  style,
}) => {
  const { speak, stop, pause, resume, isSpeaking, isPaused, isAvailable } = useTextToSpeech();
  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const backgroundColor = useThemeColor({}, 'backgroundSecondary');

  const handlePress = async () => {
    if (!text || text.trim().length === 0) {
      return;
    }

    try {
      if (isSpeaking) {
        if (isPaused) {
          await resume();
        } else {
          await pause();
        }
      } else {
        await speak(text.trim());
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      Alert.alert(
        'Text-to-Speech Unavailable',
        'Text-to-speech is not available on this device or in this environment. Please try using a development build or Expo Go.',
        [{ text: 'OK' }]
      );
    }
  };

  const getIconName = () => {
    if (isSpeaking) {
      return isPaused ? 'play' : 'pause';
    }
    return 'volume-2';
  };

  const getButtonText = () => {
    if (isSpeaking) {
      return isPaused ? 'Resume' : 'Pause';
    }
    return title;
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { padding: 8, iconSize: 16, fontSize: 12 };
      case 'large':
        return { padding: 16, iconSize: 24, fontSize: 16 };
      default:
        return { padding: 12, iconSize: 20, fontSize: 14 };
    }
  };

  const sizeStyles = getSizeStyles();
  const isDisabled = !text || text.trim().length === 0 || isAvailable === false;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          padding: sizeStyles.padding,
          backgroundColor: isSpeaking ? backgroundColor : 'transparent',
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityLabel={getButtonText()}
      accessibilityHint="Double tap to toggle text-to-speech"
    >
      <Feather
        name={getIconName() as any}
        size={sizeStyles.iconSize}
        color={isSpeaking ? textColor : mutedTextColor}
      />
      <ThemedText
        style={[
          styles.buttonText,
          {
            fontSize: sizeStyles.fontSize,
            color: isSpeaking ? textColor : mutedTextColor,
          },
        ]}
      >
        {getButtonText()}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonText: {
    fontWeight: '500',
  },
}); 