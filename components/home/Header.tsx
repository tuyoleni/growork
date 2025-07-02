import { ThemedView } from '@/components/ThemedView';
import CategorySelector from '@/components/ui/CategorySelector';
import { Colors } from '@/constants/Colors';
import React, { useState } from 'react';
import { useColorScheme } from 'react-native';
import IndustrySelector from '../ui/IndustrySelector';

const Header = () => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const colorScheme = useColorScheme() ?? 'light';
    const primary = Colors[colorScheme].tint;
    const badgeBg = colorScheme === 'dark' ? '#222' : '#e0e0e0';
    const badgeText = colorScheme === 'dark' ? '#fff' : '#111';

    const industryOptions = [
        { icon: 'briefcase', label: 'Marketing' },
        { icon: 'bar-chart', label: 'Sales' },
        { icon: 'pen-tool', label: 'Creative' },
        { icon: 'monitor', label: 'Tech' },
    ];
    const [selectedIndustry, setSelectedIndustry] = useState(0);

    return (
        <ThemedView style={{height: 'auto' }}>
            <CategorySelector
                options={['All', 'Jobs', 'News']}
                selectedIndex={selectedIndex}
                onChange={setSelectedIndex}
            />
            <IndustrySelector
                options={industryOptions}
                selectedIndex={selectedIndustry}
                onChange={setSelectedIndustry}
                style={{ marginVertical: 8 }}
            />
        </ThemedView>
    );
};

export default Header;
