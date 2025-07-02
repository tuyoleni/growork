import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import React from 'react';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: any;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, selectedIndex, onChange, style }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const primary = Colors[colorScheme].tint;
  const background = Colors[colorScheme].background;
  const border = colorScheme === 'dark' ? '#444' : '#ccc';
  const selectedTextColor = colorScheme === 'dark' ? '#111' : '#fff';

  return (
    <View style={[styles.container, { borderColor: border, borderWidth: StyleSheet.hairlineWidth }, style]}>
      {options.map((option, idx) => {
        const selected = idx === selectedIndex;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(idx)}
            style={({ pressed }) => [
              styles.segment,
              {
                backgroundColor: selected ? primary : background,
                borderTopLeftRadius: idx === 0 ? 8 : 0,
                borderBottomLeftRadius: idx === 0 ? 8 : 0,
                borderTopRightRadius: idx === options.length - 1 ? 8 : 0,
                borderBottomRightRadius: idx === options.length - 1 ? 8 : 0,
                opacity: pressed ? 0.7 : 1,
                flex: 1,
                minWidth: 80,
                borderRightWidth: idx !== options.length - 1 ? StyleSheet.hairlineWidth : 0,
                borderRightColor: border,
              },
            ]}
          >
            <ThemedText
              type={selected ? 'defaultSemiBold' : 'default'}
              style={{ color: selected ? selectedTextColor : Colors[colorScheme].text, textAlign: 'center', flexShrink: 1 }}
            >
              {option}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
  },
  segment: {
    paddingVertical: 6,
    marginHorizontal: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SegmentedControl; 