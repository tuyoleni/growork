import CategorySelector from '@/components/ui/CategorySelector';
import { Colors } from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, useColorScheme, View } from 'react-native';
import IndustrySelector from '../ui/IndustrySelector';

const Header = () => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const industryOptions = [
        { icon: 'briefcase', label: 'Marketing' },
        { icon: 'bar-chart', label: 'Sales' },
        { icon: 'pen-tool', label: 'Creative' },
        { icon: 'monitor', label: 'Tech' },
    ];
    const [selectedIndustry, setSelectedIndustry] = useState(0);

    return (
        <SafeAreaView style={[
            styles.header,
            {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.border,
                backgroundColor: theme.background,
            },
        ]}>
            <View style={styles.topRow}>
                <View style={{ flex: 1 }} />
                <Pressable onPress={() => { /* Notification action */ }} style={styles.iconButton}>
                    <Feather name="bell" size={20} color={theme.text} />
                </Pressable>
            </View>
            <CategorySelector
                options={['All', 'Jobs', 'News']}
                selectedIndex={selectedIndex}
                onChange={setSelectedIndex}
            />
            <IndustrySelector
                options={industryOptions}
                selectedIndex={selectedIndustry}
                onChange={setSelectedIndustry}
                style={{ marginTop: 8, marginBottom: 12 }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 16,
        paddingTop: 0,
        paddingBottom: 8,
        justifyContent: 'center',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 8,
        marginBottom: 8,
    },
    iconButton: {
        padding: 16,
    },
});

export default Header;
