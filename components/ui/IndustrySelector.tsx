import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, useColorScheme } from 'react-native';

interface IndustryOption {
  icon: string;
  label: string;
}

interface IndustrySelectorProps {
  options: IndustryOption[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: any;
  onMorePress?: () => void;
  showMoreButton?: boolean;
  title?: string;
  subtitle?: string;
}

const IndustrySelector: React.FC<IndustrySelectorProps> = ({ 
  options, 
  selectedIndex, 
  onChange, 
  style, 
  onMorePress,
  showMoreButton = true,
  title,
  subtitle
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const badgeBg = useThemeColor({}, 'backgroundSecondary');
  const badgeSelectedBg = useThemeColor({}, 'icon');
  const badgeText = useThemeColor({}, 'text');
  const badgeSelectedText = useThemeColor({}, 'background');
  const plusBg = badgeBg;
  const plusColor = badgeText;
  const titleColor = useThemeColor({}, 'text');
  const subtitleColor = useThemeColor({}, 'mutedText');

  const handlePress = (idx: number) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onChange(idx);
  };

  const handleMorePress = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onMorePress && onMorePress();
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.badgeRow, style]}
    >
      {/* Optional Title and Subtitle */}
      {title && (
        <Pressable style={styles.titleContainer}>
          <ThemedText style={[styles.titleText, { color: titleColor }]}>{title}</ThemedText>
          {subtitle && (
            <ThemedText style={[styles.subtitleText, { color: subtitleColor }]}>{subtitle}</ThemedText>
          )}
        </Pressable>
      )}

      {/* Industry Options */}
      {options.map((option, idx) => {
        const selected = idx === selectedIndex;
        return (
          <Pressable
            key={option.label}
            onPress={() => handlePress(idx)}
            style={({ pressed }) => [
              styles.badge,
              {
                backgroundColor: selected ? badgeSelectedBg : badgeBg,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name={option.icon as any} size={18} color={selected ? badgeSelectedText : badgeText} />
            <ThemedText style={[styles.badgeText, { color: selected ? badgeSelectedText : badgeText }]}>{option.label}</ThemedText>
          </Pressable>
        );
      })}

      {/* Optional More Button */}
      {showMoreButton && (
        <Pressable
          onPress={handleMorePress}
          style={({ pressed }) => [
            styles.badge,
            {
              backgroundColor: plusBg,
              opacity: pressed ? 0.7 : 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Feather name="plus" size={18} color={plusColor} />
          <ThemedText style={[styles.badgeText, { color: plusColor, marginLeft: 2 }]}>More</ThemedText>
        </Pressable>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 0,
  },
  badgeText: {
    marginLeft: 6,
    fontSize: 14,
  },
  titleContainer: {
    marginRight: 8,
    paddingHorizontal: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default IndustrySelector; 