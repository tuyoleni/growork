import CategorySelector from '@/components/ui/CategorySelector';
import { Colors } from '@/constants/Colors';
import { ALL_INDUSTRIES, DEFAULT_INDUSTRIES } from '@/dataset/industries';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import CustomOptionStrip from '../ui/CustomOptionStrip';

interface HeaderProps {
  selectedContentType: number;
  onContentTypeChange: (index: number) => void;
  selectedIndustry: number;
  onIndustryChange: (index: number) => void;
}

const Header = ({ 
  selectedContentType, 
  onContentTypeChange, 
  selectedIndustry, 
  onIndustryChange 
}: HeaderProps) => {
    const [visibleIndustries, setVisibleIndustries] = useState(DEFAULT_INDUSTRIES);
    const textColor = useThemeColor({}, 'text');
    const mutedText = useThemeColor({}, 'mutedText');
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <View style={[
            styles.header,
            {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.border,
                backgroundColor: theme.background,
            },
        ]}>
            <View style={styles.topRow}>
                <ThemedText style={styles.appName} numberOfLines={1}>Growork</ThemedText>
                <Pressable style={styles.bellButton} onPress={() => {}} hitSlop={8}>
                    <Feather name="bell" size={22} color={theme.icon} />
                </Pressable>
            </View>
            <CategorySelector
                options={['All', 'Jobs', 'News']}
                selectedIndex={selectedContentType}
                onChange={onContentTypeChange}
            />
            <CustomOptionStrip
                visibleOptions={visibleIndustries}
                selectedIndex={selectedIndustry}
                onChange={onIndustryChange}
                allOptions={ALL_INDUSTRIES}
                minVisibleOptions={1}
                maxVisibleOptions={6}
                style={styles.industrySelector}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingHorizontal: 16,
    },
    appName: {
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    bellButton: {
    },
    header: {
        paddingTop: 10,
        paddingBottom: 8,
        justifyContent: 'center',
    },
    industrySelector: {
        marginTop: 8,
        marginBottom: 0,
    },
});

const HEADER_HEIGHT = 190;

export { HEADER_HEIGHT };
export default Header;
