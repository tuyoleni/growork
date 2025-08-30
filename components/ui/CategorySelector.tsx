import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks";
import * as Haptics from "expo-haptics";
import React from "react";
import { useColorScheme } from "react-native";
import SegmentedControlTab from "react-native-segmented-control-tab";

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: any;
}

const CategorySelector: React.FC<SegmentedControlProps> = ({
  options,
  selectedIndex,
  onChange,
  style,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const backgroundSecondary = useThemeColor({}, "backgroundSecondary");
  const backgroundTertiary = useThemeColor({}, "backgroundTertiary");
  const textColor = useThemeColor({}, "text");
  const activeTabBg = useThemeColor({}, "icon");
  const activeTabText = useThemeColor({}, "background");

  const handleTabPress = (index: number) => {
    if (process.env.EXPO_OS === "ios") {
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
        backgroundColor: backgroundSecondary,
        borderRadius: 8,
        marginHorizontal: 16,
        height: 40,
        borderWidth: 0,
        borderColor: "transparent",
      }}
      tabStyle={{
        borderWidth: 0,
        borderColor: "transparent",
        margin: 2,
        backgroundColor: "transparent",
      }}
      activeTabStyle={{
        backgroundColor: activeTabBg,
        elevation: 2,
        borderWidth: 0,
        borderColor: "transparent",
      }}
      tabTextStyle={{
        color: textColor,
        fontSize: 16,
        textAlign: "center",
      }}
      activeTabTextStyle={{
        color: activeTabText,
        textAlign: "center",
      }}
    />
  );
};

export default CategorySelector;
