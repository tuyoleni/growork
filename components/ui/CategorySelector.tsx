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
  const isDark = colorScheme === 'dark';

  const containerBg = isDark ? '#23272A' : '#F3F4F6';
  const activeBg = isDark ? '#000' : '#fff';
  const textColor = isDark ? '#ECEDEE' : '#222';

  return (
    <SegmentedControlTab
      values={options}
      selectedIndex={selectedIndex}
      onTabPress={onChange}
      tabsContainerStyle={{
        backgroundColor: containerBg,
        borderRadius: 8,
        margin: 8,
        height: 40,
        borderWidth: 0,
      }}
      tabStyle={{
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderRadius: 8,
        margin: 2,
      }}
      activeTabStyle={{
        backgroundColor: activeBg,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}
      tabTextStyle={{
        color: textColor,
        fontWeight: '500',
        fontSize: 16,
      }}
      activeTabTextStyle={{
        color: textColor,
        fontWeight: '500',
      }}
    />
  );
};

export default CategorySelector;
