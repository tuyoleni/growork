import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedAvatar } from '@/components/ui/ThemedAvatar';
import ThemedButton from '@/components/ui/ThemedButton';
import { useThemeColor } from '@/hooks/ui/useThemeColor';
import { Company } from '@/types/company';

interface CompanyHeaderProps {
    company: Company;
    isFollowing: boolean;
    onFollowToggle: () => void;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({
    company,
    isFollowing,
    onFollowToggle,
}) => {
    const mutedTextColor = useThemeColor({}, 'mutedText');

    return (
        <ThemedView style={styles.container}>
            <View style={styles.content}>
                <ThemedAvatar
                    size={60}
                    image={company.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&size=60`}
                    square={true}
                />
                <View style={styles.info}>
                    <ThemedText style={styles.name}>{company.name}</ThemedText>
                    {company.industry && (
                        <ThemedText style={[styles.subtitle, { color: mutedTextColor }]}>
                            {company.industry}
                        </ThemedText>
                    )}
                </View>
                <ThemedButton
                    title={isFollowing ? 'Following' : 'Follow'}
                    onPress={onFollowToggle}
                    variant={isFollowing ? 'primary' : 'outline'}
                    size="small"
                    style={styles.followButton}
                />
            </View>
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 14,
    },
    followButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
});
