import CategorySelector from '@/components/ui/CategorySelector';
import { Colors } from '@/constants/Colors';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, useColorScheme } from 'react-native';
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
});

export default Header;
