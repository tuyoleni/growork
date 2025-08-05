import React from 'react';
import { StyleSheet, View, ViewStyle, FlatList } from 'react-native';
import { ALL_INDUSTRIES, Industry } from '@/dataset/industries';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface IndustrySelectorProps {
  selectedIndustry: string;
  onIndustryChange: (industry: string) => void;
  style?: ViewStyle;
}

export default function IndustrySelector({
  selectedIndustry,
  onIndustryChange,
  style,
}: IndustrySelectorProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const tintColor = useThemeColor({}, 'tint');

  const renderIndustryItem = ({ item }: { item: Industry }) => {
    const isSelected = selectedIndustry === item.label;
    
    return (
      <TouchableOpacity
        onPress={() => onIndustryChange(item.label)}
        style={[
          styles.industryItem,
          {
            backgroundColor: isSelected ? tintColor : backgroundSecondary,
            borderColor: isSelected ? tintColor : borderColor,
          }
        ]}
      >
        <Feather 
          name={item.icon as any} 
          size={16} 
          color={isSelected ? backgroundColor : textColor} 
          style={styles.industryIcon} 
        />
        <ThemedText 
          style={[
            styles.industryText,
            { 
              color: isSelected ? backgroundColor : textColor,
              fontWeight: isSelected ? 'bold' : 'normal',
            }
          ]}
        >
          {item.label}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={ALL_INDUSTRIES}
        renderItem={renderIndustryItem}
        keyExtractor={(item) => item.label}
        horizontal={false}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxHeight: 300,
  },
  listContent: {
    paddingHorizontal: 8,
    gap: 8,
  },
  industryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
    marginVertical: 4,
    flex: 1,
  },
  industryIcon: {
    marginRight: 6,
  },
  industryText: {
    fontSize: 14,
  },
});