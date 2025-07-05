import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';

const CATEGORIES = [
  { label: 'Documents', value: '43a0226c' },
  { label: 'Companies', value: '4bcd400b' },
  { label: 'Media', value: '89e136bc' },
];

export type ProfileCategorySelectorProps = {
  value: string;
  onValueChange: (value: string) => void;
  style?: any;
};

export default function ProfileCategorySelector({ value, onValueChange, style }: ProfileCategorySelectorProps) {
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const selectedTextColor = useThemeColor({}, 'background');

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow}>
        {CATEGORIES.map((cat) => {
          const selected = value === cat.value;
          return (
            <Pressable
              key={cat.value}
              style={({ pressed }) => [
                styles.item,
                {
                  backgroundColor: selected
                    ? tintColor
                    : pressed
                    ? borderColor
                    : backgroundColor,
                  borderColor: selected ? tintColor : borderColor,
                },
              ]}
              onPress={() => {
                if (cat.value !== value) {
                  if (process.env.EXPO_OS === 'ios') {
                    import('expo-haptics').then((Haptics) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    });
                  }
                  onValueChange(cat.value);
                }
              }}
            >
              <ThemedText style={[styles.itemText, { color: selected ? selectedTextColor : textColor }]}> 
                {cat.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'flex-end',
    paddingVertical: 8,
  },
  scrollRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  item: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 4,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontWeight: '600',
    fontSize: 15,
  },
}); 