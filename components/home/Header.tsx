import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { Colors } from '@/constants/Colors';
import { Feather } from '@expo/vector-icons'; // Feather icons for badges
import React, { useState } from 'react';
import { ScrollView, StyleSheet, useColorScheme } from 'react-native';

const Header = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const colorScheme = useColorScheme() ?? 'light';
  const primary = Colors[colorScheme].tint;
  const badgeBg = colorScheme === 'dark' ? '#222' : '#e0e0e0';
  const badgeText = colorScheme === 'dark' ? '#fff' : '#111';

  return (
    <ThemedView style={styles.container}>
      <SegmentedControl
        options={['All', 'Jobs', 'News']}
        selectedIndex={selectedIndex}
        onChange={setSelectedIndex}
        style={styles.segmentedPicker}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeRow}>
        <ThemedView style={[styles.badge, { backgroundColor: badgeBg }]}> 
          <Feather name="briefcase" size={18} color={badgeText} />
          <ThemedText style={[styles.badgeText, { color: badgeText }]}>Marketing</ThemedText>
        </ThemedView>
        <ThemedView style={[styles.badge, { backgroundColor: badgeBg }]}> 
          <Feather name="bar-chart" size={18} color={badgeText} />
          <ThemedText style={[styles.badgeText, { color: badgeText }]}>Sales</ThemedText>
        </ThemedView>
        <ThemedView style={[styles.badge, { backgroundColor: badgeBg }]}> 
          <Feather name="pen-tool" size={18} color={badgeText} />
          <ThemedText style={[styles.badgeText, { color: badgeText }]}>Creative</ThemedText>
        </ThemedView>
        <ThemedView style={[styles.badge, { backgroundColor: badgeBg }]}> 
          <Feather name="monitor" size={18} color={badgeText} />
          <ThemedText style={[styles.badgeText, { color: badgeText }]}>Tech</ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 16,
    gap: 10,
  },
  segmentedPicker: {
    marginBottom: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginRight: 0,
  },
  badgeText: {
    marginLeft: 6,
    fontSize: 14,
  },
});

export default Header;
