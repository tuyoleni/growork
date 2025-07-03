import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
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
}

const IndustrySelector: React.FC<IndustrySelectorProps> = ({ options, selectedIndex, onChange, style, onMorePress }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const badgeBg = colorScheme === 'dark' ? '#23272A' : '#F3F4F6';
  const badgeSelectedBg = Colors[colorScheme].tint;
  const badgeText = Colors[colorScheme].text;
  const badgeSelectedText = Colors[colorScheme].background;
  const plusBg = badgeBg;
  const plusColor = Colors[colorScheme].text;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.badgeRow, style]}
    >
      {options.map((option, idx) => {
        const selected = idx === selectedIndex;
        return (
          <Pressable
            key={option.label}
            onPress={() => onChange(idx)}
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
      <Pressable
        onPress={onMorePress}
        style={({ pressed }) => [
          styles.badge,
          {
            backgroundColor: plusBg,
            opacity: pressed ? 0.7 : 1,
            marginLeft: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Feather name="plus" size={18} color={plusColor} />
        <ThemedText style={[styles.badgeText, { color: plusColor, marginLeft: 2 }]}>More</ThemedText>
      </Pressable>
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
});

export default IndustrySelector; 