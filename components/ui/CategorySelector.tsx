import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { useColorScheme } from 'react-native';
import SegmentedControlTab from 'react-native-segmented-control-tab';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: any;
}

const CategorySelector: React.FC<SegmentedControlProps> = ({ options, selectedIndex, onChange, style }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const handleTabPress = (index: number) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onChange(index);
  };

  return (
    <SegmentedControlTab
      values={options}
      selectedIndex={selectedIndex}
      onTabPress={handleTabPress}
      tabsContainerStyle={{
        backgroundColor: colorScheme === 'dark' ? '#23272A' : '#F3F4F6',
        borderRadius: 8,
        marginHorizontal: 12,
        height: 40,
        borderWidth: 0,
      }}
      tabStyle={{
        borderWidth: 0,
        margin: 2,
        backgroundColor: 'transparent',
      }}
      activeTabStyle={{
        backgroundColor: colorScheme === 'dark' ? '#fff' : '#111',
        elevation: 2,
      }}
      tabTextStyle={{
        color: colorScheme === 'dark' ? '#fff' : '#111',
        fontSize: 16,
      }}
      activeTabTextStyle={{
        color: colorScheme === 'dark' ? '#111' : '#fff',
      }}
    />
  );
};

export default CategorySelector;
