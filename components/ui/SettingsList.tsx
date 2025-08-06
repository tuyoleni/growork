import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  SectionList,
  Text,
  useColorScheme
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';

interface SettingsItemProps {
  title: string;
  subtitle?: string;
  icon: string;
  onPress?: () => void;
  showArrow?: boolean;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  destructive?: boolean;
  iconColor?: string;
  rightComponent?: React.ReactNode;
}

interface SettingsSection {
  title: string;
  data: SettingsItemProps[];
}

interface SettingsListProps {
  sections: SettingsSection[];
  style?: any;
  contentContainerStyle?: any;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  showArrow = true,
  showSwitch = false,
  switchValue = false,
  onSwitchChange,
  destructive = false,
  iconColor,
  rightComponent,
}) => {
  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'backgroundSecondary');

  return (
    <TouchableOpacity
      style={[
        styles.settingsItem,
        {
          backgroundColor,
        }
      ]}
      onPress={onPress}
      disabled={showSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: cardBg },
          destructive && styles.destructiveIcon
        ]}>
          <Feather
            name={icon as any}
            size={18}
            color={iconColor || (destructive ? '#ef4444' : textColor)}
          />
        </View>
        <View style={styles.settingsItemContent}>
          <ThemedText
            style={[
              styles.settingsItemTitle,
              { color: destructive ? '#ef4444' : textColor }
            ]}
          >
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText style={[styles.settingsItemSubtitle, { color: mutedTextColor }]}>
              {subtitle}
            </ThemedText>
          )}
        </View>
      </View>

      {rightComponent ? (
        rightComponent
      ) : showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#e5e5e5', true: '#2563eb' }}
          thumbColor={switchValue ? '#ffffff' : '#ffffff'}
          ios_backgroundColor="#e5e5e5"
        />
      ) : showArrow ? (
        <Feather name="chevron-right" size={16} color={mutedTextColor} />
      ) : null}
    </TouchableOpacity>
  );
};

export default function SettingsList({ sections, style, contentContainerStyle }: SettingsListProps) {
  const colorScheme = useColorScheme();
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const mutedTextColor = useThemeColor({}, 'mutedText');

  const renderSectionHeader = ({ section }: { section: SettingsSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionHeaderText, { color: mutedTextColor }]}>
        {section.title.toUpperCase()}
      </Text>
    </View>
  );

  const renderItem = ({ item, index, section }: { item: SettingsItemProps; index: number; section: SettingsSection }) => {
    const isFirst = index === 0;
    const isLast = index === section.data.length - 1;

    return (
      <View style={[
        styles.itemContainer,
        isFirst && styles.firstItem,
        isLast && styles.lastItem,
        !isFirst && !isLast && styles.middleItem,
      ]}>
        <SettingsItem {...item} />
        {!isLast && <View style={[styles.separator, { backgroundColor: borderColor }]} />}
      </View>
    );
  };

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, index) => item.title + index}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      style={[styles.container, { backgroundColor }, style]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionSeparator: {
    height: 20,
  },
  itemContainer: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 0.5,
      },
    }),
  },
  firstItem: {
    marginTop: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  lastItem: {
    marginBottom: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  middleItem: {
    marginBottom: 1,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  destructiveIcon: {
    backgroundColor: '#fef2f2',
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  settingsItemSubtitle: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '400',
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
}); 