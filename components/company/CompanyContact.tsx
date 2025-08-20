import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/ui/useThemeColor';

interface CompanyContactProps {
    website?: string | null;
    hasPhone: boolean;
    onWebsitePress?: () => void;
    onPhonePress?: () => void;
}

export const CompanyContact: React.FC<CompanyContactProps> = ({
    website,
    hasPhone,
    onWebsitePress,
    onPhonePress,
}) => {
    const tintColor = useThemeColor({}, 'tint');

    if (!website && !hasPhone) {
        return null;
    }

    return (
        <ThemedView style={styles.contactSection}>
            <View style={styles.contactRow}>
                {website && (
                    <TouchableOpacity style={styles.contactLink} onPress={onWebsitePress}>
                        <Feather name="globe" size={16} color={tintColor} />
                        <ThemedText style={[styles.linkText, { color: tintColor }]}>
                            Website
                        </ThemedText>
                    </TouchableOpacity>
                )}
                {hasPhone && (
                    <TouchableOpacity style={styles.contactLink} onPress={onPhonePress}>
                        <Feather name="phone" size={16} color={tintColor} />
                        <ThemedText style={[styles.linkText, { color: tintColor }]}>
                            Contact
                        </ThemedText>
                    </TouchableOpacity>
                )}
            </View>
        </ThemedView>
    );
};

const styles = {
    contactSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginBottom: 20,
    },
    contactRow: {
        flexDirection: 'row' as const,
        gap: 24,
    },
    contactLink: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        paddingVertical: 4,
    },
    linkText: {
        fontSize: 14,
        fontWeight: '400' as const,
    },
};
