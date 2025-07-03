import { Colors } from '@/constants/Colors';
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

  return (
    <SegmentedControlTab
      values={options}
      selectedIndex={selectedIndex}
      onTabPress={onChange}
      tabsContainerStyle={{
        backgroundColor: colorScheme === 'dark' ? '#23272A' : '#F3F4F6',
        borderRadius: 8,
        marginHorizontal: 12,
        height: 40,
        borderWidth: 2,
        borderColor: colorScheme === 'dark' ? '#23272A' : '#F3F4F6',
      }}
      tabStyle={{
        borderWidth: 0,
        margin: 2,
        backgroundColor: 'transparent',
      }}
      activeTabStyle={{
        backgroundColor: theme.tint,
        borderRadius: 6,
        elevation: 2,
      }}
      tabTextStyle={{
        color: theme.text,
        fontSize: 16,
      }}
      activeTabTextStyle={{
        color: theme.background,
      }}
    />
  );
};

export default CategorySelector;
