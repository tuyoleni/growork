import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import GlobalBottomSheet from '../GlobalBottomSheet';

interface OptionItem {
  icon: string;
  label: string;
}

interface CustomOptionStripProps {
  visibleOptions: OptionItem[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: any;
  showMoreButton?: boolean;
  title?: string;
  subtitle?: string;
  allOptions?: OptionItem[];
  minVisibleOptions?: number;
  maxVisibleOptions?: number;
}

const CustomOptionStrip: React.FC<CustomOptionStripProps> = ({ 
  visibleOptions, 
  selectedIndex, 
  onChange, 
  style, 
  showMoreButton = true,
  title,
  subtitle,
  allOptions,
  minVisibleOptions = 1,
  maxVisibleOptions = 8,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const badgeBg = useThemeColor({}, 'backgroundSecondary');
  const badgeSelectedBg = useThemeColor({}, 'icon');
  const badgeText = useThemeColor({}, 'text');
  const badgeSelectedText = useThemeColor({}, 'background');
  const plusBg = badgeBg;
  const plusColor = badgeText;
  const titleColor = useThemeColor({}, 'text');
  const subtitleColor = useThemeColor({}, 'mutedText');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [internalVisibleOptions, setInternalVisibleOptions] = useState(visibleOptions);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    setInternalVisibleOptions(visibleOptions);
  }, [visibleOptions]);

  const handlePress = (idx: number) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedIndex === idx) {
      onChange(-1);
    } else {
      onChange(idx);
    }
  };

  const handleCustomizePress = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowOptionsSheet(true);
    setTimeout(() => {
      bottomSheetRef.current?.present();
    }, 0);
  };

  const handleOptionToggle = (option: OptionItem) => {
    const isCurrentlyVisible = internalVisibleOptions.some(opt => opt.label === option.label);
    
    if (isCurrentlyVisible) {
      if (internalVisibleOptions.length <= minVisibleOptions) {
        return;
      }
      const newOptions = internalVisibleOptions.filter(opt => opt.label !== option.label);
      setInternalVisibleOptions(newOptions);
    } else {
      if (internalVisibleOptions.length >= maxVisibleOptions) {
        return;
      }
      const newOptions = [...internalVisibleOptions, option];
      setInternalVisibleOptions(newOptions);
    }
  };

  const closeOptionsSheet = () => {
    setShowOptionsSheet(false);
    bottomSheetRef.current?.dismiss();
  };

  const availableOptions = allOptions || visibleOptions;

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return availableOptions;
    
    return availableOptions.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableOptions, searchQuery]);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.badgeRow, style]}
      >
        {/* Optional Title and Subtitle */}
        {title && (
          <Pressable style={styles.titleContainer}>
            <ThemedText style={[styles.titleText, { color: titleColor }]}>{title}</ThemedText>
            {subtitle && (
              <ThemedText style={[styles.subtitleText, { color: subtitleColor }]}>{subtitle}</ThemedText>
            )}
          </Pressable>
        )}

        {/* Visible Options */}
        {internalVisibleOptions.map((option, idx) => {
          const selected = idx === selectedIndex;
          return (
            <Pressable
              key={option.label}
              onPress={() => handlePress(idx)}
              style={({ pressed }) => [
                styles.badge,
                {
                  backgroundColor: selected ? badgeSelectedBg : badgeBg,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather name={option.icon as any} size={18} color={selected ? badgeSelectedText : badgeText} />
              <ThemedText style={[styles.badgeText, { color: selected ? badgeSelectedText : badgeText }]}>{option.label}</ThemedText>
            </Pressable>
          );
        })}

        {/* Customize Button */}
        {showMoreButton && (
          <Pressable
            onPress={handleCustomizePress}
            style={({ pressed }) => [
              styles.badge,
              {
                backgroundColor: plusBg,
                opacity: pressed ? 0.7 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <Feather name="plus" size={18} color={plusColor} />
            <ThemedText style={[styles.badgeText, { color: plusColor, marginLeft: 2 }]}>Customize</ThemedText>
          </Pressable>
        )}
      </ScrollView>

      {/* Options Selection Bottom Sheet */}
      {showOptionsSheet && (
        <GlobalBottomSheet
          ref={bottomSheetRef}
          onDismiss={closeOptionsSheet}
          snapPoints={['70%']}
          header={
            <ThemedText style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
              Customize Options
            </ThemedText>
          }
          body={
            <ScrollView 
              contentContainerStyle={{ padding: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Search Input */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: badgeBg,
                borderRadius: 8,
                paddingHorizontal: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: borderColor,
              }}>
                <Feather name="search" size={16} color={badgeText} style={{ marginRight: 8 }} />
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: badgeText,
                  }}
                  placeholder="Search options..."
                  placeholderTextColor={subtitleColor}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Feather name="x" size={16} color={badgeText} />
                  </TouchableOpacity>
                )}
              </View>

              {filteredOptions.map((option, index) => {
                const isVisible = internalVisibleOptions.some(opt => opt.label === option.label);
                const isAtMax = internalVisibleOptions.length >= maxVisibleOptions;
                const isAtMin = internalVisibleOptions.length <= minVisibleOptions;
                const canToggle = isVisible ? !isAtMin : !isAtMax;
                
                return (
                  <TouchableOpacity
                    key={option.label}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 16,
                      paddingHorizontal: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: borderColor,
                      opacity: canToggle ? 1 : 0.4,
                    }}
                    onPress={() => canToggle && handleOptionToggle(option)}
                  >
                    <Feather 
                      name={option.icon as any} 
                      size={20} 
                      color={badgeText} 
                      style={{ marginRight: 12 }}
                    />
                    <ThemedText style={{ flex: 1, fontSize: 16 }}>{option.label}</ThemedText>
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isVisible ? tintColor : borderColor,
                      backgroundColor: isVisible ? tintColor : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {isVisible && (
                        <Feather name="check" size={16} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
              
              {filteredOptions.length === 0 && (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ThemedText style={{ fontSize: 14, color: subtitleColor, fontStyle: 'italic' }}>
                    No options found for "{searchQuery}"
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          }
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 0,
  },
  badgeText: {
    marginLeft: 6,
    fontSize: 14,
  },
  titleContainer: {
    marginRight: 8,
    paddingHorizontal: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default CustomOptionStrip; 