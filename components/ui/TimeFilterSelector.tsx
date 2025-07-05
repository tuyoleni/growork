import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';

export interface TimeFilterOption {
  label: string;
  value: string;
}

export interface TimeFilterSelectorProps {
  options: TimeFilterOption[];
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  style?: any;
  title?: string;
  subtitle?: string;
}

export default function TimeFilterSelector({
  options,
  selectedFilter,
  onFilterChange,
  style,
  title,
  subtitle,
}: TimeFilterSelectorProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const titleColor = useThemeColor({}, 'text');
  const subtitleColor = useThemeColor({}, 'mutedText');

  return (
    <View style={[styles.container, style]}>
      {/* Optional Title and Subtitle */}
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <ThemedText style={[styles.title, { color: titleColor }]}>
              {title}
            </ThemedText>
          )}
          {subtitle && (
            <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>
              {subtitle}
            </ThemedText>
          )}
        </View>
      )}

      {/* Time Filter Options */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((option) => {
          const selected = selectedFilter === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onFilterChange(option.value)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selected ? tintColor : backgroundSecondary,
                  borderColor: selected ? tintColor : borderColor,
                }
              ]}
            >
              <ThemedText style={[
                styles.filterText,
                { 
                  color: selected ? backgroundColor : textColor, 
                  fontWeight: selected ? 'bold' : '600',
                }
              ]}>
                {option.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 14,
  },
}); 