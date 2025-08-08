import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SectionList,
  Text,
  TextInput,
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
  // New text input props
  showTextInput?: boolean;
  textInputValue?: string;
  textInputPlaceholder?: string;
  onTextInputChange?: (text: string) => void;
  textInputProps?: any; // Additional TextInput props
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
  // New text input props
  showTextInput = false,
  textInputValue = '',
  textInputPlaceholder,
  onTextInputChange,
  textInputProps = {},
}) => {
  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const cardBg = useThemeColor({}, 'backgroundSecondary');

  return (
    <View
      style={[
        styles.settingsItem,
        {
          backgroundColor,
        }
      ]}
    >
      <View style={styles.settingsItemTop}>
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
        ) : showArrow && !showTextInput ? (
          <Feather name="chevron-right" size={16} color={mutedTextColor} />
        ) : null}
      </View>

      {showTextInput && (
        <View style={styles.textInputContainer}>
          <TextInput
            style={[
              styles.textInput,
              {
                color: textColor,
                borderColor: borderColor,
                backgroundColor: cardBg,
              }
            ]}
            value={textInputValue}
            placeholder={textInputPlaceholder}
            placeholderTextColor={mutedTextColor}
            onChangeText={onTextInputChange}
            {...textInputProps}
          />
        </View>
      )}

      {!showTextInput && onPress && (
        <TouchableOpacity
          style={styles.touchableOverlay}
          onPress={onPress}
          activeOpacity={0.7}
        />
      )}
    </View>
  );
};

export default function SettingsList({ sections, style, contentContainerStyle }: SettingsListProps) {
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
    paddingVertical: 8,
    paddingTop: 16,
    paddingBottom: 6,
    paddingLeft: 16,
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
    marginBottom: 1,
  },
  firstItem: {
    marginTop: 10,
  },
  lastItem: {
    marginBottom: 10,
  },
  middleItem: {
    marginBottom: 1,
  },
  settingsItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  settingsItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  textInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
  },
  textInputContainer: {
    marginTop: 12,
    paddingHorizontal: 44, // Align with content (icon width + margin)
  },
  touchableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
}); 